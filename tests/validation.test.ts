import { describe, expect, it } from "vitest";
import { candidateProfileSchema } from "@/lib/validation";
describe("candidate profile validation", () => {
  it("accepts a complete candidate profile", () => {
    expect(
      candidateProfileSchema.safeParse({
        headline: "Senior Product Designer",
        bio: "I design accessible products for complex industries.",
        location: "Melbourne",
        desiredTitles: ["Lead Product Designer"],
        workModes: ["HYBRID"],
        skills: [
          { name: "Figma", proficiency: 5 },
          { name: "Research", proficiency: 4 },
          { name: "Strategy", proficiency: 4 },
        ],
      }).success,
    ).toBe(true);
  });
  it("requires at least three skills", () => {
    const result = candidateProfileSchema.safeParse({
      headline: "Designer",
      bio: "I design accessible products for complex industries.",
      location: "Melbourne",
      desiredTitles: ["Designer"],
      workModes: ["REMOTE"],
      skills: [],
    });
    expect(result.success).toBe(false);
  });
});
