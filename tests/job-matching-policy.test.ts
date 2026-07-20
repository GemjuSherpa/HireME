import { describe, expect, it } from "vitest";
import { jobSchema } from "@/lib/job-schema";

const validJob = {
  title: "Senior Software Engineer",
  description: "Build reliable customer-facing systems with a collaborative product team.",
  responsibilities: "Design, implement, test and operate maintainable software services.",
  idealCandidate: "An evidence-led engineer who communicates clearly and learns continuously.",
  perks: "Flexible work, learning budget and meaningful product ownership.",
  contactName: "Talent Team",
  contactEmail: "talent@example.com",
  location: "Melbourne, Australia",
  workMode: "HYBRID",
  employmentType: "FULL_TIME",
  experienceLevel: "SENIOR",
  requiredEducation: "NONE",
  workRightsRequirement: "GLOBAL",
  sponsorship: false,
  preferredTimezone: "Australia/Melbourne",
  desiredStartDate: "",
  salaryMin: 120_000,
  salaryMax: 160_000,
  poolSize: 100,
  targetShortlist: 10,
  shortlistResponseDays: 3,
  minMatchScore: 45,
  skills: ["TypeScript", "System design"],
  phases: [
    {
      templateId: "behavioural",
      name: "Behavioural interview",
      type: "BEHAVIOURAL",
      description: "Assess evidence, motivation and role-relevant behaviour.",
      position: 1,
      durationMinutes: 30,
      completionDays: 7,
      passThreshold: 60,
      sampleSize: 10,
      questions: [],
    },
  ],
} as const;

describe("job matching threshold policy", () => {
  it("accepts the recommended 45 percent discovery threshold", () => {
    expect(jobSchema.safeParse(validJob).success).toBe(true);
  });

  it.each([29, 81])("rejects unsafe threshold %s", (minMatchScore) => {
    expect(jobSchema.safeParse({ ...validJob, minMatchScore }).success).toBe(false);
  });
});
