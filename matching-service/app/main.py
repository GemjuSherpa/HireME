"""HTTP API contracts for the HireME matching service."""

from fastapi import FastAPI
from pydantic import BaseModel, Field

from .ranking import HybridRanker

app = FastAPI(title="HireME Matching Service", version="2.0.0")
ranker = HybridRanker()


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
    return {"status": "ok", "service": "hireme-matching", "model_version": ranker.model_version}


@app.post("/v1/matches/score")
def match(request: MatchRequest):
    result = ranker.rank([request.candidate.model_dump()], request.job.model_dump())[0]
    return {
        **result,
        "reasons": [
            f"Matched {item['requirement']}"
            for item in result["evidence"]["matched_skills"]
            if item["verified"]
        ],
        "missing_required": result["evidence"]["missing_required_skills"],
    }


@app.post("/v2/matches/rank")
def rank(request: RankRequest):
    ranked = ranker.rank(
        [item.model_dump() for item in request.candidates], request.job.model_dump()
    )
    return {
        "model_version": ranker.model_version,
        "analysed": len(ranked),
        "eligible": sum(item["eligible"] for item in ranked),
        "results": ranked[: request.limit],
    }
