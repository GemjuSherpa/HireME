import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConsentControls } from "./consent-controls";
import { LockKeyhole, ShieldCheck } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const user = await requireUser();
  const records = await prisma.consentRecord.findMany({
    where: { userId: user.id },
    orderBy: { grantedAt: "asc" },
  });
  const latest = Object.fromEntries(records.map((r) => [r.type, r.granted && !r.withdrawnAt]));
  const recruiter = user.role === "RECRUITER";
  return (
    <AppShell
      role={recruiter ? "recruiter" : "candidate"}
      name={user.name}
      subtitle={
        recruiter
          ? (user.recruiter?.company.name ?? "Recruiter")
          : (user.candidate?.headline ?? "Candidate")
      }
    >
      <main className="dashboard">
        <div className="dash-title">
          <div>
            <p>PRIVACY & SECURITY</p>
            <h1>Your data, your decision</h1>
            <small>Consent changes are versioned and written to the audit log immediately.</small>
          </div>
        </div>
        <div className="settings-grid">
          <section className="panel">
            <div className="settings-title">
              <ShieldCheck />
              <div>
                <h2>Assessment and data consent</h2>
                <p>Each purpose is controlled independently.</p>
              </div>
            </div>
            <ConsentControls initial={latest} />
          </section>
          <aside className="panel security-card">
            <LockKeyhole />
            <h2>Account security</h2>
            <p>
              Passwords use salted scrypt hashes. Sessions are opaque, hashed in PostgreSQL and
              stored in an HttpOnly cookie.
            </p>
            <dl>
              <dt>Email</dt>
              <dd>{user.email}</dd>
              <dt>Role</dt>
              <dd>{user.role}</dd>
              <dt>Email verified</dt>
              <dd>{user.emailVerifiedAt ? "Yes" : "No"}</dd>
            </dl>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
