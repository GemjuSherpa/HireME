"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  Plus,
  Save,
  ScrollText,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
type Skill = { name: string; proficiency: number };
type Experience = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  achievements: string;
};
type Education = {
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
};
type Project = { title: string; description: string; url: string; tags: string };
type Certification = {
  title: string;
  issuer: string;
  credentialId: string;
  credentialUrl: string;
  issuedAt: string;
  expiresAt: string;
};
type Publication = {
  title: string;
  type: string;
  publisher: string;
  publishedAt: string;
  url: string;
  description: string;
};
type Initial = {
  careerGoal: string;
  careerHighlights: string;
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  publications: Publication[];
  resume?: { id: string; originalName: string; sizeBytes: number; uploadedAt: string };
};
export function DetailedProfileEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [goal, setGoal] = useState(initial.careerGoal);
  const [highlights, setHighlights] = useState(initial.careerHighlights);
  const [skills, setSkills] = useState(initial.skills);
  const [experiences, setExperiences] = useState(initial.experiences);
  const [education, setEducation] = useState(initial.education);
  const [projects, setProjects] = useState(initial.projects);
  const [certifications, setCertifications] = useState(initial.certifications);
  const [publications, setPublications] = useState(initial.publications);
  const [resume, setResume] = useState(initial.resume);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/profile/details", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        careerGoal: goal,
        careerHighlights: highlights
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        skills,
        experiences: experiences.map((x) => ({
          ...x,
          achievements: x.achievements
            .split("\n")
            .map((y) => y.trim())
            .filter(Boolean),
        })),
        education: education.map((x) => ({
          ...x,
          startYear: x.startYear ? Number(x.startYear) : null,
          endYear: x.endYear ? Number(x.endYear) : null,
        })),
        projects: projects.map((x) => ({
          ...x,
          tags: x.tags
            .split(",")
            .map((y) => y.trim())
            .filter(Boolean),
        })),
        certifications,
        publications,
      }),
    });
    const body = await response.json();
    if (response.ok) {
      setMessage("Detailed profile saved to PostgreSQL");
      router.refresh();
    } else setMessage(body.error ?? "Could not save profile");
    setBusy(false);
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.set("resume", file);
    setMessage("Uploading résumé…");
    const response = await fetch("/api/profile/resume", { method: "POST", body: data });
    if (response.ok) {
      setMessage("Résumé uploaded privately");
      router.refresh();
      setResume({
        id: "",
        originalName: file.name,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
      });
    } else setMessage((await response.json()).error);
  }
  return (
    <div className="detailed-editor">
      <section className="profile-section">
        <SectionTitle
          icon={<Target />}
          title="Career goals"
          text="Describe where you want your career to go and the impact you want to make."
        />
        <label>
          Career goal
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="I want to lead…"
          />
        </label>
        <label>
          Career highlights <small>One achievement per line</small>
          <textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder="Improved conversion by 24%&#10;Led a team of six"
          />
        </label>
      </section>
      <section className="profile-section">
        <SectionTitle
          icon={<ScrollText />}
          title="Skills"
          text="Add your core skills and proficiency from 1 to 5."
        />
        {skills.map((item, index) => (
          <div className="repeat-row skill-edit" key={index}>
            <input
              aria-label={`Skill ${index + 1}`}
              value={item.name}
              onChange={(e) => setSkills(update(skills, index, { name: e.target.value }))}
              placeholder="TypeScript"
            />
            <select
              value={item.proficiency}
              onChange={(e) =>
                setSkills(update(skills, index, { proficiency: Number(e.target.value) }))
              }
            >
              {[1, 2, 3, 4, 5].map((x) => (
                <option key={x} value={x}>
                  {x} / 5
                </option>
              ))}
            </select>
            <Remove onClick={() => setSkills(remove(skills, index))} />
          </div>
        ))}
        <Add
          label="Add skill"
          onClick={() => setSkills([...skills, { name: "", proficiency: 3 }])}
        />
      </section>
      <section className="profile-section">
        <SectionTitle
          icon={<BriefcaseBusiness />}
          title="Work history"
          text="Record roles, dates and measurable achievements."
        />
        {experiences.map((item, index) => (
          <div className="repeat-card" key={index}>
            <Remove onClick={() => setExperiences(remove(experiences, index))} />
            <div className="two-col">
              <Input
                label="Company"
                value={item.company}
                onChange={(company) => setExperiences(update(experiences, index, { company }))}
              />
              <Input
                label="Job title"
                value={item.title}
                onChange={(title) => setExperiences(update(experiences, index, { title }))}
              />
              <Input
                label="Start date"
                type="date"
                value={item.startDate}
                onChange={(startDate) => setExperiences(update(experiences, index, { startDate }))}
              />
              <Input
                label="End date"
                type="date"
                value={item.endDate}
                onChange={(endDate) => setExperiences(update(experiences, index, { endDate }))}
              />
            </div>
            <label>
              Achievements <small>One per line</small>
              <textarea
                value={item.achievements}
                onChange={(e) =>
                  setExperiences(update(experiences, index, { achievements: e.target.value }))
                }
              />
            </label>
          </div>
        ))}
        <Add
          label="Add employment"
          onClick={() =>
            setExperiences([
              ...experiences,
              { company: "", title: "", startDate: "", endDate: "", achievements: "" },
            ])
          }
        />
      </section>
      <section className="profile-section">
        <SectionTitle
          icon={<GraduationCap />}
          title="Education"
          text="Qualifications, institutions and fields of study."
        />
        {education.map((item, index) => (
          <div className="repeat-card" key={index}>
            <Remove onClick={() => setEducation(remove(education, index))} />
            <div className="two-col">
              <Input
                label="Institution"
                value={item.institution}
                onChange={(institution) => setEducation(update(education, index, { institution }))}
              />
              <Input
                label="Qualification"
                value={item.qualification}
                onChange={(qualification) =>
                  setEducation(update(education, index, { qualification }))
                }
              />
              <Input
                label="Field of study"
                value={item.fieldOfStudy}
                onChange={(fieldOfStudy) =>
                  setEducation(update(education, index, { fieldOfStudy }))
                }
              />
              <Input
                label="Start year"
                type="number"
                value={item.startYear}
                onChange={(startYear) => setEducation(update(education, index, { startYear }))}
              />
              <Input
                label="End year"
                type="number"
                value={item.endYear}
                onChange={(endYear) => setEducation(update(education, index, { endYear }))}
              />
            </div>
          </div>
        ))}
        <Add
          label="Add education"
          onClick={() =>
            setEducation([
              ...education,
              { institution: "", qualification: "", fieldOfStudy: "", startYear: "", endYear: "" },
            ])
          }
        />
      </section>
      <section className="profile-section">
        <SectionTitle
          icon={<BookOpen />}
          title="Projects"
          text="Show practical work, portfolios and open-source contributions."
        />
        {projects.map((item, index) => (
          <div className="repeat-card" key={index}>
            <Remove onClick={() => setProjects(remove(projects, index))} />
            <div className="two-col">
              <Input
                label="Project title"
                value={item.title}
                onChange={(title) => setProjects(update(projects, index, { title }))}
              />
              <Input
                label="Project URL"
                type="url"
                value={item.url}
                onChange={(url) => setProjects(update(projects, index, { url }))}
              />
              <Input
                label="Tags"
                value={item.tags}
                onChange={(tags) => setProjects(update(projects, index, { tags }))}
              />
            </div>
            <label>
              Description
              <textarea
                value={item.description}
                onChange={(e) =>
                  setProjects(update(projects, index, { description: e.target.value }))
                }
              />
            </label>
          </div>
        ))}
        <Add
          label="Add project"
          onClick={() =>
            setProjects([...projects, { title: "", description: "", url: "", tags: "" }])
          }
        />
      </section>
      <section className="profile-section">
        <SectionTitle
          icon={<CheckCircle2 />}
          title="Certifications"
          text="Professional credentials, licences and verification links."
        />
        {certifications.map((item, index) => (
          <div className="repeat-card" key={index}>
            <Remove onClick={() => setCertifications(remove(certifications, index))} />
            <div className="two-col">
              <Input
                label="Credential"
                value={item.title}
                onChange={(title) => setCertifications(update(certifications, index, { title }))}
              />
              <Input
                label="Issuer"
                value={item.issuer}
                onChange={(issuer) => setCertifications(update(certifications, index, { issuer }))}
              />
              <Input
                label="Credential ID"
                value={item.credentialId}
                onChange={(credentialId) =>
                  setCertifications(update(certifications, index, { credentialId }))
                }
              />
              <Input
                label="Verification URL"
                type="url"
                value={item.credentialUrl}
                onChange={(credentialUrl) =>
                  setCertifications(update(certifications, index, { credentialUrl }))
                }
              />
              <Input
                label="Issued"
                type="date"
                value={item.issuedAt}
                onChange={(issuedAt) =>
                  setCertifications(update(certifications, index, { issuedAt }))
                }
              />
              <Input
                label="Expires"
                type="date"
                value={item.expiresAt}
                onChange={(expiresAt) =>
                  setCertifications(update(certifications, index, { expiresAt }))
                }
              />
            </div>
          </div>
        ))}
        <Add
          label="Add certification"
          onClick={() =>
            setCertifications([
              ...certifications,
              {
                title: "",
                issuer: "",
                credentialId: "",
                credentialUrl: "",
                issuedAt: "",
                expiresAt: "",
              },
            ])
          }
        />
      </section>
      <section className="profile-section">
        <SectionTitle
          icon={<BookOpen />}
          title="Publications"
          text="Articles, research, conference papers and talks."
        />
        {publications.map((item, index) => (
          <div className="repeat-card" key={index}>
            <Remove onClick={() => setPublications(remove(publications, index))} />
            <div className="two-col">
              <Input
                label="Title"
                value={item.title}
                onChange={(title) => setPublications(update(publications, index, { title }))}
              />
              <Input
                label="Type"
                value={item.type}
                onChange={(type) => setPublications(update(publications, index, { type }))}
              />
              <Input
                label="Publisher"
                value={item.publisher}
                onChange={(publisher) =>
                  setPublications(update(publications, index, { publisher }))
                }
              />
              <Input
                label="Published"
                type="date"
                value={item.publishedAt}
                onChange={(publishedAt) =>
                  setPublications(update(publications, index, { publishedAt }))
                }
              />
              <Input
                label="URL"
                type="url"
                value={item.url}
                onChange={(url) => setPublications(update(publications, index, { url }))}
              />
            </div>
            <label>
              Description
              <textarea
                value={item.description}
                onChange={(e) =>
                  setPublications(update(publications, index, { description: e.target.value }))
                }
              />
            </label>
          </div>
        ))}
        <Add
          label="Add publication"
          onClick={() =>
            setPublications([
              ...publications,
              {
                title: "",
                type: "Article",
                publisher: "",
                publishedAt: "",
                url: "",
                description: "",
              },
            ])
          }
        />
      </section>
      <section className="profile-section resume-section">
        <SectionTitle
          icon={<FileText />}
          title="Résumé"
          text="Optional. PDF or DOCX, maximum 5 MB. Kept private and access-controlled."
        />
        {resume && (
          <div className="resume-file">
            <FileText />
            <span>
              <strong>{resume.originalName}</strong>
              <small>
                {Math.ceil(resume.sizeBytes / 1024)} KB · uploaded{" "}
                {new Date(resume.uploadedAt).toLocaleDateString()}
              </small>
            </span>
            {resume.id && <a href={`/api/profile/resume/${resume.id}`}>Download</a>}
          </div>
        )}
        <label className="upload-button">
          <Upload />
          Upload or replace résumé
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={upload}
          />
        </label>
      </section>
      {message && (
        <p
          className={
            message.includes("saved") || message.includes("uploaded")
              ? "saved-message"
              : "form-error"
          }
        >
          {message}
        </p>
      )}
      <button className="button button-coral save-details" onClick={save} disabled={busy}>
        <Save />
        {busy ? "Saving…" : "Save detailed profile"}
      </button>
    </div>
  );
}
function SectionTitle({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="profile-section-title">
      <i>{icon}</i>
      <span>
        <h2>{title}</h2>
        <p>{text}</p>
      </span>
    </div>
  );
}
function Add({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="add-row" onClick={onClick}>
      <Plus />
      {label}
    </button>
  );
}
function Remove({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="remove-row" aria-label="Remove item" onClick={onClick}>
      <Trash2 />
    </button>
  );
}
function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function update<T>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}
function remove<T>(items: T[], index: number) {
  return items.filter((_, i) => i !== index);
}
