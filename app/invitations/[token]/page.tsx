import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";
import { InvitationActions } from "./invitation-actions";

export const dynamic = "force-dynamic";
export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      application: {
        include: {
          job: {
            include: {
              company: true,
              skills: { include: { skill: true } },
              stages: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!invitation || invitation.kind !== "SHORTLIST") notFound();
  const job = invitation.application.job;
  const closed =
    ["ACCEPTED", "DECLINED", "EXPIRED"].includes(invitation.status) ||
    invitation.expiresAt < new Date();
  return (
    <main className="stage-page">
      <div className="invitation-review">
        <p className="eyebrow">SHORTLIST INVITATION</p>
        <h1>{job.title}</h1>
        <h2>{job.company.name}</h2>
        <p>{job.description}</p>
        <div className="job-requirements">
          <div>
            <small>LOCATION</small>
            <strong>{job.location}</strong>
          </div>
          <div>
            <small>WORK MODE</small>
            <strong>{job.workMode}</strong>
          </div>
          <div>
            <small>EDUCATION</small>
            <strong>{job.requiredEducation?.replaceAll("_", " ")}</strong>
          </div>
          <div>
            <small>WORK RIGHTS</small>
            <strong>{job.workRightsRequirement?.replaceAll("_", " ")}</strong>
          </div>
        </div>
        <section>
          <h2>Roles and responsibilities</h2>
          <p className="pre-line">{job.responsibilities}</p>
        </section>
        <section>
          <h2>Ideal candidate</h2>
          <p className="pre-line">{job.idealCandidate}</p>
        </section>
        <section>
          <h2>Why work with us</h2>
          <p className="pre-line">{job.perks}</p>
        </section>
        <section>
          <h2>Required skills</h2>
          <p>{job.skills.map((x) => x.skill.name).join(", ")}</p>
        </section>
        <section>
          <h2>Assessment journey</h2>
          <ol>
            {job.stages.map((x) => (
              <li key={x.id}>
                {x.name} — complete within {x.completionDays} days
              </li>
            ))}
          </ol>
        </section>
        <p>
          <strong>Questions:</strong> {job.contactName} ·{" "}
          <a href={`mailto:${job.contactEmail}`}>{job.contactEmail}</a>
        </p>
        <p>
          Respond by {invitation.expiresAt.toLocaleString("en-AU")}. Assessment access remains
          locked until acceptance.
        </p>
        <InvitationActions token={token} disabled={closed} />
      </div>
    </main>
  );
}
