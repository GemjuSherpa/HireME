"""Fine-tune a lightweight job-profile bi-encoder entirely on local infrastructure."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

from .text_features import candidate_to_text, job_to_text


def train(
    input_path: Path,
    output_path: Path,
    base_model: str,
    epochs: int,
    batch_size: int,
    seed: int,
    max_records: int | None = None,
) -> dict:
    """Trains and evaluates a Sentence Transformer with job-disjoint validation data."""

    try:
        from sentence_transformers import (
            InputExample,
            SentenceTransformer,
            evaluation,
            losses,
        )
        from torch.utils.data import DataLoader
    except ImportError as error:
        raise RuntimeError(
            "Install the semantic training dependencies from requirements-semantic.txt"
        ) from error

    random.seed(seed)
    records = [json.loads(line) for line in input_path.read_text().splitlines() if line]
    if max_records:
        random.shuffle(records)
        records = records[:max_records]
    job_ids = list(dict.fromkeys(record["job"]["id"] for record in records))
    random.shuffle(job_ids)
    split = max(1, int(len(job_ids) * 0.8))
    train_jobs = set(job_ids[:split])
    train_records = [record for record in records if record["job"]["id"] in train_jobs]
    test_records = [record for record in records if record["job"]["id"] not in train_jobs]
    examples = [
        InputExample(
            texts=[job_to_text(record["job"]), candidate_to_text(record["candidate"])],
            label=float(record["relevance"]),
        )
        for record in train_records
    ]
    model = SentenceTransformer(base_model)
    loader = DataLoader(examples, shuffle=True, batch_size=batch_size)
    loss = losses.CosineSimilarityLoss(model)
    evaluation_records = test_records[:2_000]
    evaluator = evaluation.EmbeddingSimilarityEvaluator(
        [job_to_text(record["job"]) for record in evaluation_records],
        [candidate_to_text(record["candidate"]) for record in evaluation_records],
        [float(record["relevance"]) for record in evaluation_records],
        name="job-profile-held-out",
    )
    output_path.mkdir(parents=True, exist_ok=True)
    model.fit(
        train_objectives=[(loader, loss)],
        epochs=epochs,
        warmup_steps=max(10, int(len(loader) * epochs * 0.1)),
        evaluator=evaluator,
        output_path=str(output_path),
        show_progress_bar=True,
    )
    metrics = {
        "model": "SentenceTransformer bi-encoder",
        "base_model": base_model,
        "version": "synthetic-v2",
        "train_records": len(train_records),
        "test_records": len(test_records),
        "train_jobs": len(train_jobs),
        "test_jobs": len(job_ids) - len(train_jobs),
        "epochs": epochs,
        "synthetic_only": True,
        "production_validated": False,
        "evaluator": evaluator(model),
    }
    (output_path / "hireme_metrics.json").write_text(json.dumps(metrics, indent=2))
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/synthetic-ranking-v2.jsonl")
    parser.add_argument("--output", default="artifacts/hireme-minilm-v1")
    parser.add_argument("--base-model", default="sentence-transformers/all-MiniLM-L6-v2")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--seed", type=int, default=20260721)
    parser.add_argument("--max-records", type=int)
    args = parser.parse_args()
    metrics = train(
        Path(args.input),
        Path(args.output),
        args.base_model,
        args.epochs,
        args.batch_size,
        args.seed,
        args.max_records,
    )
    print(json.dumps(metrics))


if __name__ == "__main__":
    main()
