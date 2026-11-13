/**
 * signin-chooser.e2e.ts — FV-707 / FV-708
 *
 * Public, signed-out screens. CI does not set ENABLE_ADULT_SIGNUP, so the
 * 18+ door and /signup/athlete stay closed here. The flag-on path is covered
 * by the Vitest page tests.
 *
 * Auth: none.
 */
import { expect, test } from "@playwright/test";

test.describe("Signed-out welcome doors", () => {
  test("Welcome chooser routes parent and invite, and hides 18+ when the flag is off", async ({
    page,
  }) => {
    await page.goto("/signin");
    await expect(
      page.getByRole("heading", { name: "Welcome", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Welcome back/i }),
    ).toHaveCount(0);
    await expect(page.getByText("How will you use From Victory?")).toBeVisible();

    await expect(page.getByTestId("signin-door-parent")).toHaveAttribute(
      "href",
      "/signup",
    );
    await expect(page.getByTestId("signin-have-invite")).toHaveAttribute(
      "href",
      "/invite",
    );
    await expect(page.getByTestId("signin-door-adult")).toHaveCount(0);

    await page.getByTestId("signin-show-form").click();
    await expect(page.getByLabel("Email")).toBeVisible();
    await page.getByTestId("signin-tab-athlete").click();
    await expect(page.getByLabel("Username or email")).toBeVisible();
  });

  test("parent signup says 7 days and has no 18+ card when the flag is off", async ({
    page,
  }) => {
    await page.goto("/signup");
    await expect(
      page.getByText("7 days free, then $5/mo or $49/yr."),
    ).toBeVisible();
    await expect(page.getByText("Cancel anytime.")).toBeVisible();
    await expect(page.getByText(/14 days/i)).toHaveCount(0);
    await expect(page.getByText(/Are you the athlete/i)).toHaveCount(0);
    await expect(page.getByTestId("signup-adult-entry")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Create parent account" }),
    ).toBeVisible();
  });

  test("adult signup route is closed when the flag is off", async ({ page }) => {
    const response = await page.goto("/signup/athlete");
    expect(response?.status()).toBe(404);
  });
});
