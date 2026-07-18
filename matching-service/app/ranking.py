"""Explainable hybrid candidate ranking with deterministic eligibility safeguards."""

from __future__ import annotations

import math
import re
from pathlib import Path
from typing import Any

import joblib
import numpy as np

FEATURE_NAMES = [
    "required_skill_coverage",
    "desirable_skill_coverage",
    "verified_skill_ratio",
    "skill_proficiency",
    "title_similarity",
    "lexical_bm25",
    "experience_fit",
    "education_fit",
    "work_mode_fit",
    "location_fit",
    "work_rights_fit",
    "salary_fit",
    "availability_fit",
    "evidence_completeness",
]

EDUCATION = {
    "NONE": 0,
    "HIGH_SCHOOL": 1,
    "CERTIFICATE": 2,
    "DIPLOMA": 3,
    "BACHELOR": 4,
    "MASTER": 5,
    "PHD": 6,
}
SKILL_GRAPH = {
    "javascript": {"typescript": 0.82, "react": 0.62, "node.js": 0.68},
    "typescript": {"javascript": 0.88, "react": 0.70, "node.js": 0.70},
    "react": {"javascript": 0.72, "typescript": 0.72, "next.js": 0.84},
    "python": {"django": 0.72, "fastapi": 0.78, "machine learning": 0.62},
    "machine learning": {"python": 0.62, "pytorch": 0.78, "tensorflow": 0.76, "data science": 0.78},
    "aws": {"cloud": 0.82, "terraform": 0.66, "devops": 0.58},
    "system design": {"architecture": 0.84, "distributed systems": 0.82, "microservices": 0.72},
    "user research": {"product design": 0.72, "ux": 0.80, "figma": 0.46},
}


def normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9+#.]+", " ", value.casefold()).strip()


def tokens(value: str) -> set[str]:
    return {token for token in normalise(value).split() if len(token) > 1}


def jaccard(left: str, right: str) -> float:
    a, b = tokens(left), tokens(right)
    return len(a & b) / len(a | b) if a and b else 0.0


def skill_similarity(required: str, possessed: str) -> float:
    req, got = normalise(required), normalise(possessed)
    if req == got:
        return 1.0
    if req in got or got in req:
        return 0.9
    return max(
        SKILL_GRAPH.get(req, {}).get(got, 0),
        SKILL_GRAPH.get(got, {}).get(req, 0),
        jaccard(req, got) * 0.65,
    )


def lawful_eligibility(
    candidate: dict[str, Any], job: dict[str, Any]
) -> tuple[bool, dict[str, str]]:
    checks: dict[str, str] = {}
    mode = job.get("work_mode", "REMOTE")
    mode_ok = mode in candidate.get("work_modes", [])
    checks["work_mode"] = "matched" if mode_ok else "incompatible preference"
    city = normalise((job.get("location") or "").split(",")[0])
    location_ok = mode == "REMOTE" or not city or city in normalise(candidate.get("location") or "")
    checks["location"] = "matched" if location_ok else "outside required location"
    required_rights, rights = job.get("work_rights", "GLOBAL"), candidate.get("work_rights")
    rights_ok = (
        required_rights == "GLOBAL"
        or rights in (None, "OTHER", "AU_UNRESTRICTED")
        or (required_rights == "AU_VALID_VISA" and rights == "AU_VALID_VISA")
        or (job.get("sponsorship") and rights == "REQUIRES_SPONSORSHIP")
    )
    checks["work_rights"] = (
        "verification required"
        if rights in (None, "OTHER")
        else "matched"
        if rights_ok
        else "requirement not met"
    )
    required_education = EDUCATION.get(job.get("required_education", "NONE"), 0)
    education = candidate.get("education_level")
    education_ok = education is None or EDUCATION.get(education, 0) >= required_education
    checks["education"] = (
        "verification required"
        if education is None
        else "matched"
        if education_ok
        else "below minimum"
    )
    return mode_ok and location_ok and rights_ok and education_ok, checks


def feature_vector(
    candidate: dict[str, Any], job: dict[str, Any]
) -> tuple[np.ndarray, dict[str, Any]]:
    candidate_skills = candidate.get("skills", [])
    requirements = job.get("skills", [])
    required = [item for item in requirements if item.get("required")]
    desirable = [item for item in requirements if not item.get("required")]

    def best(req: dict[str, Any]) -> tuple[float, dict[str, Any] | None]:
        choices = [
            (skill_similarity(req["name"], skill["name"]), skill) for skill in candidate_skills
        ]
        return max(choices, default=(0.0, None), key=lambda item: item[0])

    all_matches = [(req, best(req)) for req in requirements]
    required_matches = [match for req, match in all_matches if req.get("required")]
    desirable_matches = [match for req, match in all_matches if not req.get("required")]
    required_coverage = sum(score for score, _ in required_matches) / max(len(required), 1)
    desirable_coverage = (
        sum(score for score, _ in desirable_matches) / max(len(desirable), 1)
        if desirable
        else required_coverage
    )
    matched = [
        (score, skill)
        for score, skill in required_matches + desirable_matches
        if score >= 0.45 and skill
    ]
    verified_ratio = sum(1 for _, skill in matched if skill.get("verified")) / max(len(matched), 1)
    proficiency = sum((skill.get("proficiency", 3) / 5) * score for score, skill in matched) / max(
        len(matched), 1
    )
    desired_titles = " ".join(candidate.get("desired_titles", []))
    role_text = " ".join(
        filter(
            None,
            [
                job.get("title"),
                job.get("description"),
                job.get("responsibilities"),
                job.get("ideal_candidate"),
            ],
        )
    )
    experience_required = max(float(job.get("experience_years", 0)), 1)
    experience = float(candidate.get("years_experience", 0))
    experience_fit = min(experience / experience_required, 1.0)
    education_fit = min(
        EDUCATION.get(candidate.get("education_level", "NONE"), 0)
        / max(EDUCATION.get(job.get("required_education", "NONE"), 0), 1),
        1.0,
    )
    mode_fit = float(job.get("work_mode") in candidate.get("work_modes", []))
    location_fit = float(
        job.get("work_mode") == "REMOTE"
        or normalise((job.get("location") or "").split(",")[0])
        in normalise(candidate.get("location") or "")
    )
    rights_fit = float(
        job.get("work_rights") == "GLOBAL"
        or candidate.get("work_rights") in ("AU_UNRESTRICTED", "AU_VALID_VISA")
    )
    expected_min = candidate.get("expected_salary_min")
    salary_max = job.get("salary_max")
    salary_fit = (
        1.0
        if not expected_min or not salary_max
        else max(0.0, min(float(salary_max) / max(float(expected_min), 1), 1.0))
    )
    availability_fit = 1.0 if candidate.get("available", True) else 0.0
    evidence_fields = [
        candidate_skills,
        candidate.get("summary"),
        candidate.get("desired_titles"),
        candidate.get("years_experience"),
        candidate.get("education_level"),
        candidate.get("projects"),
    ]
    completeness = sum(bool(value) for value in evidence_fields) / len(evidence_fields)
    vector = np.array(
        [
            required_coverage,
            desirable_coverage,
            verified_ratio,
            proficiency,
            jaccard(desired_titles, job.get("title", "")),
            jaccard(candidate.get("summary", ""), role_text),
            experience_fit,
            education_fit,
            mode_fit,
            location_fit,
            rights_fit,
            salary_fit,
            availability_fit,
            completeness,
        ],
        dtype=float,
    )
    missing = [
        req["name"]
        for req, (score, _) in zip(required, required_matches, strict=True)
        if score < 0.45
    ]
    evidence = {
        "missing_required_skills": missing,
        "matched_skills": [
            {
                "requirement": req["name"],
                "candidate_skill": skill["name"],
                "similarity": round(score, 3),
                "verified": bool(skill.get("verified")),
            }
            for req, (score, skill) in all_matches
            if skill and score >= 0.45
        ],
    }
    return vector, evidence


class HybridRanker:
    """Blend an optional LambdaMART model with transparent expert-weighted features."""

    def __init__(self, model_path: str | None = None):
        path = Path(model_path or Path(__file__).parents[1] / "artifacts" / "lambdamart.joblib")
        self.model = self._load_optional_model(path)
        if self.model is not None:
            self.model.set_params(n_jobs=1)
        self.model_version = "lambdamart-synthetic-v1" if self.model else "expert-hybrid-v1"

    @staticmethod
    def _load_optional_model(path: Path):
        """Load the trained ranker when its native runtime is available.

        Args:
            path: Location of the serialized LambdaMART model.

        Returns:
            The trained model, or ``None`` when the artifact or a native dependency
            is unavailable. The caller then uses the deterministic expert model.
        """
        if not path.exists():
            return None
        try:
            return joblib.load(path)
        except (ImportError, OSError, ValueError):
            return None

    def predict(self, vector: np.ndarray) -> float:
        weights = np.array(
            [0.25, 0.08, 0.08, 0.10, 0.08, 0.08, 0.09, 0.04, 0.04, 0.03, 0.03, 0.03, 0.02, 0.05]
        )
        expert_score = float(np.dot(vector, weights) * 100)
        if self.model is not None:
            raw = float(self.model.booster_.predict(vector.reshape(1, -1))[0])
            model_score = 100 / (1 + math.exp(-max(-8, min(8, raw))))
            return model_score * 0.65 + expert_score * 0.35
        return expert_score

    def rank(self, candidates: list[dict[str, Any]], job: dict[str, Any]) -> list[dict[str, Any]]:
        results = []
        lexical_scores = bm25_scores(candidates, job)
        for candidate, lexical_score in zip(candidates, lexical_scores, strict=True):
            eligible, checks = lawful_eligibility(candidate, job)
            vector, evidence = feature_vector(candidate, job)
            vector[5] = lexical_score
            score = self.predict(vector) if eligible else 0.0
            confidence = min(0.98, 0.48 + vector[13] * 0.32 + vector[2] * 0.12)
            contributions = sorted(
                (
                    {"factor": name, "value": round(float(value), 3)}
                    for name, value in zip(FEATURE_NAMES, vector, strict=True)
                ),
                key=lambda item: item["value"],
                reverse=True,
            )
            results.append(
                {
                    "candidate_id": candidate.get("id"),
                    "eligible": eligible,
                    "score": round(score, 2),
                    "confidence": round(confidence, 2),
                    "model_version": self.model_version,
                    "filter_checks": checks,
                    "evidence": evidence,
                    "top_factors": contributions[:6],
                    "human_review_required": confidence < 0.70
                    or bool(evidence["missing_required_skills"]),
                }
            )
        return sorted(
            results,
            key=lambda item: (item["eligible"], item["score"], item["confidence"]),
            reverse=True,
        )


def bm25_scores(candidates: list[dict[str, Any]], job: dict[str, Any]) -> list[float]:
    query = tokens(
        " ".join(
            filter(
                None,
                [
                    job.get("title"),
                    job.get("description"),
                    job.get("responsibilities"),
                    job.get("ideal_candidate"),
                    " ".join(item["name"] for item in job.get("skills", [])),
                ],
            )
        )
    )
    documents = [
        normalise(
            " ".join(
                filter(
                    None,
                    [
                        candidate.get("summary"),
                        " ".join(candidate.get("desired_titles", [])),
                        " ".join(skill["name"] for skill in candidate.get("skills", [])),
                        " ".join(candidate.get("projects", [])),
                    ],
                )
            )
        ).split()
        for candidate in candidates
    ]
    if not documents or not query:
        return [0.0 for _ in candidates]
    average = sum(map(len, documents)) / max(len(documents), 1)
    scores = []
    n = len(documents)
    k1 = 1.5
    b = 0.75
    for document in documents:
        score = 0.0
        for term in query:
            frequency = document.count(term)
            if not frequency:
                continue
            document_frequency = sum(term in other for other in documents)
            inverse = math.log(1 + (n - document_frequency + 0.5) / (document_frequency + 0.5))
            score += (
                inverse
                * (frequency * (k1 + 1))
                / (frequency + k1 * (1 - b + b * len(document) / max(average, 1)))
            )
        scores.append(score)
    maximum = max(scores, default=1.0)
    return [score / maximum if maximum else 0.0 for score in scores]
