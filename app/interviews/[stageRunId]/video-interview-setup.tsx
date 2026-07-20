"use client";

import { useState } from "react";
import { Camera, MessageSquareText, ShieldCheck } from "lucide-react";

/** Collects recording consent or an alternative-format request before provisioning video media. */
export function VideoInterviewSetup({ stageRunId }: { stageRunId: string }) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function createSession(requestAlternative: boolean) {
    setBusy(true);
    setStatus("");
    const response = await fetch(`/api/video-interviews/${stageRunId}/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ consent: consent && !requestAlternative, requestAlternative }),
    });
    const body = (await response.json()) as { error?: string; session?: { status: string } };
    setStatus(
      response.ok
        ? requestAlternative
          ? "Your alternative-format request has been recorded for human follow-up."
          : "Consent recorded. The secure real-time video provider will be connected in the next delivery milestone."
        : (body.error ?? "The interview session could not be prepared."),
    );
    setBusy(false);
  }

  return (
    <div className="video-interview-setup">
      <Camera />
      <h3>AI-enabled video interview</h3>
      <p>
        The AI interviewer will ask approved, structured questions and limited evidence-seeking
        follow-ups. HireME evaluates transcript content only—never appearance, facial expression,
        eye contact, accent, voice pitch or apparent emotion.
      </p>
      <label className="attestation">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        I consent to the interview recording, transcription and job-related evidence review.
      </label>
      <div className="dialog-actions">
        <button
          className="button button-coral"
          disabled={!consent || busy}
          onClick={() => createSession(false)}
        >
          <ShieldCheck /> Prepare secure interview
        </button>
        <button
          className="button button-outline"
          disabled={busy}
          onClick={() => createSession(true)}
        >
          <MessageSquareText /> Request text or accessible alternative
        </button>
      </div>
      {status && <p role="status">{status}</p>}
    </div>
  );
}
