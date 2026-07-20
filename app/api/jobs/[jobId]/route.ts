import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobSchema } from "@/lib/job-schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const user = await requireUser("RECRUITER"),
    { jobId } = await params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, status: "DRAFT", recruiter: { userId: user.id } },
    include: { stages: { orderBy: { position: "asc" } } },
  });
  if (!job)
    return NextResponse.json(
      { error: "Only an owned draft pipeline can be edited." },
      { status: 409 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  if (!Array.isArray(body.phases))
    body.phases = job.stages.map((stage) => {
      const config = stage.config as {
        templateId?: string;
        questions?: string[];
        sampleSize?: number;
      };
      return {
        templateId: config.templateId ?? stage.id,
        name: stage.name,
        type: stage.type,
        description: stage.instructions,
        position: stage.position,
        durationMinutes: stage.durationMinutes ?? 30,
        completionDays: stage.completionDays,
        passThreshold: stage.passThreshold,
        sampleSize: config.sampleSize ?? (stage.type === "COGNITIVE_APTITUDE" ? 15 : 10),
        questions: config.questions?.length
          ? config.questions
          : ["Provide evidence relevant to this assessment stage."],
      };
    });
  for (const key of [
    "employmentType",
    "experienceLevel",
    "requiredEducation",
    "workRightsRequirement",
    "workMode",
  ]) {
    if (typeof body[key] === "string")
      body[key] = (body[key] as string).trim().toUpperCase().replaceAll(" ", "_");
  }
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0],
      field = String(issue?.path[0] ?? "field"),
      label = field.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase());
    const missing = issue?.code === "invalid_type" || issue?.message === "Required";
    return NextResponse.json(
      {
        error: missing
          ? `${label} is required.`
          : `${label}: ${issue?.message ?? "check this value."}`,
        field,
      },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const skillRecords = await Promise.all(
    data.skills.map(async (name, index) => {
      const skill = await prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name, category: "Role-specific" },
      });
      return { skillId: skill.id, weight: index < 3 ? 3 : 2, required: index < 2 };
    }),
  );
  await prisma.$transaction(async (tx) => {
    await tx.application.deleteMany({ where: { jobId } });
    await tx.jobSkill.deleteMany({ where: { jobId } });
    await tx.hiringStage.deleteMany({ where: { jobId } });
    await tx.job.update({
      where: { id: jobId },
      data: {
        title: data.title,
        description: data.description,
        responsibilities: data.responsibilities,
        idealCandidate: data.idealCandidate,
        perks: data.perks,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        location: data.location,
        workMode: data.workMode,
        employmentType: data.employmentType,
        experienceLevel: data.experienceLevel,
        requiredEducation: data.requiredEducation,
        workRightsRequirement: data.workRightsRequirement,
        sponsorship: data.sponsorship,
        preferredTimezone: data.preferredTimezone || null,
        desiredStartDate: data.desiredStartDate ? new Date(data.desiredStartDate) : null,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        poolSize: data.poolSize,
        targetShortlist: data.targetShortlist,
        shortlistResponseDays: data.shortlistResponseDays,
        minMatchScore: data.minMatchScore,
        skills: { create: skillRecords },
        stages: {
          create: data.phases
            .sort((a, b) => a.position - b.position)
            .map((item, index) => ({
              position: index + 1,
              name: item.name,
              type: item.type,
              instructions: item.description,
              durationMinutes: item.durationMinutes,
              completionDays: item.completionDays,
              passThreshold: item.passThreshold,
              config: {
                templateId: item.templateId,
                questions: item.questions,
                questionCount: item.questions.length,
                sampleSize: item.sampleSize ?? (item.type === "COGNITIVE_APTITUDE" ? 15 : 10),
                customised: true,
                humanApprovalRequired: false,
              },
            })),
        },
      },
    });
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "JOB_DRAFT_UPDATED",
      entityType: "Job",
      entityId: jobId,
      metadata: { matchesCleared: true, minimumMatchScore: data.minMatchScore },
    },
  });
  return NextResponse.json({ job: { id: jobId } });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireUser("RECRUITER"),
    { jobId } = await params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, status: { in: ["DRAFT", "CLOSED"] }, recruiter: { userId: user.id } },
    include: { applications: true },
  });
  if (!job)
    return NextResponse.json(
      { error: "Only an owned draft, closed, or cancelled pipeline can be removed." },
      { status: 409 },
    );
  await prisma.job.delete({ where: { id: jobId } });
  return NextResponse.json({ deleted: true });
}
