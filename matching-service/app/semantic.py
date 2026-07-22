"""Local semantic retrieval model with no external inference API dependency."""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np

from .text_features import candidate_to_text, job_to_text


class SemanticMatcher:
    """Loads a locally trained Sentence Transformer and scores job-profile similarity."""

    def __init__(self, model_path: str | None = None):
        self.model_path = model_path or os.getenv("SEMANTIC_MODEL_PATH")
        self._model = None

    @property
    def available(self) -> bool:
        """Reports whether a local model artifact has been configured and exists."""

        return bool(self.model_path and Path(self.model_path).exists())

    @property
    def version(self) -> str | None:
        """Returns the configured artifact directory name for service diagnostics."""

        return Path(self.model_path).name if self.model_path else None

    def score(self, candidates: list[dict], job: dict) -> list[float]:
        """Returns normalized cosine similarity scores in candidate input order."""

        model = self._load()
        job_embedding = model.encode(
            [job_to_text(job)], normalize_embeddings=True, convert_to_numpy=True
        )[0]
        candidate_embeddings = model.encode(
            [candidate_to_text(candidate) for candidate in candidates],
            normalize_embeddings=True,
            convert_to_numpy=True,
            batch_size=64,
        )
        similarities = candidate_embeddings @ job_embedding
        return [round(float(np.clip((score + 1) / 2, 0, 1) * 100), 2) for score in similarities]

    def _load(self):
        """Lazily imports and loads the model so the classical service remains lightweight."""

        if not self.available:
            raise RuntimeError("SEMANTIC_MODEL_PATH does not reference a local trained model")
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
            except ImportError as error:
                raise RuntimeError("Semantic runtime dependencies are not installed") from error
            self._model = SentenceTransformer(self.model_path, local_files_only=True)
        return self._model
