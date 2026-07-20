import { describe, expect, it } from "vitest";
import {
  assessmentQuestionBanks,
  inferJobFamily,
  scoreCognitiveAnswers,
  selectAssessmentQuestions,
} from "@/lib/assessment-question-bank";

const context = {
  jobTitle: "Head Chef",
  companyName: "Harbour Kitchen",
  primarySkill: "Food safety",
  location: "Melbourne",
  workMode: "on-site",
  jobFamily: "HOSPITALITY",
  experienceLevel: "MID",
};
const chooseMinimum = (minimum: number) => minimum;

describe("phase-specific assessment question banks", () => {
  it("maintains an independent bank for every assessment phase", () => {
    expect(Object.keys(assessmentQuestionBanks)).toEqual([
      "PRE_SCREEN",
      "SKILL_VERIFICATION",
      "BEHAVIOURAL",
      "COGNITIVE_APTITUDE",
      "TECHNICAL",
      "AI_INTERVIEW",
      "FINAL_REVIEW",
    ]);
    for (const questions of Object.values(assessmentQuestionBanks))
      expect(questions.length).toBeGreaterThanOrEqual(12);
  });

  it("selects nine questions only from the requested phase", () => {
    const selected = selectAssessmentQuestions("BEHAVIOURAL", context, [], chooseMinimum);
    const behaviouralIds = new Set(assessmentQuestionBanks.BEHAVIOURAL.map(({ id }) => id));

    expect(selected).toHaveLength(9);
    expect(selected.every(({ id }) => behaviouralIds.has(id))).toBe(true);
    expect(new Set(selected.map(({ id }) => id)).size).toBe(selected.length);
  });

  it("guarantees recruiter questions and fills remaining places from that phase bank", () => {
    const selected = selectAssessmentQuestions(
      "PRE_SCREEN",
      context,
      ["Why does {{companyName}} interest you?", "Describe your strongest relevant skill."],
      chooseMinimum,
    );

    expect(selected).toHaveLength(9);
    expect(selected.filter(({ source }) => source === "RECRUITER")).toHaveLength(2);
    expect(selected.some(({ prompt }) => prompt.includes("Harbour Kitchen"))).toBe(true);
    expect(selected.filter(({ source }) => source === "QUESTION_BANK")).toHaveLength(7);
  });

  it("interpolates job context without mutating the source bank", () => {
    const selected = selectAssessmentQuestions("BEHAVIOURAL", context, [], chooseMinimum);

    expect(selected.some(({ prompt }) => prompt.includes("Food safety"))).toBe(true);
    expect(
      assessmentQuestionBanks.BEHAVIOURAL.some(({ prompt }) => prompt.includes("{{primarySkill}}")),
    ).toBe(true);
  });

  it("selects a configured 10–20 item cognitive test without exposing answer keys", () => {
    const selected = selectAssessmentQuestions(
      "COGNITIVE_APTITUDE",
      context,
      [],
      chooseMinimum,
      15,
    );

    expect(selected).toHaveLength(15);
    expect(selected.every((question) => !("correctAnswer" in question))).toBe(true);
    expect(selected.every(({ answerType }) => answerType === "SINGLE_SELECT")).toBe(true);
    expect(selected.filter(({ difficulty }) => difficulty === 1)).toHaveLength(5);
    expect(selected.filter(({ difficulty }) => difficulty === 2)).toHaveLength(7);
    expect(selected.filter(({ difficulty }) => difficulty === 3)).toHaveLength(3);
  });

  it("scores cognitive answers server-side and reports category results", () => {
    const questions = [
      {
        id: "cog-num-percent",
        category: "Numerical reasoning",
        prompt: "Candidate-safe prompt",
        answerType: "SINGLE_SELECT" as const,
        required: true,
        source: "QUESTION_BANK" as const,
      },
      {
        id: "cog-detail-code",
        category: "Attention to detail",
        prompt: "Candidate-safe prompt",
        answerType: "SINGLE_SELECT" as const,
        required: true,
        source: "QUESTION_BANK" as const,
      },
    ];
    const result = scoreCognitiveAnswers(questions, {
      "cog-num-percent": "70%",
      "cog-detail-code": "incorrect",
    });

    expect(result).toMatchObject({ score: 50, correct: 1, total: 2 });
    expect(result.categoryScores).toEqual({
      "Numerical reasoning": 100,
      "Attention to detail": 0,
    });
  });

  it("selects experience-appropriate programming questions for software roles", () => {
    const softwareContext = {
      ...context,
      jobTitle: "Senior Software Engineer",
      primarySkill: "TypeScript",
      jobFamily: inferJobFamily("Senior Software Engineer", ["TypeScript", "React"]),
      experienceLevel: "SENIOR",
    };
    const selected = selectAssessmentQuestions("TECHNICAL", softwareContext, [], chooseMinimum);

    expect(softwareContext.jobFamily).toBe("SOFTWARE");
    expect(selected.filter(({ id }) => id.startsWith("tech-software-"))).toHaveLength(6);
  });
});
