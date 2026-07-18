import { NextRequest, NextResponse } from "next/server";
import { respondToShortlist } from "@/lib/workflow";
import { shortlistResponseSchema } from "@/features/invitations/contracts";
import { handleRouteError, parseJsonRequest } from "@/shared/http/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const parsed = shortlistResponseSchema.safeParse(await parseJsonRequest(request));
    if (!parsed.success)
      return NextResponse.json({ error: "Choose accept or decline." }, { status: 400 });
    const { token } = await params;
    return NextResponse.json(await respondToShortlist(token, parsed.data.action));
  } catch (error) {
    return handleRouteError(error, "Invitation could not be updated.");
  }
}
