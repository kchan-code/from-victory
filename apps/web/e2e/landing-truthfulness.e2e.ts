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
 *   - The post-game reset preview card no longer carries a "Coming soon"
 *     badge (FV-225 shipped the feature; FV-394 removed the caveat).
 *   - No journal <textarea> on / — guards against the journal being
 *     re-wired into the landing page while it remains descoped (FV-135). The
 *     waitlist's optional-note field (#w-note) is the one allowed textarea.
 *   - The available-sports labels ("Hockey" and "Basketball") render in the
 *     sport dropdown so the MVP sport set stays truthful.
 *   - The "Other sports — join the waitlist" signal renders, confirming the
 *     non-live sports are not advertised as available.
 *
 * Audience-language guard: asserts no "kid/kids/kiddo/youngster" in the
 * athlete-facing in-app preview region (#app). Scoped to athlete-facing copy
 * by design — the parent-voice founder letter legitimately says "my own kids"
 * (CLAUDE.md scopes the never-"kid" rule to athlete-facing content).
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
    // Word-boundary match so we don't flag "skid"/"kidney"-type substrings.
    expect(
      text.toLowerCase(),
      `Audience-language violation: found "${word}" in ${selector}`,
    ).not.toMatch(new RegExp(`\\b${word}\\b`));
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
  // Post-game reset — shipped, no "coming soon" caveat
  // -------------------------------------------------------------------------

  test("post-game reset preview card has no 'Coming soon' badge (feature is shipped)", async ({
    page,
  }) => {
    // FV-225 shipped the post-game debrief; FV-394 removed the landing-page
    // caveat. If the badge reappears, the app preview would misrepresent a
    // live feature as still in-progress.
    await expect(page.getByTestId("postgame-coming-soon")).toHaveCount(0);
    await expect(
      page.locator("#app").getByText(/coming soon/i),
    ).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // Journal textarea guard (FV-135 descope regression)
  // -------------------------------------------------------------------------

  test("no journal <textarea> on the landing page (journal is descoped from /)", async ({
    page,
  }) => {
    // Journal was descoped from the daily flow (FV-135). A journal textarea on
    // the landing page would mean it was accidentally re-wired. The waitlist's
    // optional-note field (#w-note) is the one legitimate textarea, so we assert
    // there is no OTHER textarea — a re-added journal entry box would trip this.
    const otherTextareas = page.locator("textarea:not(#w-note)");
    await expect(otherTextareas).toHaveCount(0);
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

  test("no audience-language violations in the athlete-facing app preview (#app)", async ({
    page,
  }) => {
    // Scoped to the in-app preview region — the athlete-facing copy on /. The
    // never-"kid" rule is for athlete-facing content; the founder's personal
    // letter ("my own kids") is parent-voice and intentionally not covered.
    await assertNoKidLanguage(page, "#app");
  });
});
