import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const optionalUrl = z.string().url().optional().or(z.literal(""));
const schema = z.object({
  careerGoal: z.string().max(1500).optional(),
  careerHighlights: z.array(z.string().min(2).max(250)).max(12),
  skills: z
    .array(
      z.object({ name: z.string().min(1).max(80), proficiency: z.number().int().min(1).max(5) }),
    )
    .max(50),
  experiences: z
    .array(
      z.object({
        company: z.string().min(1),
        title: z.string().min(1),
        startDate: z.string().min(4),
        endDate: z.string().optional(),
        achievements: z.array(z.string().min(1)).max(12),
      }),
    )
    .max(30),
  education: z
    .array(
      z.object({
        institution: z.string().min(1),
        qualification: z.string().min(1),
        fieldOfStudy: z.string().optional(),
        startYear: z.number().int().min(1900).max(2200).nullable(),
        endYear: z.number().int().min(1900).max(2200).nullable(),
      }),
    )
    .max(20),
  projects: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        url: optionalUrl,
        tags: z.array(z.string()).max(20),
      }),
    )
    .max(30),
  certifications: z
    .array(
      z.object({
        title: z.string().min(1),
        issuer: z.string().min(1),
        credentialId: z.string().optional(),
        credentialUrl: optionalUrl,
        issuedAt: z.string().optional(),
        expiresAt: z.string().optional(),
      }),
    )
    .max(30),
  publications: z
    .array(
      z.object({
        title: z.string().min(1),
        type: z.string().min(1),
        publisher: z.string().optional(),
        publishedAt: z.string().optional(),
        url: optionalUrl,
        description: z.string().optional(),
      }),
    )
    .max(30),
});
const dateOrNull = (value?: string) => (value ? new Date(value) : null);
export async function PUT(request: NextRequest) {
  const user = await requireUser("CANDIDATE");
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check profile details." },
      { status: 400 },
    );
  const profile = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const data = parsed.data;
  await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.candidateSkill.deleteMany({ where: { candidateId: profile.id, verified: false } }),
      tx.experience.deleteMany({ where: { candidateId: profile.id, verificationLocked: false } }),
      tx.education.deleteMany({ where: { candidateId: profile.id, verified: false } }),
      tx.project.deleteMany({ where: { candidateId: profile.id } }),
      tx.certification.deleteMany({ where: { candidateId: profile.id, verified: false } }),
      tx.publication.deleteMany({ where: { candidateId: profile.id } }),
    ]);
    for (const item of data.skills) {
      const skill = await tx.skill.upsert({
        where: { name: item.name },
        update: {},
        create: { name: item.name, category: "Candidate supplied" },
      });
      await tx.candidateSkill.upsert({
        where: { candidateId_skillId: { candidateId: profile.id, skillId: skill.id } },
        update: { proficiency: item.proficiency },
        create: { candidateId: profile.id, skillId: skill.id, proficiency: item.proficiency },
      });
    }
    await tx.candidateProfile.update({
      where: { id: profile.id },
      data: {
        careerGoal: data.careerGoal,
        careerHighlights: data.careerHighlights,
        profileScore: Math.min(
          100,
          55 +
            Math.min(10, data.skills.length * 2) +
            Math.min(10, data.experiences.length * 3) +
            Math.min(8, data.education.length * 2) +
            Math.min(8, data.projects.length * 2) +
            Math.min(5, data.certifications.length),
        ),
      },
    });
    if (data.experiences.length)
      await tx.experience.createMany({
        data: data.experiences.map((item) => ({
          candidateId: profile.id,
          company: item.company,
          title: item.title,
          startDate: new Date(item.startDate),
          endDate: dateOrNull(item.endDate),
          achievements: item.achievements,
        })),
      });
    if (data.education.length)
      await tx.education.createMany({
        data: data.education.map((item) => ({
          ...item,
          candidateId: profile.id,
          fieldOfStudy: item.fieldOfStudy || null,
        })),
      });
    if (data.projects.length)
      await tx.project.createMany({
        data: data.projects.map((item) => ({
          ...item,
          candidateId: profile.id,
          url: item.url || null,
        })),
      });
    if (data.certifications.length)
      await tx.certification.createMany({
        data: data.certifications.map((item) => ({
          ...item,
          candidateId: profile.id,
          credentialId: item.credentialId || null,
          credentialUrl: item.credentialUrl || null,
          issuedAt: dateOrNull(item.issuedAt),
          expiresAt: dateOrNull(item.expiresAt),
        })),
      });
    if (data.publications.length)
      await tx.publication.createMany({
        data: data.publications.map((item) => ({
          ...item,
          candidateId: profile.id,
          publisher: item.publisher || null,
          publishedAt: dateOrNull(item.publishedAt),
          url: item.url || null,
          description: item.description || null,
        })),
      });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "DETAILED_PROFILE_UPDATED",
        entityType: "CandidateProfile",
        entityId: profile.id,
        metadata: {
          skills: data.skills.length,
          experiences: data.experiences.length,
          education: data.education.length,
          projects: data.projects.length,
          certifications: data.certifications.length,
          publications: data.publications.length,
        },
      },
    });
  });
  return NextResponse.json({ ok: true });
}
