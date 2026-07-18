import { describe, expect, it } from "vitest";
import { calculateMatch } from "@/lib/matching";
const job = {
  title: "Lead Product Designer",
  workMode: "HYBRID",
  experienceYears: 5,
  skills: [
    { name: "Figma", weight: 3, required: true },
    { name: "Research", weight: 2, required: true },
    { name: "Strategy", weight: 2, required: false },
  ],
};
describe("candidate matching", () => {
  it("rewards verified evidence and aligned preferences", () => {
    const result = calculateMatch(
      {
        skills: [
          { name: "Figma", proficiency: 5, verified: true },
          { name: "Research", proficiency: 4, verified: true },
          { name: "Strategy", proficiency: 4, verified: true },
        ],
        desiredTitles: ["Product Designer"],
        workModes: ["HYBRID"],
        yearsExperience: 7,
      },
      job,
    );
    expect(result.score).toBe(100);
    expect(result.reasons).toContain("Verified Figma");
  });
  it("penalises missing required skills without producing a negative score", () => {
    const result = calculateMatch(
      { skills: [], desiredTitles: [], workModes: ["REMOTE"], yearsExperience: 0 },
      job,
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.missingRequired).toEqual(["Figma", "Research"]);
  });
  it("treats skill names case-insensitively", () => {
    const result = calculateMatch(
      {
        skills: [{ name: "figma", proficiency: 3, verified: true }],
        desiredTitles: [],
        workModes: [],
        yearsExperience: 0,
      },
      { ...job, skills: [job.skills[0]] },
    );
    expect(result.reasons).toEqual(["Verified Figma"]);
  });
});
