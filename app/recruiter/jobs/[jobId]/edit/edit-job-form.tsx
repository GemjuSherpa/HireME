"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

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

type EditableJob = {
  id: string;
  title: string;
  description: string;
  responsibilities: string | null;
  idealCandidate: string | null;
  perks: string | null;
  contactName: string | null;
  contactEmail: string | null;
  location: string | null;
  workMode: string;
  employmentType: string;
  experienceLevel: string;
  requiredEducation: string | null;
  workRightsRequirement: string | null;
  sponsorship: boolean;
  preferredTimezone: string | null;
  desiredStartDate: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  poolSize: number;
  targetShortlist: number;
  shortlistResponseDays: number;
  skills: string[];
  phases: Phase[];
};

export function EditJobForm({ job }: { job: EditableJob }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phases, setPhases] = useState<Phase[]>(job.phases);
  const updatePhase = (index: number, patch: Partial<Phase>) =>
    setPhases((all) => all.map((phase, i) => (i === index ? { ...phase, ...patch } : phase)));

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget),
      number = (key: string) => Number(f.get(key)) || null;
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
      salaryMin: number("salaryMin"),
      salaryMax: number("salaryMax"),
      poolSize: Number(f.get("poolSize")),
      targetShortlist: Number(f.get("targetShortlist")),
      shortlistResponseDays: Number(f.get("shortlistResponseDays")),
      skills: String(f.get("skills"))
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      phases: phases.map((phase, index) => ({
        ...phase,
        position: index + 1,
        questions: phase.questions.map((x) => x.trim()).filter(Boolean),
      })),
    };
    const response = await fetch(`/api/jobs/${job.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (response.ok) {
      const preview = await fetch(`/api/jobs/${job.id}/preview`, { method: "POST" });
      if (!preview.ok) {
        const previewBody = await preview.json();
        setError(
          `Draft saved, but matching could not refresh: ${previewBody.error ?? "try Refresh matches."}`,
        );
        setBusy(false);
        return;
      }
      router.push(`/recruiter/jobs/${job.id}`);
      router.refresh();
    } else {
      setError(body.error ?? "Could not save draft");
      setBusy(false);
    }
  }

  return (
    <form className="advanced-job-form" onSubmit={save}>
      <section className="builder-section">
        <h2>Edit opportunity and matching requirements</h2>
        <div className="form-grid">
          <Field label="Job title">
            <input name="title" defaultValue={job.title} required />
          </Field>
          <Field label="Employment type">
            <Select
              name="employmentType"
              value={job.employmentType}
              options={["FULL_TIME", "PART_TIME", "CONTRACT", "CASUAL", "INTERNSHIP"]}
            />
          </Field>
          <Field label="Job description" wide>
            <textarea name="description" defaultValue={job.description} minLength={50} required />
          </Field>
          <Field label="Roles and responsibilities" wide>
            <textarea
              name="responsibilities"
              defaultValue={job.responsibilities ?? ""}
              minLength={30}
              required
            />
          </Field>
          <Field label="Ideal candidate" wide>
            <textarea
              name="idealCandidate"
              defaultValue={job.idealCandidate ?? ""}
              minLength={30}
              required
            />
          </Field>
          <Field label="Perks" wide>
            <textarea name="perks" defaultValue={job.perks ?? ""} minLength={20} required />
          </Field>
          <Field label="Contact name">
            <input name="contactName" defaultValue={job.contactName ?? ""} required />
          </Field>
          <Field label="Contact email">
            <input
              name="contactEmail"
              type="email"
              defaultValue={job.contactEmail ?? ""}
              required
            />
          </Field>
        </div>
      </section>
      <section className="builder-section">
        <h2>Edit AI matching filters</h2>
        <div className="form-grid">
          <Field label="Required skills" wide>
            <input name="skills" defaultValue={job.skills.join(", ")} required />
          </Field>
          <Field label="Experience">
            <Select
              name="experienceLevel"
              value={job.experienceLevel}
              options={["ENTRY", "JUNIOR", "MID", "SENIOR", "EXECUTIVE"]}
            />
          </Field>
          <Field label="Education">
            <Select
              name="requiredEducation"
              value={job.requiredEducation ?? "NONE"}
              options={[
                "NONE",
                "HIGH_SCHOOL",
                "CERTIFICATE",
                "DIPLOMA",
                "BACHELOR",
                "MASTER",
                "PHD",
              ]}
            />
          </Field>
          <Field label="Location">
            <input name="location" defaultValue={job.location ?? ""} required />
          </Field>
          <Field label="Work arrangement">
            <Select name="workMode" value={job.workMode} options={["REMOTE", "HYBRID", "ONSITE"]} />
          </Field>
          <Field label="Work rights">
            <Select
              name="workRightsRequirement"
              value={job.workRightsRequirement ?? "GLOBAL"}
              options={["AU_UNRESTRICTED", "AU_VALID_VISA", "GLOBAL"]}
            />
          </Field>
          <Field label="Preferred timezone">
            <input name="preferredTimezone" defaultValue={job.preferredTimezone ?? ""} />
          </Field>
          <Field label="Desired start">
            <input name="desiredStartDate" type="date" defaultValue={job.desiredStartDate ?? ""} />
          </Field>
          <Field label="Minimum salary">
            <input name="salaryMin" type="number" defaultValue={job.salaryMin ?? ""} />
          </Field>
          <Field label="Maximum salary">
            <input name="salaryMax" type="number" defaultValue={job.salaryMax ?? ""} />
          </Field>
          <Field label="Invitation maximum">
            <input
              name="poolSize"
              type="number"
              min="10"
              max="1000"
              defaultValue={job.poolSize}
              required
            />
          </Field>
          <Field label="Final shortlist">
            <input
              name="targetShortlist"
              type="number"
              min="1"
              max="100"
              defaultValue={job.targetShortlist}
              required
            />
          </Field>
          <Field label="Acceptance deadline (days)">
            <input
              name="shortlistResponseDays"
              type="number"
              min="1"
              max="30"
              defaultValue={job.shortlistResponseDays}
              required
            />
          </Field>
        </div>
        <label className="check-line">
          <input name="sponsorship" type="checkbox" defaultChecked={job.sponsorship} /> Visa
          sponsorship available
        </label>
      </section>
      <section className="builder-section assessment-builder">
        <h2>Edit interview phases and questions</h2>
        <p>Changes are applied only while this pipeline remains a draft.</p>
        <div className="selected-phases">
          {phases.map((phase, index) => (
            <article key={`${phase.templateId}-${index}`}>
              <div className="phase-editor">
                <button
                  type="button"
                  className="add-row"
                  onClick={() => setPhases((all) => all.filter((_, i) => i !== index))}
                >
                  <Trash2 />
                  Remove phase {index + 1}
                </button>
                <div className="form-grid">
                  <Field label={`Phase ${index + 1} name`}>
                    <input
                      value={phase.name}
                      required
                      onChange={(e) => updatePhase(index, { name: e.target.value })}
                    />
                  </Field>
                  <Field label="Assessment type">
                    <Select
                      value={phase.type}
                      options={[
                        "PRE_SCREEN",
                        "SKILL_VERIFICATION",
                        "BEHAVIOURAL",
                        "TECHNICAL",
                        "AI_INTERVIEW",
                        "FINAL_REVIEW",
                      ]}
                      onChange={(type) => updatePhase(index, { type })}
                    />
                  </Field>
                  <Field label="Instructions" wide>
                    <textarea
                      value={phase.description}
                      required
                      minLength={5}
                      onChange={(e) => updatePhase(index, { description: e.target.value })}
                    />
                  </Field>
                  <Field label="Duration (minutes)">
                    <input
                      type="number"
                      min="5"
                      max="240"
                      value={phase.durationMinutes}
                      required
                      onChange={(e) =>
                        updatePhase(index, { durationMinutes: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Days to complete">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={phase.completionDays}
                      required
                      onChange={(e) =>
                        updatePhase(index, { completionDays: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Pass threshold">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={phase.passThreshold}
                      required
                      onChange={(e) =>
                        updatePhase(index, { passThreshold: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>
                <h4>Candidate questions</h4>
                {phase.questions.map((question, qIndex) => (
                  <div className="question-row" key={qIndex}>
                    <span>{qIndex + 1}</span>
                    <textarea
                      value={question}
                      required
                      minLength={3}
                      onChange={(e) =>
                        updatePhase(index, {
                          questions: phase.questions.map((q, i) =>
                            i === qIndex ? e.target.value : q,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Remove question ${qIndex + 1}`}
                      onClick={() =>
                        updatePhase(index, {
                          questions: phase.questions.filter((_, i) => i !== qIndex),
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
                  onClick={() => updatePhase(index, { questions: [...phase.questions, ""] })}
                >
                  <Plus />
                  Add question
                </button>
              </div>
            </article>
          ))}
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={() =>
            setPhases((all) => [
              ...all,
              {
                templateId: `custom-${Date.now()}`,
                name: "New interview phase",
                type: "BEHAVIOURAL",
                description: "Describe the purpose and evaluation approach for this phase.",
                durationMinutes: 30,
                completionDays: 7,
                passThreshold: 70,
                questions: ["Add the first candidate question here."],
              },
            ])
          }
        >
          <Plus />
          Add interview phase
        </button>
        {phases.length === 0 && (
          <p className="form-error">At least one interview phase is required.</p>
        )}
      </section>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button button-coral" disabled={busy || phases.length === 0}>
        {busy ? "Saving…" : "Save draft"}
      </button>
    </form>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      {label}
      {children}
    </label>
  );
}
function Select({
  name,
  value,
  options,
  onChange,
}: {
  name?: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
}) {
  return (
    <select
      name={name}
      value={onChange ? value : undefined}
      defaultValue={onChange ? undefined : value}
      required
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
