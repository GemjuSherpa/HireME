import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Creates the consent-controlled shell for a candidate's AI video interview session. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stageRunId: string }> },
) {
  const user = await requireUser("CANDIDATE");
  const { stageRunId } = await params;
  const body = (await request.json()) as { consent?: boolean; requestAlternative?: boolean };
  const run = await prisma.stageRun.findFirst({
    where: {
      id: stageRunId,
      stage: { type: "AI_INTERVIEW" },
      status: { in: ["INVITED", "IN_PROGRESS"] },
      application: {
        candidate: { userId: user.id },
        invitations: { some: { kind: "SHORTLIST", status: "ACCEPTED" } },
      },
    },
  });
  if (!run)
    return NextResponse.json({ error: "AI interview session is not available." }, { status: 404 });
  if (!body.consent && !body.requestAlternative)
    return NextResponse.json(
      { error: "Consent or an alternative-format request is required." },
      { status: 400 },
    );

  const session = await prisma.videoInterviewSession.upsert({
    where: { stageRunId },
    update: body.requestAlternative
      ? { status: "ALTERNATIVE_REQUESTED", alternativeRequested: true }
      : { status: "READY_FOR_PROVIDER", consentGrantedAt: new Date() },
    create: {
      stageRunId,
      status: body.requestAlternative ? "ALTERNATIVE_REQUESTED" : "READY_FOR_PROVIDER",
      alternativeRequested: Boolean(body.requestAlternative),
      consentGrantedAt: body.consent ? new Date() : null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: body.requestAlternative
        ? "VIDEO_INTERVIEW_ALTERNATIVE_REQUESTED"
        : "VIDEO_INTERVIEW_CONSENTED",
      entityType: "VideoInterviewSession",
      entityId: session.id,
      metadata: { stageRunId, biometricScoringDisabled: true },
    },
  });
  return NextResponse.json({ session: { id: session.id, status: session.status } });
}
