import { calculateMatch } from "@/lib/matching";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const schema = z.object({
  candidate: z.object({
    skills: z.array(z.object({ name: z.string(), proficiency: z.number(), verified: z.boolean() })),
    desiredTitles: z.array(z.string()),
    workModes: z.array(z.string()),
    yearsExperience: z.number(),
  }),
  job: z.object({
    title: z.string(),
    workMode: z.string(),
    experienceYears: z.number(),
    skills: z.array(z.object({ name: z.string(), weight: z.number(), required: z.boolean() })),
  }),
});
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid matching request", details: parsed.error.flatten() },
      { status: 400 },
    );
  return NextResponse.json(calculateMatch(parsed.data.candidate, parsed.data.job));
}
