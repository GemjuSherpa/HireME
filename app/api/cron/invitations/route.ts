import { NextRequest, NextResponse } from "next/server";
import {
  processExpiredShortlistInvitations,
  retryTechnicalAssessmentExceptions,
} from "@/lib/workflow";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [invitations, assessments] = await Promise.all([
    processExpiredShortlistInvitations(),
    retryTechnicalAssessmentExceptions(),
  ]);
  return NextResponse.json({ invitations, assessments });
}
