/**
 * practice-flow.e2e.ts — FRO-22
 *
 * Covers the pre-practice "Lock In" flow at /athlete/practice.
 *
 * PRE-FRO-22 (current baseline — 2 screens):
 *   Screen 1 – FocusPickerScreen: 8 presets + custom free-text input.
 *   Screen 2 – PracticeSessionScreen: guided session, focus shown prominently.
 *
 * FRO-22 TARGET (now fully implemented — 4 screens):
 *   Screen 1 – StatePickerScreen: "Dialed in" (default) or "Not feeling it".
 *   Screen 2 – FocusPickerScreen: 7 presets ONLY, no custom input.
 *   Screen 3 – Prayer-style picker: "Pray with me" or "I'll pray on my own".
 *   Screen 4 – PracticeSessionScreen: state-aware audio, focus voiced.
 *
 * Auth: uses signed-in athlete storageState from global-setup (chromium-mobile-athlete project).
 * Audience-language guard: athlete-facing route, asserts no "kid/kids/kiddo/youngster".
 *
 * NOTE: Playwright specs require a running Next.js server.
 *   Cannot be executed headlessly in this env.
 *   Run locally: npx playwright test e2e/practice-flow.e2e.ts
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

// Navigate through State → Focus → Prayer-style pickers, then into the session.
// Used in tests that need to reach the session screen.
async function navigateToSession(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.goto("/athlete/practice");

  // Screen 1: State picker — advance through it.
  const stateNextBtn = page.getByTestId("state-next-btn");
  if ((await stateNextBtn.count()) > 0 && await stateNextBtn.isVisible()) {
    await stateNextBtn.click();
  }

  // Screen 2: Focus picker — select the first preset option and continue.
  const radioGroup = page.locator('[role="radiogroup"][aria-label="Today\'s focus"]');
  await expect(radioGroup).toBeVisible({ timeout: 10_000 });
  await radioGroup.locator('[role="radio"]').first().click();
  await page.getByTestId("start-practice-btn").click();

  // Screen 3: Prayer-style picker — advance to the session.
  await expect(page.getByTestId("prayer-picker-next-btn")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("prayer-picker-next-btn").click();

  // Screen 4: Session.
  await expect(page.getByTestId("practice-focus-display")).toBeVisible();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("Pre-practice flow", () => {
  // --------------------------------------------------------------------------
  // FocusPickerScreen (current baseline — Screen 2 in the 4-screen flow)
  // --------------------------------------------------------------------------

  test.describe("FocusPickerScreen (current baseline)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/athlete/practice");
      // Advance past the state picker to reach the focus picker.
      const stateNextBtn = page.getByTestId("state-next-btn");
      if ((await stateNextBtn.count()) > 0 && await stateNextBtn.isVisible()) {
        await stateNextBtn.click();
      }
      // The focus picker must be visible.
      await expect(
        page.locator('[role="radiogroup"][aria-label="Today\'s focus"]'),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("renders the focus picker radio group", async ({ page }) => {
      const radioGroup = page.locator('[role="radiogroup"][aria-label="Today\'s focus"]');
      await expect(radioGroup).toBeVisible();
    });

    test("focus CONTINUE advances to the prayer picker", async ({ page }) => {
      const radioGroup = page.locator('[role="radiogroup"][aria-label="Today\'s focus"]');
      await radioGroup.locator('[role="radio"]').first().click();
      await page.getByTestId("start-practice-btn").click();
      await expect(page.getByTestId("prayer-picker-next-btn")).toBeVisible();
    });

    test("audience-language guard on focus picker", async ({ page }) => {
      await assertNoKidLanguage(page, "body");
    });
  });

  // --------------------------------------------------------------------------
  // StatePickerScreen (Screen 1)
  // --------------------------------------------------------------------------

  test.describe("[FRO-22] StatePickerScreen — new Screen 1", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/athlete/practice");
    });

    test("renders exactly 2 state options", async ({ page }) => {
      await expect(page.getByTestId("state-option-dialed-in")).toBeVisible();
      await expect(page.getByTestId("state-option-not-feeling-it")).toBeVisible();

      const radioGroup = page.locator('[role="radiogroup"][aria-label="Pre-practice state"]');
      await expect(radioGroup).toBeVisible();
      await expect(radioGroup.locator('[role="radio"]')).toHaveCount(2);
    });

    test('"Dialed in" is pre-selected by default (aria-checked=true)', async ({ page }) => {
      await expect(
        page.getByTestId("state-option-dialed-in"),
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        page.getByTestId("state-option-not-feeling-it"),
      ).toHaveAttribute("aria-checked", "false");
    });

    test("CONTINUE button advances to the focus picker", async ({ page }) => {
      await page.getByTestId("state-next-btn").click();
      await expect(page.getByTestId("start-practice-btn")).toBeVisible();
    });

    test('"Not feeling it" can be selected', async ({ page }) => {
      await page.getByTestId("state-option-not-feeling-it").click();
      await expect(
        page.getByTestId("state-option-not-feeling-it"),
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        page.getByTestId("state-option-dialed-in"),
      ).toHaveAttribute("aria-checked", "false");
    });

    test("audience-language guard on state picker", async ({ page }) => {
      await assertNoKidLanguage(page, "body");
    });
  });

  // --------------------------------------------------------------------------
  // FocusPickerScreen updates (Screen 2 in FRO-22 flow)
  // --------------------------------------------------------------------------

  test.describe("[FRO-22] FocusPickerScreen updates", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/athlete/practice");
      // Navigate through state picker (if present) to focus picker.
      const stateNextBtn = page.getByTestId("state-next-btn");
      if ((await stateNextBtn.count()) > 0 && await stateNextBtn.isVisible()) {
        await stateNextBtn.click();
      }
      await expect(page.getByTestId("start-practice-btn")).toBeVisible({ timeout: 10_000 });
    });

    test("renders exactly 7 focus options (FRO-22: 8→7, 'First' dropped)", async ({ page }) => {
      // This test FAILS until PRACTICE_FOCUS_OPTIONS is trimmed to 7 items.
      const radioGroup = page.locator('[role="radiogroup"][aria-label="Today\'s focus"]');
      await expect(radioGroup.locator('[role="radio"]')).toHaveCount(7);
    });

    test('"First" is not present as a focus option', async ({ page }) => {
      // "First" was dropped in FRO-22.
      await expect(page.getByTestId("focus-option-First")).not.toBeVisible();
    });

    test("custom free-text input is NOT rendered (removed in FRO-22)", async ({ page }) => {
      // FRO-22 removes the custom focus text field so all focuses map to voiced clips.
      // This test FAILS until the CustomInputRow is removed from the focus picker.
      const inputs = page.locator('input[type="text"], textarea');
      await expect(inputs).toHaveCount(0);
    });

    test("Back from focus picker returns to state picker (FRO-22 back nav)", async ({ page }) => {
      // The back button on the FRO-22 focus picker returns to the state picker.
      const backBtn = page.getByRole("button", { name: "Back to state picker" });
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await expect(page.getByTestId("state-next-btn")).toBeVisible();
    });
  });

  // --------------------------------------------------------------------------
  // Prayer-style picker (Screen 3 — new)
  // --------------------------------------------------------------------------

  test.describe("Prayer-style picker", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/athlete/practice");

      // Screen 1: State picker.
      const stateNextBtn = page.getByTestId("state-next-btn");
      if ((await stateNextBtn.count()) > 0 && await stateNextBtn.isVisible()) {
        await stateNextBtn.click();
      }

      // Screen 2: Focus picker — select first option and continue.
      const radioGroup = page.locator('[role="radiogroup"][aria-label="Today\'s focus"]');
      await expect(radioGroup).toBeVisible({ timeout: 10_000 });
      await radioGroup.locator('[role="radio"]').first().click();
      await page.getByTestId("start-practice-btn").click();

      // Screen 3: Prayer-style picker should now be visible.
      await expect(page.getByTestId("prayer-picker-next-btn")).toBeVisible({ timeout: 10_000 });
    });

    test("renders the Closing prayer style radiogroup with exactly 2 buttons", async ({ page }) => {
      // SelectCard renders as <button aria-pressed> — NOT role="radio".
      // Locate buttons scoped within the radiogroup.
      const radioGroup = page.locator('[role="radiogroup"][aria-label="Closing prayer style"]');
      await expect(radioGroup).toBeVisible();
      await expect(radioGroup.locator("button")).toHaveCount(2);
    });

    test("prayer-picker-next-btn advances to the session", async ({ page }) => {
      await page.getByTestId("prayer-picker-next-btn").click();
      await expect(page.getByTestId("practice-focus-display")).toBeVisible();
    });

    test("Back to focus picker button returns to the focus picker", async ({ page }) => {
      const backBtn = page.getByRole("button", { name: "Back to focus picker" });
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await expect(page.getByTestId("start-practice-btn")).toBeVisible();
    });

    test("audience-language guard on prayer picker", async ({ page }) => {
      await assertNoKidLanguage(page, "body");
    });
  });

  // --------------------------------------------------------------------------
  // PracticeSessionScreen (Screen 4)
  // --------------------------------------------------------------------------

  test.describe("PracticeSessionScreen", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToSession(page);
    });

    test("chosen focus text is displayed in the focus display element", async ({ page }) => {
      const focusDisplay = page.getByTestId("practice-focus-display");
      await expect(focusDisplay).toBeVisible();
      const text = await focusDisplay.innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    });

    test("play/pause button is rendered and has an accessible aria-label", async ({ page }) => {
      const playPauseBtn = page.getByTestId("practice-play-pause-btn");
      await expect(playPauseBtn).toBeVisible();
      const label = await playPauseBtn.getAttribute("aria-label");
      expect(label).toBeTruthy();
    });

    test("progress bar is rendered with correct ARIA role and range attributes", async ({ page }) => {
      const progressBar = page.locator('[role="progressbar"]');
      await expect(progressBar).toBeVisible();
      await expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      await expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });

    test("back button returns to the prayer picker", async ({ page }) => {
      await page.getByTestId("practice-back-btn").click();
      await expect(page.getByTestId("prayer-picker-next-btn")).toBeVisible();
    });

    test("audience-language guard on session screen", async ({ page }) => {
      await assertNoKidLanguage(page, "body");
    });
  });

  // --------------------------------------------------------------------------
  // Full 4-screen round-trip
  // state picker → focus picker → prayer picker → session
  //   → back to prayer picker → back to focus picker → back to state
  // --------------------------------------------------------------------------

  test.describe("Full 4-screen round-trip", () => {
    test("state → focus → prayer → session → back to prayer → back to focus → back to state", async ({ page }) => {
      await page.goto("/athlete/practice");

      // Screen 1: State picker.
      await expect(page.getByTestId("state-option-dialed-in")).toBeVisible();
      await page.getByTestId("state-next-btn").click();

      // Screen 2: Focus picker.
      await expect(page.getByTestId("start-practice-btn")).toBeVisible();
      const radioGroup = page.locator('[role="radiogroup"][aria-label="Today\'s focus"]');
      await radioGroup.locator('[role="radio"]').first().click();
      await page.getByTestId("start-practice-btn").click();

      // Screen 3: Prayer-style picker.
      await expect(page.getByTestId("prayer-picker-next-btn")).toBeVisible();
      await page.getByTestId("prayer-picker-next-btn").click();

      // Screen 4: Session.
      await expect(page.getByTestId("practice-focus-display")).toBeVisible();

      // Back to prayer picker.
      await page.getByTestId("practice-back-btn").click();
      await expect(page.getByTestId("prayer-picker-next-btn")).toBeVisible();

      // Back to focus picker.
      await page.getByRole("button", { name: "Back to focus picker" }).click();
      await expect(page.getByTestId("start-practice-btn")).toBeVisible();

      // Back to state picker.
      await page.getByRole("button", { name: "Back to state picker" }).click();
      await expect(page.getByTestId("state-next-btn")).toBeVisible();
      await expect(page.getByTestId("state-option-dialed-in")).toBeVisible();
    });
  });
});
