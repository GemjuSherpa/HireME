import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { DetailedProfileEditor } from "./detailed-profile-editor";
export const dynamic = "force-dynamic";
const day = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");
export default async function ProfilePage() {
  const user = await requireUser();
  if (user.role === "RECRUITER") {
    const recruiter = await prisma.recruiterProfile.findUniqueOrThrow({
      where: { userId: user.id },
      include: { company: true },
    });
    return (
      <AppShell role="recruiter" name={user.name} subtitle={recruiter.company.name}>
        <main className="dashboard">
          <div className="dash-title">
            <div>
              <p>COMPANY PROFILE</p>
              <h1>{recruiter.company.name}</h1>
              <small>
                Company accounts have organization profiles and cannot become candidate profiles.
              </small>
            </div>
          </div>
          <section className="panel company-profile">
            <BadgeCheck />
            <h2>{recruiter.company.name}</h2>
            <p>
              {recruiter.company.industry} · {recruiter.company.size} employees
            </p>
            <a href={recruiter.company.website ?? "#"}>{recruiter.company.website}</a>
            <dl>
              <dt>Recruiter</dt>
              <dd>
                {user.name} · {recruiter.title}
              </dd>
              <dt>Publishing permission</dt>
              <dd>{recruiter.canPublishJobs ? "Enabled" : "Disabled"}</dd>
            </dl>
            <Link className="button button-coral" href="/recruiter/onboarding">
              Edit company profile
            </Link>
          </section>
        </main>
      </AppShell>
    );
  }
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      skills: { include: { skill: true }, orderBy: { skill: { name: "asc" } } },
      experiences: { orderBy: { startDate: "desc" } },
      education: { orderBy: { endYear: "desc" } },
      projects: { orderBy: { title: "asc" } },
      certifications: { orderBy: { createdAt: "desc" } },
      publications: { orderBy: { publishedAt: "desc" } },
      resumes: { where: { isCurrent: true }, take: 1 },
    },
  });
  const editableExperiences = profile.experiences.filter((item) => !item.verificationLocked);
  const initial = {
    careerGoal: profile.careerGoal ?? "",
    careerHighlights: profile.careerHighlights.join("\n"),
    skills: profile.skills.map((item) => ({
      name: item.skill.name,
      proficiency: item.proficiency,
    })),
    experiences: editableExperiences.map((item) => ({
      company: item.company,
      title: item.title,
      startDate: day(item.startDate),
      endDate: day(item.endDate),
      achievements: item.achievements.join("\n"),
    })),
    education: profile.education
      .filter((item) => !item.verified)
      .map((item) => ({
        institution: item.institution,
        qualification: item.qualification,
        fieldOfStudy: item.fieldOfStudy ?? "",
        startYear: item.startYear?.toString() ?? "",
        endYear: item.endYear?.toString() ?? "",
      })),
    projects: profile.projects.map((item) => ({
      title: item.title,
      description: item.description,
      url: item.url ?? "",
      tags: item.tags.join(", "),
    })),
    certifications: profile.certifications
      .filter((item) => !item.verified)
      .map((item) => ({
        title: item.title,
        issuer: item.issuer,
        credentialId: item.credentialId ?? "",
        credentialUrl: item.credentialUrl ?? "",
        issuedAt: day(item.issuedAt),
        expiresAt: day(item.expiresAt),
      })),
    publications: profile.publications.map((item) => ({
      title: item.title,
      type: item.type,
      publisher: item.publisher ?? "",
      publishedAt: day(item.publishedAt),
      url: item.url ?? "",
      description: item.description ?? "",
    })),
    resume: profile.resumes[0]
      ? {
          id: profile.resumes[0].id,
          originalName: profile.resumes[0].originalName,
          sizeBytes: profile.resumes[0].sizeBytes,
          uploadedAt: profile.resumes[0].uploadedAt.toISOString(),
        }
      : undefined,
  };
  return (
    <AppShell role="candidate" name={user.name} subtitle={profile.headline ?? "Candidate"}>
      <main className="dashboard detailed-profile-page">
        <div className="dash-title">
          <div>
            <p>DETAILED CANDIDATE PROFILE</p>
            <h1>Your complete career record</h1>
            <small>
              Structured evidence improves matching and carries across every opportunity.
            </small>
          </div>
          <Link className="primary-action" href="/onboarding">
            Edit basics
          </Link>
        </div>
        {profile.experiences.some((item) => item.verificationLocked) && (
          <section className="verified-records">
            <BadgeCheck />
            <span>
              <strong>
                {profile.experiences.filter((item) => item.verificationLocked).length} verified
                employment record(s)
              </strong>
              Verified records are retained as read-only evidence and cannot be changed by the
              candidate.
            </span>
          </section>
        )}
        <DetailedProfileEditor initial={initial} />
      </main>
    </AppShell>
  );
}
