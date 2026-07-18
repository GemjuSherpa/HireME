import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const schema = z.object({
  companyName: z.string().trim().min(2).max(150),
  website: z.string().trim().url().optional().or(z.literal("")),
  industry: z.string().trim().min(2).max(100),
  size: z.string().trim().min(1).max(50),
  recruiterTitle: z.string().trim().min(2).max(100),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});
export async function PATCH(request: NextRequest) {
  const user = await requireUser("RECRUITER"),
    parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check company details." },
      { status: 400 },
    );
  const recruiter = await prisma.recruiterProfile.findUniqueOrThrow({ where: { userId: user.id } }),
    data = parsed.data;
  await prisma.$transaction([
    prisma.company.update({
      where: { id: recruiter.companyId },
      data: {
        name: data.companyName,
        website: data.website || null,
        industry: data.industry,
        size: data.size,
        visibility: data.visibility,
      },
    }),
    prisma.recruiterProfile.update({
      where: { id: recruiter.id },
      data: { title: data.recruiterTitle },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "COMPANY_PROFILE_UPDATED",
        entityType: "Company",
        entityId: recruiter.companyId,
        metadata: { visibility: data.visibility },
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
