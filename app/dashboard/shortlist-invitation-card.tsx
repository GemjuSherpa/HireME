"use client";

import { BriefcaseBusiness, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson } from "@/shared/http/api-client";

type ShortlistInvitation = {
  id: string;
  expiresAt: string;
  job: {
    title: string;
    companyName: string;
    description: string;
    responsibilities: string | null;
    idealCandidate: string | null;
    perks: string | null;
    location: string | null;
    workMode: string;
    skills: string[];
  };
};

/** Presents one actionable shortlist invitation and owns its local review/mutation state. */
export function ShortlistInvitationCard({ invitation }: { invitation: ShortlistInvitation }) {
  const router = useRouter();
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState<"ACCEPT" | "DECLINE" | null>(null);
  const [result, setResult] = useState<{ assessmentPath?: string; error?: string } | null>(null);

  async function respond(action: "ACCEPT" | "DECLINE") {
    setBusy(action);
    setResult(null);
    try {
      const body = await requestJson<{ status: string; assessmentPath?: string }>(
        `/api/candidate/invitations/${invitation.id}/respond`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (action === "ACCEPT" && body.assessmentPath)
        setResult({ assessmentPath: body.assessmentPath });
      else router.refresh();
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Invitation could not be updated.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="shortlist-dashboard-card">
      <div className="invite-art">
        <BriefcaseBusiness />
      </div>
      <div className="shortlist-dashboard-content">
        <p>SHORTLIST INVITATION</p>
        <h2>{invitation.job.title}</h2>
        <span>
          {invitation.job.companyName} · {invitation.job.location ?? "Flexible location"} · respond
          by {new Date(invitation.expiresAt).toLocaleString("en-AU")}
        </span>
        <button
          className="shortlist-review-toggle"
          type="button"
          onClick={() => setReviewing((value) => !value)}
        >
          {reviewing ? <ChevronUp /> : <ChevronDown />}
          {reviewing ? "Hide role details" : "Review opportunity"}
        </button>
        {reviewing && (
          <div className="shortlist-review-details">
            <p>{invitation.job.description}</p>
            <h3>Responsibilities</h3>
            <p>{invitation.job.responsibilities ?? "Not specified"}</p>
            <h3>Ideal candidate</h3>
            <p>{invitation.job.idealCandidate ?? "Not specified"}</p>
            <h3>Why work with us</h3>
            <p>{invitation.job.perks ?? "Not specified"}</p>
            <h3>Required skills</h3>
            <p>{invitation.job.skills.join(", ") || "Not specified"}</p>
            <small>Work arrangement: {invitation.job.workMode}</small>
          </div>
        )}
        {result?.error && <p className="form-error">{result.error}</p>}
        {result?.assessmentPath && (
          <div className="saved-message">
            <span>Invitation accepted. Your first assessment is ready.</span>
            <Link className="button button-coral" href={result.assessmentPath}>
              Begin assessment
            </Link>
          </div>
        )}
      </div>
      {!result?.assessmentPath && (
        <div className="shortlist-dashboard-actions">
          <button
            className="button button-coral"
            disabled={busy !== null}
            onClick={() => respond("ACCEPT")}
          >
            {busy === "ACCEPT" ? "Accepting…" : "Accept shortlist"}
          </button>
          <button
            className="button button-outline"
            disabled={busy !== null}
            onClick={() => respond("DECLINE")}
          >
            {busy === "DECLINE" ? "Declining…" : "Decline"}
          </button>
        </div>
      )}
    </section>
  );
}
