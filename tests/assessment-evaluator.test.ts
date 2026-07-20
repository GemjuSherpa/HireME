import { afterEach, describe, expect, it, vi } from "vitest";
import { evaluateWrittenAssessment } from "@/lib/assessment-evaluator";

const input = {
  stageType: "BEHAVIOURAL" as const,
  stageName: "Behavioural assessment",
  jobTitle: "Site supervisor",
  jobDescription: "Coordinate safe construction work.",
  responsibilities: "Plan daily work and resolve hazards.",
  idealCandidate: "Evidence-led and safety conscious.",
  requiredSkills: ["Site safety"],
  safetyIdentifier: "candidate-1",
  questions: [
    {
      id: "q1",
      category: "Safety",
      prompt: "Describe a hazard you resolved.",
      answerType: "LONG_TEXT" as const,
      required: true,
      source: "QUESTION_BANK" as const,
    },
    {
      id: "q2",
      category: "Planning",
      prompt: "Describe a changing priority.",
      answerType: "LONG_TEXT" as const,
      required: true,
      source: "QUESTION_BANK" as const,
    },
  ],
  answers: {
    q1: "I isolated the area, briefed the crew and removed the hazard.",
    q2: "I replanned the shift and completed critical work safely.",
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENAI_API_KEY;
});

describe("autonomous assessment evaluator", () => {
  it("uses structured evidence and computes the final score server-side", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            output: [
              {
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify({
                      questionScores: [
                        {
                          questionId: "q1",
                          score: 80,
                          evidence: "isolated the area and briefed the crew",
                          feedback: "Strong control steps.",
                        },
                        {
                          questionId: "q2",
                          score: 70,
                          evidence: "replanned the shift around critical work",
                          feedback: "Add the measured result.",
                        },
                      ],
                      summary: "Specific, job-related evidence was supplied.",
                      strengths: ["Safety response"],
                      developmentAreas: ["Quantify results"],
                      integrityFlags: [],
                    }),
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await evaluateWrittenAssessment(input);

    expect(result.score).toBe(75);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.provider).toBe("OPENAI");
    expect(result.questionScores).toHaveLength(2);
    const request = vi.mocked(fetch).mock.calls[0]?.[1];
    const requestBody = JSON.parse(String(request?.body)) as {
      store: boolean;
      safety_identifier: string;
      text: { format: { strict: boolean } };
    };
    expect(requestBody.store).toBe(false);
    expect(requestBody.safety_identifier).not.toContain(input.safetyIdentifier);
    expect(requestBody.text.format.strict).toBe(true);
  });

  it("fails closed when the assessment service is not configured", async () => {
    await expect(evaluateWrittenAssessment(input)).rejects.toThrow("OPENAI_API_KEY");
  });

  it("rejects incomplete output instead of silently scoring it", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              questionScores: [
                {
                  questionId: "q1",
                  score: 80,
                  evidence: "specific evidence supplied",
                  feedback: "Good.",
                },
              ],
              summary: "Incomplete",
              strengths: [],
              developmentAreas: [],
              integrityFlags: [],
            }),
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(evaluateWrittenAssessment(input)).rejects.toThrow("every assigned question");
  });
});
