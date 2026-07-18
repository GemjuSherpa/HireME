"""Train and persist the synthetic LambdaMART ranking model."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
from lightgbm import LGBMRanker
from sklearn.metrics import ndcg_score

from .ranking import FEATURE_NAMES, bm25_scores, feature_vector


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/synthetic-ranking.jsonl")
    parser.add_argument("--output", default="artifacts/lambdamart.joblib")
    args = parser.parse_args()
    records = [json.loads(line) for line in Path(args.input).read_text().splitlines() if line]
    job_ids = []
    x = []
    y = []
    lexical = {}
    for job_id in dict.fromkeys(record["job"]["id"] for record in records):
        indices = [index for index, record in enumerate(records) if record["job"]["id"] == job_id]
        scores = bm25_scores(
            [records[index]["candidate"] for index in indices], records[indices[0]]["job"]
        )
        lexical.update(dict(zip(indices, scores, strict=True)))
    for index, record in enumerate(records):
        vector, _ = feature_vector(record["candidate"], record["job"])
        vector[5] = lexical[index]
        x.append(vector)
        y.append(record["label"])
        job_ids.append(record["job"]["id"])
    unique = list(dict.fromkeys(job_ids))
    split = max(1, int(len(unique) * 0.8))
    train_jobs = set(unique[:split])
    train = [i for i, jid in enumerate(job_ids) if jid in train_jobs]
    groups = [sum(1 for jid in job_ids if jid == group) for group in unique[:split]]
    model = LGBMRanker(
        objective="lambdarank",
        metric="ndcg",
        n_estimators=180,
        learning_rate=0.045,
        num_leaves=23,
        min_child_samples=18,
        subsample=0.85,
        colsample_bytree=0.9,
        reg_lambda=1.2,
        random_state=20260717,
        n_jobs=1,
        verbosity=-1,
    )
    model.fit(np.array(x)[train], np.array(y)[train], group=groups)
    scores = []
    for jid in unique[split:]:
        idx = [i for i, value in enumerate(job_ids) if value == jid]
        scores.append(
            ndcg_score([np.array(y)[idx]], [model.predict(np.array(x)[idx])], k=min(100, len(idx)))
        )
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output)
    metrics = {
        "model": "LambdaMART",
        "version": "synthetic-v1",
        "records": len(records),
        "train_jobs": split,
        "test_jobs": len(unique) - split,
        "ndcg_at_100": round(float(np.mean(scores)), 4) if scores else None,
        "features": FEATURE_NAMES,
        "synthetic_only": True,
    }
    output.with_suffix(".metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics))


if __name__ == "__main__":
    main()
