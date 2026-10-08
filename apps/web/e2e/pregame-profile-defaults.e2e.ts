/**
 * pregame-profile-defaults.e2e.ts — FV-253 (integration with the FV-508 harness)
 *
 * Real-RPC proof of the FV-253 pregame pre-selection against the disposable
 * CI Supabase stack: the seeded athlete's `profiles.position` /
 * `profiles.focus_area` are written with the service-role client, and the
 * app reads them back through the SECURITY DEFINER `get_own_personalization()`
 * RPC (FV-361 grant hardening — the browser client has no column SELECT on
 * those two columns). No mock anywhere in this file.
 *
 * Fixture discipline: this spec MUTATES the shared seeded athlete's two quiz
 * columns and RESTORES them to null in afterAll (the seed default), so every
 * other spec keeps seeing the pre-FV-253 "nothing pre-selected" state. Specs
 * run one file at a time on a single worker (fullyParallel: false, workers: 1
 * on CI) — it is that single-worker completion guarantee (beforeAll → tests →
 * afterAll before the next file starts), not file order, that protects the
 * other specs — and each test gets a fresh context from
 * athlete.storageState.json, so localStorage never leaks between tests either. Position values used here ("Goalie", "Forward",
 * "Guard") are all in the DB CHECK union (migration 20260613010000) — "Guard"
 * is deliberately a BASKETBALL role, i.e. DB-valid but invalid for the seeded
 * hockey athlete.
 *
 * Auth: chromium-mobile-athlete project (signed-in athlete storageState).
 * The seeded athlete is sport: "hockey".
 */

import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// Playwright forbids importing a test file (global-setup.ts is the "setup"
// project's test) from a spec, so the seeded athlete's email is repeated here.
// KEEP IN SYNC with TEST_ATHLETE_EMAIL in e2e/global-setup.ts.
const TEST_ATHLETE_EMAIL = "e2e-athlete@athletes.fromvictory.app";

// ---------------------------------------------------------------------------
// Service-role fixture control (server-side only; never reaches the browser)
// ---------------------------------------------------------------------------

function serviceClient() {
  const url = process.env.E2E_SUPABASE_URL ?? "";
  const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let athleteId = "";

async function resolveAthleteId(): Promise<string> {
  const service = serviceClient();
  // auth.users is the source of truth for the seeded email → id mapping.
  const { data, error } = await service.auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(`[fv253-e2e] listUsers failed: ${error.message}`);
  const user = data.users.find((u) => u.email === TEST_ATHLETE_EMAIL);
  if (!user) throw new Error(`[fv253-e2e] seeded athlete ${TEST_ATHLETE_EMAIL} not found`);
  return user.id;
}

async function setQuiz(position: string | null, focusArea: string | null): Promise<void> {
  const service = serviceClient();
  const { error } = await service
    .from("profiles")
    .update({ position, focus_area: focusArea })
    .eq("id", athleteId);
  if (error) throw new Error(`[fv253-e2e] profiles update failed: ${error.message}`);
  // Read back through the same service path so a silent no-op write can't
  // pass as "seeded".
  const { data, error: readError } = await service
    .from("profiles")
    .select("position, focus_area")
    .eq("id", athleteId)
    .single();
  if (readError) throw new Error(`[fv253-e2e] profiles read-back failed: ${readError.message}`);
  expect(data).toEqual({ position, focus_area: focusArea });
}

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

/**
 * Dismiss the first-run coachmark tour if it renders. Its backdrop
 * (animate-coachmark-fade-in) intercepts pointer events on the start-screen
 * buttons, so this must run after every load of the start screen — including
 * a reload, where CI showed the tour again (first run of the E2E context).
 */
async function dismissCoachmark(page: Page): Promise<void> {
  const skipTour = page.getByTestId("coachmark-skip-btn");
  // CoachmarkTour paints nothing until its anchor measurement fires
  // (setTimeout ~200ms), so an instant isVisible() check races it. Wait a
  // bounded moment for the tour to mount; if it never does, move on.
  await skipTour.waitFor({ state: "visible", timeout: 1_500 }).catch(() => null);
  if (await skipTour.isVisible().catch(() => false)) {
    await skipTour.click();
    await expect(skipTour).toBeHidden();
  }
  await expect(page.locator(".animate-coachmark-fade-in")).toHaveCount(0);
}

/** Open the pregame start screen; dismiss the first-run coachmark tour if it renders. */
async function openPregameStart(page: Page): Promise<void> {
  await page.goto("/athlete/pregame");
  await expect(page.getByTestId("set-up-for-later-btn")).toBeVisible({ timeout: 15_000 });
  await dismissCoachmark(page);
}

/** Enter the prepare-ahead flow — its first step is Today's Focus (no breath timer). */
async function openPrepareFlow(page: Page): Promise<void> {
  await openPregameStart(page);
  await page.getByTestId("set-up-for-later-btn").click();
  await expect(page.getByText(/Step 02/)).toBeVisible({ timeout: 10_000 });
}

const chip = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const continueBtn = (page: Page) =>
  page.getByRole("button", { name: "CONTINUE", exact: true });

async function expectPressed(page: Page, name: string, pressed: boolean): Promise<void> {
  await expect(chip(page, name)).toHaveAttribute("aria-pressed", String(pressed));
}

const HOCKEY_NEEDS = [
  "Confidence",
  "Calm",
  "Compete level",
  "Reset after mistakes",
  "Physical courage",
  "Better puck decisions",
  "Leadership",
  "Joy",
  "Hope",
  "Be more Vocal",
];
const HOCKEY_ROLES = ["Forward", "Defense", "Goalie"];

/**
 * Reads a Review-screen row value by its label. Rows are
 * <div><span>label</span><span>value</span></div> (screens-b.tsx ReviewScreen).
 * The label span is CSS-uppercased, so match the label by textContent
 * (getByText) and read the value span's textContent, never innerText.
 */
async function reviewValue(page: Page, label: string): Promise<string> {
  const row = page
    .locator("div", { has: page.getByText(label, { exact: true }) })
    .last(); // ancestors precede descendants in DOM order → last = the row itself
  return ((await row.locator("span").nth(1).textContent()) ?? "").trim();
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

// Not serial on purpose: every test seeds its own quiz values and starts from
// a fresh context, so one failure must not skip the others (Playwright serial
// mode would). Single worker + fullyParallel:false still keep the shared
// athlete row consistent within this file.

test.describe("Pregame pre-selects the saved quiz answers via get_own_personalization (FV-253)", () => {
  test.beforeAll(async () => {
    athleteId = await resolveAthleteId();
  });

  test.afterAll(async () => {
    // Restore the seed default so every other spec sees "nothing pre-selected".
    if (athleteId) await setQuiz(null, null);
  });

  test("valid position + focus_area pre-select Today's Focus and Position; a manual tap overrides", async ({ page }) => {
    await setQuiz("Goalie", "nerves");
    await openPrepareFlow(page);

    // nerves → Calm (FOCUS_AREA_TO_NEED), read through the real RPC.
    await expectPressed(page, "Calm", true);
    for (const n of HOCKEY_NEEDS.filter((n) => n !== "Calm")) await expectPressed(page, n, false);
    await expect(continueBtn(page)).toBeEnabled();

    await continueBtn(page).click();
    await expect(page.getByText(/Step 03/)).toBeVisible();
    await expectPressed(page, "Goalie", true);
    await expectPressed(page, "Forward", false);
    await expectPressed(page, "Defense", false);
    await expect(continueBtn(page)).toBeEnabled();

    // Manual override wins.
    await chip(page, "Forward").click();
    await expectPressed(page, "Forward", true);
    await expectPressed(page, "Goalie", false);
  });

  test("the play path (BEGIN → breathe) pre-selects the same need", async ({ page }) => {
    await setQuiz("Goalie", "nerves");
    await openPregameStart(page);
    await page.getByRole("button", { name: "BEGIN", exact: true }).click();
    await page.getByRole("button", { name: "Already settled" }).click();
    await page.getByRole("button", { name: "SET MY FOCUS", exact: true }).click();
    await expect(page.getByText(/Step 02/)).toBeVisible();
    await expectPressed(page, "Calm", true);
    await expect(continueBtn(page)).toBeEnabled();
  });

  test("skipped quiz (both null) → nothing pre-selected, CONTINUE gated as before", async ({ page }) => {
    await setQuiz(null, null);
    await openPrepareFlow(page);
    for (const n of HOCKEY_NEEDS) await expectPressed(page, n, false);
    await expect(continueBtn(page)).toBeDisabled();
  });

  test("cross-sport position (basketball 'Guard') is ignored for a hockey athlete; focus still maps", async ({ page }) => {
    await setQuiz("Guard", "faith");
    await openPrepareFlow(page);
    await expectPressed(page, "Hope", true); // faith → Hope
    await continueBtn(page).click();
    await expect(page.getByText(/Step 03/)).toBeVisible();
    for (const r of HOCKEY_ROLES) await expectPressed(page, r, false);
    await expect(continueBtn(page)).toBeDisabled();
  });

  test("'Run it like last time' replays the saved session, not the profile pre-selection", async ({ page }) => {
    await setQuiz("Forward", "nerves"); // would pre-select Forward / Calm
    await openPregameStart(page);
    // Seed a saved session (Joy / Goalie) the way the app writes it, then reload.
    await page.evaluate(() => {
      window.localStorage.setItem(
        "fv_pregame_session",
        JSON.stringify({
          sport: "hockey",
          need: "Joy",
          role: "Goalie",
          positivePlays: [],
          adversity: "I feel nervous.",
          anchor: "Long exhale",
          selfTalk: "Stay steady. Make the next play.",
          cueWord: "Faithful",
          prayerStyle: "guided",
        }),
      );
    });
    await page.reload();
    await expect(page.getByTestId("set-up-for-later-btn")).toBeVisible({ timeout: 15_000 });
    await dismissCoachmark(page);

    await page.getByRole("button", { name: /run it like last time/i }).click();
    await page.getByRole("button", { name: "Already settled" }).click();
    // Saved-run shortcut: SET MY FOCUS jumps straight to the audio step.
    await page.getByRole("button", { name: "SET MY FOCUS", exact: true }).click();
    await expect(page.getByText(/Step 02/)).toBeHidden();
    // Back from audio lands on Review, pre-filled from the SAVED session.
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.getByText("Today's focus", { exact: true })).toBeVisible({ timeout: 10_000 });
    expect(await reviewValue(page, "Today's focus")).toBe("Joy");
    expect(await reviewValue(page, "Position")).toBe("Goalie");

    // A fresh session from the same page still pre-selects the profile.
    // Close remounts the start screen (and with it the tour) — dismiss again.
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByTestId("set-up-for-later-btn")).toBeVisible();
    await dismissCoachmark(page);
    await page.getByTestId("set-up-for-later-btn").click();
    await expect(page.getByText(/Step 02/)).toBeVisible();
    await expectPressed(page, "Calm", true);
    await expectPressed(page, "Joy", false);
  });
});
