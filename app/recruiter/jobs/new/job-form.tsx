"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UsersRound,
} from "lucide-react";
import { assessmentTemplates } from "@/lib/assessment-templates";

type Phase = {
  templateId: string;
  name: string;
  type: string;
  description: string;
  durationMinutes: number;
  completionDays: number;
  passThreshold: number;
  questions: string[];
};

export function JobForm({ initial }: { initial?: { id: string; phases?: Phase[] } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [openPhase, setOpenPhase] = useState<string | null>("eligibility");
  const [phases, setPhases] = useState<Phase[]>(
    initial?.phases ??
      assessmentTemplates
        .filter((t) => t.recommended)
        .map((t) => ({
          templateId: t.id,
          name: t.name,
          type: t.type,
          description: t.description,
          durationMinutes: t.durationMinutes,
          passThreshold: t.passThreshold,
          completionDays: 7,
          questions: [...t.questions],
        })),
  );
  function toggleTemplate(id: string) {
    const t = assessmentTemplates.find((x) => x.id === id)!;
    setPhases((all) =>
      all.some((x) => x.templateId === id)
        ? all.filter((x) => x.templateId !== id)
        : [
            ...all,
            {
              templateId: t.id,
              name: t.name,
              type: t.type,
              description: t.description,
              durationMinutes: t.durationMinutes,
              passThreshold: t.passThreshold,
              completionDays: 7,
              questions: [...t.questions],
            },
          ],
    );
    setOpenPhase(id);
  }
  function updatePhase(id: string, patch: Partial<Phase>) {
    setPhases((all) => all.map((x) => (x.templateId === id ? { ...x, ...patch } : x)));
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    const payload = {
      title: f.get("title"),
      description: f.get("description"),
      responsibilities: f.get("responsibilities"),
      idealCandidate: f.get("idealCandidate"),
      perks: f.get("perks"),
      contactName: f.get("contactName"),
      contactEmail: f.get("contactEmail"),
      location: f.get("location"),
      workMode: f.get("workMode"),
      employmentType: f.get("employmentType"),
      experienceLevel: f.get("experienceLevel"),
      requiredEducation: f.get("requiredEducation"),
      workRightsRequirement: f.get("workRightsRequirement"),
      sponsorship: f.get("sponsorship") === "on",
      preferredTimezone: f.get("preferredTimezone"),
      desiredStartDate: f.get("desiredStartDate"),
      salaryMin: Number(f.get("salaryMin")) || null,
      salaryMax: Number(f.get("salaryMax")) || null,
      poolSize: Number(f.get("poolSize")),
      targetShortlist: Number(f.get("targetShortlist")),
      shortlistResponseDays: Number(f.get("shortlistResponseDays")),
      skills: String(f.get("skills"))
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      phases: phases.map((x, i) => ({
        ...x,
        position: i + 1,
        questions: x.questions.filter(Boolean),
      })),
    };
    const response = await fetch(initial ? `/api/jobs/${initial.id}` : "/api/jobs", {
      method: initial ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Could not save job");
      setBusy(false);
      return;
    }
    router.push(`/recruiter/jobs/${body.job.id}`);
    router.refresh();
  }
  return (
    <form className="advanced-job-form" onSubmit={submit}>
      <section className="builder-section">
        <BuilderTitle
          icon={<BriefcaseBusiness />}
          step="1"
          title="Job opportunity"
          text="Complete job content used by candidates and the suitability model."
        />
        <div className="form-grid">
          <Label text="Job title">
            <input name="title" defaultValue="Senior Product Engineer" required />
          </Label>
          <Label text="Employment type">
            <select name="employmentType">
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="CASUAL">Casual</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </Label>
          <Label text="Job description" hint="Purpose, team and impact" wide>
            <textarea
              name="description"
              defaultValue="Join our product engineering team to build reliable and accessible experiences used by growing organisations."
              required
              minLength={50}
            />
          </Label>
          <Label text="Roles and responsibilities" hint="One responsibility per line" wide>
            <textarea
              name="responsibilities"
              defaultValue={
                "Lead technical delivery from discovery to production.\nCollaborate with product and design.\nMentor engineers and improve platform quality."
              }
              required
              minLength={30}
            />
          </Label>
          <Label text="Ideal candidate" hint="Experience, behaviours and evidence you value" wide>
            <textarea
              name="idealCandidate"
              defaultValue="A pragmatic product engineer who communicates clearly, makes evidence-based decisions and has delivered secure, accessible web products."
              required
              minLength={30}
            />
          </Label>
          <Label text="Perks — why work with us" wide>
            <textarea
              name="perks"
              defaultValue={
                "Flexible hybrid work and learning budget.\nMeaningful product ownership.\nInclusive team with transparent career development."
              }
              required
              minLength={20}
            />
          </Label>
          <Label text="Contact name">
            <input name="contactName" defaultValue="Talent Acquisition Team" required />
          </Label>
          <Label text="Contact email">
            <input name="contactEmail" type="email" defaultValue="recruiter@hireme.test" required />
          </Label>
        </div>
      </section>
      <section className="builder-section">
        <BuilderTitle
          icon={<SlidersHorizontal />}
          step="2"
          title="AI matching parameters"
          text="Structured requirements applied to every open-to-work candidate profile."
        />
        <div className="form-grid">
          <Label text="Required skills" hint="Comma-separated" wide>
            <input name="skills" defaultValue="TypeScript, React, Python, System design" required />
          </Label>
          <Label text="Experience level">
            <select name="experienceLevel" defaultValue="SENIOR">
              <option value="ENTRY">Entry</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid-level</option>
              <option value="SENIOR">Senior</option>
              <option value="EXECUTIVE">Executive</option>
            </select>
          </Label>
          <Label text="Minimum education">
            <select name="requiredEducation" defaultValue="BACHELOR">
              <option value="NONE">No formal requirement</option>
              <option value="HIGH_SCHOOL">High school</option>
              <option value="CERTIFICATE">Certificate</option>
              <option value="DIPLOMA">Diploma</option>
              <option value="BACHELOR">Bachelor&apos;s degree</option>
              <option value="MASTER">Master&apos;s degree</option>
              <option value="PHD">PhD</option>
            </select>
          </Label>
          <Label text="Location">
            <input name="location" defaultValue="Melbourne, Australia" required />
          </Label>
          <Label text="Work arrangement">
            <select name="workMode" defaultValue="HYBRID">
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>
          </Label>
          <Label text="Preferred timezone">
            <input name="preferredTimezone" defaultValue="Australia/Melbourne" />
          </Label>
          <Label text="Work-rights requirement">
            <select name="workRightsRequirement">
              <option value="AU_UNRESTRICTED">Unrestricted Australian work rights</option>
              <option value="AU_VALID_VISA">Valid Australian work visa</option>
              <option value="GLOBAL">No location-specific requirement</option>
            </select>
          </Label>
          <Label text="Desired start date">
            <input name="desiredStartDate" type="date" />
          </Label>
          <Label text="Minimum salary (AUD)">
            <input name="salaryMin" type="number" min="0" defaultValue="140000" />
          </Label>
          <Label text="Maximum salary (AUD)">
            <input name="salaryMax" type="number" min="0" defaultValue="170000" />
          </Label>
        </div>
        <label className="check-line">
          <input name="sponsorship" type="checkbox" /> Visa sponsorship may be available
        </label>
      </section>
      <section className="builder-section">
        <BuilderTitle
          icon={<UsersRound />}
          step="3"
          title="Shortlist invitation flow"
          text="Invite the highest-ranked candidates first and automatically backfill declined or expired offers."
        />
        <div className="form-grid">
          <Label text="Accepted shortlist target" hint="Top candidates invited first">
            <input name="poolSize" type="number" min="10" max="1000" defaultValue="100" />
          </Label>
          <Label text="Final face-to-face shortlist">
            <input name="targetShortlist" type="number" min="1" max="100" defaultValue="10" />
          </Label>
          <Label text="Days to accept shortlist offer">
            <input name="shortlistResponseDays" type="number" min="1" max="30" defaultValue="3" />
          </Label>
        </div>
      </section>
      <section className="builder-section assessment-builder">
        <BuilderTitle
          icon={<BookOpen />}
          step="4"
          title="Interview phases, deadlines and questions"
          text="Choose assessments, set completion deadlines, and customise candidate questions."
        />
        <div className="template-picker">
          {assessmentTemplates.map((t) => (
            <button
              type="button"
              key={t.id}
              className={phases.some((x) => x.templateId === t.id) ? "selected" : ""}
              onClick={() => toggleTemplate(t.id)}
            >
              <i>{phases.some((x) => x.templateId === t.id) && <Check />}</i>
              <span>
                <strong>{t.name}</strong>
                <small>
                  {t.questionType} · {t.durationMinutes} min
                </small>
              </span>
            </button>
          ))}
        </div>
        <div className="selected-phases">
          {phases.map((phase, index) => (
            <article key={phase.templateId}>
              <button
                type="button"
                className="phase-heading"
                onClick={() =>
                  setOpenPhase(openPhase === phase.templateId ? null : phase.templateId)
                }
              >
                <b>{index + 1}</b>
                <span>
                  <strong>{phase.name}</strong>
                  <small>{phase.description}</small>
                </span>
                {openPhase === phase.templateId ? <ChevronUp /> : <ChevronDown />}
              </button>
              {openPhase === phase.templateId && (
                <div className="phase-editor">
                  <div className="phase-settings">
                    <Label text="Duration (minutes)">
                      <input
                        type="number"
                        min="5"
                        max="240"
                        value={phase.durationMinutes}
                        onChange={(e) =>
                          updatePhase(phase.templateId, { durationMinutes: Number(e.target.value) })
                        }
                      />
                    </Label>
                    <Label text="Days to complete">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={phase.completionDays}
                        onChange={(e) =>
                          updatePhase(phase.templateId, { completionDays: Number(e.target.value) })
                        }
                      />
                    </Label>
                    <Label text="Pass threshold">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={phase.passThreshold}
                        onChange={(e) =>
                          updatePhase(phase.templateId, { passThreshold: Number(e.target.value) })
                        }
                      />
                    </Label>
                  </div>
                  <h4>Questions shown to candidates</h4>
                  {phase.questions.map((q, i) => (
                    <div className="question-row" key={i}>
                      <span>{i + 1}</span>
                      <textarea
                        aria-label={`${phase.name} question ${i + 1}`}
                        value={q}
                        onChange={(e) =>
                          updatePhase(phase.templateId, {
                            questions: phase.questions.map((x, n) =>
                              n === i ? e.target.value : x,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        aria-label={`Remove question ${i + 1}`}
                        onClick={() =>
                          updatePhase(phase.templateId, {
                            questions: phase.questions.filter((_, n) => n !== i),
                          })
                        }
                      >
                        <Trash2 />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-row"
                    onClick={() =>
                      updatePhase(phase.templateId, { questions: [...phase.questions, ""] })
                    }
                  >
                    <Plus />
                    Add custom question
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
        {phases.length === 0 && <p className="form-error">Select at least one interview phase.</p>}
      </section>
      {error && <p className="form-error">{error}</p>}
      <div className="builder-submit">
        <ShieldCheck />
        <span>
          <strong>Review before launch</strong>This creates a draft. AI analysis and consent
          invitations begin only when launched.
        </span>
        <button className="button button-coral" disabled={busy || phases.length === 0}>
          {busy ? "Creating pipeline…" : "Create draft pipeline"}
          <ArrowRight />
        </button>
      </div>
    </form>
  );
}

function BuilderTitle({
  icon,
  step,
  title,
  text,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div className="builder-title">
      <i>{icon}</i>
      <span>
        <small>STEP {step}</small>
        <h2>{title}</h2>
        <p>{text}</p>
      </span>
    </div>
  );
}
function Label({
  text,
  hint,
  wide,
  children,
}: {
  text: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      {text}
      {hint && <small>{hint}</small>}
      {children}
    </label>
  );
}
