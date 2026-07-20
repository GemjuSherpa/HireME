import { describe, expect, it } from "vitest";
import { assessmentQuestionBanks, selectAssessmentQuestions } from "@/lib/assessment-question-bank";

const context = {
  jobTitle: "Head Chef",
  companyName: "Harbour Kitchen",
  primarySkill: "Food safety",
  location: "Melbourne",
  workMode: "on-site",
};
const chooseMinimum = (minimum: number) => minimum;

describe("phase-specific assessment question banks", () => {
  it("maintains an independent bank for every assessment phase", () => {
    expect(Object.keys(assessmentQuestionBanks)).toEqual([
      "PRE_SCREEN",
      "SKILL_VERIFICATION",
      "BEHAVIOURAL",
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
    const selected = selectAssessmentQuestions("SKILL_VERIFICATION", context, [], chooseMinimum);

    expect(selected.some(({ prompt }) => prompt.includes("Food safety"))).toBe(true);
    expect(
      assessmentQuestionBanks.SKILL_VERIFICATION.some(({ prompt }) =>
        prompt.includes("{{primarySkill}}"),
      ),
    ).toBe(true);
  });
});
