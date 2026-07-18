"use client";
import { AlertTriangle, Ban, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CancelPipelineButton({ jobId }: { jobId: string }) {
  const router = useRouter(),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function cancel() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });
    const body = await response.json();
    if (response.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(body.error ?? "Could not cancel pipeline");
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        className="button button-outline danger"
        onClick={() => setOpen(true)}
        disabled={busy}
      >
        <Ban />
        Cancel pipeline
      </button>
      {open && (
        <div className="profile-modal-backdrop" role="presentation">
          <section
            className="journey-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-pipeline-title"
          >
            <button
              type="button"
              className="profile-modal-close"
              aria-label="Close cancellation dialog"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              <X />
            </button>
            <div className="journey-confirm-icon">
              <AlertTriangle />
            </div>
            <p className="eyebrow">CANCEL PIPELINE</p>
            <h2 id="cancel-pipeline-title">Cancel this hiring pipeline?</h2>
            <p>
              Pending invitations and assessments will expire, and candidates still in active stages
              will be withdrawn. You can permanently remove the pipeline from your history after it
              is cancelled.
            </p>
            {error && <p className="form-error">{error}</p>}
            <div className="journey-confirm-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Keep pipeline
              </button>
              <button
                type="button"
                className="button button-coral danger-action"
                onClick={cancel}
                disabled={busy}
              >
                {busy ? "Cancelling…" : "Yes, cancel pipeline"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
