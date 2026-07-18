"use client";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function InterviewOptions({
  interview,
}: {
  interview: {
    id: string;
    firstOption: string;
    secondOption: string;
    selectedOption: string | null;
    timezone: string;
    location: string | null;
    status: string;
  };
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  async function choose(option: "FIRST" | "SECOND") {
    setBusy(option);
    const response = await fetch(`/api/candidate/interviews/${interview.id}/select`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ option }),
    });
    if (response.ok) router.refresh();
    else {
      setError((await response.json()).error);
      setBusy("");
    }
  }
  const format = (value: string) =>
    new Date(value).toLocaleString("en-AU", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: interview.timezone,
    });
  if (interview.status === "CONFIRMED" && interview.selectedOption)
    return (
      <div className="interview-options confirmed">
        <CalendarDays />
        <div>
          <strong>Interview confirmed</strong>
          <span>
            {format(interview.selectedOption)} · {interview.location}
          </span>
        </div>
      </div>
    );
  return (
    <div className="interview-options">
      <div>
        <strong>Choose one suitable interview time</strong>
        <span>
          {interview.location} · {interview.timezone}
        </span>
      </div>
      <button onClick={() => choose("FIRST")} disabled={!!busy}>
        {busy === "FIRST" ? "Confirming…" : format(interview.firstOption)}
      </button>
      <button onClick={() => choose("SECOND")} disabled={!!busy}>
        {busy === "SECOND" ? "Confirming…" : format(interview.secondOption)}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
