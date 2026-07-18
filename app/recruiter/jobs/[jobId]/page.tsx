import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, UsersRound } from "lucide-react";
import { LaunchButton } from "./launch-button";
import { DraftActions } from "./draft-actions";
import { CancelPipelineButton } from "./cancel-pipeline-button";
import { ProfileModalTrigger } from "@/components/profile-modal";
import { RemovePipelineButton } from "./remove-pipeline-button";
export const dynamic = "force-dynamic";

export default async function JobPipeline({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireUser("RECRUITER");
  const { jobId } = await params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, recruiter: { userId: user.id } },
    include: {
      company: true,
      skills: { include: { skill: true } },
      stages: { orderBy: { position: "asc" }, include: { runs: true } },
      applications: {
        where: {
          matchScore: { gte: 60 },
          status: { in: ["MATCHED", "INVITED", "ACTIVE", "FINALIST"] },
        },
        orderBy: { matchScore: "desc" },
        include: {
          candidate: { include: { user: true } },
          invitations: { where: { kind: "SHORTLIST", status: "ACCEPTED" } },
          stageRuns: { include: { stage: true } },
        },
      },
    },
  });
  if (!job) notFound();
  return (
    <AppShell role="recruiter" name={user.name} subtitle={job.company.name}>
      <main className="dashboard">
        <Link className="pipeline-back" href="/recruiter">
          <ArrowLeft />
          Back to company overview
        </Link>
        <div className="dash-title">
          <div>
            <p>{job.status} PIPELINE</p>
            <h1>{job.title}</h1>
            <small>
              {job.location} · {job.workMode.toLowerCase()} · minimum match {job.minMatchScore}% ·
              maximum invitations {job.poolSize}
            </small>
          </div>
          <LaunchButton jobId={job.id} disabled={job.status !== "DRAFT"} />
        </div>
        {job.status === "DRAFT" && <DraftActions jobId={job.id} />}{" "}
        {(["ACTIVE", "PAUSED"] as string[]).includes(job.status) && (
          <CancelPipelineButton jobId={job.id} />
        )}{" "}
        {job.status === "CLOSED" && <RemovePipelineButton jobId={job.id} jobTitle={job.title} />}
        <section className="job-requirements">
          <div>
            <small>EMPLOYMENT</small>
            <strong>{job.employmentType.replaceAll("_", " ")}</strong>
          </div>
          <div>
            <small>EXPERIENCE</small>
            <strong>{job.experienceLevel}</strong>
          </div>
          <div>
            <small>EDUCATION</small>
            <strong>{job.requiredEducation?.replaceAll("_", " ") ?? "Not specified"}</strong>
          </div>
          <div>
            <small>WORK RIGHTS</small>
            <strong>{job.workRightsRequirement?.replaceAll("_", " ") ?? "Not specified"}</strong>
          </div>
          <div>
            <small>WORK MODE</small>
            <strong>{job.workMode}</strong>
          </div>
          <div>
            <small>SALARY</small>
            <strong>
              {job.salaryMin && job.salaryMax
                ? `$${Math.round(job.salaryMin / 1000)}k–$${Math.round(job.salaryMax / 1000)}k`
                : "Not listed"}
            </strong>
          </div>
        </section>
        <section className="panel stage-overview">
          <div className="panel-head">
            <div>
              <p>AUTONOMOUS SELECTION JOURNEY</p>
              <h2>{job.stages.length} configured interview phases</h2>
            </div>
          </div>
          <div className="workflow-line">
            {job.stages.map((stage) => (
              <div key={stage.id}>
                <i>
                  {stage.runs.some((run) => run.status === "PASSED") ? (
                    <CheckCircle2 />
                  ) : (
                    <Circle />
                  )}
                </i>
                <span>
                  <strong>
                    {stage.position}. {stage.name}
                  </strong>
                  <small>
                    {stage.runs.length} candidates · pass ≥ {stage.passThreshold}% ·{" "}
                    {stage.completionDays} days
                  </small>
                </span>
              </div>
            ))}
          </div>
          <div className="pipeline-question-list">
            {job.stages.map((stage) => {
              const config = stage.config as { questions?: string[] };
              return (
                <details key={stage.id}>
                  <summary>
                    {stage.position}. {stage.name}
                    <span>
                      {config.questions?.length ?? 0} questions · {stage.durationMinutes ?? 0} min
                    </span>
                  </summary>
                  <ol>
                    {config.questions?.map((question) => <li key={question}>{question}</li>) ?? (
                      <li>Legacy stage without configured questions.</li>
                    )}
                  </ol>
                </details>
              );
            })}
          </div>
        </section>
        <section className="panel pipeline-table">
          <div className="panel-head">
            <div>
              <p>
                {job.status === "DRAFT"
                  ? "DRAFT MATCH PREVIEW"
                  : "QUALIFIED AND INVITED CANDIDATES"}
              </p>
              <h2>
                {job.applications.length} candidates at or above {job.minMatchScore}%
              </h2>
            </div>
            <UsersRound />
          </div>
          <div className="table-head">
            <span>Candidate</span>
            <span>Match</span>
            <span>Current stage</span>
            <span>Status</span>
          </div>
          {job.applications.length === 0 && (
            <p className="empty-state">
              No candidates met the minimum match threshold. Edit the requirements and refresh
              matching, or delete this draft.
            </p>
          )}
          {job.applications.map((application) => (
            <div className="table-row" key={application.id}>
              <span>
                {application.identityRevealed ||
                application.invitations.length > 0 ||
                application.candidate.visibility === "PUBLIC" ? (
                  <ProfileModalTrigger type="candidate" id={application.candidate.id}>
                    <strong>
                      {application.candidate.user.name} <ExternalLink size={12} />
                    </strong>
                    <small>{application.candidate.headline}</small>
                  </ProfileModalTrigger>
                ) : (
                  <>
                    <strong>Anonymous candidate</strong>
                    <small>{application.candidate.headline}</small>
                  </>
                )}
              </span>
              <b>{Math.round(application.matchScore)}%</b>
              <span>
                {job.status === "DRAFT"
                  ? "Preview only"
                  : (job.stages.find((stage) => stage.position === application.currentStagePosition)
                      ?.name ?? "Shortlist invitation")}
              </span>
              <i className={`status-pill ${application.status.toLowerCase()}`}>
                {application.status}
              </i>
            </div>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
