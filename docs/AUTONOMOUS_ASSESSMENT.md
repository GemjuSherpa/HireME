# Autonomous assessment architecture

HireME evaluates every submitted interview stage against the published job criteria without routine
recruiter intervention. Recruiters receive finalists only after the configured stages have passed.

## Decision flow

1. Validate ownership, invitation acceptance, deadlines, required answers and attestation.
2. Score cognitive aptitude questions deterministically against server-side answer keys.
3. Score written, behavioural, technical and structured-interview evidence question by question
   using the OpenAI Responses API and a strict JSON schema.
4. Calculate the aggregate score in HireME code rather than accepting a model-generated total.
5. Compare that score with the stage's published pass threshold.
6. Automatically invite a passing candidate to the next stage, mark an unsuccessful candidate and
   queue job-related feedback, or mark the candidate as a finalist after the last assessment.

`NEEDS_REVIEW` is reserved for technical exceptions such as missing credentials, network failure,
timeouts or malformed model output. The cron worker retries these failures up to three times before
leaving them for technical support. Low model confidence is not a separate decision path.

## Scoring rubric

Each response receives a 0–100 score using common anchors:

- 0: no relevant evidence
- 25: unsupported or vague claim
- 50: relevant example with limited detail
- 75: specific actions and outcomes that address the criterion
- 100: exceptional, complete job-related evidence

The evaluator returns the evidence used, feedback, strengths, development areas and integrity flags.
Protected attributes and proxies are prohibited, and writing style, verbosity, grammar, confidence
and cultural similarity are not scoring criteria unless a narrowly defined requirement is genuinely
essential to the advertised role.

## Operations

- Required production variables: `OPENAI_API_KEY` and `OPENAI_ASSESSMENT_MODEL`.
- Default model: `gpt-5.6-terra`, selected to balance assessment quality, latency and cost.
- Requests use `store: false`, a privacy-safe hashed safety identifier, medium reasoning and a
  45-second timeout.
- Model and policy versions, per-question evidence, score, confidence and decision are retained in
  the existing `StageDecision` audit record.
- Before changing the prompt, rubric or model, run a labelled evaluation set and compare agreement,
  false-negative rates, stability and outcome distributions by job family.
