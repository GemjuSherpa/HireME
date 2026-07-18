import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApplicationError } from "@/shared/errors/application-error";

/** Parses a JSON request body and converts malformed JSON into a safe client error. */
export async function parseJsonRequest(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApplicationError("Request body must contain valid JSON.", 400);
  }
}

/** Creates the common JSON error envelope consumed by HireME clients. */
export function errorResponse(message: string, status = 400, field?: string) {
  return NextResponse.json({ error: message, ...(field ? { field } : {}) }, { status });
}

/** Converts known application/validation failures into safe JSON without leaking internals. */
export function handleRouteError(error: unknown, fallback: string) {
  if (error instanceof ApplicationError)
    return errorResponse(error.message, error.status, error.field);
  if (error instanceof ZodError)
    return errorResponse(error.issues[0]?.message ?? "Invalid request.", 400);
  console.error("Unhandled API route error", error);
  return errorResponse(fallback, 500);
}
