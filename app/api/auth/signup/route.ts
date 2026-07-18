import { createSession, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const base = {
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(12)
    .max(128)
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/[0-9]/, "Add a number"),
};
const schema = z.discriminatedUnion("accountType", [
  z.object({ ...base, accountType: z.literal("CANDIDATE") }),
  z.object({
    ...base,
    accountType: z.literal("COMPANY"),
    companyName: z.string().trim().min(2).max(150),
    companyWebsite: z.string().trim().url().optional().or(z.literal("")),
    industry: z.string().trim().min(2).max(100),
    recruiterTitle: z.string().trim().min(2).max(100),
  }),
]);

export async function POST(request: NextRequest) {
  const activeUser = await getCurrentUser();
  if (activeUser)
    return NextResponse.json(
      {
        error: `${activeUser.name} is already signed in. Sign out before creating another account.`,
        redirectTo: activeUser.role === "RECRUITER" ? "/recruiter" : "/dashboard",
      },
      { status: 409 },
    );
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your details." },
      { status: 400 },
    );
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists)
    return NextResponse.json(
      { error: "An account already exists for this email." },
      { status: 409 },
    );
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.$transaction(async (tx) => {
    if (parsed.data.accountType === "CANDIDATE")
      return tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: "CANDIDATE",
          candidate: {
            create: {
              headline: "New candidate",
              bio: "Tell recruiters about your experience, strengths and the outcomes you create.",
              workModes: ["HYBRID"],
              workTypes: ["FULL_TIME"],
              desiredTitles: ["My next role"],
              profileScore: 25,
            },
          },
        },
      });
    return tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "RECRUITER",
        recruiter: {
          create: {
            title: parsed.data.recruiterTitle,
            company: {
              create: {
                name: parsed.data.companyName,
                website: parsed.data.companyWebsite || null,
                industry: parsed.data.industry,
                size: "Not specified",
              },
            },
          },
        },
      },
    });
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "ACCOUNT_CREATED",
      entityType: "User",
      entityId: user.id,
      metadata: { role: user.role, roleImmutable: true },
    },
  });
  await createSession(user.id);
  return NextResponse.json(
    { ok: true, redirectTo: user.role === "RECRUITER" ? "/recruiter/onboarding" : "/onboarding" },
    { status: 201 },
  );
}
