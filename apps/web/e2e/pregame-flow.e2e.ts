/**
 * pregame-flow.e2e.ts — FV-345
 *
 * Browser-level analogue of the jsdom unit guard in
 * components/pregame/__tests__/preset-only-screens.test.tsx.
 *
 * Goal: assert that the pregame setup screens for Hard Moment (Step 05),
 * Reset Anchor (Step 06), and Self-Talk (Step 07) render ZERO free-text
 * inputs after FV-343 made them preset-only.
 *
 * Secondary: audience-language guard on the athlete-facing route — no
 * "kid/kids/kiddo/youngster" in user-visible text.
 *
 * Auth: uses signed-in athlete storageState from global-setup
 *   (chromium-mobile-athlete project). The seeded athlete is sport: "hockey".
 *
 * NOTE: Playwright specs require a running Next.js server + Supabase.
 *   Cannot be executed headlessly in this env without those services.
 *   Run locally: npx playwright test e2e/pregame-flow.e2e.ts
 *
 * Scope (FV-345): the ONLY assertions that matter for this issue are the
 * "no free-text input" guards on Steps 05–07. Full-flow coverage and back-
 * navigation for the pregame is intentionally out of scope (follow-up issue).
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

/**
 * Advance past the Breath threshold step robustly.
 *
 * BreathScreen hides the global BottomBar (hideBottomBar: true). The screen
 * renders an "Already settled" text button that fires markDone() immediately,
 * bypassing the three-round breathing timer. After markDone(), the screen
 * re-renders with an inline "SET MY FOCUS" Button that calls onContinue().
 *
 * This approach is equivalent to what we do in practice-flow.e2e.ts for the
 * state picker: conditionally click if present. We do NOT use waitForTimeout.
 */
async function skipBreathStep(
  page: import("@playwright/test").Page,
): Promise<void> {
  // The "Already settled" skip link skips the breathing timer.
  const skipBtn = page.getByRole("button", { name: "Already settled" });
  await expect(skipBtn).toBeVisible({ timeout: 10_000 });
  await skipBtn.click();

  // After skip, the screen flips to "Body's ready." state and shows the
  // inline "SET MY FOCUS" CTA (part of BreathScreen, not the BottomBar).
  const setFocusBtn = page.getByRole("button", { name: "SET MY FOCUS" });
  await expect(setFocusBtn).toBeEnabled({ timeout: 5_000 });
  await setFocusBtn.click();
}

/**
 * Advance past Today's Focus (Step 02).
 *
 * TodaysFocusScreen renders a row of SelectChip buttons (aria-pressed chips).
 * We pick the first one and click the BottomBar CONTINUE button.
 * The sport config for the seeded hockey athlete is used; chip text doesn't
 * matter — any selection enables the Continue button.
 */
async function completeTodaysFocus(
  page: import("@playwright/test").Page,
): Promise<void> {
  // Wait for focus chips to appear (sport-keyed, so wait for at least one).
  const firstChip = page
    .locator('[aria-pressed]')
    .filter({ hasText: /.+/ })
    .first();
  await expect(firstChip).toBeVisible({ timeout: 10_000 });
  await firstChip.click();

  // CONTINUE in the BottomBar is enabled once a chip is selected.
  const continueBtn = page.getByRole("button", { name: "CONTINUE" });
  await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
  await continueBtn.click();
}

/**
 * Advance past Position (Step 03).
 *
 * PositionScreen renders role buttons as plain <button aria-pressed>. For the
 * seeded hockey athlete the roles are Forward / Defense / Goalie (3-column
 * grid). Pick the first visible one and continue.
 */
async function completePosition(
  page: import("@playwright/test").Page,
): Promise<void> {
  // Confirm we're on the Position step. The heading interpolates the
  // sport's roleLabel and uses a curly apostrophe ("What's your position
  // today?"), so anchor on the stable "Step 03" SectionLabel instead.
  await expect(
    page.getByText(/Step 03/),
  ).toBeVisible({ timeout: 10_000 });

  // Pick the first role chip (any will do — we just need canAdvance = true).
  const firstRole = page
    .locator('button[aria-pressed]')
    .first();
  await expect(firstRole).toBeVisible({ timeout: 5_000 });
  await firstRole.click();

  const continueBtn = page.getByRole("button", { name: "CONTINUE" });
  await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
  await continueBtn.click();
}

/**
 * Advance past Positive Plays (Step 04).
 *
 * PositivePlaysScreen requires ≥1 selection (canAdvance = positivePlays.length > 0).
 * Chips render as SelectChip (aria-pressed). Pick the first one.
 *
 * Note: this step only renders when the sport has positive plays for the
 * selected role. The seeded hockey athlete with role Forward has plays. If the
 * step is skipped by the flow router (no positive plays for the sport/role),
 * this function will time out — handled by the test harness. For the hockey
 * seed, it will be present.
 */
async function completePositivePlays(
  page: import("@playwright/test").Page,
): Promise<void> {
  // SectionLabel contains "Positive Play" or sport-keyed equivalent.
  // Use the "Pick at least one" eyebrow which is shown when nothing is selected.
  await expect(
    page.getByText("Pick at least one"),
  ).toBeVisible({ timeout: 10_000 });

  const firstChip = page
    .locator('button[aria-pressed="false"]')
    .first();
  await expect(firstChip).toBeVisible({ timeout: 5_000 });
  await firstChip.click();

  const continueBtn = page.getByRole("button", { name: "CONTINUE" });
  await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
  await continueBtn.click();
}

/**
 * Navigate the flow from the pregame start screen through to a target step.
 *
 * The pregame flow for a hockey athlete (with positive plays for Forward) is:
 *   start → breath → todaysFocus → position → positivePlays →
 *   hardMoment (Step 05) → resetAnchor (Step 06) → selfTalk (Step 07) → …
 *
 * This helper lands the test on the HARD MOMENT screen.
 */
async function navigateToHardMoment(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.goto("/athlete/pregame");

  // Start screen — click BEGIN (no testid; the Button variant="coach" renders
  // as a plain <button> with text "BEGIN" wrapped in a div[data-coachmark]).
  const beginBtn = page.getByRole("button", { name: "BEGIN" });
  await expect(beginBtn).toBeVisible({ timeout: 10_000 });
  await beginBtn.click();

  // Step 01: Breath — skip the breathing timer.
  await skipBreathStep(page);

  // Step 02: Today's Focus.
  await completeTodaysFocus(page);

  // Step 03: Position (hockey has roles).
  await completePosition(page);

  // Step 04: Positive Plays (hockey Forward has plays).
  await completePositivePlays(page);

  // We are now on Step 05 · Hard Moment.
  await expect(
    page.getByText("Rehearse the hard moment."),
  ).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("Pregame setup screens are preset-only (FV-343)", () => {
  // --------------------------------------------------------------------------
  // Audience-language guard — athlete-facing route
  // --------------------------------------------------------------------------

  test("audience-language guard on /athlete/pregame start screen", async ({ page }) => {
    await page.goto("/athlete/pregame");
    await expect(page.getByRole("button", { name: "BEGIN" })).toBeVisible({
      timeout: 10_000,
    });
    await assertNoKidLanguage(page, "body");
  });

  // --------------------------------------------------------------------------
  // Step 05 · Hard Moment — no free-text input
  // --------------------------------------------------------------------------

  test.describe("Step 05 · Hard Moment", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToHardMoment(page);
    });

    test("renders no free-text input (FV-343)", async ({ page }) => {
      // The full selector mirrors the practice-flow precedent at line ~192:
      //   'input[type="text"], textarea'
      // Hard Moment shows SelectChip buttons (aria-pressed pills) — never a
      // free-text field. This assertion is the primary FV-343 contract.
      const freeTextInputs = page.locator('input[type="text"], textarea');
      await expect(freeTextInputs).toHaveCount(0);
    });

    test("CONTINUE is disabled until an adversity is selected", async ({ page }) => {
      const continueBtn = page.getByRole("button", { name: "CONTINUE" });
      await expect(continueBtn).toBeDisabled();
    });

    test("picking an adversity chip enables CONTINUE", async ({ page }) => {
      // Any SelectChip (aria-pressed pill) works. Pick the first visible one.
      const firstChip = page.locator('button[aria-pressed="false"]').first();
      await expect(firstChip).toBeVisible({ timeout: 5_000 });
      await firstChip.click();

      const continueBtn = page.getByRole("button", { name: "CONTINUE" });
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
    });

    test("audience-language guard on Hard Moment screen", async ({ page }) => {
      await assertNoKidLanguage(page, "body");
    });
  });

  // --------------------------------------------------------------------------
  // Step 06 · Reset Anchor — no free-text input
  // --------------------------------------------------------------------------

  test.describe("Step 06 · Reset Anchor", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to Hard Moment, then pick an adversity and continue to Anchor.
      await navigateToHardMoment(page);

      // Pick the first adversity chip.
      const firstChip = page.locator('button[aria-pressed="false"]').first();
      await expect(firstChip).toBeVisible({ timeout: 5_000 });
      await firstChip.click();

      const continueBtn = page.getByRole("button", { name: "CONTINUE" });
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
      await continueBtn.click();

      // Confirm we're on Reset Anchor.
      await expect(
        page.getByText("Choose your reset anchor."),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("renders no free-text input (FV-343)", async ({ page }) => {
      // ResetAnchorScreen renders a grid of preset anchor buttons plus an
      // optional legacy-anchor read-only note (FV-344). Neither the grid nor
      // the note introduces a text input.
      const freeTextInputs = page.locator('input[type="text"], textarea');
      await expect(freeTextInputs).toHaveCount(0);
    });

    test("CONTINUE is disabled until an anchor is selected", async ({ page }) => {
      const continueBtn = page.getByRole("button", { name: "CONTINUE" });
      await expect(continueBtn).toBeDisabled();
    });

    test("picking an anchor chip enables CONTINUE", async ({ page }) => {
      // Anchor buttons are plain <button aria-pressed> chips (not SelectChip,
      // but same pattern). Pick the first.
      const firstAnchor = page.locator('button[aria-pressed="false"]').first();
      await expect(firstAnchor).toBeVisible({ timeout: 5_000 });
      await firstAnchor.click();

      const continueBtn = page.getByRole("button", { name: "CONTINUE" });
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
    });

    test("audience-language guard on Reset Anchor screen", async ({ page }) => {
      await assertNoKidLanguage(page, "body");
    });
  });

  // --------------------------------------------------------------------------
  // Step 07 · Self-Talk — no free-text input
  // --------------------------------------------------------------------------

  test.describe("Step 07 · Self-Talk", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to Hard Moment, pick adversity → Anchor, pick anchor → Self-Talk.
      await navigateToHardMoment(page);

      // Hard Moment: pick first adversity.
      let firstChip = page.locator('button[aria-pressed="false"]').first();
      await expect(firstChip).toBeVisible({ timeout: 5_000 });
      await firstChip.click();
      let continueBtn = page.getByRole("button", { name: "CONTINUE" });
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
      await continueBtn.click();

      // Reset Anchor: wait for the screen, pick first anchor.
      await expect(
        page.getByText("Choose your reset anchor."),
      ).toBeVisible({ timeout: 10_000 });
      firstChip = page.locator('button[aria-pressed="false"]').first();
      await expect(firstChip).toBeVisible({ timeout: 5_000 });
      await firstChip.click();
      continueBtn = page.getByRole("button", { name: "CONTINUE" });
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
      await continueBtn.click();

      // Confirm we're on Self-Talk.
      await expect(
        page.getByText("Coach yourself like someone you trust would coach you."),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("renders no free-text input (FV-343)", async ({ page }) => {
      // SelfTalkScreen renders SelectCard buttons (aria-pressed large cards)
      // and optionally a read-only quote block when a phrase is selected.
      // No text inputs are present.
      const freeTextInputs = page.locator('input[type="text"], textarea');
      await expect(freeTextInputs).toHaveCount(0);
    });

    test("CONTINUE is disabled until a self-talk phrase is selected", async ({ page }) => {
      const continueBtn = page.getByRole("button", { name: "CONTINUE" });
      await expect(continueBtn).toBeDisabled();
    });

    test("picking a self-talk phrase enables CONTINUE", async ({ page }) => {
      // SelfTalkScreen uses SelectCard (aria-pressed buttons, full-width).
      const firstCard = page.locator('button[aria-pressed="false"]').first();
      await expect(firstCard).toBeVisible({ timeout: 5_000 });
      await firstCard.click();

      const continueBtn = page.getByRole("button", { name: "CONTINUE" });
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
    });

    test("audience-language guard on Self-Talk screen", async ({ page }) => {
      await assertNoKidLanguage(page, "body");
    });
  });
});
