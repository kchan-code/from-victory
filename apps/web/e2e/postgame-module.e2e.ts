/**
 * postgame-module.e2e.ts — FV-225
 *
 * Covers the post-game debrief module page at /athlete/postgame/[slug].
 *
 * Auth: signed-in athlete storageState from global-setup
 *   (chromium-mobile-athlete project). The test athlete is seeded with
 *   sport: "hockey", so hockey slugs render and basketball slugs 404.
 *
 * What this pins:
 *   - A valid module for the athlete's sport renders (article + scripture).
 *   - The CrisisFooter is ALWAYS present, with the live 988 resources — the
 *     safety-critical invariant. A future edit that drops it fails here.
 *   - The "When you're ready" forward-action box holds EXACTLY ONE link
 *     (Tomorrow's reset). The duplicate "Talk to someone — 988" link was
 *     removed because the footer already covers crisis resources; this guards
 *     against it creeping back in.
 *   - The sport guard 404s cross-sport slugs and unknown slugs (no DB writes,
 *     no leaking which slugs exist for other sports).
 *
 * Audience-language guard: athlete-facing route — asserts no
 *   "kid/kids/kiddo/youngster" in rendered copy.
 *
 * Zero athlete-data writes: the page stamps nothing, so no cleanup is needed.
 */

import { expect, test } from "@playwright/test";

// The test athlete is seeded as hockey (see e2e/global-setup.ts).
const HOCKEY_SLUG = "hockey-the-loss"; // → "After the Loss" (The Loss)
const CROSS_SPORT_SLUG = "basketball-the-loss"; // valid basketball slug, wrong sport
const UNKNOWN_SLUG = "nonexistent-postgame-slug";

// Helper: assert no kid-language on a selector.
async function assertNoKidLanguage(
  page: import("@playwright/test").Page,
  selector: string,
): Promise<void> {
  const text = await page
    .locator(selector)
    .innerText()
    .catch(() => "");
  const forbidden = ["kid", "kids", "kiddo", "youngster"];
  for (const word of forbidden) {
    expect(
      text.toLowerCase(),
      `Audience-language violation: found "${word}" in ${selector}`,
    ).not.toContain(word);
  }
}

test.describe("Post-game debrief module", () => {
  test.describe("valid module for the athlete's sport", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/athlete/postgame/${HOCKEY_SLUG}`);
      // Authed athlete with a selected sport — must land on the module, not a
      // redirect to /signin or /athlete/onboarding/sport.
      await expect(page).toHaveURL(
        new RegExp(`/athlete/postgame/${HOCKEY_SLUG}$`),
      );
    });

    test("renders the module article and scripture block", async ({ page }) => {
      await expect(page.getByTestId("postgame-module-article")).toBeVisible();
      await expect(page.getByTestId("postgame-scripture-block")).toBeVisible();
      // Title is rendered as the h2 inside the article.
      await expect(
        page.getByRole("heading", { level: 2, name: "After the Loss" }),
      ).toBeVisible();
    });

    test("always shows the crisis footer with the live 988 resources", async ({
      page,
    }) => {
      const footer = page.getByTestId("crisis-footer");
      await expect(footer).toBeVisible();
      // The actionable resources must be present — not just the container.
      await expect(
        footer.getByText("988 Suicide & Crisis Lifeline"),
      ).toBeVisible();
      await expect(footer.locator('a[href="tel:988"]')).toBeVisible();
      await expect(footer.locator('a[href="sms:741741?body=HOME"]')).toBeVisible();
    });

    test('the "When you\'re ready" box holds only the Tomorrow\'s reset link', async ({
      page,
    }) => {
      const box = page.getByTestId("postgame-forward-action");
      await expect(box).toBeVisible();

      // The daily-session link is present...
      await expect(page.getByTestId("postgame-daily-link")).toBeVisible();

      // ...and is the SOLE interactive element in the box (dedupe invariant).
      await expect(box.locator("a, button")).toHaveCount(1);

      // The removed "Talk to someone — 988" link must not reappear here.
      await expect(page.getByTestId("postgame-talk-link")).toHaveCount(0);
      await expect(box.getByText("Talk to someone")).toHaveCount(0);
    });

    test("audience-language guard on the module body", async ({ page }) => {
      await assertNoKidLanguage(page, "body");
    });
  });

  test.describe("sport guard + unknown slug", () => {
    // NOTE: these assert a true HTTP 404 from `notFound()`. That requires the
    // production server (`next build && next start`) — which is how CI and the
    // Playwright `webServer` run on CI. Under `next dev` the status can come
    // back 200 with the not-found UI rendered; run locally with CI=true (prod
    // build) to reproduce the CI behavior.
    test("404s a valid slug for a different sport", async ({ page }) => {
      const res = await page.goto(`/athlete/postgame/${CROSS_SPORT_SLUG}`, {
        waitUntil: "domcontentloaded",
      });
      expect(res?.status()).toBe(404);
      // Module content for the other sport must not render.
      await expect(page.getByTestId("postgame-module-article")).toHaveCount(0);
    });

    test("404s an unknown slug", async ({ page }) => {
      const res = await page.goto(`/athlete/postgame/${UNKNOWN_SLUG}`, {
        waitUntil: "domcontentloaded",
      });
      expect(res?.status()).toBe(404);
      await expect(page.getByTestId("postgame-module-article")).toHaveCount(0);
    });
  });
});
