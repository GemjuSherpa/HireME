import { z } from "zod";
const phase = z.object({
  templateId: z.string(),
  name: z.string().min(2),
  type: z.enum([
    "PRE_SCREEN",
    "SKILL_VERIFICATION",
    "BEHAVIOURAL",
    "TECHNICAL",
    "AI_INTERVIEW",
    "FINAL_REVIEW",
  ]),
  description: z.string().min(5),
  position: z.number().int().min(1),
  durationMinutes: z.number().int().min(5).max(240),
  completionDays: z.number().int().min(1).max(30),
  passThreshold: z.number().min(0).max(100),
  questions: z
    .array(z.string().min(3).max(1000))
    .max(5, "Add no more than five recruiter questions to a phase."),
});
export const jobSchema = z
  .object({
    title: z.string().min(3).max(150),
    description: z.string().min(50).max(10000),
    responsibilities: z.string().min(30).max(10000),
    idealCandidate: z.string().min(30).max(10000),
    perks: z.string().min(20).max(10000),
    contactName: z.string().min(2).max(150),
    contactEmail: z.string().email(),
    location: z.string().min(2),
    workMode: z.enum(["HYBRID", "REMOTE", "ONSITE"]),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "CASUAL", "INTERNSHIP"]),
    experienceLevel: z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "EXECUTIVE"]),
    requiredEducation: z.enum([
      "NONE",
      "HIGH_SCHOOL",
      "CERTIFICATE",
      "DIPLOMA",
      "BACHELOR",
      "MASTER",
      "PHD",
    ]),
    workRightsRequirement: z.enum(["AU_UNRESTRICTED", "AU_VALID_VISA", "GLOBAL"]),
    sponsorship: z.boolean(),
    preferredTimezone: z.string().max(100).optional(),
    desiredStartDate: z.string().optional(),
    salaryMin: z.number().int().nonnegative().nullable(),
    salaryMax: z.number().int().nonnegative().nullable(),
    poolSize: z.number().int().min(10).max(1000),
    targetShortlist: z.number().int().min(1).max(100),
    shortlistResponseDays: z.number().int().min(1).max(30),
    skills: z.array(z.string().min(1).max(80)).min(1).max(50),
    phases: z.array(phase).min(1).max(10),
  })
  .refine((x) => !x.salaryMin || !x.salaryMax || x.salaryMax >= x.salaryMin, {
    message: "Maximum salary must be at least the minimum salary.",
  })
  .refine((x) => x.targetShortlist < x.poolSize, {
    message: "Final interview shortlist must be smaller than the accepted candidate pool.",
  });
