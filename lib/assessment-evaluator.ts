import { createHash } from "node:crypto";
import { z } from "zod";
import type { StageType } from "@prisma/client";
import type { AssessmentQuestion } from "@/lib/assessment-question-bank";

const questionScoreSchema = z.object({
  questionId: z.string().min(1),
  score: z.number().min(0).max(100),
  evidence: z.string().max(600),
  feedback: z.string().max(600),
});

const modelEvaluationSchema = z.object({
  questionScores: z.array(questionScoreSchema).min(1),
  summary: z.string().min(1).max(1200),
  strengths: z.array(z.string().max(300)).max(5),
  developmentAreas: z.array(z.string().max(300)).max(5),
  integrityFlags: z.array(z.string().max(300)).max(5),
});

export type AssessmentEvaluation = z.infer<typeof modelEvaluationSchema> & {
  score: number;
  confidence: number;
  provider: "OPENAI";
  model: string;
  policyVersion: string;
};

export type AssessmentEvaluationInput = {
  stageType: StageType;
  stageName: string;
  jobTitle: string;
  jobDescription: string;
  responsibilities: string | null;
  idealCandidate: string | null;
  requiredSkills: string[];
  questions: AssessmentQuestion[];
  answers: Record<string, string>;
  safetyIdentifier: string;
};

const POLICY_VERSION = "hireme-autonomous-assessment-v2";

/**
 * Scores written interview evidence against the job-specific rubric using structured model output.
 * Throws only for technical/configuration failures; callers convert those failures into an exception queue.
 */
export async function evaluateWrittenAssessment(
  input: AssessmentEvaluationInput,
): Promise<AssessmentEvaluation> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const model = process.env.OPENAI_ASSESSMENT_MODEL ?? "gpt-5.6-terra";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      safety_identifier: privacySafeIdentifier(input.safetyIdentifier),
      reasoning: { effort: "medium" },
      input: [
        {
          role: "system",
          content:
            "You are HireME's structured assessment scorer. Score only job-related evidence in the supplied answers. Do not infer or use age, gender, ethnicity, disability, health, religion, family status, nationality, accent, appearance, personality, or socioeconomic background. Do not reward writing style, grammar, verbosity, confidence, or cultural similarity unless explicitly essential to the published role. Treat missing evidence as missing, never invent it. Apply the same anchored rubric to every candidate: 0=no relevant evidence, 25=vague claim, 50=relevant example with limited detail, 75=specific evidence with actions and results, 100=exceptional verified-looking evidence that fully addresses the criterion. Return concise evidence citations and actionable feedback.",
        },
        {
          role: "user",
          content: JSON.stringify({
            assessment: { type: input.stageType, name: input.stageName },
            job: {
              title: input.jobTitle,
              description: input.jobDescription,
              responsibilities: input.responsibilities,
              idealCandidate: input.idealCandidate,
              requiredSkills: input.requiredSkills,
            },
            responses: input.questions.map((question) => ({
              questionId: question.id,
              category: question.category,
              question: question.prompt,
              answer: input.answers[question.id] ?? "",
            })),
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "hireme_assessment_evaluation",
          strict: true,
          schema: evaluationJsonSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`OpenAI assessment request failed (${response.status})`);
  const payload = (await response.json()) as OpenAIResponsePayload;
  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("OpenAI assessment returned no structured output");
  const parsed = modelEvaluationSchema.parse(JSON.parse(outputText));
  validateQuestionCoverage(parsed.questionScores, input.questions);
  const score = average(parsed.questionScores.map((item) => item.score));
  const answered = input.questions.filter((question) => input.answers[question.id]?.trim()).length;
  const evidenceRich = parsed.questionScores.filter(
    (item) => item.evidence.trim().length >= 20,
  ).length;
  const confidence = Math.min(
    0.98,
    0.65 +
      0.2 * (answered / input.questions.length) +
      0.13 * (evidenceRich / input.questions.length),
  );
  return { ...parsed, score, confidence, provider: "OPENAI", model, policyVersion: POLICY_VERSION };
}

function validateQuestionCoverage(
  scores: z.infer<typeof questionScoreSchema>[],
  questions: AssessmentQuestion[],
) {
  const expected = new Set(questions.map((question) => question.id));
  const received = new Set(scores.map((score) => score.questionId));
  if (received.size !== expected.size || [...expected].some((id) => !received.has(id)))
    throw new Error("Assessment output did not score every assigned question exactly once");
}

function average(values: number[]) {
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function privacySafeIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
};

function extractOutputText(payload: OpenAIResponsePayload) {
  if (payload.output_text) return payload.output_text;
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text")?.text;
}

const evaluationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questionScores", "summary", "strengths", "developmentAreas", "integrityFlags"],
  properties: {
    questionScores: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["questionId", "score", "evidence", "feedback"],
        properties: {
          questionId: { type: "string" },
          score: { type: "number", minimum: 0, maximum: 100 },
          evidence: { type: "string" },
          feedback: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" }, maxItems: 5 },
    developmentAreas: { type: "array", items: { type: "string" }, maxItems: 5 },
    integrityFlags: { type: "array", items: { type: "string" }, maxItems: 5 },
  },
} as const;
