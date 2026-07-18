"use client";
import { useState } from "react";
import Link from "next/link";
import { requestJson } from "@/shared/http/api-client";

/** Handles accept/decline mutations for a tokenised email invitation page. */
export function InvitationActions({ token, disabled }: { token: string; disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    assessmentPath?: string;
    error?: string;
  } | null>(null);
  async function respond(action: "ACCEPT" | "DECLINE") {
    setBusy(true);
    try {
      const body = await requestJson<{ status: string; assessmentPath?: string }>(
        `/api/invitations/${encodeURIComponent(token)}/respond`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      setResult(body);
    } catch (error) {
      setResult({
        status: "ERROR",
        error: error instanceof Error ? error.message : "Invitation could not be updated.",
      });
    } finally {
      setBusy(false);
    }
  }
  if (result?.status === "ACCEPT")
    return (
      <div className="saved-message">
        <span>Invitation accepted. Your assessment is now available.</span>
        {result.assessmentPath && (
          <Link className="button button-coral" href={result.assessmentPath}>
            Begin assessment
          </Link>
        )}
      </div>
    );
  if (result?.status === "DECLINE")
    return (
      <div className="saved-message">
        Invitation declined. No assessment has been created for you.
      </div>
    );
  return (
    <div>
      <div className="invitation-actions">
        <button
          className="button button-coral"
          disabled={busy || disabled}
          onClick={() => respond("ACCEPT")}
        >
          Accept and continue
        </button>
        <button
          className="button button-outline"
          disabled={busy || disabled}
          onClick={() => respond("DECLINE")}
        >
          Decline opportunity
        </button>
      </div>
      {result?.error && <p className="form-error">{result.error}</p>}
    </div>
  );
}
