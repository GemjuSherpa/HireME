import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, BookOpen, BriefcaseBusiness, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export default async function RecruiterCandidateProfile({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const user = await requireUser("RECRUITER");
  const { candidateId } = await params;
  const acceptedAccess = {
    job: { recruiter: { userId: user.id } },
    OR: [
      { identityRevealed: true },
      { invitations: { some: { kind: "SHORTLIST", status: "ACCEPTED" as const } } },
    ],
  };
  const candidate = await prisma.candidateProfile.findFirst({
    where: { id: candidateId, applications: { some: acceptedAccess } },
    include: {
      user: true,
      skills: { include: { skill: true } },
      experiences: true,
      education: true,
      projects: true,
      certifications: true,
      publications: true,
      applications: { where: acceptedAccess, include: { job: true } },
    },
  });
  if (!candidate) notFound();
  return (
    <AppShell role="recruiter" name={user.name} subtitle="Accepted candidate">
      <main className="dashboard">
        <Link href={`/recruiter/jobs/${candidate.applications[0].jobId}`} className="text-link">
          <ArrowLeft />
          Back to pipeline
        </Link>
        <div className="dash-title">
          <div>
            <p>CONSENTED CANDIDATE PROFILE</p>
            <h1>{candidate.user.name}</h1>
            <small>
              {candidate.headline} · {candidate.location}
            </small>
          </div>
        </div>
        <section className="panel">
          <h2>Profile summary</h2>
          <p>{candidate.bio}</p>
          <p>
            <strong>Career goal:</strong> {candidate.careerGoal ?? "Not provided"}
          </p>
          <p>
            <strong>Work rights:</strong>{" "}
            {candidate.workRights?.replaceAll("_", " ") ?? "Verification required"} ·{" "}
            <strong>Education:</strong>{" "}
            {candidate.highestEducation?.replaceAll("_", " ") ?? "Not provided"}
          </p>
        </section>
        <section className="panel">
          <h2>
            <BadgeCheck /> Skills
          </h2>
          <div className="chip-list">
            {candidate.skills.map((item) => (
              <span key={item.skillId}>
                {item.skill.name} · {item.proficiency}/5 {item.verified && "✓"}
              </span>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>
            <BriefcaseBusiness /> Work history
          </h2>
          {candidate.experiences.map((item) => (
            <article key={item.id}>
              <strong>
                {item.title} · {item.company}
              </strong>
              <p>{item.achievements.join(" · ")}</p>
            </article>
          ))}
        </section>
        <section className="panel">
          <h2>
            <GraduationCap /> Education
          </h2>
          {candidate.education.map((item) => (
            <article key={item.id}>
              <strong>{item.qualification}</strong>
              <p>
                {item.institution} · {item.fieldOfStudy}
              </p>
            </article>
          ))}
        </section>
        <section className="panel">
          <h2>
            <BookOpen /> Projects and evidence
          </h2>
          {candidate.projects.map((item) => (
            <article key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
