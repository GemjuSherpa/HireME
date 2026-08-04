import {
  DecisionOutcome,
  DecisionSource,
  InvitationStatus,
  JobStatus,
  ProcessStatus,
  StageRunStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateMatch } from "@/lib/matching";
import { hashToken, randomToken } from "@/lib/security";
import { deliverOutboxEmail, shortlistEmail } from "@/lib/email";
import { rankWithMatchingService } from "@/lib/hybrid-matching";
import { evaluateCandidateEligibility } from "@/features/matching/domain/candidate-eligibility";
import { ApplicationError } from "@/shared/errors/application-error";
import {
  scoreCognitiveAnswers,
  inferJobFamily,
  selectAssessmentQuestions,
  type AssessmentQuestion,
} from "@/lib/assessment-question-bank";
import { evaluateWrittenAssessment } from "@/lib/assessment-evaluator";

/** Launches a draft pipeline after refreshing matches and queues shortlist invitations by rank. */
export async function launchJob(jobId: string, actorId: string) {
  const preview = await previewJobMatches(jobId, actorId);
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  const applications = await prisma.application.findMany({
    where: { jobId, status: ProcessStatus.MATCHED },
    orderBy: { matchScore: "desc" },
    take: job.poolSize,
    include: { candidate: { include: { user: true } } },
  });
  for (const [index, application] of applications.entries())
    await inviteToShortlist(
      application.id,
      application.candidate.user.email,
      index + 1,
      job.shortlistResponseDays,
    );
  await prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.ACTIVE, publishedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "JOB_LAUNCHED",
      entityType: "Job",
      entityId: jobId,
      metadata: preview,
    },
  });
  return preview;
}

/** Rebuilds a draft's eligible match preview and records an auditable summary. */
export async function previewJobMatches(jobId: string, actorId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { skills: { include: { skill: true } }, stages: { orderBy: { position: "asc" } } },
  });
  if (job.status !== JobStatus.DRAFT)
    throw new Error("Only draft pipelines can refresh matching previews.");
  const candidates = await prisma.candidateProfile.findMany({
    where: { seekingStatus: { not: "NOT_LOOKING" } },
    include: {
      user: true,
      skills: { include: { skill: true } },
      experiences: true,
      projects: true,
    },
  });
  const hybridResults = await rankWithMatchingService(candidates, job);
  const evaluated = candidates.map((candidate) => {
    const hybrid = hybridResults?.get(candidate.id);
    return {
      candidate,
      eligibility: hybridResults
        ? hybrid
          ? { eligible: hybrid.eligible, checks: hybrid.filter_checks }
          : { eligible: false, checks: { retrieval: "Outside hybrid retrieval top 1000" } }
        : evaluateCandidateEligibility(candidate, job),
      result:
        hybrid ??
        calculateMatch(
          {
            skills: candidate.skills.map((item) => ({
              name: item.skill.name,
              proficiency: item.proficiency,
              verified: item.verified,
            })),
            desiredTitles: candidate.desiredTitles,
            workModes: candidate.workModes,
            yearsExperience: candidate.experiences.reduce(
              (sum, item) =>
                sum +
                ((item.endDate ?? new Date()).getTime() - item.startDate.getTime()) /
                  31_557_600_000,
              0,
            ),
          },
          {
            title: job.title,
            workMode: job.workMode,
            experienceYears: experienceYears(job.experienceLevel),
            skills: job.skills.map((item) => ({
              name: item.skill.name,
              weight: item.weight,
              required: item.required,
            })),
          },
        ),
    };
  });
  const ranked = evaluated
    .filter((item) => item.eligibility.eligible && item.result.score >= job.minMatchScore)
    .map((item) => ({
      ...item,
      result: {
        ...item.result,
        filterChecks: item.eligibility.checks,
        roleContext: {
          description: job.description,
          responsibilities: job.responsibilities,
          idealCandidate: job.idealCandidate,
          perks: job.perks,
          education: job.requiredEducation,
          workRights: job.workRightsRequirement,
        },
      },
    }))
    .sort((a, b) => b.result.score - a.result.score);
  await prisma.application.deleteMany({ where: { jobId, status: ProcessStatus.MATCHED } });
  for (const { candidate, result } of ranked)
    await prisma.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        matchScore: result.score,
        matchReasons: result,
        status: ProcessStatus.MATCHED,
      },
    });
  const summary = {
    analysed: evaluated.length,
    eligible: evaluated.filter((item) => item.eligibility.eligible).length,
    belowThreshold: evaluated.filter(
      (item) => item.eligibility.eligible && item.result.score < job.minMatchScore,
    ).length,
    qualified: ranked.length,
    minimumMatchScore: job.minMatchScore,
    thresholdPolicy: "recruiter-configured",
    shortlistOffers: Math.min(ranked.length, job.poolSize),
  };
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "DRAFT_MATCH_PREVIEWED",
      entityType: "Job",
      entityId: jobId,
      metadata: summary,
    },
  });
  return summary;
}

/** Queues a consent-first shortlist invitation; synthetic users never receive external email. */
export async function inviteToShortlist(
  applicationId: string,
  email: string,
  ranking: number,
  responseDays: number,
) {
  const application = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: {
      candidate: { include: { user: true } },
      job: { include: { company: true, skills: { include: { skill: true } } } },
    },
  });
  const token = randomToken();
  const expiresAt = new Date(Date.now() + responseDays * 86_400_000);
  await prisma.invitation.create({
    data: {
      applicationId,
      kind: "SHORTLIST",
      ranking,
      tokenHash: hashToken(token),
      status: InvitationStatus.QUEUED,
      expiresAt,
    },
  });
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: ProcessStatus.INVITED, invitedAt: new Date() },
  });
  const content = shortlistEmail(application.job, token, expiresAt);
  const outbox = await prisma.emailOutbox.create({
    data: {
      toEmail: email,
      template: "shortlist-consent",
      dedupeKey: `shortlist-offer:${applicationId}`,
      status: application.candidate.user.isSynthetic ? "CANCELLED" : "PENDING",
      lastError: application.candidate.user.isSynthetic
        ? "Synthetic candidate: external delivery intentionally suppressed"
        : null,
      payload: {
        jobTitle: application.job.title,
        ranking,
        responseDays,
        invitationUrl: content.invitationUrl,
        actions: ["ACCEPT", "DECLINE"],
        synthetic: application.candidate.user.isSynthetic,
      },
    },
  });
  if (!application.candidate.user.isSynthetic)
    await deliverOutboxEmail(outbox.id, content.subject, content.html);
}

/** Applies a candidate's shortlist choice and advances or replenishes the ranked pool. */
export async function respondToShortlist(token: string, action: "ACCEPT" | "DECLINE") {
  const invitation = await prisma.invitation.findUniqueOrThrow({
    where: { tokenHash: hashToken(token) },
    select: { id: true },
  });
  return applyShortlistResponse(invitation.id, action);
}

/** Applies a dashboard response after confirming the invitation belongs to the signed-in candidate. */
export async function respondToOwnedShortlist(
  invitationId: string,
  candidateUserId: string,
  action: "ACCEPT" | "DECLINE",
) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, application: { candidate: { userId: candidateUserId } } },
    select: { id: true },
  });
  if (!invitation) throw new ApplicationError("Shortlist invitation not found.", 404);
  return applyShortlistResponse(invitation.id, action);
}

async function applyShortlistResponse(invitationId: string, action: "ACCEPT" | "DECLINE") {
  const invitation = await prisma.invitation.findUniqueOrThrow({
    where: { id: invitationId },
    include: {
      application: {
        include: {
          candidate: { include: { user: true } },
          job: { include: { stages: { orderBy: { position: "asc" } } } },
        },
      },
    },
  });
  if (
    invitation.kind !== "SHORTLIST" ||
    invitation.status === InvitationStatus.ACCEPTED ||
    invitation.status === InvitationStatus.DECLINED
  )
    throw new ApplicationError("This shortlist invitation is no longer available.", 409);
  if (invitation.expiresAt < new Date())
    throw new ApplicationError("This shortlist invitation has expired.", 410);
  let assessmentPath: string | undefined;
  if (action === "ACCEPT") {
    const first = invitation.application.job.stages[0];
    await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      }),
      prisma.application.update({
        where: { id: invitation.applicationId },
        data: {
          status: ProcessStatus.ACTIVE,
          currentStagePosition: first?.position ?? 0,
          identityRevealed: true,
        },
      }),
    ]);
    if (first) {
      const run = await inviteToStage(
        invitation.applicationId,
        first.id,
        invitation.application.candidate.user.email,
        invitation.application.job.title,
        first.name,
        first.completionDays,
      );
      assessmentPath = `/interviews/${run.id}`;
    }
  } else {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.DECLINED, declinedAt: new Date() },
    });
    await prisma.application.update({
      where: { id: invitation.applicationId },
      data: { status: ProcessStatus.WITHDRAWN, completedAt: new Date() },
    });
    await inviteNextRankedCandidate(invitation.application.jobId);
  }
  return { status: action, assessmentPath };
}

async function inviteNextRankedCandidate(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  const lastRank = await prisma.invitation.aggregate({
    where: { application: { jobId }, kind: "SHORTLIST" },
    _max: { ranking: true },
  });
  const next = await prisma.application.findFirst({
    where: { jobId, status: ProcessStatus.MATCHED, invitations: { none: { kind: "SHORTLIST" } } },
    orderBy: { matchScore: "desc" },
    include: { candidate: { include: { user: true } } },
  });
  if (next)
    await inviteToShortlist(
      next.id,
      next.candidate.user.email,
      (lastRank._max.ranking ?? 0) + 1,
      job.shortlistResponseDays,
    );
}

/** Expires overdue shortlist invitations and offers each released place to the next candidate. */
export async function processExpiredShortlistInvitations() {
  const expired = await prisma.invitation.findMany({
    where: {
      kind: "SHORTLIST",
      status: { in: [InvitationStatus.QUEUED, InvitationStatus.SENT, InvitationStatus.OPENED] },
      expiresAt: { lt: new Date() },
    },
    include: { application: true },
  });
  for (const invitation of expired) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    await prisma.application.update({
      where: { id: invitation.applicationId },
      data: { status: ProcessStatus.WITHDRAWN, completedAt: new Date() },
    });
    await inviteNextRankedCandidate(invitation.application.jobId);
  }
  return { expired: expired.length, replacementsQueued: expired.length };
}

/** Idempotently creates the first assessment attempt and its invitation. */
export async function inviteToStage(
  applicationId: string,
  stageId: string,
  email: string,
  jobTitle: string,
  stageName: string,
  completionDays = 7,
) {
  const questionSet = await createQuestionSet(stageId);
  const stageRun = await prisma.stageRun.upsert({
    where: { applicationId_stageId_attempt: { applicationId, stageId, attempt: 1 } },
    update: {},
    create: {
      applicationId,
      stageId,
      questionSet,
      status: StageRunStatus.INVITED,
      expiresAt: new Date(Date.now() + completionDays * 86_400_000),
    },
  });
  const token = randomToken();
  await prisma.invitation.upsert({
    where: { stageRunId: stageRun.id },
    update: {},
    create: {
      applicationId,
      stageRunId: stageRun.id,
      kind: "ASSESSMENT",
      tokenHash: hashToken(token),
      status: InvitationStatus.QUEUED,
      expiresAt: new Date(Date.now() + completionDays * 86_400_000),
    },
  });
  await prisma.emailOutbox.upsert({
    where: { dedupeKey: `stage-invite:${stageRun.id}` },
    update: {},
    create: {
      toEmail: email,
      template: "stage-invitation",
      dedupeKey: `stage-invite:${stageRun.id}`,
      payload: { jobTitle, stageName, completionDays, invitationToken: token },
    },
  });
  return stageRun;
}

/** Returns the immutable question snapshot for a stage run, backfilling legacy runs once. */
export async function ensureStageRunQuestions(stageRunId: string): Promise<AssessmentQuestion[]> {
  const run = await prisma.stageRun.findUniqueOrThrow({
    where: { id: stageRunId },
    select: { questionSet: true, stageId: true },
  });
  const existing = run.questionSet as AssessmentQuestion[];
  if (Array.isArray(existing) && existing.length > 0) return existing;
  const questionSet = await createQuestionSet(run.stageId);
  await prisma.stageRun.update({ where: { id: stageRunId }, data: { questionSet } });
  return questionSet;
}

/** Selects questions exclusively from the requested phase bank and its recruiter additions. */
async function createQuestionSet(stageId: string): Promise<AssessmentQuestion[]> {
  const stage = await prisma.hiringStage.findUniqueOrThrow({
    where: { id: stageId },
    include: {
      job: {
        include: {
          company: true,
          skills: { include: { skill: true }, orderBy: { weight: "desc" } },
        },
      },
    },
  });
  const config = stage.config as { questions?: string[]; sampleSize?: number };
  return selectAssessmentQuestions(
    stage.type,
    {
      jobTitle: stage.job.title,
      companyName: stage.job.company.name,
      primarySkill: stage.job.skills[0]?.skill.name ?? "the role's primary skill",
      location: stage.job.location ?? "the advertised location",
      workMode: stage.job.workMode.toLowerCase(),
      jobFamily: inferJobFamily(
        stage.job.title,
        stage.job.skills.map((item) => item.skill.name),
      ),
      experienceLevel: stage.job.experienceLevel,
    },
    config.questions ?? [],
    undefined,
    config.sampleSize,
  );
}

/** Autonomously evaluates submitted evidence and advances or closes the application. */
export async function evaluateStageRun(stageRunId: string) {
  const run = await prisma.stageRun.findUniqueOrThrow({
    where: { id: stageRunId },
    include: {
      submission: true,
      stage: true,
      application: {
        include: {
          candidate: { include: { user: true } },
          job: {
            include: {
              stages: { orderBy: { position: "asc" } },
              skills: { include: { skill: true } },
            },
          },
        },
      },
    },
  });
  if (!run.submission) throw new Error("Submission required");
  const answers = run.submission.answers as Record<string, unknown>;
  await prisma.stageRun.update({
    where: { id: stageRunId },
    data: { status: StageRunStatus.EVALUATING },
  });
  const questions = run.questionSet as AssessmentQuestion[];
  const stringAnswers = Object.fromEntries(
    Object.entries(answers).map(([id, value]) => [id, String(value)]),
  );
  const cognitiveResult =
    run.stage.type === "COGNITIVE_APTITUDE"
      ? scoreCognitiveAnswers(questions, stringAnswers)
      : null;
  let writtenEvaluation: Awaited<ReturnType<typeof evaluateWrittenAssessment>> | null = null;
  try {
    if (!cognitiveResult)
      writtenEvaluation = await evaluateWrittenAssessment({
        stageType: run.stage.type,
        stageName: run.stage.name,
        jobTitle: run.application.job.title,
        jobDescription: run.application.job.description,
        responsibilities: run.application.job.responsibilities,
        idealCandidate: run.application.job.idealCandidate,
        requiredSkills: run.application.job.skills
          .filter((item) => item.required)
          .map((item) => item.skill.name),
        questions,
        answers: stringAnswers,
        safetyIdentifier: run.application.candidate.user.id,
      });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown assessment service failure";
    const decision = await prisma.stageDecision.create({
      data: {
        stageRunId,
        source: DecisionSource.AI,
        outcome: DecisionOutcome.REVIEW,
        rationale: { summary: "Automated evaluation could not complete.", technicalError: message },
        policyVersion: "hireme-autonomous-assessment-v2",
      },
    });
    await prisma.stageRun.update({
      where: { id: stageRunId },
      data: { status: StageRunStatus.NEEDS_REVIEW },
    });
    return decision;
  }
  const score = cognitiveResult?.score ?? writtenEvaluation!.score;
  const confidence = cognitiveResult
    ? Math.min(0.98, 0.72 + cognitiveResult.total * 0.015)
    : writtenEvaluation!.confidence;
  const outcome: DecisionOutcome =
    score >= run.stage.passThreshold ? DecisionOutcome.ADVANCE : DecisionOutcome.REJECT;
  const decision = await prisma.stageDecision.create({
    data: {
      stageRunId,
      source: DecisionSource.AI,
      outcome,
      score,
      confidence,
      rationale: {
        summary:
          writtenEvaluation?.summary ??
          "Objective answers scored against the published answer key.",
        questionScores: writtenEvaluation?.questionScores,
        strengths: writtenEvaluation?.strengths,
        developmentAreas: writtenEvaluation?.developmentAreas,
        integrityFlags: writtenEvaluation?.integrityFlags,
        cognitive: cognitiveResult,
        threshold: run.stage.passThreshold,
        safeguards: ["Protected attributes excluded", "Job-related evidence only"],
        provider: writtenEvaluation?.provider ?? "DETERMINISTIC",
        model: writtenEvaluation?.model,
      },
      policyVersion: writtenEvaluation?.policyVersion ?? "hireme-objective-scoring-v2",
    },
  });
  const status =
    outcome === DecisionOutcome.ADVANCE
      ? StageRunStatus.PASSED
      : outcome === DecisionOutcome.REJECT
        ? StageRunStatus.FAILED
        : StageRunStatus.NEEDS_REVIEW;
  await prisma.stageRun.update({ where: { id: stageRunId }, data: { status } });
  if (outcome === DecisionOutcome.ADVANCE) {
    const next = run.application.job.stages.find(
      (stage) => stage.position > run.stage.position && stage.type !== "FINAL_REVIEW",
    );
    if (next) {
      await prisma.application.update({
        where: { id: run.applicationId },
        data: { status: ProcessStatus.ACTIVE, currentStagePosition: next.position },
      });
      await inviteToStage(
        run.applicationId,
        next.id,
        run.application.candidate.user.email,
        run.application.job.title,
        next.name,
        next.completionDays,
      );
    } else
      await prisma.application.update({
        where: { id: run.applicationId },
        data: { status: ProcessStatus.FINALIST, completedAt: new Date() },
      });
  } else if (outcome === DecisionOutcome.REJECT) {
    await prisma.application.update({
      where: { id: run.applicationId },
      data: { status: ProcessStatus.REJECTED, completedAt: new Date() },
    });
    await prisma.emailOutbox.create({
      data: {
        toEmail: run.application.candidate.user.email,
        template: "candidate-feedback",
        dedupeKey: `rejection:${run.applicationId}:${run.stageId}`,
        payload: {
          jobTitle: run.application.job.title,
          stageName: run.stage.name,
          feedback:
            "Thank you for your time. Your response showed strengths, but other candidates aligned more closely with this stage's published rubric.",
        },
      },
    });
  }
  return decision;
}

/** Retries transient autonomous-assessment failures before escalating them to technical support. */
export async function retryTechnicalAssessmentExceptions() {
  const retryBefore = new Date(Date.now() - 2 * 60 * 1000);
  const failedRuns = await prisma.stageRun.findMany({
    where: { status: StageRunStatus.NEEDS_REVIEW, updatedAt: { lte: retryBefore } },
    include: {
      decisions: {
        where: { outcome: DecisionOutcome.REVIEW },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    take: 10,
  });
  let retried = 0;
  let exhausted = 0;
  for (const run of failedRuns) {
    if (run.decisions.length >= 3) {
      exhausted += 1;
      continue;
    }
    const claimed = await prisma.stageRun.updateMany({
      where: { id: run.id, status: StageRunStatus.NEEDS_REVIEW },
      data: { status: StageRunStatus.EVALUATING },
    });
    if (!claimed.count) continue;
    await evaluateStageRun(run.id);
    retried += 1;
  }
  return { discovered: failedRuns.length, retried, exhausted };
}

function experienceYears(level: string) {
  return (
    ({ ENTRY: 0, JUNIOR: 1, MID: 3, SENIOR: 5, EXECUTIVE: 10 } as Record<string, number>)[
      level.toUpperCase()
    ] ?? 3
  );
}
