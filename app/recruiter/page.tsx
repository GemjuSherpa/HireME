import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Plus,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProfileModalTrigger } from "@/components/profile-modal";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FaceToFaceScheduler } from "./face-to-face-scheduler";
export const dynamic = "force-dynamic";

export default async function RecruiterDashboard() {
  const user = await requireUser("RECRUITER");
  const recruiter = await prisma.recruiterProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      company: true,
      jobs: {
        orderBy: { createdAt: "desc" },
        include: {
          applications: {
            include: {
              candidate: { include: { user: true } },
              stageRuns: true,
              faceToFaceInterview: true,
            },
          },
          stages: { orderBy: { position: "asc" } },
        },
      },
    },
  });
  const jobs = recruiter.jobs,
    applications = jobs.flatMap((job) => job.applications),
    reviewCount = applications
      .flatMap((a) => a.stageRuns)
      .filter((r) => r.status === "NEEDS_REVIEW").length,
    finalists = applications.filter((a) => a.status === "FINALIST");
  const orchestrationJobs = jobs.filter(
    (job) =>
      ["ACTIVE", "PAUSED"].includes(job.status) ||
      job.applications.some((application) => application.status === "FINALIST"),
  );
  const pipelineHistory = jobs.filter((job) => job.status !== "ACTIVE");
  const recommendationsByCandidate = new Map<
    string,
    { application: (typeof applications)[number]; job: (typeof jobs)[number] }
  >();
  for (const job of jobs)
    for (const application of job.applications) {
      if (
        application.candidateHiddenAt ||
        application.matchScore < job.minMatchScore ||
        !["MATCHED", "INVITED", "ACTIVE", "FINALIST"].includes(application.status)
      )
        continue;
      const existing = recommendationsByCandidate.get(application.candidateId);
      if (!existing || existing.application.matchScore < application.matchScore)
        recommendationsByCandidate.set(application.candidateId, { application, job });
    }
  const recommendations = [...recommendationsByCandidate.values()].sort(
    (a, b) => b.application.matchScore - a.application.matchScore,
  );

  return (
    <AppShell
      role="recruiter"
      name={user.name}
      subtitle={recruiter.company.name}
      badgeCount={reviewCount}
    >
      <main className="dashboard">
        <div className="dash-title">
          <div>
            <p>{recruiter.company.name.toUpperCase()} · RECRUITER WORKSPACE</p>
            <h1>Good morning, {user.name.split(" ")[0]}</h1>
            <small>Monitor autonomous stages and review consequential decisions.</small>
          </div>
          <Link className="primary-action" href="/recruiter/jobs/new">
            <Plus />
            Create a pipeline
          </Link>
        </div>
        <section className="panel orchestration-section">
          <div className="panel-head orchestration-head">
            <div>
              <p>ORCHESTRATION STATUS</p>
              <h2>Pipeline-by-pipeline hiring status</h2>
              <small>
                {finalists.length} shortlisted candidates · {reviewCount} decisions need human
                review
              </small>
            </div>
            <span className="agent-icon">
              <Bot />
            </span>
          </div>
          <div className="orchestration-grid">
            {orchestrationJobs.map((job) => {
              const jobFinalists = job.applications.filter(
                  (application) => application.status === "FINALIST",
                ),
                jobReviews = job.applications
                  .flatMap((application) => application.stageRuns)
                  .filter((run) => run.status === "NEEDS_REVIEW").length,
                jobInFlow = job.applications.filter((application) =>
                  ["MATCHED", "INVITED", "ACTIVE", "FINALIST"].includes(application.status),
                ).length;
              return (
                <article className="orchestration-pipeline" key={job.id}>
                  <header>
                    <div>
                      <span className={`status-pill ${job.status.toLowerCase()}`}>
                        {job.status}
                      </span>
                      <h3>{job.title}</h3>
                      <small>
                        {job.location ?? "Flexible location"} · {job.stages.length} stages
                      </small>
                    </div>
                    <Link
                      href={`/recruiter/jobs/${job.id}`}
                      aria-label={`View ${job.title} pipeline`}
                    >
                      <ArrowUpRight />
                    </Link>
                  </header>
                  <div className="orchestration-metrics">
                    <span>
                      <strong>{jobInFlow}</strong>
                      <small>In flow</small>
                    </span>
                    <span>
                      <strong>{jobReviews}</strong>
                      <small>Needs review</small>
                    </span>
                    <span>
                      <strong>{jobFinalists.length}</strong>
                      <small>Shortlisted</small>
                    </span>
                  </div>
                  <div className="pipeline-finalists">
                    <div className="pipeline-finalists-title">
                      <strong>Shortlisted candidates</strong>
                      <span>{jobFinalists.length}</span>
                    </div>
                    {jobFinalists.length === 0 ? (
                      <p className="orchestration-empty">
                        No candidates have reached the final shortlist yet.
                      </p>
                    ) : (
                      jobFinalists.map((application) => (
                        <div className="pipeline-finalist" key={application.id}>
                          <div className="avatar-sm">
                            {application.candidate.user.name
                              .split(" ")
                              .map((x) => x[0])
                              .join("")}
                          </div>
                          <span>
                            <strong>{application.candidate.user.name}</strong>
                            <small>
                              {application.candidate.headline} ·{" "}
                              {Math.round(application.matchScore)}% match
                            </small>
                          </span>
                          <FaceToFaceScheduler
                            applicationId={application.id}
                            candidateName={application.candidate.user.name}
                            existing={
                              application.faceToFaceInterview
                                ? {
                                    firstOption:
                                      application.faceToFaceInterview.firstOption.toISOString(),
                                    secondOption:
                                      application.faceToFaceInterview.secondOption.toISOString(),
                                    selectedOption:
                                      application.faceToFaceInterview.selectedOption?.toISOString() ??
                                      null,
                                    status: application.faceToFaceInterview.status,
                                    location: application.faceToFaceInterview.location,
                                  }
                                : undefined
                            }
                          />
                        </div>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
            {orchestrationJobs.length === 0 && (
              <div className="empty-state">
                No active pipelines to orchestrate. Create or launch a pipeline to begin matching
                candidates.
              </div>
            )}
          </div>
        </section>
        <section className="stats-row">
          <article>
            <span className="stat-icon green">
              <BriefcaseBusiness />
            </span>
            <div>
              <small>ACTIVE ROLES</small>
              <strong>{jobs.filter((j) => j.status === "ACTIVE").length}</strong>
              <em>{jobs.length} total</em>
            </div>
          </article>
          <article>
            <span className="stat-icon coral">
              <UsersRound />
            </span>
            <div>
              <small>CANDIDATES IN FLOW</small>
              <strong>{applications.length}</strong>
              <em>Across hiring pipelines</em>
            </div>
          </article>
          <article>
            <span className="stat-icon purple">
              <Clock3 />
            </span>
            <div>
              <small>NEEDS REVIEW</small>
              <strong>{reviewCount}</strong>
              <em>AI never decides silently</em>
            </div>
          </article>
          <article>
            <span className="stat-icon amber">
              <CheckCircle2 />
            </span>
            <div>
              <small>FINALISTS</small>
              <strong>{finalists.length}</strong>
              <em>Ready to interview</em>
            </div>
          </article>
        </section>
        <div className="overview-secondary-grid">
          <section className="panel activity">
            <div className="panel-head">
              <div>
                <p>PIPELINE HISTORY</p>
                <h2>Inactive pipelines</h2>
                <small>Draft, paused, closed and cancelled hiring pipelines.</small>
              </div>
            </div>
            {pipelineHistory.length ? (
              pipelineHistory.map((job) => {
                const total = job.applications.length,
                  progressed = job.applications.filter((a) => a.currentStagePosition > 1).length,
                  pct = total ? Math.round((progressed / total) * 100) : 0;
                return (
                  <Link className="job-progress" key={job.id} href={`/recruiter/jobs/${job.id}`}>
                    <div className="pipeline-row">
                      <span>
                        <strong>{job.title}</strong>
                        <small>
                          {total} candidates · {job.stages.length} stages
                        </small>
                      </span>
                      <b>{pct}%</b>
                    </div>
                    <div className="pipeline-bar">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                    <small>
                      {job.status} · {job.location ?? "Flexible location"} · pool limit{" "}
                      {job.poolSize}
                    </small>
                  </Link>
                );
              })
            ) : (
              <div className="empty-state">There are no inactive pipelines in your history.</div>
            )}
            <Link className="quiet-button" href="/recruiter/jobs/new">
              Create another role
            </Link>
          </section>
          <section className="panel recommended-candidates" id="matches">
            <div className="panel-head">
              <div>
                <p>RELEVANT TO YOUR COMPANY AND OPEN ROLES</p>
                <h2>Recommended candidates</h2>
                <small>
                  {recommendations.length} unique candidates meeting the applicable job threshold,
                  skills, work arrangement and location filters.
                </small>
              </div>
              <UsersRound />
            </div>
            {recommendations.length ? (
              <div className="recommended-grid">
                {recommendations.map(({ application, job }) => {
                  const visible =
                    application.identityRevealed || application.candidate.visibility === "PUBLIC";
                  return (
                    <article key={application.candidateId}>
                      <div className="candidate-avatar avatar-sm">
                        {visible
                          ? application.candidate.user.name
                              .split(" ")
                              .map((x) => x[0])
                              .join("")
                          : "?"}
                      </div>
                      <div>
                        {visible ? (
                          <ProfileModalTrigger type="candidate" id={application.candidate.id}>
                            <h3>{application.candidate.user.name}</h3>
                          </ProfileModalTrigger>
                        ) : (
                          <h3>Anonymous candidate</h3>
                        )}
                        <p>
                          {application.candidate.headline ?? "Candidate"} ·{" "}
                          {application.candidate.location ?? "Location not listed"}
                        </p>
                        <small>
                          Recommended for <strong>{job.title}</strong> ·{" "}
                          {job.location ?? "Flexible"}
                        </small>
                      </div>
                      <div className="fit">
                        <strong>{Math.round(application.matchScore)}%</strong>
                        <span>MATCH</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                No candidates currently meet the minimum match threshold for this company’s hiring
                pipelines. Refresh draft matches or adjust job requirements.
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
