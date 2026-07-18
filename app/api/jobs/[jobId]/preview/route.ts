import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { previewJobMatches } from "@/lib/workflow";

export async function POST(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireUser("RECRUITER");
  const { jobId } = await params;
  const owned = await prisma.job.count({
    where: { id: jobId, status: "DRAFT", recruiter: { userId: user.id } },
  });
  if (!owned) return NextResponse.json({ error: "Draft pipeline not found." }, { status: 404 });
  try {
    return NextResponse.json(await previewJobMatches(jobId, user.id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Matching preview failed." },
      { status: 500 },
    );
  }
}
