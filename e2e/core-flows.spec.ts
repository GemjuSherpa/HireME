import { expect, test } from "@playwright/test";
test("candidate can discover the value proposition and begin onboarding", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Stop chasing jobs/i })).toBeVisible();
  await page.getByRole("link", { name: /Build my profile/i }).click();
  await expect(page.getByRole("heading", { name: "What do you do best?" })).toBeVisible();
});
test("candidate dashboard presents matches and invitation", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Strong matches", { exact: true })).toBeVisible();
  await expect(page.getByText("Lead Product Designer", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/invited to meet Greenly/i)).toBeVisible();
});
test("recruiter sees autonomous agent result and pipeline", async ({ page }) => {
  await page.goto("/recruiter");
  await expect(page.getByText(/shortlist is ready/i)).toBeVisible();
  await expect(page.getByText("Recommended talent")).toBeVisible();
});
