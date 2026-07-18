import { describe, expect, it } from "vitest";
import { evaluateCandidateEligibility } from "@/features/matching/domain/candidate-eligibility";

const job = {
  workMode: "HYBRID",
  location: "Melbourne, Australia",
  workRightsRequirement: "AU_UNRESTRICTED",
  requiredEducation: "BACHELOR",
  sponsorship: false,
};

describe("candidate job filters", () => {
  it("accepts a candidate who meets structured requirements", () => {
    const result = evaluateCandidateEligibility(
      {
        workModes: ["HYBRID", "REMOTE"],
        location: "Melbourne, VIC",
        workRights: "AU_UNRESTRICTED",
        highestEducation: "MASTER",
      },
      job,
    );

    expect(result.eligible).toBe(true);
    expect(result.checks.education).toBe("Matched");
  });

  it("rejects candidates with incompatible location, rights or education", () => {
    const result = evaluateCandidateEligibility(
      {
        workModes: ["HYBRID"],
        location: "Sydney, NSW",
        workRights: "REQUIRES_SPONSORSHIP",
        highestEducation: "DIPLOMA",
      },
      job,
    );

    expect(result.eligible).toBe(false);
    expect(result.checks.workRights).toBe("Does not meet requirement");
    expect(result.checks.education).toBe("Below minimum requirement");
  });

  it("routes missing evidence to pre-screen verification", () => {
    const result = evaluateCandidateEligibility(
      {
        workModes: ["HYBRID"],
        location: "Melbourne",
        workRights: null,
        highestEducation: null,
      },
      job,
    );

    expect(result.eligible).toBe(true);
    expect(result.checks.workRights).toContain("Verification required");
    expect(result.checks.education).toContain("Verification required");
  });
});
