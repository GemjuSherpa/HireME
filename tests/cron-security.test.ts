import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/invitations/route";

const originalSecret = process.env.CRON_SECRET;

describe("invitation cron authorization", () => {
  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("fails closed when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(new NextRequest("http://localhost/api/cron/invitations"));
    expect(response.status).toBe(401);
  });

  it("rejects an incorrect bearer token", async () => {
    process.env.CRON_SECRET = "expected-secret";
    const request = new NextRequest("http://localhost/api/cron/invitations", {
      headers: { authorization: "Bearer incorrect-secret" },
    });
    expect((await GET(request)).status).toBe(401);
  });
});
