import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import { StageForm } from "./stage-form";
export const dynamic = "force-dynamic";
export default async function InterviewStage({
  params,
}: {
  params: Promise<{ stageRunId: string }>;
}) {
  const user = await requireUser("CANDIDATE");
  const { stageRunId } = await params;
  const run = await prisma.stageRun.findFirst({
    where: {
      id: stageRunId,
      status: { in: ["INVITED", "IN_PROGRESS"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      application: {
        candidate: { userId: user.id },
        OR: [
          { identityRevealed: true },
          { invitations: { some: { kind: "SHORTLIST", status: "ACCEPTED" } } },
        ],
      },
    },
    include: { stage: true, application: { include: { job: { include: { company: true } } } } },
  });
  if (!run) notFound();
  return (
    <main className="stage-page">
      <header>
        <Link className="brand" href="/">
          <span>H</span>HireME
        </Link>
        <Link href="/dashboard">
          <ArrowLeft />
          Back to dashboard
        </Link>
      </header>
      <div className="stage-layout">
        <aside>
          <p>INTERVIEW JOURNEY</p>
          <h1>{run.application.job.title}</h1>
          <span>{run.application.job.company.name}</span>
          <div className="stage-meta">
            <Clock3 />
            <span>
              <strong>{run.stage.durationMinutes ?? 30} minutes</strong>Suggested completion time
            </span>
          </div>
          <div className="stage-meta">
            <ShieldCheck />
            <span>
              <strong>Consistent rubric</strong>Every candidate is assessed against the same
              published criteria.
            </span>
          </div>
          <div className="stage-meta">
            <LockKeyhole />
            <span>
              <strong>Invitation accepted</strong>This assessment was unlocked only after your
              consent.
            </span>
          </div>
        </aside>
        <section>
          <p className="eyebrow">STAGE {run.stage.position}</p>
          <h2>{run.stage.name}</h2>
          <p>{run.stage.instructions}</p>
          <div className="rubric-note">
            <strong>How this is evaluated</strong>
            <span>
              Relevance, evidence quality and structured judgement. Protected attributes are
              excluded. You can request human review.
            </span>
          </div>
          <StageForm stageRunId={run.id} />
        </section>
      </div>
    </main>
  );
}
