# Candidate matching strategy

HireME uses matching to discover and order relevant candidates, not to make an unreviewable final
employment decision. Lawful, job-related eligibility requirements are evaluated first. Eligible
candidates are then retrieved and ranked using role evidence, preferences and verified profile data.

## Current production policy

- The default discovery threshold is **45%**, configurable from 30–80% per draft pipeline.
- Work arrangement, location, work rights and genuine minimum education requirements remain
  explicit eligibility checks; lowering the score never bypasses them.
- The highest-ranked candidates are invited up to the configured pool size. A smaller qualified
  pool is valid; the system does not manufacture 100 matches.
- Scores retain factor-level explanations and low-confidence or missing-required-skill results are
  flagged for human review.
- Protected attributes are excluded from ranking features.

The score is a relative discovery signal, not a probability that somebody will be hired. A universal
60% cutoff was therefore misleading and reduced recall before the model had been calibrated on real
HireME outcomes.

## Recommended model architecture

1. **Eligibility:** deterministic, auditable job-related constraints.
2. **Retrieval:** combine structured entity/skill retrieval, BM25 and dense job/profile embeddings.
3. **Ranking:** use the existing explainable LambdaMART feature model to rerank the retrieved set.
4. **Calibration:** calibrate scores by job family using held-out, time-based validation data.
5. **Human review:** keep recruiters accountable for consequential decisions and expose evidence,
   confidence and missing information.

This two-stage retrieval/ranking design follows large-scale job-matching research from
[LinkedIn](https://arxiv.org/abs/2402.13435) and
[CareerBuilder](https://arxiv.org/abs/2107.00221). It is preferable to asking a general-purpose LLM
to select candidates directly.

## Foundation models and LLMs

Use a multilingual sentence-embedding model to improve semantic retrieval across equivalent titles,
skills and evidence phrasing. An LLM may extract structured, reviewable entities from job descriptions
or explain already-computed factors. It must not independently reject candidates, infer protected
attributes, evaluate personality from video, or generate an opaque suitability score.

Do not fine-tune a foundation model yet. Synthetic data is useful for plumbing and regression tests,
but it cannot establish real hiring validity. Fine-tuning becomes reasonable only after HireME has a
large, consented, representative and audited outcome dataset.

## Training and evaluation plan

- Record impression, invitation, acceptance, assessment completion, stage advancement, recruiter
  review and hire outcomes with model version and feature snapshot.
- Separate behavioural outcomes: invitation acceptance measures interest, while later structured
  assessments and reviewed hires provide stronger relevance labels.
- Train with grouped job queries and time-based train/validation/test splits to prevent leakage.
- Optimise ranking metrics such as Recall@100 and nDCG@10, then measure calibration, coverage,
  latency and stability by job family.
- Evaluate false-negative rates and ranking exposure across legally reviewed groups without using
  protected attributes as ranking inputs.
- Shadow-test every challenger model, canary it on a small share of traffic, and retain a deterministic
  fallback and rollback path.
- Monitor drift and retrain only when predefined data-volume, quality and fairness gates pass.

These controls align with the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework),
which emphasizes validity, reliability, transparency, explainability and harmful-bias management
throughout the system lifecycle.
