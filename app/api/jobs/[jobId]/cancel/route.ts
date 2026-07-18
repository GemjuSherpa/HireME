import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireUser("RECRUITER"),
    { jobId } = await params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, status: { in: ["ACTIVE", "PAUSED"] }, recruiter: { userId: user.id } },
  });
  if (!job)
    return NextResponse.json(
      { error: "Only an active or paused pipeline can be cancelled." },
      { status: 409 },
    );
  const now = new Date();
  await prisma.$transaction([
    prisma.job.update({ where: { id: jobId }, data: { status: "CLOSED" } }),
    prisma.invitation.updateMany({
      where: { application: { jobId }, status: { in: ["QUEUED", "SENT", "OPENED"] } },
      data: { status: "EXPIRED" },
    }),
    prisma.stageRun.updateMany({
      where: { application: { jobId }, status: { in: ["PENDING", "INVITED", "IN_PROGRESS"] } },
      data: { status: "EXPIRED" },
    }),
    prisma.application.updateMany({
      where: { jobId, status: { in: ["MATCHED", "INVITED", "ACTIVE"] } },
      data: { status: "WITHDRAWN", completedAt: now },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "PIPELINE_CANCELLED",
        entityType: "Job",
        entityId: jobId,
        metadata: { cancelledAt: now.toISOString() },
      },
    }),
  ]);
  return NextResponse.json({ cancelled: true });
}
