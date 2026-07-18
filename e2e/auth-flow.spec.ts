import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const password = "CloudTestPassword2026";

/** Builds a collision-resistant address for tests that persist an account. */
function uniqueEmail(accountType: "candidate" | "company") {
  return `${accountType}-${randomUUID()}@example.test`;
}

test.describe("authentication and account boundaries", () => {
  test("candidate can sign up, maintain one session, sign out, and sign back in", async ({
    request,
  }) => {
    const email = uniqueEmail("candidate");
    const signup = await request.post("/api/auth/signup", {
      data: { name: "CI Candidate", email, password, accountType: "CANDIDATE" },
    });
    expect(signup.status()).toBe(201);
    await expect(signup.json()).resolves.toMatchObject({
      ok: true,
      redirectTo: "/onboarding",
    });

    const currentUser = await request.get("/api/auth/me");
    expect(currentUser.status()).toBe(200);
    await expect(currentUser.json()).resolves.toMatchObject({ email, role: "CANDIDATE" });

    const competingLogin = await request.post("/api/auth/login", {
      data: { email: "someone-else@example.test", password },
    });
    expect(competingLogin.status()).toBe(409);

    const logout = await request.post("/api/auth/logout", { maxRedirects: 0 });
    expect(logout.status()).toBe(303);
    expect((await request.get("/api/auth/me")).status()).toBe(401);

    const login = await request.post("/api/auth/login", { data: { email, password } });
    expect(login.status()).toBe(200);
    await expect(login.json()).resolves.toMatchObject({ ok: true, redirectTo: "/dashboard" });
  });

  test("company registration creates an immutable recruiter identity", async ({ request }) => {
    const email = uniqueEmail("company");
    const signup = await request.post("/api/auth/signup", {
      data: {
        name: "CI Recruiter",
        email,
        password,
        accountType: "COMPANY",
        companyName: "CI Hiring Company",
        companyWebsite: "https://example.test",
        industry: "Software",
        recruiterTitle: "Hiring Manager",
      },
    });
    expect(signup.status()).toBe(201);
    await expect(signup.json()).resolves.toMatchObject({
      ok: true,
      redirectTo: "/recruiter/onboarding",
    });

    const currentUser = await request.get("/api/auth/me");
    expect(currentUser.status()).toBe(200);
    await expect(currentUser.json()).resolves.toMatchObject({ email, role: "RECRUITER" });
  });

  test("signup rejects weak, incomplete, and duplicate account data", async ({ request }) => {
    const email = uniqueEmail("candidate");
    const weakPassword = await request.post("/api/auth/signup", {
      data: { name: "CI Candidate", email, password: "password", accountType: "CANDIDATE" },
    });
    expect(weakPassword.status()).toBe(400);

    const incompleteCompany = await request.post("/api/auth/signup", {
      data: { name: "CI Recruiter", email, password, accountType: "COMPANY" },
    });
    expect(incompleteCompany.status()).toBe(400);

    expect(
      (
        await request.post("/api/auth/signup", {
          data: { name: "CI Candidate", email, password, accountType: "CANDIDATE" },
        })
      ).status(),
    ).toBe(201);

    await request.post("/api/auth/logout", { maxRedirects: 0 });
    const duplicate = await request.post("/api/auth/signup", {
      data: { name: "Duplicate Candidate", email, password, accountType: "CANDIDATE" },
    });
    expect(duplicate.status()).toBe(409);
  });
});
