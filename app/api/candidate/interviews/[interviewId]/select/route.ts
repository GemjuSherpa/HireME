import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ option: z.enum(["FIRST", "SECOND"]) });
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> },
) {
  const user = await requireUser("CANDIDATE"),
    { interviewId } = await params,
    parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Choose one proposed time." }, { status: 400 });
  const interview = await prisma.faceToFaceInterview.findFirst({
    where: {
      id: interviewId,
      status: "PROPOSED",
      application: { candidate: { userId: user.id }, status: "FINALIST" },
    },
  });
  if (!interview)
    return NextResponse.json(
      { error: "Interview proposal is no longer available." },
      { status: 409 },
    );
  const selected = parsed.data.option === "FIRST" ? interview.firstOption : interview.secondOption;
  const updated = await prisma.faceToFaceInterview.update({
    where: { id: interviewId },
    data: { selectedOption: selected, status: "CONFIRMED", confirmedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "FACE_TO_FACE_TIME_CONFIRMED",
      entityType: "Application",
      entityId: interview.applicationId,
      metadata: { selectedOption: selected.toISOString() },
    },
  });
  return NextResponse.json({ interview: updated });
}
