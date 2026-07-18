import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Building2, ShieldCheck, UsersRound } from "lucide-react";
import { CompanyForm } from "./company-form";
export const dynamic = "force-dynamic";
export default async function CompanyOnboarding() {
  const user = await requireUser("RECRUITER"),
    recruiter = await prisma.recruiterProfile.findUniqueOrThrow({
      where: { userId: user.id },
      include: { company: true },
    });
  return (
    <AppShell role="recruiter" name={user.name} subtitle={recruiter.company.name}>
      <main className="dashboard onboarding-live">
        <div className="dash-title">
          <div>
            <p>COMPANY WORKSPACE SETUP</p>
            <h1>Configure your hiring organization.</h1>
            <small>Choose who can view the company profile and maintain workspace details.</small>
          </div>
        </div>
        <div className="onboarding-live-grid">
          <section className="panel">
            <CompanyForm
              initial={{
                companyName: recruiter.company.name,
                website: recruiter.company.website ?? "",
                industry: recruiter.company.industry ?? "",
                size: recruiter.company.size ?? "Not specified",
                recruiterTitle: recruiter.title ?? "Hiring team member",
                visibility: recruiter.company.visibility,
              }}
            />
          </section>
          <aside className="panel onboarding-help">
            <Building2 />
            <h2>Company workspace</h2>
            <p>
              Public profiles are visible to authenticated users. Private profiles require an
              accepted invitation.
            </p>
            <UsersRound />
            <h2>Team permissions</h2>
            <p>Your company account remains separate from candidate accounts.</p>
            <ShieldCheck />
            <h2>Access controlled</h2>
            <p>Profile access is checked by the server for every request.</p>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
