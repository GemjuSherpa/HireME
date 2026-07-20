import { expect, test } from "@playwright/test";

test.describe("@cloud deployed application smoke tests", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  test("health endpoint reports the expected service", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok", service: "hireme-web" });
  });

  test("public entry pages render without server failures", async ({ request }) => {
    for (const path of ["/", "/login", "/signup"]) {
      const response = await request.get(path);
      expect(response.status(), `${path} should be reachable`).toBe(200);
      const html = await response.text();
      expect(html).toContain("HireME");
      expect(html).not.toContain("Internal Server Error");
    }
  });

  test("PWA manifest is valid and installable metadata is present", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest).toMatchObject({ name: expect.any(String), display: "standalone" });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([expect.objectContaining({ src: expect.any(String) })]),
    );
  });

  test("scheduled workflow endpoint fails closed without its secret", async ({ request }) => {
    const response = await request.get("/api/cron/invitations");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
