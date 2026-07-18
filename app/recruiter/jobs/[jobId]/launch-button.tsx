"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
export function LaunchButton({ jobId, disabled }: { jobId: string; disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function launch() {
    if (!confirm("Launch this job, rank the candidate pool, and queue first-stage invitations?"))
      return;
    setBusy(true);
    const response = await fetch(`/api/jobs/${jobId}/launch`, { method: "POST" });
    if (response.ok) {
      router.refresh();
    } else setBusy(false);
  }
  return (
    <button className="primary-action" onClick={launch} disabled={disabled || busy}>
      <Rocket />
      {busy ? "Building pool…" : disabled ? "Pipeline active" : "Launch pipeline"}
    </button>
  );
}
