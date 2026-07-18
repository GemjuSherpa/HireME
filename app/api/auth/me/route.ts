import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
export async function GET() {
  const user = await getCurrentUser();
  return user
    ? NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role })
    : NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
}
