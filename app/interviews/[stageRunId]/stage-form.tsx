"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
export function StageForm({ stageRunId }: { stageRunId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/stages/${stageRunId}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        answers: {
          roleMotivation: Number(form.get("roleMotivation")),
          evidenceQuality: Number(form.get("evidenceQuality")),
          scenarioJudgement: Number(form.get("scenarioJudgement")),
        },
      }),
    });
    if (response.ok) {
      setDone(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } else setBusy(false);
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
      <fieldset>
        <legend>1. How strongly does this role align with your goals?</legend>
        <p>
          Use 0–100. In production, this stage can use structured questions, recorded video, or an
          agent call.
        </p>
        <input name="roleMotivation" type="range" min="0" max="100" defaultValue="82" />
      </fieldset>
      <fieldset>
        <legend>2. Rate the strength of the evidence in your example.</legend>
        <textarea
          placeholder="Describe a relevant situation, what you did, and the measurable outcome."
          required
          defaultValue="I led discovery across customer and engineering teams, tested three concepts, and improved task completion by 24%."
        />
        <input name="evidenceQuality" type="range" min="0" max="100" defaultValue="86" />
      </fieldset>
      <fieldset>
        <legend>3. Scenario judgement</legend>
        <p>
          A release is blocked by conflicting accessibility and timeline constraints. How
          confidently could you facilitate a fair decision?
        </p>
        <input name="scenarioJudgement" type="range" min="0" max="100" defaultValue="88" />
      </fieldset>
      <label className="attestation">
        <input type="checkbox" required /> I confirm this response is my own and consent to
        evaluation under the published rubric.
      </label>
      <button className="button button-coral" disabled={busy}>
        {busy ? "Evaluating…" : "Submit stage"}
        <ArrowRight />
      </button>
    </form>
  );
}
