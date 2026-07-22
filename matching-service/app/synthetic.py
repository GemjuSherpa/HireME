"""Generate reproducible, diverse synthetic job-profile ranking examples."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

from faker import Faker

from .profession_catalog import PROFESSIONS, Profession

LOCATIONS = (
    "Melbourne, Australia",
    "Sydney, Australia",
    "Brisbane, Australia",
    "Perth, Australia",
    "Adelaide, Australia",
    "Hobart, Australia",
    "Darwin, Australia",
    "Regional Victoria, Australia",
    "Regional Queensland, Australia",
)
WORK_RIGHTS = ("AU_UNRESTRICTED", "AU_VALID_VISA", "REQUIRES_SPONSORSHIP", "OTHER")


def generate_dataset(count: int = 50_000, jobs: int = 500, seed: int = 20260721) -> list[dict]:
    """Returns labelled examples split across profession families and realistic mismatch types."""

    Faker.seed(seed)
    rng = random.Random(seed)
    fake = Faker("en_AU")
    records: list[dict] = []
    per_job = max(10, count // jobs)
    for job_index in range(jobs):
        role = PROFESSIONS[job_index % len(PROFESSIONS)]
        job = make_job(role, job_index, rng)
        for candidate_index in range(per_job):
            fit = rng.betavariate(1.8, 1.8)
            candidate = make_candidate(role, job, job_index, candidate_index, fit, rng, fake)
            relevance = calculate_synthetic_relevance(candidate, job, rng)
            records.append(
                {
                    "job": job,
                    "candidate": candidate,
                    "label": relevance_label(relevance),
                    "relevance": round(relevance, 4),
                    "synthetic": True,
                    "generator": "Faker (MIT)",
                    "seed": seed,
                    "schema_version": "diverse-professions-v2",
                }
            )
    rng.shuffle(records)
    return records[:count]


def make_job(role: Profession, index: int, rng: random.Random) -> dict:
    """Creates a job advert with explicit requirements from one profession definition."""

    required = rng.sample(list(role.skills), k=min(3, len(role.skills)))
    work_mode = rng.choice(role.work_modes)
    location = rng.choice(LOCATIONS)
    return {
        "id": f"synthetic-job-{index}",
        "family": role.family,
        "title": role.title,
        "description": (
            f"Join our team as a {role.title}. Deliver safe, reliable and measurable outcomes."
        ),
        "responsibilities": "; ".join(role.responsibilities),
        "ideal_candidate": (
            f"Practical experience in {', '.join(required)} with evidence of dependable work."
        ),
        "work_mode": work_mode,
        "location": location,
        "work_rights": "AU_VALID_VISA",
        "required_education": rng.choice(role.education),
        "experience_years": rng.choice((0, 1, 2, 3, 5, 7)),
        "salary_max": rng.choice((60_000, 75_000, 90_000, 110_000, 140_000, 170_000)),
        "skills": [
            {"name": skill, "weight": 3 if skill in required else 1, "required": skill in required}
            for skill in role.skills
        ],
    }


def make_candidate(
    role: Profession,
    job: dict,
    job_index: int,
    candidate_index: int,
    fit: float,
    rng: random.Random,
    fake: Faker,
) -> dict:
    """Creates a candidate with controlled positive evidence and cross-profession hard negatives."""

    matched_count = max(0, min(len(role.skills), round(fit * len(role.skills))))
    matched = rng.sample(list(role.skills), k=matched_count)
    other_role = rng.choice([item for item in PROFESSIONS if item.family != role.family])
    noise_count = rng.randint(0, min(3, len(other_role.skills)))
    skills = list(dict.fromkeys([*matched, *rng.sample(list(other_role.skills), k=noise_count)]))
    desired_role = role if rng.random() < fit else other_role
    years = max(0, round(job["experience_years"] * (0.35 + fit) + rng.uniform(-1, 2), 1))
    achievement = rng.choice(role.responsibilities)
    summary = (
        f"{desired_role.title} with {years:g} years of experience. "
        f"Skilled in {', '.join(skills[:4]) or 'entry-level workplace practices'}. "
        f"Recent work included: {achievement.lower()}."
    )
    return {
        "id": f"synthetic-{job_index}-{candidate_index}",
        "name": fake.name(),
        "email": fake.unique.safe_email(),
        "summary": summary,
        "desired_titles": [desired_role.title],
        "skills": [
            {"name": skill, "proficiency": rng.randint(1, 5), "verified": rng.random() < 0.45}
            for skill in skills
        ],
        "years_experience": years,
        "work_modes": rng.sample(list(role.work_modes), k=rng.randint(1, len(role.work_modes))),
        "location": job["location"] if rng.random() < 0.7 else rng.choice(LOCATIONS),
        "work_rights": rng.choices(WORK_RIGHTS, weights=(65, 20, 10, 5), k=1)[0],
        "education_level": rng.choice(role.education),
        "expected_salary_min": max(
            35_000, job["salary_max"] - rng.choice((10_000, 20_000, 35_000))
        ),
        "available": rng.random() > 0.04,
        "projects": [f"{achievement} for {fake.company()}"],
    }


def calculate_synthetic_relevance(candidate: dict, job: dict, rng: random.Random) -> float:
    """Produces a transparent training label from job-related attributes only."""

    required = {item["name"] for item in job["skills"] if item["required"]}
    candidate_skills = {item["name"] for item in candidate["skills"]}
    coverage = len(required & candidate_skills) / max(len(required), 1)
    value = (
        coverage * 0.50
        + min(candidate["years_experience"] / max(job["experience_years"], 1), 1) * 0.16
        + float(job["title"] in candidate["desired_titles"]) * 0.14
        + float(job["work_mode"] in candidate["work_modes"]) * 0.07
        + float(candidate["location"] == job["location"] or job["work_mode"] == "REMOTE") * 0.06
        + float(candidate["work_rights"] in {"AU_UNRESTRICTED", "AU_VALID_VISA"}) * 0.05
        + rng.uniform(-0.04, 0.04)
    )
    return max(0.0, min(1.0, value))


def relevance_label(value: float) -> int:
    """Maps a continuous synthetic relevance value to a LambdaMART grade."""

    return (
        4
        if value >= 0.82
        else 3
        if value >= 0.66
        else 2
        if value >= 0.48
        else 1
        if value >= 0.3
        else 0
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=50_000)
    parser.add_argument("--jobs", type=int, default=500)
    parser.add_argument("--seed", type=int, default=20260721)
    parser.add_argument("--output", default="data/synthetic-ranking-v2.jsonl")
    args = parser.parse_args()
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    records = generate_dataset(args.count, args.jobs, args.seed)
    path.write_text("\n".join(json.dumps(record) for record in records) + "\n")
    families = sorted({record["job"]["family"] for record in records})
    print(
        json.dumps(
            {
                "records": len(records),
                "jobs": args.jobs,
                "families": len(families),
                "seed": args.seed,
                "output": str(path),
            }
        )
    )


if __name__ == "__main__":
    main()
