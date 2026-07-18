import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const candidateSchema = z.object({
  headline: z.string().min(3).max(120),
  bio: z.string().min(20).max(1200),
  location: z.string().min(2).max(120),
  seekingStatus: z.enum(["ACTIVELY_LOOKING", "OPEN_TO_OFFERS", "NOT_LOOKING"]),
  workModes: z.array(z.enum(["REMOTE", "HYBRID", "ONSITE"])).min(1),
  desiredTitles: z.array(z.string().min(2)).min(1),
  workRights: z.enum(["AU_UNRESTRICTED", "AU_VALID_VISA", "REQUIRES_SPONSORSHIP", "OTHER"]),
  highestEducation: z.enum(["HIGH_SCHOOL", "CERTIFICATE", "DIPLOMA", "BACHELOR", "MASTER", "PHD"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});
export async function PATCH(request: NextRequest) {
  const user = await requireUser();
  if (user.role !== "CANDIDATE")
    return NextResponse.json({ error: "Candidate profile only" }, { status: 403 });
  const parsed = candidateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Check all required profile fields." }, { status: 400 });
  const profile = await prisma.candidateProfile.update({
    where: { userId: user.id },
    data: {
      ...parsed.data,
      profileScore: Math.min(
        100,
        70 + parsed.data.desiredTitles.length * 4 + parsed.data.workModes.length * 3,
      ),
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "PROFILE_UPDATED",
      entityType: "CandidateProfile",
      entityId: profile.id,
    },
  });
  return NextResponse.json({ profile });
}
