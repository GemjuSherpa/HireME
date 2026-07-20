"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { AssessmentQuestion } from "@/lib/assessment-question-bank";

type StageFormProps = {
  stageRunId: string;
  questions: AssessmentQuestion[];
};

/** Renders the persisted question snapshot and submits answers keyed by stable question ID. */
export function StageForm({ stageRunId, questions }: StageFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const answers = Object.fromEntries(
      questions.map((question) => [question.id, String(form.get(question.id) ?? "").trim()]),
    );
    const response = await fetch(`/api/stages/${stageRunId}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers, candidateAttestation: form.get("attestation") === "on" }),
    });
    if (response.ok) {
      setDone(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
      return;
    }
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(body?.error ?? "Your responses could not be submitted. Please try again.");
    setBusy(false);
  }

  if (done)
    return (
      <div className="stage-success">
        <CheckCircle2 />
        <h2>Response submitted</h2>
        <p>
          Your evidence has been recorded. The evaluation and any next invitation will appear in
          your dashboard.
        </p>
      </div>
    );

  return (
    <form className="assessment-form" onSubmit={submit}>
      {questions.map((question, index) => (
        <fieldset key={question.id}>
          <legend>
            {index + 1}. {question.prompt}
          </legend>
          <p>
            {question.category} ·{" "}
            {question.source === "RECRUITER" ? "Hiring-team question" : "Question bank"}
          </p>
          {question.answerType === "SINGLE_SELECT" ? (
            <select name={question.id} required={question.required} defaultValue="">
              <option value="" disabled>
                Select an answer
              </option>
              {question.options?.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : question.answerType === "DATE" ? (
            <input name={question.id} type="date" required={question.required} />
          ) : question.answerType === "NUMERIC" ? (
            <input name={question.id} type="number" required={question.required} />
          ) : question.answerType === "SHORT_TEXT" ? (
            <input name={question.id} type="text" required={question.required} maxLength={500} />
          ) : (
            <textarea
              name={question.id}
              required={question.required}
              minLength={30}
              maxLength={3000}
              placeholder="Give a specific, evidence-based response."
            />
          )}
        </fieldset>
      ))}
      <label className="attestation">
        <input name="attestation" type="checkbox" required /> I confirm these responses are my own
        and consent to evaluation under the published rubric.
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button button-coral" disabled={busy}>
        {busy ? "Submitting…" : "Submit stage"}
        <ArrowRight />
      </button>
    </form>
  );
}
