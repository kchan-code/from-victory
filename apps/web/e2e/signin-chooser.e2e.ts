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

const RESTRICTED_SHELL_UAS = [
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 FVNativeShell/1",
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 FVNativeShell/1 (play)",
] as const;

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
    // "Email" is a substring of the athlete field's "Username or email".
    // Both inputs are in the DOM, so the locator must be exact.
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await page.getByTestId("signin-tab-athlete").click();
    await expect(
      page.getByLabel("Username or email", { exact: true }),
    ).toBeVisible();
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

  test("restricted shell user agent shows the welcome doors and no price or trial line", async ({
    browser,
  }) => {
    for (const userAgent of RESTRICTED_SHELL_UAS) {
      const context = await browser.newContext({
        userAgent,
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      try {
        await page.goto("/signin");
        await expect(
          page.getByRole("heading", { name: "Welcome", exact: true }),
        ).toBeVisible();
        await expect(page.getByTestId("signin-door-parent")).toHaveAttribute(
          "href",
          "/signup",
        );
        await expect(page.getByTestId("signin-have-invite")).toHaveAttribute(
          "href",
          "/invite",
        );
        await expect(page.getByTestId("signin-door-adult")).toHaveCount(0);
        const doors = page.locator("a");
        const hrefs = await doors.evaluateAll((els) =>
          els.map((el) => el.getAttribute("href") ?? ""),
        );
        expect(hrefs.some((href) => /subscribe|checkout|stripe/i.test(href))).toBe(
          false,
        );

        await page.goto("/signup");
        const signup = (await page.locator("#main-content").innerText()).toLowerCase();
        expect(signup).not.toMatch(/\$\d/);
        expect(signup).not.toContain("7 days");
        expect(signup).not.toContain("14 days");
        expect(signup).not.toContain("free trial");
        await expect(page.getByTestId("signup-ios-subscription-note")).toHaveCount(0);
      } finally {
        await context.close();
      }
    }
  });

  test("ios shell signup points at the in-app subscription step without a web price", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) FVNativeShell/1 (ios)",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    try {
      await page.goto("/signup");
      await expect(page.getByTestId("signup-ios-subscription-note")).toHaveText(
        "After you create your account, you choose a subscription in the app.",
      );
      const signup = await page.locator("#main-content").innerText();
      expect(signup).not.toMatch(/\$\d/);
      expect(signup.toLowerCase()).not.toContain("card required");
      expect(signup.toLowerCase()).not.toContain("7 days");
      expect(signup.toLowerCase()).not.toContain("14 days");
    } finally {
      await context.close();
    }
  });

  test("sign-in fields are at least 16px and zoom stays enabled", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/signin");
    await page.getByTestId("signin-show-form").click();
    const email = page.getByLabel("Email", { exact: true });
    const password = page.getByLabel("Password", { exact: true });
    for (const field of [email, password]) {
      const size = await field.evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize),
      );
      expect(size).toBeGreaterThanOrEqual(16);
    }
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute("content") ?? "";
    });
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no/i);
    expect(viewport).not.toMatch(/maximum-scale\s*=\s*1(?:\.0+)?(?:\s|,|$)/i);
    await email.focus();
    const scale = await page.evaluate(() => window.visualViewport?.scale ?? 1);
    expect(scale).toBeLessThanOrEqual(1.01);
  });
});
