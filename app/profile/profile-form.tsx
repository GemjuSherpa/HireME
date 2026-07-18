"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Save } from "lucide-react";
type Profile = {
  headline: string | null;
  bio: string | null;
  location: string | null;
  seekingStatus: string;
  workModes: string[];
  desiredTitles: string[];
  workRights: string | null;
  highestEducation: string | null;
  visibility: string;
};
export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter(),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        headline: form.get("headline"),
        bio: form.get("bio"),
        location: form.get("location"),
        seekingStatus: form.get("seekingStatus"),
        workRights: form.get("workRights"),
        highestEducation: form.get("highestEducation"),
        visibility: form.get("visibility"),
        workModes: form.getAll("workModes"),
        desiredTitles: String(form.get("desiredTitles"))
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      }),
    });
    if (response.ok) {
      setSaved(true);
      router.refresh();
    } else setError((await response.json()).error);
  }
  return (
    <form className="live-form" onSubmit={submit}>
      <label>
        Profile visibility
        <select
          name="visibility"
          defaultValue={profile.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE"}
          required
        >
          <option value="PRIVATE">Private — accepted companies only</option>
          <option value="PUBLIC">Public — all authenticated users</option>
        </select>
      </label>
      <label>
        Professional headline
        <input name="headline" defaultValue={profile.headline ?? ""} required />
      </label>
      <label>
        Professional summary
        <textarea name="bio" defaultValue={profile.bio ?? ""} required minLength={20} />
      </label>
      <label>
        Location
        <input name="location" defaultValue={profile.location ?? ""} required />
      </label>
      <label>
        Opportunity status
        <select name="seekingStatus" defaultValue={profile.seekingStatus} required>
          <option value="ACTIVELY_LOOKING">Actively looking</option>
          <option value="OPEN_TO_OFFERS">Open to offers</option>
          <option value="NOT_LOOKING">Not looking</option>
        </select>
      </label>
      <label>
        Desired roles
        <input name="desiredTitles" defaultValue={profile.desiredTitles.join(", ")} required />
      </label>
      <label>
        Highest completed education
        <select
          name="highestEducation"
          defaultValue={profile.highestEducation ?? "BACHELOR"}
          required
        >
          {["HIGH_SCHOOL", "CERTIFICATE", "DIPLOMA", "BACHELOR", "MASTER", "PHD"].map((x) => (
            <option key={x} value={x}>
              {x.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label>
        Australian work rights
        <select name="workRights" defaultValue={profile.workRights ?? "OTHER"} required>
          {["AU_UNRESTRICTED", "AU_VALID_VISA", "REQUIRES_SPONSORSHIP", "OTHER"].map((x) => (
            <option key={x} value={x}>
              {x.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Preferred work modes</legend>
        {["REMOTE", "HYBRID", "ONSITE"].map((mode) => (
          <label className="check-row" key={mode}>
            <input
              type="checkbox"
              name="workModes"
              value={mode}
              defaultChecked={profile.workModes.includes(mode)}
            />
            {mode.toLowerCase()}
          </label>
        ))}
      </fieldset>
      {error && <p className="form-error">{error}</p>}
      {saved && (
        <p className="saved-message">
          <CheckCircle2 />
          Profile saved
        </p>
      )}
      <button className="button button-coral">
        <Save />
        Save profile
      </button>
    </form>
  );
}
