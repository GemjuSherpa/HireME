import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const schema = z.object({
  type: z.enum(["AI_ASSESSMENT", "TRAINING_DATA", "VIDEO_RECORDING"]),
  granted: z.boolean(),
});
export async function POST(request: NextRequest) {
  const user = await requireUser();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid consent" }, { status: 400 });
  const record = await prisma.consentRecord.create({
    data: {
      userId: user.id,
      type: parsed.data.type,
      granted: parsed.data.granted,
      policyVersion: "2026-07",
      withdrawnAt: parsed.data.granted ? null : new Date(),
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "CONSENT_UPDATED",
      entityType: "ConsentRecord",
      entityId: record.id,
      metadata: parsed.data,
    },
  });
  return NextResponse.json({ record });
}
