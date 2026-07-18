import Link from "next/link";
import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "RECRUITER" ? "/recruiter" : "/dashboard");
  return (
    <main className="login-page">
      <section className="login-brand">
        <Link className="brand brand-light" href="/">
          <span>H</span>HireME
        </Link>
        <div>
          <p>ONE PROFILE. BETTER OPPORTUNITIES.</p>
          <h1>Welcome back to hiring that works.</h1>
          <span>Secure, transparent and designed around people.</span>
        </div>
      </section>
      <section className="login-panel">
        <div>
          <p className="eyebrow">SECURE SIGN IN</p>
          <h2>Continue to HireME</h2>
          <p>Use a demo account or sign in to your own workspace.</p>
          <LoginForm />
          <p className="auth-switch">
            Need an account? <Link href="/signup">Choose candidate or company</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
