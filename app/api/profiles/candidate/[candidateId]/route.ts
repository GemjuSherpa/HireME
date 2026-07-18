import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(_: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  const user = await requireUser(),
    { candidateId } = await params;
  const profile = await prisma.candidateProfile.findUnique({
    where: { id: candidateId },
    include: {
      user: true,
      skills: { include: { skill: true } },
      experiences: true,
      education: true,
      projects: true,
      applications: {
        select: {
          invitations: { where: { kind: "SHORTLIST", status: "ACCEPTED" }, select: { id: true } },
          job: { select: { recruiter: { select: { userId: true } } } },
        },
      },
    },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  const own = profile.userId === user.id,
    acceptedRecruiter =
      user.role === "RECRUITER" &&
      profile.applications.some(
        (a) => a.job.recruiter.userId === user.id && a.invitations.length > 0,
      );
  if (profile.visibility !== "PUBLIC" && !own && !acceptedRecruiter)
    return NextResponse.json(
      { error: "This candidate profile is private until an invitation is accepted." },
      { status: 403 },
    );
  return NextResponse.json({
    type: "candidate",
    id: profile.id,
    name: profile.user.name,
    subtitle: profile.headline,
    visibility: profile.visibility,
    summary: profile.bio,
    location: profile.location,
    details: [
      `Work rights: ${profile.workRights?.replaceAll("_", " ") ?? "Not provided"}`,
      `Education: ${profile.highestEducation?.replaceAll("_", " ") ?? "Not provided"}`,
      `Career goal: ${profile.careerGoal ?? "Not provided"}`,
    ],
    skills: profile.skills.map((x) => x.skill.name),
    sections: [
      { title: "Work history", items: profile.experiences.map((x) => `${x.title} · ${x.company}`) },
      {
        title: "Education",
        items: profile.education.map((x) => `${x.qualification} · ${x.institution}`),
      },
      { title: "Projects", items: profile.projects.map((x) => x.title) },
    ],
  });
}
