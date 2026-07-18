from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
job = {
    "title": "Senior Backend Engineer",
    "description": "Build reliable Python services",
    "work_mode": "REMOTE",
    "experience_years": 5,
    "work_rights": "GLOBAL",
    "required_education": "NONE",
    "skills": [
        {"name": "Python", "weight": 3, "required": True},
        {"name": "System design", "weight": 2, "required": True},
    ],
}
strong = {
    "id": "strong",
    "skills": [
        {"name": "Python", "proficiency": 5, "verified": True},
        {"name": "Distributed systems", "proficiency": 4, "verified": True},
    ],
    "desired_titles": ["Backend Engineer"],
    "work_modes": ["REMOTE"],
    "years_experience": 7,
    "summary": "Designed reliable distributed Python services",
    "education_level": "BACHELOR",
    "projects": ["Payments API"],
}
weak = {
    "id": "weak",
    "skills": [{"name": "Figma", "proficiency": 5, "verified": True}],
    "desired_titles": ["Product Designer"],
    "work_modes": ["REMOTE"],
    "years_experience": 1,
    "summary": "Product designer",
    "education_level": "BACHELOR",
}


def test_health_reports_model():
    result = client.get("/health").json()
    assert result["status"] == "ok"
    assert "model_version" in result


def test_ranker_orders_stronger_candidate_first_and_explains():
    response = client.post(
        "/v2/matches/rank", json={"job": job, "candidates": [weak, strong], "limit": 100}
    )
    assert response.status_code == 200
    result = response.json()
    assert result["results"][0]["candidate_id"] == "strong"
    assert result["results"][0]["top_factors"]
    assert result["results"][0]["model_version"]


def test_skill_graph_recognises_related_skill_evidence():
    result = client.post("/v1/matches/score", json={"candidate": strong, "job": job}).json()
    assert any(
        item["requirement"] == "System design" for item in result["evidence"]["matched_skills"]
    )


def test_invalid_proficiency_is_rejected():
    invalid = {**strong, "skills": [{"name": "Python", "proficiency": 9, "verified": True}]}
    assert (
        client.post("/v1/matches/score", json={"candidate": invalid, "job": job}).status_code == 422
    )
