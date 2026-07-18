import Link from "next/link";
import { SignupForm } from "./signup-form";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "RECRUITER" ? "/recruiter" : "/dashboard");
  return (
    <main className="login-page">
      <section className="login-brand">
        <Link className="brand brand-light" href="/">
          <span>H</span>HireME
        </Link>
        <div>
          <p>CHOOSE YOUR HIREME WORKSPACE</p>
          <h1>One account. One clear purpose.</h1>
          <span>
            Candidates manage their career journey. Companies manage jobs, pipelines and final
            interviews.
          </span>
        </div>
      </section>
      <section className="login-panel">
        <div>
          <p className="eyebrow">ACCOUNT REGISTRATION</p>
          <h2>Create your account</h2>
          <p>Your account type determines your permanent profile, permissions and workspace.</p>
          <SignupForm />
        </div>
      </section>
    </main>
  );
}
