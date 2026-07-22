# In-house semantic job-profile matching

## Architecture

HireME uses a small bi-encoder for semantic retrieval rather than a generative LLM. The model
embeds job advertisements and candidate evidence into the same vector space. Candidate embeddings
can be computed once and indexed; a new job embedding can then retrieve a large candidate pool
quickly. Existing eligibility rules and LambdaMART remain responsible for hard constraints,
explanations and final ordering.

```text
Faker + profession taxonomy
          |
          v
50,000 labelled job/profile pairs
          |
          v
all-MiniLM-L6-v2 fine-tuning
          |
          v
local model artifact ----> FastAPI semantic retrieval
                                  |
                                  v
                     eligibility + LambdaMART reranking
```

## Why this model

`sentence-transformers/all-MiniLM-L6-v2` is a compact Apache-2.0 sentence embedding model. It is
appropriate for retrieval, substantially lighter than a generative LLM, and can run on CPU. The
model artifact and all candidate data remain within HireME infrastructure.

The Python Faker library is MIT-licensed and runs locally. No external fake-data API receives job or
candidate data. The generator combines Faker identity placeholders with HireME's versioned,
auditable profession taxonomy covering office, technology, cleaning, hospitality, agriculture,
construction, trades, logistics, retail, care, education and healthcare roles.

## Reproducible workflow

Run from `matching-service`:

```bash
PYTHONPATH=. .venv/bin/python -m app.synthetic \
  --count 50000 --jobs 500 --seed 20260721 \
  --output data/synthetic-ranking-v2.jsonl

.venv/bin/pip install -r requirements-semantic.txt

PYTHONPATH=. .venv/bin/python -m app.train_semantic \
  --input data/synthetic-ranking-v2.jsonl \
  --output artifacts/hireme-minilm-v1 \
  --epochs 1 --batch-size 32

SEMANTIC_MODEL_PATH=artifacts/hireme-minilm-v1 \
  .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For a quick CPU smoke-training run, append `--max-records 5000`. This does not replace the full
training run used to produce a release candidate.

The local endpoint is `POST /v3/matches/rank`. It blends semantic similarity at 30% with the
existing explainable score at 70%, after hard eligibility checks. If no semantic artifact is
configured, it returns the classical ranking unchanged. `/health` reports whether the semantic
artifact was loaded.

For an isolated in-house service, copy the release artifact to
`artifacts/hireme-minilm-v1` and run `docker compose -f compose.semantic.yaml up --build`. The model
directory is mounted read-only and no external inference provider is called.

The committed smoke-training metrics are in
`matching-service/artifacts/hireme-minilm-smoke-v1.metrics.json`. The 87 MB model artifact and 89 MB
synthetic dataset are intentionally ignored by Git and reproduced from the documented seed.

The complete 50,000-example rehearsal trained on 40,000 pairs and evaluated 10,000 pairs from 100
held-out jobs. Its synthetic-only Pearson/Spearman correlations were 0.950/0.947; see
`matching-service/artifacts/hireme-minilm-v1.metrics.json`. These measure reproduction of the
synthetic labelling policy, not real-world hiring quality.

## Evaluation and promotion gates

Synthetic data verifies the pipeline and establishes a baseline; it does not prove hiring validity.
Before semantic scores affect production invitations:

1. evaluate retrieval recall and nDCG on job-disjoint synthetic test data;
2. run the model in shadow mode alongside the current matcher;
3. collect consented recruiter relevance judgements and real downstream outcomes;
4. test by profession family, location and work arrangement;
5. review false negatives and exposure differences using legally approved fairness data;
6. retrain on representative real labels, then canary and monitor drift;
7. retain deterministic eligibility rules and an immediate rollback path.
