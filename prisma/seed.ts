import {
  PrismaClient,
  ProcessStatus,
  StageRunStatus,
  StageType,
  UserRole,
  Visibility,
} from "@prisma/client";
import { hashPassword } from "../lib/security";
const prisma = new PrismaClient();
const demoPassword = "HireME-demo-2026!";

const people = [
  [
    "Maya Patel",
    "candidate@hireme.test",
    "Senior Product Designer",
    ["Figma", "Product strategy", "User research", "Design systems"],
  ],
  [
    "Ethan Brooks",
    "ethan@hireme.test",
    "Product Design Lead",
    ["Figma", "Product strategy", "Design systems", "Prototyping"],
  ],
  [
    "Sofia Chen",
    "sofia@hireme.test",
    "Senior UX Designer",
    ["Figma", "User research", "Accessibility", "Prototyping"],
  ],
  [
    "Liam Wilson",
    "liam@hireme.test",
    "Service Designer",
    ["User research", "Workshop facilitation", "Product strategy"],
  ],
  [
    "Amelia Jones",
    "amelia@hireme.test",
    "Product Designer",
    ["Figma", "Design systems", "Accessibility"],
  ],
  [
    "Noah Thompson",
    "noah@hireme.test",
    "UX Lead",
    ["User research", "Product strategy", "Workshop facilitation"],
  ],
  [
    "Ava Nguyen",
    "ava@hireme.test",
    "Senior Product Designer",
    ["Figma", "Product strategy", "Prototyping"],
  ],
  [
    "Oliver Smith",
    "oliver@hireme.test",
    "Design Manager",
    ["Product strategy", "Design systems", "Workshop facilitation"],
  ],
  [
    "Isla Martin",
    "isla@hireme.test",
    "UX Researcher",
    ["User research", "Accessibility", "Product strategy"],
  ],
  ["Leo Brown", "leo@hireme.test", "Product Designer", ["Figma", "Prototyping", "Design systems"]],
  [
    "Grace Taylor",
    "grace@hireme.test",
    "Experience Designer",
    ["User research", "Figma", "Accessibility"],
  ],
  [
    "Jack Davis",
    "jack@hireme.test",
    "Senior UX Designer",
    ["Figma", "User research", "Design systems"],
  ],
] as const;

async function main() {
  const passwordHash = await hashPassword(demoPassword);
  await prisma.auditLog.deleteMany();
  await prisma.emailOutbox.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.trainingExample.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.stageDecision.deleteMany();
  await prisma.stageSubmission.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.stageRun.deleteMany();
  await prisma.application.deleteMany();
  await prisma.hiringStage.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidateSkill.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.project.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.session.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.recruiterProfile.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.modelVersion.deleteMany();
  const skillNames = [...new Set(people.flatMap((p) => [...p[3]]))];
  for (const name of skillNames) await prisma.skill.create({ data: { name, category: "Design" } });
  const company = await prisma.company.create({
    data: {
      name: "Greenly",
      website: "https://greenly.example",
      industry: "Climate technology",
      size: "51–200",
    },
  });
  const recruiterUser = await prisma.user.create({
    data: {
      email: "recruiter@hireme.test",
      emailVerifiedAt: new Date(),
      passwordHash,
      name: "Noah Williams",
      role: UserRole.RECRUITER,
    },
  });
  const recruiter = await prisma.recruiterProfile.create({
    data: { userId: recruiterUser.id, companyId: company.id, title: "Head of Talent" },
  });
  const candidates = [];
  for (let index = 0; index < people.length; index++) {
    const [name, email, headline, skills] = people[index];
    const user = await prisma.user.create({
      data: { email, emailVerifiedAt: new Date(), passwordHash, name, role: UserRole.CANDIDATE },
    });
    const candidate = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        headline,
        bio: `${headline} focused on useful, inclusive products and measurable customer outcomes.`,
        location: "Melbourne, Australia",
        timezone: "Australia/Melbourne",
        workModes: ["HYBRID", "REMOTE"],
        workTypes: ["FULL_TIME"],
        desiredTitles: [headline, "Lead Product Designer"],
        visibility: Visibility.ANONYMOUS,
        profileScore: 92 - index,
        skills: {
          create: await Promise.all(
            skills.map(async (skillName, skillIndex) => ({
              skillId: (await prisma.skill.findUniqueOrThrow({ where: { name: skillName } })).id,
              proficiency: Math.max(3, 5 - (skillIndex % 2)),
              verified: skillIndex < 2,
              verifiedAt: skillIndex < 2 ? new Date() : null,
            })),
          ),
        },
        experiences: {
          create: {
            company: index % 2 ? "Commonform" : "Bright Labs",
            title: headline,
            startDate: new Date(2019 - (index % 3), 1, 1),
            achievements: [
              "Led cross-functional discovery",
              "Improved completion and accessibility metrics",
            ],
            verified: true,
            verificationLocked: true,
          },
        },
      },
    });
    candidates.push({ user, candidate });
  }
  const model = await prisma.modelVersion.create({
    data: {
      name: "HireME rubric evaluator",
      version: "1.0.0",
      provider: "internal-adapter",
      purpose: "Stage scoring and evidence summarisation",
      evaluationMetrics: {
        validationAccuracy: 0.84,
        demographicParityReview: "required",
        lastEvaluated: "2026-07-01",
      },
      approvedAt: new Date(),
    },
  });
  const job = await prisma.job.create({
    data: {
      recruiterId: recruiter.id,
      companyId: company.id,
      title: "Lead Product Designer",
      slug: "lead-product-designer-greenly",
      description:
        "Lead product discovery and design systems for climate products used by growing businesses.",
      location: "Melbourne, Australia",
      workMode: "HYBRID",
      employmentType: "FULL_TIME",
      experienceLevel: "SENIOR",
      salaryMin: 155000,
      salaryMax: 175000,
      poolSize: 100,
      targetShortlist: 10,
      status: "ACTIVE",
      publishedAt: new Date(),
      skills: {
        create: await Promise.all(
          ["Figma", "Product strategy", "User research", "Design systems"].map(
            async (name, index) => ({
              skillId: (await prisma.skill.findUniqueOrThrow({ where: { name } })).id,
              weight: index < 2 ? 3 : 2,
              required: index < 2,
            }),
          ),
        ),
      },
      stages: {
        create: [
          {
            position: 1,
            name: "Pre-screen & skill verification",
            type: StageType.PRE_SCREEN,
            instructions: "Confirm eligibility, availability and role fundamentals.",
            durationMinutes: 25,
            passThreshold: 70,
            config: { format: "mixed", questions: 6 },
            modelVersionId: model.id,
          },
          {
            position: 2,
            name: "Behavioural assessment",
            type: StageType.BEHAVIOURAL,
            instructions: "Respond to structured workplace scenarios.",
            durationMinutes: 35,
            passThreshold: 72,
            config: { format: "situational", questions: 5 },
            modelVersionId: model.id,
          },
          {
            position: 3,
            name: "Technical design exercise",
            type: StageType.TECHNICAL,
            instructions: "Complete a product critique and design task.",
            durationMinutes: 90,
            passThreshold: 75,
            config: { format: "case-study", upload: true },
            modelVersionId: model.id,
          },
          {
            position: 4,
            name: "AI structured interview",
            type: StageType.AI_INTERVIEW,
            instructions: "Complete a recorded structured interview with consistent questions.",
            durationMinutes: 30,
            passThreshold: 76,
            config: { format: "agent-call", recording: true },
            modelVersionId: model.id,
          },
          {
            position: 5,
            name: "Final shortlist review",
            type: StageType.FINAL_REVIEW,
            instructions: "Human review of evidence and recommendation for face-to-face interview.",
            passThreshold: 80,
            config: { humanApprovalRequired: true },
            modelVersionId: model.id,
          },
        ],
      },
    },
  });
  const stages = await prisma.hiringStage.findMany({
    where: { jobId: job.id },
    orderBy: { position: "asc" },
  });
  for (let index = 0; index < candidates.length; index++) {
    const entry = candidates[index];
    const reached = index === 0 ? 4 : Math.min(5, 1 + Math.floor((people.length - index) / 3));
    const status = index > 0 && index < 3 ? ProcessStatus.FINALIST : ProcessStatus.ACTIVE;
    const isFinalist = status === ProcessStatus.FINALIST;
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: entry.candidate.id,
        status,
        currentStagePosition: reached,
        matchScore: 96 - index * 2.1,
        matchReasons: {
          reasons: ["Verified core skills", "Preferred work mode aligned"],
          missingRequired: [],
        },
        identityRevealed: true,
        invitedAt: new Date(Date.now() - index * 3600000),
      },
    });
    for (const stage of stages.slice(0, reached)) {
      const isCurrent = !isFinalist && stage.position === reached;
      const run = await prisma.stageRun.create({
        data: {
          applicationId: application.id,
          stageId: stage.id,
          status: isCurrent ? StageRunStatus.INVITED : StageRunStatus.PASSED,
          startedAt: isCurrent ? null : new Date(),
          submittedAt: isCurrent ? null : new Date(),
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      if (!isCurrent) {
        await prisma.stageSubmission.create({
          data: {
            stageRunId: run.id,
            answers: { criterion1: 82 - index, criterion2: 88 - index, criterion3: 84 - index },
            artifactUrls: [],
            candidateAttestation: true,
          },
        });
        await prisma.stageDecision.create({
          data: {
            stageRunId: run.id,
            source: "AI",
            outcome: "ADVANCE",
            score: 85 - index,
            confidence: 0.86,
            rationale: {
              summary: "Met the published rubric",
              strengths: ["Structured evidence", "Relevant examples"],
            },
            policyVersion: "hireme-selection-v1",
            modelVersionId: model.id,
          },
        });
      }
    }
  }
  await prisma.notification.create({
    data: {
      userId: candidates[0].user.id,
      type: "STAGE_INVITATION",
      title: "Your next interview stage is ready",
      body: "Continue your Greenly interview journey.",
      href: "/dashboard",
    },
  });
  console.log("Seeded HireME demo", {
    recruiter: "recruiter@hireme.test",
    candidate: "candidate@hireme.test",
    password: demoPassword,
  });
}
main().finally(() => prisma.$disconnect());
