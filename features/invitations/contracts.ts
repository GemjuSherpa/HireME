import { z } from "zod";

/** Accepted candidate responses to a shortlist invitation. */
export const shortlistResponseSchema = z.object({ action: z.enum(["ACCEPT", "DECLINE"]) });

export type ShortlistResponse = z.infer<typeof shortlistResponseSchema>["action"];
