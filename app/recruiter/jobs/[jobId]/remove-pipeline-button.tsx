"use client";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemovePipelineButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    const body = await response.json();
    if (response.ok) {
      router.push("/recruiter");
      router.refresh();
    } else {
      setError(body.error ?? "Could not remove pipeline");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="button button-outline danger"
        onClick={() => setOpen(true)}
        disabled={busy}
      >
        <Trash2 />
        Remove from history
      </button>
      {open && (
        <div className="profile-modal-backdrop" role="presentation">
          <section
            className="journey-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-pipeline-title"
          >
            <button
              type="button"
              className="profile-modal-close"
              aria-label="Close removal dialog"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              <X />
            </button>
            <div className="journey-confirm-icon">
              <AlertTriangle />
            </div>
            <p className="eyebrow">REMOVE PIPELINE</p>
            <h2 id="remove-pipeline-title">Permanently remove “{jobTitle}”?</h2>
            <p>
              This closed pipeline and its recruitment records will be removed from your history.
              This action cannot be undone.
            </p>
            {error && <p className="form-error">{error}</p>}
            <div className="journey-confirm-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Keep in history
              </button>
              <button
                type="button"
                className="button button-coral danger-action"
                onClick={remove}
                disabled={busy}
              >
                {busy ? "Removing…" : "Remove permanently"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
