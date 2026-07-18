"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { requestJson } from "@/shared/http/api-client";

/** Creates one permanent candidate or company account and enters its role-specific workspace. */
export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accountType, setAccountType] = useState<"CANDIDATE" | "COMPANY">("CANDIDATE");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const body = await requestJson<{ redirectTo: string }>("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accountType,
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          companyName: form.get("companyName"),
          companyWebsite: form.get("companyWebsite"),
          industry: form.get("industry"),
          recruiterTitle: form.get("recruiterTitle"),
        }),
      });
      router.push(body.redirectTo);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="login-form" onSubmit={submit}>
      <fieldset className="account-type">
        <legend>I am registering as</legend>
        <button
          type="button"
          className={accountType === "CANDIDATE" ? "selected" : ""}
          onClick={() => setAccountType("CANDIDATE")}
        >
          <strong>Candidate</strong>
          <span>Build a private talent profile</span>
        </button>
        <button
          type="button"
          className={accountType === "COMPANY" ? "selected" : ""}
          onClick={() => setAccountType("COMPANY")}
        >
          <strong>Company</strong>
          <span>Post roles and manage hiring</span>
        </button>
      </fieldset>
      <label>
        {accountType === "COMPANY" ? "Hiring team member name" : "Full name"}
        <input name="name" required autoComplete="name" placeholder="Alex Morgan" />
      </label>
      <label>
        Work email address
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="alex@example.com"
        />
      </label>
      {accountType === "COMPANY" && (
        <div className="company-signup-fields">
          <label>
            Company name
            <input name="companyName" required placeholder="Acme Pty Ltd" />
          </label>
          <label>
            Your role or title
            <input name="recruiterTitle" required placeholder="Talent Acquisition Lead" />
          </label>
          <label>
            Industry
            <input name="industry" required placeholder="Technology" />
          </label>
          <label>
            Company website <small>Optional</small>
            <input name="companyWebsite" type="url" placeholder="https://example.com" />
          </label>
        </div>
      )}
      <label>
        Password
        <input
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          placeholder="12+ characters, upper/lowercase and number"
        />
      </label>
      <label>
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="button button-coral" disabled={busy}>
        {busy
          ? "Creating account…"
          : accountType === "CANDIDATE"
            ? "Create candidate account"
            : "Create company account"}
        <ArrowRight />
      </button>
      <div className="demo-note">
        <LockKeyhole />
        <span>
          <strong>One permanent account type</strong>
          {accountType === "CANDIDATE"
            ? "Candidate accounts have private profiles and interview journeys."
            : "Company accounts have organization profiles, jobs, pipelines and hiring analytics."}
        </span>
      </div>
      <p className="auth-switch">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
