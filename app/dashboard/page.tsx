import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/security";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Target,
} from "lucide-react";
import Link from "next/link";
import { ProfileModalTrigger } from "@/components/profile-modal";
import { JourneyDeleteButton } from "./journey-delete-button";
import { InterviewOptions } from "./interview-options";
import { ShortlistInvitationCard } from "./shortlist-invitation-card";
export const dynamic = "force-dynamic";

export default async function CandidateDashboard() {
  const user = await requireUser("CANDIDATE");
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      skills: { include: { skill: true } },
      applications: {
        where: { candidateHiddenAt: null },
        orderBy: { updatedAt: "desc" },
        include: {
          job: {
            include: {
              company: true,
              skills: { include: { skill: true } },
              stages: { orderBy: { position: "asc" } },
            },
          },
          invitations: { select: { id: true, kind: true, status: true, expiresAt: true } },
          stageRuns: {
            include: { stage: true, decisions: { orderBy: { createdAt: "desc" }, take: 1 } },
          },
          faceToFaceInterview: true,
        },
      },
    },
  });
  const active = profile.applications.filter((a) =>
    ["INVITED", "ACTIVE", "FINALIST"].includes(a.status),
  );
  const pendingShortlists = profile.applications.flatMap((application) =>
    application.invitations
      .filter(
        (invitation) =>
          invitation.kind === "SHORTLIST" &&
          ["QUEUED", "SENT", "OPENED"].includes(invitation.status) &&
          invitation.expiresAt > new Date(),
      )
      .map((invitation) => ({ invitation, application })),
  );
  const actionable = active.filter(
    (application) =>
      (application.identityRevealed ||
        application.invitations.some(
          (invitation) => invitation.kind === "SHORTLIST" && invitation.status === "ACCEPTED",
        )) &&
      application.status !== "INVITED",
  );
  const nextRun = actionable
    .flatMap((a) => a.stageRuns.map((run) => ({ run, application: a })))
    .find(
      (item) =>
        ["INVITED", "IN_PROGRESS"].includes(item.run.status) &&
        (!item.run.expiresAt || item.run.expiresAt > new Date()),
    );
  const actionCount = actionable
    .flatMap((application) => application.stageRuns)
    .filter(
      (run) =>
        ["INVITED", "IN_PROGRESS"].includes(run.status) &&
        (!run.expiresAt || run.expiresAt > new Date()),
    ).length;
  const faceToFace = profile.applications.find((application) => application.status === "FINALIST");
  return (
    <AppShell
      role="candidate"
      name={user.name}
      subtitle={profile.headline ?? "Candidate"}
      badgeCount={active.length}
    >
      <main className="dashboard">
        <div className="dash-title">
          <div>
            <p>CANDIDATE WORKSPACE</p>
            <h1>
              Welcome back, {user.name.split(" ")[0]} <span>👋</span>
            </h1>
            <small>Your profile and interview journeys update in real time.</small>
          </div>
          <Link className="primary-action" href="/onboarding">
            Update profile
          </Link>
        </div>
        <section className="profile-banner">
          <div className="avatar-xl">
            {initials(user.name)}
            <i />
          </div>
          <div className="profile-summary">
            <div>
              <h2>
                {user.name} <BadgeCheck />
              </h2>
              <span>
                {profile.headline} · {profile.location}
              </span>
            </div>
            <div className="completion">
              <span>
                Profile strength <strong>{profile.profileScore}%</strong>
              </span>
              <div>
                <i style={{ width: `${profile.profileScore}%` }} />
              </div>
              <small>
                {profile.skills.filter((s) => s.verified).length} verified skills · Anonymous until
                you accept
              </small>
            </div>
          </div>
        </section>
        <section className="stats-row">
          <article>
            <span className="stat-icon green">
              <Target />
            </span>
            <div>
              <small>ACTIVE JOURNEYS</small>
              <strong>{active.length}</strong>
              <em>Across matched roles</em>
            </div>
          </article>
          <article>
            <span className="stat-icon coral">
              <BriefcaseBusiness />
            </span>
            <div>
              <small>STAGES COMPLETED</small>
              <strong>
                {
                  profile.applications
                    .flatMap((a) => a.stageRuns)
                    .filter((r) => r.status === "PASSED").length
                }
              </strong>
              <em>Evidence retained</em>
            </div>
          </article>
          <article>
            <span className="stat-icon purple">
              <Clock3 />
            </span>
            <div>
              <small>ACTION REQUIRED</small>
              <strong>{actionCount + pendingShortlists.length}</strong>
              <em>Check deadlines</em>
            </div>
          </article>
          <article>
            <span className="stat-icon amber">
              <CalendarDays />
            </span>
            <div>
              <small>FINAL SHORTLISTS</small>
              <strong>{profile.applications.filter((a) => a.status === "FINALIST").length}</strong>
              <em>Recruiter interview next</em>
            </div>
          </article>
        </section>
        {pendingShortlists.map(({ invitation, application }) => (
          <ShortlistInvitationCard
            key={invitation.id}
            invitation={{
              id: invitation.id,
              expiresAt: invitation.expiresAt.toISOString(),
              job: {
                title: application.job.title,
                companyName: application.job.company.name,
                description: application.job.description,
                responsibilities: application.job.responsibilities,
                idealCandidate: application.job.idealCandidate,
                perks: application.job.perks,
                location: application.job.location,
                workMode: application.job.workMode,
                skills: application.job.skills.map((item) => item.skill.name),
              },
            }}
          />
        ))}
        {nextRun && (
          <section className="invite-banner">
            <div className="invite-art">
              <BriefcaseBusiness />
            </div>
            <div>
              <p>NEXT ACTION</p>
              <h2>{nextRun.run.stage.name} is ready.</h2>
              <span>
                {nextRun.application.job.company.name} · approximately{" "}
                {nextRun.run.stage.durationMinutes ?? 30} minutes
              </span>
            </div>
            <Link href={`/interviews/${nextRun.run.id}`}>
              Begin stage <ChevronRight />
            </Link>
          </section>
        )}
        {faceToFace && (
          <section className="invite-banner face-to-face-banner">
            <div className="invite-art">
              <CalendarDays />
            </div>
            <div>
              <p>FINAL INTERVIEW</p>
              <h2>Face-to-face interview</h2>
              <span>
                You passed every assessment phase for {faceToFace.job.title} at{" "}
                {faceToFace.job.company.name}.
              </span>
              {faceToFace.faceToFaceInterview ? (
                <InterviewOptions
                  interview={{
                    id: faceToFace.faceToFaceInterview.id,
                    firstOption: faceToFace.faceToFaceInterview.firstOption.toISOString(),
                    secondOption: faceToFace.faceToFaceInterview.secondOption.toISOString(),
                    selectedOption:
                      faceToFace.faceToFaceInterview.selectedOption?.toISOString() ?? null,
                    timezone: faceToFace.faceToFaceInterview.timezone,
                    location: faceToFace.faceToFaceInterview.location,
                    status: faceToFace.faceToFaceInterview.status,
                  }}
                />
              ) : (
                <small>The company has not proposed interview times yet.</small>
              )}
            </div>
            <ProfileModalTrigger type="company" id={faceToFace.job.company.id}>
              View company
            </ProfileModalTrigger>
          </section>
        )}
        <section className="panel journey-panel" id="journeys">
          <span id="interview-stages" className="section-anchor" />
          <div className="panel-head">
            <div>
              <p>LIVE RECRUITMENT JOURNEYS</p>
              <h2>Your interview progress</h2>
            </div>
          </div>
          {profile.applications.map((application) => (
            <article className="journey" key={application.id}>
              <div className="journey-title">
                <ProfileModalTrigger
                  type="company"
                  id={application.job.company.id}
                  className="company-logo"
                >
                  {application.job.company.name[0]}
                </ProfileModalTrigger>
                <span>
                  <h3>{application.job.title}</h3>
                  <ProfileModalTrigger type="company" id={application.job.company.id}>
                    <span>
                      {application.job.company.name} · {application.job.workMode.toLowerCase()} ·{" "}
                      {Math.round(application.matchScore)}% match
                    </span>
                  </ProfileModalTrigger>
                </span>
                <b className={`status-pill ${application.status.toLowerCase()}`}>
                  {historyLabel(application)}
                </b>
              </div>
              {historyMessage(application) && (
                <p className="journey-notice">{historyMessage(application)}</p>
              )}
              <div className="stage-track">
                {application.job.stages.map((stage) => {
                  const run = application.stageRuns.find((item) => item.stageId === stage.id);
                  return (
                    <div
                      className={`stage-step ${run?.status.toLowerCase() ?? "locked"}`}
                      key={stage.id}
                    >
                      <i>{run?.status === "PASSED" ? <CheckCircle2 /> : stage.position}</i>
                      <span>
                        <strong>{stage.name}</strong>
                        <small>
                          {run?.status === "FAILED"
                            ? "Unsuccessful"
                            : run?.status === "EXPIRED"
                              ? "Expired"
                              : run?.status === "NEEDS_REVIEW"
                                ? "Evaluation delayed"
                                : (run?.status ?? "Locked")}
                        </small>
                      </span>
                    </div>
                  );
                })}
              </div>
              <JourneyDeleteButton
                applicationId={application.id}
                active={["MATCHED", "INVITED", "ACTIVE", "FINALIST"].includes(application.status)}
              />
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}

type HistoryApplication = {
  status: string;
  job: { status: string };
  invitations: { kind: string; status: string }[];
};
function historyLabel(application: HistoryApplication) {
  if (application.status === "REJECTED") return "UNSUCCESSFUL";
  if (application.status === "WITHDRAWN" && application.job.status === "CLOSED")
    return "ROLE UNLISTED";
  if (
    application.status === "WITHDRAWN" &&
    application.invitations.some(
      (invitation) => invitation.kind === "SHORTLIST" && invitation.status === "EXPIRED",
    )
  )
    return "INVITATION EXPIRED";
  return application.status;
}
function historyMessage(application: HistoryApplication) {
  if (application.status === "WITHDRAWN" && application.job.status === "CLOSED")
    return "The company closed or withdrew this role. No further action is required.";
  if (
    application.status === "WITHDRAWN" &&
    application.invitations.some(
      (invitation) => invitation.kind === "SHORTLIST" && invitation.status === "EXPIRED",
    )
  )
    return "The deadline to accept this invitation passed. This journey is now closed and no further action is available.";
  return null;
}
