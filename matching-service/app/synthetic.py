"""Generate reproducible synthetic ranking examples for local model development."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

from faker import Faker

ROLES = {
    "Senior Product Engineer": ["TypeScript", "React", "Python", "System design", "AWS", "Testing"],
    "Machine Learning Engineer": [
        "Python",
        "Machine learning",
        "PyTorch",
        "Data science",
        "AWS",
        "SQL",
    ],
    "Product Designer": [
        "Figma",
        "User research",
        "Product design",
        "Accessibility",
        "Design systems",
    ],
    "Backend Engineer": ["Python", "FastAPI", "PostgreSQL", "System design", "Docker", "AWS"],
    "Data Analyst": ["SQL", "Python", "Tableau", "Statistics", "Data visualisation"],
}
EDUCATION = ["CERTIFICATE", "DIPLOMA", "BACHELOR", "MASTER", "PHD"]
LOCATIONS = [
    "Melbourne, Australia",
    "Sydney, Australia",
    "Brisbane, Australia",
    "Perth, Australia",
    "Adelaide, Australia",
]


def generate_dataset(count: int = 5000, jobs: int = 50, seed: int = 20260717) -> list[dict]:
    Faker.seed(seed)
    random.seed(seed)
    fake = Faker("en_AU")
    records = []
    for job_index in range(jobs):
        title = random.choice(list(ROLES))
        role_skills = ROLES[title]
        location = random.choice(LOCATIONS)
        work_mode = random.choice(["REMOTE", "HYBRID", "ONSITE"])
        required = random.sample(role_skills, k=min(3, len(role_skills)))
        job = {
            "id": f"synthetic-job-{job_index}",
            "title": title,
            "description": (
                f"Deliver high-quality {title.lower()} outcomes in a collaborative team."
            ),
            "responsibilities": "Design, deliver, test and communicate measurable outcomes.",
            "ideal_candidate": (
                f"Evidence-led professional with practical {', '.join(required)} experience."
            ),
            "work_mode": work_mode,
            "location": location,
            "work_rights": "AU_VALID_VISA",
            "required_education": random.choice(["NONE", "DIPLOMA", "BACHELOR"]),
            "experience_years": random.choice([1, 3, 5, 7]),
            "salary_max": random.choice([110000, 140000, 170000]),
            "skills": [
                {"name": name, "weight": 3 if name in required else 1, "required": name in required}
                for name in role_skills
            ],
        }
        per_job = max(10, count // jobs)
        for candidate_index in range(per_job):
            fit = random.betavariate(2, 2)
            matched = random.sample(
                role_skills, k=max(1, min(len(role_skills), round(fit * len(role_skills))))
            )
            noise_skills = random.sample(
                [s for values in ROLES.values() for s in values if s not in matched],
                k=random.randint(0, 3),
            )
            years = max(
                0, round(job["experience_years"] * (0.45 + fit) + random.uniform(-1.5, 2), 1)
            )
            candidate = {
                "id": f"synthetic-{job_index}-{candidate_index}",
                "name": fake.name(),
                "email": fake.unique.safe_email(),
                "summary": fake.paragraph(nb_sentences=3),
                "desired_titles": [title if random.random() < fit else random.choice(list(ROLES))],
                "skills": [
                    {
                        "name": skill,
                        "proficiency": random.randint(2, 5),
                        "verified": random.random() < 0.45,
                    }
                    for skill in matched + noise_skills
                ],
                "years_experience": years,
                "work_modes": random.sample(["REMOTE", "HYBRID", "ONSITE"], k=random.randint(1, 3)),
                "location": location if random.random() < 0.72 else random.choice(LOCATIONS),
                "work_rights": random.choice(
                    ["AU_UNRESTRICTED", "AU_VALID_VISA", "REQUIRES_SPONSORSHIP", "OTHER"]
                ),
                "education_level": random.choice(EDUCATION),
                "expected_salary_min": random.choice([90000, 110000, 130000, 150000]),
                "available": random.random() > 0.05,
                "projects": [fake.catch_phrase() for _ in range(random.randint(0, 3))],
            }
            skill_coverage = len(set(matched) & set(required)) / max(len(required), 1)
            relevance = (
                skill_coverage * 0.48
                + min(years / max(job["experience_years"], 1), 1) * 0.20
                + float(title in candidate["desired_titles"]) * 0.12
                + float(work_mode in candidate["work_modes"]) * 0.08
                + float(candidate["location"] == location or work_mode == "REMOTE") * 0.07
                + random.uniform(-0.06, 0.06)
            )
            label = (
                4
                if relevance >= 0.83
                else 3
                if relevance >= 0.68
                else 2
                if relevance >= 0.50
                else 1
                if relevance >= 0.32
                else 0
            )
            records.append(
                {
                    "job": job,
                    "candidate": candidate,
                    "label": label,
                    "synthetic": True,
                    "generator": "Faker 37.12.0",
                    "seed": seed,
                }
            )
    return records[:count]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=5000)
    parser.add_argument("--jobs", type=int, default=50)
    parser.add_argument("--seed", type=int, default=20260717)
    parser.add_argument("--output", default="data/synthetic-ranking.jsonl")
    args = parser.parse_args()
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    records = generate_dataset(args.count, args.jobs, args.seed)
    path.write_text("\n".join(json.dumps(record) for record in records) + "\n")
    print(
        json.dumps(
            {"records": len(records), "jobs": args.jobs, "seed": args.seed, "output": str(path)}
        )
    )


if __name__ == "__main__":
    main()
