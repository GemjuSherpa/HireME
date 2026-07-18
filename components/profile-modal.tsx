"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
type Data = {
  type: string;
  name: string;
  subtitle?: string;
  visibility: string;
  summary?: string;
  location?: string;
  details: string[];
  skills: string[];
  sections: { title: string; items: string[] }[];
};
export function ProfileModalTrigger({
  type,
  id,
  children,
  className,
}: {
  type: "candidate" | "company";
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false),
    [data, setData] = useState<Data | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!open || data) return;
    fetch(`/api/profiles/${type}/${id}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setData(body);
      })
      .catch((e) => setError(e.message));
  }, [open, data, type, id]);
  return (
    <>
      <button
        type="button"
        className={className ?? "profile-modal-trigger"}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {open && (
        <div
          className="profile-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${type} profile`}
          >
            <button
              className="profile-modal-close"
              aria-label="Close profile"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
            {error ? (
              <div className="form-error">{error}</div>
            ) : !data ? (
              <p>Loading profile…</p>
            ) : (
              <>
                <p className="eyebrow">
                  {data.visibility} {data.type} profile
                </p>
                <h2>{data.name}</h2>
                <strong>{data.subtitle}</strong>
                {data.location && <p>{data.location}</p>}
                <p>{data.summary}</p>
                <ul>
                  {data.details.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                {data.skills.length > 0 && (
                  <div className="chip-list">
                    {data.skills.map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </div>
                )}
                {data.sections.map((section) => (
                  <div key={section.title}>
                    <h3>{section.title}</h3>
                    {section.items.length ? (
                      <ul>
                        {section.items.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nothing listed.</p>
                    )}
                  </div>
                ))}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
