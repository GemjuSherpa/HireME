"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { requestJson } from "@/shared/http/api-client";

/** Authenticates an existing user and redirects to the workspace returned by the server. */
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const body = await requestJson<{ redirectTo: string }>("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      router.push(body.redirectTo);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="login-form" onSubmit={submit}>
      <label>
        Email address
        <input
          name="email"
          type="email"
          defaultValue="recruiter@hireme.test"
          required
          autoComplete="email"
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          defaultValue="HireME-demo-2026!"
          minLength={8}
          required
          autoComplete="current-password"
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="button button-coral" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
        <ArrowRight />
      </button>
      <div className="demo-note">
        <LockKeyhole />
        <span>
          <strong>Demo accounts</strong>Recruiter: recruiter@hireme.test
          <br />
          Candidate: candidate@hireme.test
          <br />
          Password: HireME-demo-2026!
        </span>
      </div>
    </form>
  );
}
