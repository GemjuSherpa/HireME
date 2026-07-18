import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function AnalyticsPage() {
  const user = await requireUser();
  const recruiter = user.role === "RECRUITER";
  if (recruiter) {
    const profile = await prisma.recruiterProfile.findUniqueOrThrow({
      where: { userId: user.id },
      include: {
        company: true,
        jobs: { include: { applications: { include: { stageRuns: true } } } },
      },
    });
    const apps = profile.jobs.flatMap((j) => j.applications);
    const passed = apps.flatMap((a) => a.stageRuns).filter((r) => r.status === "PASSED").length;
    return (
      <AppShell role="recruiter" name={user.name} subtitle={profile.company.name}>
        <main className="dashboard">
          <div className="dash-title">
            <div>
              <p>LIVE ANALYTICS</p>
              <h1>Recruitment performance</h1>
              <small>Calculated directly from current pipeline records.</small>
            </div>
          </div>
          <section className="analytics-cards">
            <Metric
              label="Active roles"
              value={profile.jobs.filter((j) => j.status === "ACTIVE").length}
            />
            <Metric label="Candidates matched" value={apps.length} />
            <Metric label="Stages passed" value={passed} />
            <Metric
              label="Final interview ready"
              value={apps.filter((a) => a.status === "FINALIST").length}
            />
          </section>
          <section className="panel">
            <h2>Pipeline conversion</h2>
            {profile.jobs.map((job) => (
              <div className="analytics-row" key={job.id}>
                <span>
                  <strong>{job.title}</strong>
                  <small>{job.applications.length} candidate pool</small>
                </span>
                {[1, 2, 3, 4, 5].map((stage) => (
                  <b key={stage}>
                    {job.applications.filter((a) => a.currentStagePosition >= stage).length}
                    <small>Stage {stage}</small>
                  </b>
                ))}
              </div>
            ))}
          </section>
        </main>
      </AppShell>
    );
  }
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: { applications: { include: { stageRuns: true } } },
  });
  const runs = profile.applications.flatMap((a) => a.stageRuns);
  return (
    <AppShell role="candidate" name={user.name} subtitle={profile.headline ?? "Candidate"}>
      <main className="dashboard">
        <div className="dash-title">
          <div>
            <p>LIVE ANALYTICS</p>
            <h1>Your opportunity momentum</h1>
            <small>Calculated from your current profile and recruitment journeys.</small>
          </div>
        </div>
        <section className="analytics-cards">
          <Metric label="Profile strength" value={`${profile.profileScore}%`} />
          <Metric label="Matched roles" value={profile.applications.length} />
          <Metric label="Stages passed" value={runs.filter((r) => r.status === "PASSED").length} />
          <Metric
            label="Final shortlists"
            value={profile.applications.filter((a) => a.status === "FINALIST").length}
          />
        </section>
      </main>
    </AppShell>
  );
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  );
}
