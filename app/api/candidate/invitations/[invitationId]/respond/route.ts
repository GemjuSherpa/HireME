import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { respondToOwnedShortlist } from "@/lib/workflow";
import { shortlistResponseSchema } from "@/features/invitations/contracts";
import { handleRouteError, parseJsonRequest } from "@/shared/http/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  const user = await requireUser("CANDIDATE");
  try {
    const parsed = shortlistResponseSchema.safeParse(await parseJsonRequest(request));
    if (!parsed.success)
      return NextResponse.json({ error: "Choose accept or decline." }, { status: 400 });
    const { invitationId } = await params;
    return NextResponse.json(
      await respondToOwnedShortlist(invitationId, user.id, parsed.data.action),
    );
  } catch (error) {
    return handleRouteError(error, "Invitation could not be updated.");
  }
}
