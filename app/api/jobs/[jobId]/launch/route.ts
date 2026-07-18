import { requireUser } from "@/lib/auth";
import { launchJob } from "@/lib/workflow";
import { NextResponse } from "next/server";
export async function POST(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireUser("RECRUITER");
  const { jobId } = await params;
  const result = await launchJob(jobId, user.id);
  return NextResponse.json(result);
}
