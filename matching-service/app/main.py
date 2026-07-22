"""HTTP API contracts for the HireME matching service."""

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

from .ranking import HybridRanker
from .semantic import SemanticMatcher

app = FastAPI(title="HireME Matching Service", version="2.0.0")
ranker = HybridRanker()
semantic_matcher = SemanticMatcher()


class Skill(BaseModel):
    name: str
    proficiency: int = Field(default=3, ge=1, le=5)
    verified: bool = False


class Requirement(BaseModel):
    name: str
    weight: float = Field(default=1, gt=0)
    required: bool = False


class Candidate(BaseModel):
    id: str | None = None
    skills: list[Skill]
    desired_titles: list[str] = []
    work_modes: list[str] = []
    years_experience: float = Field(default=0, ge=0)
    summary: str = ""
    location: str | None = None
    work_rights: str | None = None
    education_level: str | None = None
    expected_salary_min: int | None = None
    available: bool = True
    projects: list[str] = []


class Job(BaseModel):
    title: str
    work_mode: str
    experience_years: float = Field(default=0, ge=0)
    skills: list[Requirement]
    description: str = ""
    responsibilities: str = ""
    ideal_candidate: str = ""
    location: str | None = None
    work_rights: str = "GLOBAL"
    required_education: str = "NONE"
    sponsorship: bool = False
    salary_max: int | None = None


class MatchRequest(BaseModel):
    candidate: Candidate
    job: Job


class RankRequest(BaseModel):
    candidates: list[Candidate]
    job: Job
    limit: int = Field(default=100, ge=1, le=1000)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "hireme-matching",
        "model_version": ranker.model_version,
        "semantic_model": semantic_matcher.version,
        "semantic_available": semantic_matcher.available,
    }


@app.post("/v1/matches/score")
def match(request: MatchRequest):
    result = ranker.rank([request.candidate.model_dump()], request.job.model_dump())[0]
    return json_safe(
        {
            **result,
            "reasons": [
                f"Matched {item['requirement']}"
                for item in result["evidence"]["matched_skills"]
                if item["verified"]
            ],
            "missing_required": result["evidence"]["missing_required_skills"],
        }
    )


@app.post("/v2/matches/rank")
def rank(request: RankRequest):
    ranked = ranker.rank(
        [item.model_dump() for item in request.candidates], request.job.model_dump()
    )
    return {
        "model_version": ranker.model_version,
        "analysed": len(ranked),
        "eligible": sum(item["eligible"] for item in ranked),
        "results": json_safe(ranked[: request.limit]),
    }


@app.post("/v3/matches/rank")
def semantic_rank(request: RankRequest):
    """Combines local semantic retrieval with eligibility and explainable reranking."""

    candidates = [item.model_dump() for item in request.candidates]
    job = request.job.model_dump()
    classical = ranker.rank(candidates, job)
    if not semantic_matcher.available:
        return {
            "model_version": ranker.model_version,
            "semantic_available": False,
            "analysed": len(classical),
            "eligible": sum(item["eligible"] for item in classical),
            "results": json_safe(classical[: request.limit]),
        }
    scores = semantic_matcher.score(candidates, job)
    semantic_by_id = {
        candidate.get("id"): score for candidate, score in zip(candidates, scores, strict=True)
    }
    for result in classical:
        result["eligible"] = bool(result["eligible"])
        semantic_score = semantic_by_id.get(result["candidate_id"], 0.0)
        result["semantic_score"] = semantic_score
        if result["eligible"]:
            result["score"] = round(result["score"] * 0.7 + semantic_score * 0.3, 2)
        result["model_version"] = f"{ranker.model_version}+{semantic_matcher.version}"
    results = sorted(
        classical,
        key=lambda item: (item["eligible"], item["score"], item["confidence"]),
        reverse=True,
    )
    return {
        "model_version": f"{ranker.model_version}+{semantic_matcher.version}",
        "semantic_available": True,
        "analysed": len(results),
        "eligible": sum(item["eligible"] for item in results),
        "results": json_safe(results[: request.limit]),
    }


def json_safe(value):
    """Converts NumPy scalar values produced by local models into JSON-native values."""

    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    return value
