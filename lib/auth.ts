import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashToken, randomToken, verifyPassword } from "@/lib/security";

export const SESSION_COOKIE = "hireme_session";
const SESSION_MS = 1000 * 60 * 60 * 24 * 14;

/** Creates a two-week server-side session and writes only its bearer token to an HTTP-only cookie. */
export async function createSession(userId: string) {
  const token = randomToken();
  const requestHeaders = await headers();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_MS),
      userAgent: requestHeaders.get("user-agent")?.slice(0, 300),
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

/** Revokes the current server-side session before clearing the browser cookie. */
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Resolves the authenticated user for the current request, or `null` for invalid sessions. */
export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { candidate: true, recruiter: { include: { company: true } } } } },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}

/** Enforces authentication and optional role authorization for server-rendered routes. */
export async function requireUser(role?: "CANDIDATE" | "RECRUITER" | "ADMIN") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${role === "RECRUITER" ? "/recruiter" : "/dashboard"}`);
  if (role && user.role !== role && user.role !== "ADMIN")
    redirect(user.role === "RECRUITER" ? "/recruiter" : "/dashboard");
  return user;
}

/** Authenticates credentials and applies the account lockout policy after repeated failures. */
export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || (user.lockedUntil && user.lockedUntil > new Date())) return null;
  if (!(await verifyPassword(password, user.passwordHash))) {
    const failures = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: failures,
        lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60_000) : null,
      },
    });
    return null;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  return user;
}
