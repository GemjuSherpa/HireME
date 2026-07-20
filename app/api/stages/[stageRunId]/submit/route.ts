import { requireUser } from "@/lib/auth";
import { evaluateStageRun } from "@/lib/workflow";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { AssessmentQuestion } from "@/lib/assessment-question-bank";

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stageRunId: string }> },
) {
  const user = await requireUser("CANDIDATE");
  const { stageRunId } = await params;
  const run = await prisma.stageRun.findFirst({
    where: {
      id: stageRunId,
      status: { in: ["INVITED", "IN_PROGRESS"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      application: {
        candidate: { userId: user.id },
        OR: [
          { identityRevealed: true },
          { invitations: { some: { kind: "SHORTLIST", status: "ACCEPTED" } } },
        ],
      },
    },
  });
  if (!run)
    return NextResponse.json(
      { error: "Accept the shortlist invitation before beginning an assessment." },
      { status: 403 },
    );
  const body = (await request.json()) as {
    answers?: Record<string, unknown>;
    candidateAttestation?: boolean;
    artifactUrls?: string[];
  };
  const questionSet = run.questionSet as AssessmentQuestion[];
  if (!Array.isArray(questionSet) || questionSet.length < 9)
    return NextResponse.json(
      { error: "This assessment question set is not ready." },
      { status: 409 },
    );
  if (!body.candidateAttestation)
    return NextResponse.json({ error: "Candidate attestation is required." }, { status: 400 });
  const submittedAnswers = body.answers ?? {};
  const permittedIds = new Set(questionSet.map((question) => question.id));
  const hasUnexpectedAnswer = Object.keys(submittedAnswers).some((id) => !permittedIds.has(id));
  const hasInvalidAnswer = Object.values(submittedAnswers).some(
    (answer) => typeof answer !== "string" || answer.length > 3000,
  );
  const answers = Object.fromEntries(
    Object.entries(submittedAnswers).map(([id, answer]) => [id, String(answer).trim()]),
  );
  const missingRequired = questionSet.some(
    (question) => question.required && String(answers[question.id] ?? "").trim().length === 0,
  );
  if (hasUnexpectedAnswer || hasInvalidAnswer || missingRequired)
    return NextResponse.json(
      { error: "Answer every required question in the assigned assessment." },
      { status: 400 },
    );
  await prisma.$transaction([
    prisma.stageSubmission.upsert({
      where: { stageRunId },
      update: { answers, candidateAttestation: true },
      create: {
        stageRunId,
        answers,
        artifactUrls: body.artifactUrls ?? [],
        candidateAttestation: true,
      },
    }),
    prisma.stageRun.update({
      where: { id: stageRunId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    }),
  ]);
  const decision = await evaluateStageRun(stageRunId);
  return NextResponse.json({ decision });
}
