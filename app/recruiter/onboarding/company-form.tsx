"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
type CompanyData = {
  companyName: string;
  website: string;
  industry: string;
  size: string;
  recruiterTitle: string;
  visibility: string;
};
export function CompanyForm({ initial }: { initial: CompanyData }) {
  const router = useRouter(),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/company-profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    if (!response.ok) {
      setError((await response.json()).error);
      return;
    }
    setSaved(true);
    router.refresh();
  }
  return (
    <form className="live-form" onSubmit={submit}>
      <label>
        Profile visibility
        <select name="visibility" defaultValue={initial.visibility} required>
          <option value="PRIVATE">Private — accepted candidates only</option>
          <option value="PUBLIC">Public — all authenticated users</option>
        </select>
      </label>
      <label>
        Company name
        <input name="companyName" defaultValue={initial.companyName} required />
      </label>
      <label>
        Company website
        <input name="website" type="url" defaultValue={initial.website} />
      </label>
      <label>
        Industry
        <input name="industry" defaultValue={initial.industry} required />
      </label>
      <label>
        Company size
        <select name="size" defaultValue={initial.size} required>
          {["Not specified", "1–10", "11–50", "51–200", "201–1,000", "1,000+"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        Your hiring role
        <input name="recruiterTitle" defaultValue={initial.recruiterTitle} required />
      </label>
      {error && <p className="form-error">{error}</p>}
      {saved && (
        <p className="saved-message">
          <CheckCircle2 />
          Company profile saved
        </p>
      )}
      <button className="button button-coral">
        Save company workspace <ArrowRight />
      </button>
    </form>
  );
}
