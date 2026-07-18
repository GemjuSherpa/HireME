import { z } from "zod";
export const candidateProfileSchema = z.object({
  headline: z.string().min(3).max(120),
  bio: z.string().min(20).max(1200),
  location: z.string().min(2),
  desiredTitles: z.array(z.string().min(2)).min(1),
  workModes: z.array(z.enum(["REMOTE", "HYBRID", "ONSITE"])).min(1),
  skills: z
    .array(z.object({ name: z.string().min(1), proficiency: z.number().int().min(1).max(5) }))
    .min(3),
});
