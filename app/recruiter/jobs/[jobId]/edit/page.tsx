import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditJobForm } from "./edit-job-form";

export default async function EditDraft({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireUser("RECRUITER"),
    { jobId } = await params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, status: "DRAFT", recruiter: { userId: user.id } },
    include: { skills: { include: { skill: true } }, stages: { orderBy: { position: "asc" } } },
  });
  if (!job) notFound();
  const initial = {
    ...job,
    desiredStartDate: job.desiredStartDate?.toISOString().slice(0, 10) ?? "",
    skills: job.skills.map((x) => x.skill.name),
    phases: job.stages.map((stage) => {
      const config = stage.config as {
        templateId?: string;
        questions?: string[];
        sampleSize?: number;
      };
      return {
        templateId: config.templateId ?? stage.id,
        name: stage.name,
        type: stage.type,
        description: stage.instructions,
        durationMinutes: stage.durationMinutes ?? 30,
        completionDays: stage.completionDays,
        passThreshold: stage.passThreshold,
        sampleSize: config.sampleSize ?? (stage.type === "COGNITIVE_APTITUDE" ? 15 : 10),
        questions: config.questions ?? [],
      };
    }),
  };
  return (
    <AppShell role="recruiter" name={user.name} subtitle="Edit draft">
      <main className="dashboard create-job">
        <Link href={`/recruiter/jobs/${job.id}`} className="button button-outline">
          <ArrowLeft />
          Cancel edit
        </Link>
        <div className="dash-title">
          <div>
            <p>DRAFT PIPELINE</p>
            <h1>Edit {job.title}</h1>
            <small>
              Saving clears the previous match preview. Refresh matches after changing requirements.
            </small>
          </div>
        </div>
        <EditJobForm job={initial} />
      </main>
    </AppShell>
  );
}
