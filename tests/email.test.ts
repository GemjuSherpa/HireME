import { describe, expect, it } from "vitest";
import { shortlistEmail } from "@/lib/email";

describe("shortlist invitation email", () => {
  it("includes complete job information and one secure response link", () => {
    const email = shortlistEmail(
      {
        title: "Platform Engineer",
        description: "Build reliable hiring software.",
        responsibilities: "Own delivery",
        idealCandidate: "Evidence-led engineer",
        perks: "Flexible work",
        contactName: "Ava Recruiter",
        contactEmail: "ava@example.com",
        location: "Melbourne",
        workMode: "HYBRID",
        employmentType: "FULL_TIME",
        requiredEducation: "BACHELOR",
        workRightsRequirement: "AU_UNRESTRICTED",
        salaryMin: 120000,
        salaryMax: 150000,
        company: { name: "Acme" },
        skills: [{ skill: { name: "TypeScript" } }],
      },
      "secret-token",
      new Date("2026-07-20T00:00:00Z"),
    );
    expect(email.subject).toContain("Platform Engineer");
    expect(email.html).toContain("Roles and responsibilities");
    expect(email.html).toContain("Ideal candidate");
    expect(email.html).toContain("Why work with us");
    expect(email.html).toContain("BACHELOR");
    expect(email.invitationUrl).toContain("/invitations/secret-token");
  });
});
