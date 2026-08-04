"use client";
import { useState } from "react";
const options = [
  {
    type: "AI_ASSESSMENT",
    title: "AI-assisted assessment",
    text: "Allow autonomous structured evaluation with evidence-based explanations.",
  },
  {
    type: "VIDEO_RECORDING",
    title: "Video or agent-call recording",
    text: "Allow recording only for stages that clearly request it.",
  },
  {
    type: "TRAINING_DATA",
    title: "De-identified model improvement",
    text: "Optional. Operational data is not used for training without this consent.",
  },
] as const;
export function ConsentControls({ initial }: { initial: Record<string, boolean> }) {
  const [values, setValues] = useState(initial);
  async function update(type: string, granted: boolean) {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, granted }),
    });
    if (response.ok) setValues((v) => ({ ...v, [type]: granted }));
  }
  return (
    <div className="consent-list">
      {options.map((option) => (
        <div key={option.type}>
          <span>
            <strong>{option.title}</strong>
            <p>{option.text}</p>
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={Boolean(values[option.type])}
              onChange={(e) => update(option.type, e.target.checked)}
            />
            <i />
          </label>
        </div>
      ))}
    </div>
  );
}
