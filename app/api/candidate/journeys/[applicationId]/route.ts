import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireUser("CANDIDATE"),
    { applicationId } = await params;
  const application = await prisma.application.findFirst({
    where: { id: applicationId, candidate: { userId: user.id } },
    select: { id: true, status: true, candidateHiddenAt: true },
  });
  if (!application) return NextResponse.json({ error: "Journey not found." }, { status: 404 });
  if (application.candidateHiddenAt) return NextResponse.json({ hidden: true });
  const active = ["MATCHED", "INVITED", "ACTIVE", "FINALIST"].includes(application.status),
    now = new Date();
  await prisma.$transaction(async (tx) => {
    if (active) {
      await tx.invitation.updateMany({
        where: { applicationId, status: { in: ["QUEUED", "SENT", "OPENED"] } },
        data: { status: "EXPIRED" },
      });
      await tx.stageRun.updateMany({
        where: { applicationId, status: { in: ["PENDING", "INVITED", "IN_PROGRESS"] } },
        data: { status: "EXPIRED" },
      });
    }
    await tx.application.update({
      where: { id: applicationId },
      data: {
        candidateHiddenAt: now,
        ...(active ? { status: "WITHDRAWN", completedAt: now } : {}),
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: active ? "CANDIDATE_WITHDREW_AND_HID_JOURNEY" : "CANDIDATE_HID_JOURNEY",
        entityType: "Application",
        entityId: applicationId,
        metadata: { previousStatus: application.status, hiddenAt: now.toISOString() },
      },
    });
  });
  return NextResponse.json({ hidden: true, withdrawn: active });
}
