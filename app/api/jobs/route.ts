import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { jobSchema } from "@/lib/job-schema";
import { previewJobMatches } from "@/lib/workflow";

export async function POST(request: NextRequest) {
  const user = await requireUser("RECRUITER");
  const parsed = jobSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the job details." },
      { status: 400 },
    );
  const recruiter = await prisma.recruiterProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const data = parsed.data;
  const slug = `${data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
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
  const job = await prisma.job.create({
    data: {
      recruiterId: recruiter.id,
      companyId: recruiter.companyId,
      title: data.title,
      slug,
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
              customised: true,
              humanApprovalRequired: item.type === "FINAL_REVIEW",
            },
          })),
      },
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "JOB_CREATED",
      entityType: "Job",
      entityId: job.id,
      metadata: {
        stageCount: data.phases.length,
        questionCount: data.phases.reduce((sum, item) => sum + item.questions.length, 0),
        filters: {
          skills: data.skills.length,
          education: data.requiredEducation,
          workRights: data.workRightsRequirement,
          workMode: data.workMode,
        },
        shortlistResponseDays: data.shortlistResponseDays,
      },
    },
  });
  await previewJobMatches(job.id, user.id);
  return NextResponse.json({ job }, { status: 201 });
}
