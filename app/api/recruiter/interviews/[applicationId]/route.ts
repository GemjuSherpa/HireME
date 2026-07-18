import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deliverOutboxEmail } from "@/lib/email";
const schema = z
  .object({
    firstOption: z.string().datetime(),
    secondOption: z.string().datetime(),
    timezone: z.string().min(2).max(100),
    location: z.string().trim().min(2).max(250),
  })
  .refine((x) => x.firstOption !== x.secondOption, {
    message: "Choose two different interview times.",
  });
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireUser("RECRUITER"),
    { applicationId } = await params,
    parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check both interview options." },
      { status: 400 },
    );
  const application = await prisma.application.findFirst({
    where: { id: applicationId, status: "FINALIST", job: { recruiter: { userId: user.id } } },
    include: { candidate: { include: { user: true } }, job: { include: { company: true } } },
  });
  if (!application)
    return NextResponse.json({ error: "Finalist application not found." }, { status: 404 });
  const first = new Date(parsed.data.firstOption),
    second = new Date(parsed.data.secondOption);
  if (first <= new Date() || second <= new Date())
    return NextResponse.json(
      { error: "Both interview options must be in the future." },
      { status: 400 },
    );
  const interview = await prisma.faceToFaceInterview.upsert({
    where: { applicationId },
    update: {
      firstOption: first,
      secondOption: second,
      selectedOption: null,
      timezone: parsed.data.timezone,
      location: parsed.data.location,
      status: "PROPOSED",
      confirmedAt: null,
      proposedAt: new Date(),
    },
    create: {
      applicationId,
      firstOption: first,
      secondOption: second,
      timezone: parsed.data.timezone,
      location: parsed.data.location,
    },
  });
  const format = (date: Date) =>
    date.toLocaleString("en-AU", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: parsed.data.timezone,
    });
  const subject = `Choose your final interview time — ${application.job.title}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h1 style="color:#ef5b48">HireME</h1><h2>Face-to-face interview with ${application.job.company.name}</h2><p>Congratulations. Please sign in to HireME and choose one of these proposed times:</p><ul><li>${format(first)}</li><li>${format(second)}</li></ul><p><strong>Location:</strong> ${parsed.data.location}</p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard">Choose an interview time</a></div>`;
  const outbox = await prisma.emailOutbox.create({
    data: {
      toEmail: application.candidate.user.email,
      template: "face-to-face-options",
      dedupeKey: `face-to-face:${applicationId}:${interview.proposedAt.getTime()}`,
      status: application.candidate.user.isSynthetic ? "CANCELLED" : "PENDING",
      lastError: application.candidate.user.isSynthetic
        ? "Synthetic candidate: external delivery intentionally suppressed"
        : null,
      payload: {
        applicationId,
        firstOption: first.toISOString(),
        secondOption: second.toISOString(),
        timezone: parsed.data.timezone,
        location: parsed.data.location,
      },
    },
  });
  if (!application.candidate.user.isSynthetic) await deliverOutboxEmail(outbox.id, subject, html);
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "FACE_TO_FACE_OPTIONS_PROPOSED",
      entityType: "Application",
      entityId: applicationId,
      metadata: {
        firstOption: first.toISOString(),
        secondOption: second.toISOString(),
        timezone: parsed.data.timezone,
      },
    },
  });
  return NextResponse.json({ interview });
}
