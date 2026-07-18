import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
export async function GET(_: Request, { params }: { params: Promise<{ resumeId: string }> }) {
  const user = await requireUser("CANDIDATE");
  const { resumeId } = await params;
  const resume = await prisma.resumeDocument.findFirst({
    where: { id: resumeId, candidate: { userId: user.id } },
  });
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bytes = await readFile(path.join(process.cwd(), "storage", "resumes", resume.storageKey));
  return new NextResponse(bytes, {
    headers: {
      "content-type": resume.mimeType,
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(resume.originalName)}`,
      "cache-control": "private, no-store",
    },
  });
}
