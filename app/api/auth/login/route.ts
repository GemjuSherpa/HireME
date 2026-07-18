import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, getCurrentUser } from "@/lib/auth";
import { z } from "zod";
const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
export async function POST(request: NextRequest) {
  const activeUser = await getCurrentUser();
  if (activeUser)
    return NextResponse.json(
      {
        error: `${activeUser.name} is already signed in. Sign out before using another account.`,
        redirectTo: activeUser.role === "RECRUITER" ? "/recruiter" : "/dashboard",
      },
      { status: 409 },
    );
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user)
    return NextResponse.json(
      { error: "Invalid credentials or account temporarily locked." },
      { status: 401 },
    );
  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    redirectTo: user.role === "RECRUITER" ? "/recruiter" : "/dashboard",
  });
}
