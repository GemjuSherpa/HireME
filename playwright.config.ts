import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const protectionBypassSecret = process.env.PLAYWRIGHT_BYPASS_SECRET;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: externalBaseUrl ?? "http://127.0.0.1:3000",
    extraHTTPHeaders: protectionBypassSecret
      ? { "x-vercel-protection-bypass": protectionBypassSecret }
      : undefined,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "node_modules/.bin/next dev",
        url: "http://127.0.0.1:3000/api/health",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
