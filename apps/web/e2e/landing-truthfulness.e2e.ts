/**
 * landing-truthfulness.e2e.ts — FV-241
 *
 * Lightweight regression guards that keep marketing claims on the landing
 * page (/) honest. These are NOT product-feature tests — they assert the
 * presence or absence of specific copy/UI elements whose absence would
 * signal a truthfulness regression.
 *
 * Auth: none — the landing page is fully public.
 *
 * What this pins:
 *   - The post-game "Coming soon" badge is present so the feature is never
 *     silently promoted as shipped before it is.
 *   - No <textarea> anywhere on / — guards against the journal being
 *     re-wired into the landing page while it remains descoped (FV-135).
 *   - The available-sports labels ("Hockey" and "Basketball") render in the
 *     sport dropdown so the MVP sport set stays truthful.
 *   - The "Other sports — join the waitlist" signal renders, confirming the
 *     non-live sports are not advertised as available.
 *
 * Audience-language guard: asserts no "kid/kids/kiddo/youngster" on the
 * full page body.
 *
 * NOTE: Playwright specs require a running Next.js server.
 *   Cannot be executed headlessly in this env without one.
 *   Run locally: npx playwright test e2e/landing-truthfulness.e2e.ts
 */

import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function assertNoKidLanguage(
  page: import("@playwright/test").Page,
  selector: string,
): Promise<void> {
  const text = await page.locator(selector).innerText().catch(() => "");
  const forbidden = ["kid", "kids", "kiddo", "youngster"];
  for (const word of forbidden) {
    expect(
      text.toLowerCase(),
      `Audience-language violation: found "${word}" in ${selector}`,
    ).not.toContain(word);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Landing page — truthfulness regression guards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the main content to be present before making assertions.
    await expect(page.locator("main, body")).toBeAttached();
  });

  // -------------------------------------------------------------------------
  // Post-game coming-soon badge
  // -------------------------------------------------------------------------

  test("post-game 'Coming soon' badge is present (feature not yet shipped)", async ({
    page,
  }) => {
    // The badge signals this feature is in-progress. If the badge disappears
    // without the feature shipping, the landing page silently drops the caveat.
    const badge = page.getByTestId("postgame-coming-soon");
    await expect(badge).toBeVisible();
    // Text should communicate the "coming soon" state — not a shipped CTA.
    const text = await badge.innerText();
    expect(text.trim().toLowerCase()).toContain("coming soon");
  });

  // -------------------------------------------------------------------------
  // Journal textarea guard (FV-135 descope regression)
  // -------------------------------------------------------------------------

  test("no <textarea> on the landing page (journal is descoped from /)", async ({
    page,
  }) => {
    // Journal was descoped from the daily flow (FV-135). A textarea on the
    // landing page would mean the journal was accidentally re-wired, or a
    // new unreviewed textarea was added. Both require intentional review.
    const textareas = page.locator("textarea");
    await expect(textareas).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // Available-sports labels
  // -------------------------------------------------------------------------

  test("sport dropdown shows Hockey and Basketball as available now", async ({
    page,
  }) => {
    // The waitlist form sport dropdown is the canonical place where sport
    // availability is communicated. These labels confirm the MVP live set.
    const hockeyOption = page.locator('option[value="Hockey"]');
    const basketballOption = page.locator('option[value="Basketball"]');

    await expect(hockeyOption).toBeAttached();
    await expect(basketballOption).toBeAttached();

    // The label text must explicitly say "available now" so visitors are not
    // misled about which sports they can access today.
    const hockeyLabel = await hockeyOption.innerText();
    expect(hockeyLabel.toLowerCase()).toContain("available now");

    const basketballLabel = await basketballOption.innerText();
    expect(basketballLabel.toLowerCase()).toContain("available now");
  });

  test("waitlist section signals that other sports are not yet live", async ({
    page,
  }) => {
    // At least one "coming soon" or "join the waitlist" signal must exist for
    // non-live sports so visitors with other sports are not misled.
    const waitlistSection = page.locator("#waitlist");
    await expect(waitlistSection).toBeVisible();

    // The bullet text "Other sports — join the waitlist" (or similar) must render.
    await expect(
      waitlistSection.getByText(/other sports/i),
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Audience-language guard
  // -------------------------------------------------------------------------

  test("no audience-language violations on the landing page body", async ({
    page,
  }) => {
    await assertNoKidLanguage(page, "body");
  });
});
