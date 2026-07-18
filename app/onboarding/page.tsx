import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/app/profile/profile-form";
import { BadgeCheck, LockKeyhole, Sparkles } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function Onboarding() {
  const user = await requireUser("CANDIDATE");
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: { skills: { include: { skill: true } } },
  });
  return (
    <AppShell role="candidate" name={user.name} subtitle={profile.headline ?? "Candidate"}>
      <main className="dashboard onboarding-live">
        <div className="dash-title">
          <div>
            <p>PROFILE SETUP</p>
            <h1>Build the profile that works for you.</h1>
            <small>These details save immediately and power future job matching.</small>
          </div>
        </div>
        <div className="onboarding-live-grid">
          <section className="panel">
            <div className="onboarding-status">
              <Sparkles />
              <span>
                <strong>{profile.profileScore}% profile strength</strong>Complete every field to
                improve matching quality.
              </span>
            </div>
            <ProfileForm profile={profile} />
          </section>
          <aside className="panel onboarding-help">
            <LockKeyhole />
            <h2>Private by default</h2>
            <p>Your name and contact details remain hidden until you accept an invitation.</p>
            <BadgeCheck />
            <h2>Evidence earns trust</h2>
            <p>
              Verified skills and employment evidence improve matching without résumé keyword
              tricks.
            </p>
            <h3>Current verified skills</h3>
            {profile.skills.length ? (
              <ul>
                {profile.skills.map((item) => (
                  <li key={item.skillId}>
                    {item.skill.name}
                    {item.verified && <BadgeCheck />}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No verified skills yet. Assessments will appear after your core profile is saved.
              </p>
            )}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
