import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/shared/http/api-client";

describe("requestJson", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns typed JSON for successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    await expect(requestJson<{ ok: boolean }>("/api/example")).resolves.toEqual({ ok: true });
  });

  it("normalises the API error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: "Invalid", field: "email" }), { status: 400 }),
        ),
    );
    await expect(requestJson("/api/example")).rejects.toMatchObject({
      message: "Invalid",
      status: 400,
      field: "email",
    });
  });

  it("rejects malformed JSON responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json", { status: 502 })));
    await expect(requestJson("/api/example")).rejects.toThrow("invalid response");
  });
});
