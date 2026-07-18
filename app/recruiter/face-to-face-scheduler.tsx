"use client";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/shared/http/api-client";

type ExistingInterview = {
  firstOption: string;
  secondOption: string;
  selectedOption: string | null;
  status: string;
  location: string | null;
};

type FaceToFaceSchedulerProps = {
  applicationId: string;
  candidateName: string;
  existing?: ExistingInterview;
};

/** Collects and sends two face-to-face interview options for a finalist application. */
export function FaceToFaceScheduler({
  applicationId,
  candidateName,
  existing,
}: FaceToFaceSchedulerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      await requestJson(`/api/recruiter/interviews/${applicationId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstOption: new Date(String(f.get("firstOption"))).toISOString(),
          secondOption: new Date(String(f.get("secondOption"))).toISOString(),
          timezone: f.get("timezone"),
          location: f.get("location"),
        }),
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Interview options could not be sent.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {existing?.status === "CONFIRMED" ? (
        <span className="schedule-confirmed">
          <CalendarDays />
          Confirmed {new Date(existing.selectedOption!).toLocaleString("en-AU")}
        </span>
      ) : (
        <button className="button button-light" onClick={() => setOpen(true)}>
          <CalendarDays />
          {existing ? "Reschedule options" : "Organise interview"}
        </button>
      )}
      {open && (
        <div className="profile-modal-backdrop">
          <form className="journey-confirm schedule-form" onSubmit={submit}>
            <button
              type="button"
              className="profile-modal-close"
              aria-label="Close scheduling dialog"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
            <p className="eyebrow">FACE-TO-FACE INTERVIEW</p>
            <h2>Offer two times to {candidateName}</h2>
            <label htmlFor="firstOption">
              First proposed interview date and time
              <input
                id="firstOption"
                name="firstOption"
                type="datetime-local"
                title="Select the first proposed face-to-face interview date and time"
                required
              />
            </label>
            <label htmlFor="secondOption">
              Alternative interview date and time
              <input
                id="secondOption"
                name="secondOption"
                type="datetime-local"
                title="Select the alternative face-to-face interview date and time"
                required
              />
            </label>
            <label htmlFor="interviewTimezone">
              Interview timezone
              <input
                id="interviewTimezone"
                name="timezone"
                defaultValue="Australia/Melbourne"
                title="Enter the timezone used for both proposed interview times"
                placeholder="e.g. Australia/Melbourne"
                required
              />
            </label>
            <label htmlFor="interviewLocation">
              Interview location or meeting instructions
              <input
                id="interviewLocation"
                name="location"
                defaultValue={existing?.location ?? "Company office — details to follow"}
                title="Enter the venue address or face-to-face meeting instructions"
                placeholder="e.g. Level 4, 100 Collins Street, Melbourne"
                required
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="journey-confirm-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button className="button button-coral" disabled={busy}>
                {busy ? "Sending…" : "Send both options"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
