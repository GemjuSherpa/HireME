import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { JobForm } from "./job-form";
export default async function NewJob() {
  const user = await requireUser("RECRUITER");
  return (
    <AppShell
      role="recruiter"
      name={user.name}
      subtitle={user.recruiter?.company.name ?? "Recruiter"}
    >
      <main className="dashboard create-job">
        <div className="dash-title">
          <div>
            <p>NEW HIRING PIPELINE</p>
            <h1>Define the role. HireME runs the journey.</h1>
            <small>
              Configure job-board-quality filters, assessment phases and the exact questions
              candidates will receive.
            </small>
          </div>
        </div>
        <JobForm />
      </main>
    </AppShell>
  );
}
