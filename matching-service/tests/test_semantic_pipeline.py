"""Tests for diverse data generation and local semantic model serving."""

from __future__ import annotations

import numpy as np

from app.profession_catalog import PROFESSIONS
from app.semantic import SemanticMatcher
from app.synthetic import generate_dataset
from app.text_features import candidate_to_text, job_to_text


def test_synthetic_dataset_covers_diverse_profession_families():
    records = generate_dataset(count=600, jobs=60, seed=42)
    families = {record["job"]["family"] for record in records}
    labels = {record["label"] for record in records}

    assert len(PROFESSIONS) >= 30
    assert {"cleaning", "hospitality", "agriculture", "construction", "care"} <= families
    assert len(labels) >= 4
    assert all(record["synthetic"] for record in records)


def test_text_serialization_excludes_synthetic_identity_fields():
    record = generate_dataset(count=10, jobs=1, seed=7)[0]
    job_text = job_to_text(record["job"])
    candidate_text = candidate_to_text(record["candidate"])

    assert record["job"]["title"] in job_text
    assert record["candidate"]["name"] not in candidate_text
    assert record["candidate"]["email"] not in candidate_text


def test_semantic_matcher_orders_local_model_scores(tmp_path):
    model_path = tmp_path / "hireme-minilm-v1"
    model_path.mkdir()
    matcher = SemanticMatcher(str(model_path))

    class FakeModel:
        def encode(self, texts, **_kwargs):
            if len(texts) == 1:
                return np.array([[1.0, 0.0]])
            return np.array([[1.0, 0.0], [0.0, 1.0]])

    matcher._model = FakeModel()
    candidates = [
        {"id": "strong", "desired_titles": ["Cleaner"], "skills": [], "projects": []},
        {"id": "weak", "desired_titles": ["Engineer"], "skills": [], "projects": []},
    ]
    scores = matcher.score(candidates, {"title": "Cleaner", "skills": []})

    assert scores[0] > scores[1]
    assert scores == [100.0, 50.0]
