import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
const allowed = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const maxBytes = 5 * 1024 * 1024;
export async function POST(request: Request) {
  const user = await requireUser("CANDIDATE");
  const form = await request.formData();
  const file = form.get("resume");
  if (!(file instanceof File))
    return NextResponse.json({ error: "Choose a résumé file." }, { status: 400 });
  if (!allowed.has(file.type))
    return NextResponse.json({ error: "Upload a PDF or DOCX file." }, { status: 400 });
  if (file.size > maxBytes)
    return NextResponse.json({ error: "Résumé must be 5 MB or smaller." }, { status: 400 });
  const profile = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = file.type === "application/pdf" ? "pdf" : "docx";
  const storageKey = `${profile.id}/${randomUUID()}.${extension}`;
  const base = path.join(process.cwd(), "storage", "resumes");
  const destination = path.join(base, storageKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes, { flag: "wx" });
  await prisma.$transaction([
    prisma.resumeDocument.updateMany({
      where: { candidateId: profile.id, isCurrent: true },
      data: { isCurrent: false },
    }),
    prisma.resumeDocument.create({
      data: {
        candidateId: profile.id,
        originalName: file.name.slice(0, 200),
        storageKey,
        mimeType: file.type,
        sizeBytes: file.size,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "RESUME_UPLOADED",
        entityType: "CandidateProfile",
        entityId: profile.id,
        metadata: { mimeType: file.type, sizeBytes: file.size },
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
