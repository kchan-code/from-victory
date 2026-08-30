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
 *     re-wired into the landing page while it remains descoped (FV-135).
 *     FV-517 also removed the waitlist's optional-note textarea, so there is
 *     now no legitimate textarea on the page at all.
 *   - FV-517: the waitlist sport dropdown lists only non-live sports
 *     (Swimming, Wrestling, Volleyball, Track & field, Tennis, Other) — no
 *     live sport (hockey, basketball, golf, football, baseball, lacrosse,
 *     soccer) appears as a selectable waitlist option, since those sports
 *     are not waitlisted, they're live today.
 *   - The "Other sports — join the waitlist" signal renders, confirming the
 *     non-live sports are not advertised as available.
 *   - A visitor arriving with a live-sport URL param (?sport=hockey) sees a
 *     routing notice to the trial instead of a preselected live sport.
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
    // the landing page would mean it was accidentally re-wired. FV-517 removed
    // the waitlist's optional-note field too, so there should be NO textarea
    // anywhere on the page — a re-added journal entry box (or a re-added note
    // field) would trip this.
    const textareas = page.locator("textarea");
    await expect(textareas).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // Waitlist sport dropdown — non-live sports only (FV-517)
  // -------------------------------------------------------------------------

  test("waitlist sport dropdown lists only non-live sports, no live sport is selectable", async ({
    page,
  }) => {
    // FV-517: the waitlist is for sports that are NOT yet live. A live sport
    // appearing here (still offering to "notify" for a sport that already
    // ships) would misrepresent availability.
    const liveSports = [
      "Hockey",
      "Basketball",
      "Golf",
      "Football",
      "Baseball",
      "Lacrosse",
      "Soccer",
    ];
    const sportSelect = page.locator("#w-sport");
    await expect(sportSelect).toBeVisible();

    for (const sport of liveSports) {
      await expect(sportSelect.locator(`option[value="${sport}"]`)).toHaveCount(0);
    }

    const nonLiveSports = [
      "Swimming",
      "Wrestling",
      "Volleyball",
      "Track & field",
      "Tennis",
      "Other",
    ];
    for (const sport of nonLiveSports) {
      await expect(sportSelect.locator(`option[value="${sport}"]`)).toBeAttached();
    }

    // No default selection — the placeholder option is selected, disabled,
    // and has an empty value, forcing an explicit choice.
    const selectedValue = await sportSelect.inputValue();
    expect(selectedValue).toBe("");
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

  test("arriving with a live-sport param routes to the trial instead of the waitlist select", async ({
    page,
  }) => {
    // FV-517: a visitor arriving with ?sport=hockey (a live sport) should not
    // see it preselected in a dropdown that no longer offers it — instead the
    // form area shows a routing notice pointing to the trial signup.
    await page.goto("/?sport=hockey#waitlist");
    const waitlistSection = page.locator("#waitlist");
    await expect(waitlistSection).toBeVisible();
    await expect(
      waitlistSection.getByText(/available now/i),
    ).toBeVisible();
    await expect(
      waitlistSection.getByRole("link", {
        name: /start your athlete.s 14-day free trial/i,
      }).first(),
    ).toHaveAttribute("href", "/signup");
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
