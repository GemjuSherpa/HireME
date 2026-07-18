"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
export function DraftActions({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function preview() {
    setBusy("preview");
    setError("");
    const response = await fetch(`/api/jobs/${jobId}/preview`, { method: "POST" });
    const body = await response.json();
    if (response.ok) router.refresh();
    else setError(body.error ?? "Preview failed");
    setBusy("");
  }
  async function remove() {
    if (!confirm("Delete this draft pipeline? This cannot be undone.")) return;
    setBusy("delete");
    const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/recruiter");
      router.refresh();
    } else {
      setError((await response.json()).error);
      setBusy("");
    }
  }
  return (
    <div className="draft-actions">
      <Link className="button button-outline" href={`/recruiter/jobs/${jobId}/edit`}>
        <Pencil />
        Edit requirements
      </Link>
      <button className="button button-outline" onClick={preview} disabled={!!busy}>
        <RefreshCw />
        {busy === "preview" ? "Matching…" : "Refresh matches"}
      </button>
      <button className="button button-outline danger" onClick={remove} disabled={!!busy}>
        <Trash2 />
        Delete draft
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
