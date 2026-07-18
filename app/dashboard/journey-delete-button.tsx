"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function JourneyDeleteButton({
  applicationId,
  active,
}: {
  applicationId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/candidate/journeys/${applicationId}`, { method: "DELETE" });
    if (response.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError((await response.json()).error ?? "Could not remove journey");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="journey-delete"
        onClick={() => setOpen(true)}
        aria-label="Remove journey from history"
      >
        <Trash2 />
        Remove
      </button>
      {open && (
        <div
          className="profile-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setOpen(false);
          }}
        >
          <section
            className="journey-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`remove-title-${applicationId}`}
          >
            <button
              className="profile-modal-close"
              aria-label="Close warning"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
            <div className="journey-confirm-icon">
              <AlertTriangle />
            </div>
            <p className="eyebrow">{active ? "WITHDRAW AND REMOVE" : "REMOVE FROM HISTORY"}</p>
            <h2 id={`remove-title-${applicationId}`}>
              {active ? "Leave this recruitment journey?" : "Remove this journey?"}
            </h2>
            <p>
              {active
                ? "You will be withdrawn from this opportunity. Pending interviews and invitations will expire, and the journey will disappear from your dashboard."
                : "This completed journey will disappear from your dashboard. Your compliance and audit records will remain securely retained."}
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="journey-confirm-actions">
              <button
                className="button button-outline"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Keep journey
              </button>
              <button
                className="button button-coral danger-action"
                disabled={busy}
                onClick={remove}
              >
                <Trash2 />
                {busy ? "Removing…" : active ? "Withdraw and remove" : "Remove journey"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
