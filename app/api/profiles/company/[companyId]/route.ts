import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(_: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const user = await requireUser(),
    { companyId } = await params;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      recruiters: { select: { userId: true, title: true, user: { select: { name: true } } } },
      jobs: {
        where: { status: "ACTIVE" },
        select: { title: true, location: true, workMode: true },
        take: 10,
      },
      _count: { select: { jobs: true } },
    },
  });
  if (!company) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  const own = company.recruiters.some((r) => r.userId === user.id);
  let acceptedCandidate = false;
  if (user.role === "CANDIDATE") {
    acceptedCandidate = Boolean(
      await prisma.application.findFirst({
        where: {
          candidate: { userId: user.id },
          job: { companyId },
          invitations: { some: { kind: "SHORTLIST", status: "ACCEPTED" } },
        },
        select: { id: true },
      }),
    );
  }
  if (company.visibility !== "PUBLIC" && !own && !acceptedCandidate)
    return NextResponse.json(
      { error: "This company profile is private until an invitation is accepted." },
      { status: 403 },
    );
  return NextResponse.json({
    type: "company",
    id: company.id,
    name: company.name,
    subtitle: company.industry,
    visibility: company.visibility,
    summary: `${company.size ?? "Size not specified"} employees`,
    location: null,
    details: [
      company.website ? `Website: ${company.website}` : "Website not provided",
      `${company._count.jobs} hiring pipelines`,
    ],
    skills: [],
    sections: [
      {
        title: "Hiring team",
        items: company.recruiters.map((x) => `${x.user.name} · ${x.title ?? "Recruiter"}`),
      },
      {
        title: "Open roles",
        items: company.jobs.map(
          (x) => `${x.title} · ${x.location ?? "Flexible"} · ${x.workMode.toLowerCase()}`,
        ),
      },
    ],
  });
}
