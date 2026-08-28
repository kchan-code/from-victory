/**
 * App Store screenshot CANDIDATES spec (FV-214 prep). Runs ONLY under
 * playwright.screenshots.config.ts (athlete storageState, 440x956 @3x) —
 * the default playwright.config.ts projects do not match this file, so the
 * normal e2e suite is unaffected. Best-effort: every surface it reaches
 * gets a PNG; a surface that fails to render fails its own test without
 * blocking the others. See the config header for how to run.
 */

import fs from "fs";
import path from "path";

import { test, expect, type Page } from "@playwright/test";

const OUT =
  process.env.SHOT_DIR ??
  path.join(__dirname, "..", "test-results", "store-shots");

fs.mkdirSync(OUT, { recursive: true });

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForLoadState("networkidle").catch(() => {});
  // Let Reveal/entrance animations finish.
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

/** Click a button by accessible name if it is visible; return whether clicked. */
async function clickIfVisible(page: Page, name: RegExp | string): Promise<boolean> {
  const btn = page.getByRole("button", { name }).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    return true;
  }
  return false;
}

test("athlete hub", async ({ page }) => {
  await page.goto("/athlete");
  await shot(page, "01-hub");
  // If the first-run coachmark tour is up, capture the dismissed state too.
  const dismissed =
    (await clickIfVisible(page, /got it|next|skip|done/i)) &&
    ((await clickIfVisible(page, /got it|next|done/i)) || true) &&
    ((await clickIfVisible(page, /got it|next|done/i)) || true);
  if (dismissed) await shot(page, "01-hub-clean");
});

test("daily training", async ({ page }) => {
  await page.goto("/athlete/daily");
  await shot(page, "02-daily-entry");
  // One step in, if a begin/continue affordance exists.
  if (await clickIfVisible(page, /begin|start|continue/i)) {
    await shot(page, "02-daily-step2");
  }
});

test("pregame setup flow", async ({ page }) => {
  await page.goto("/athlete/pregame");
  await expect(page.getByRole("button", { name: "BEGIN" })).toBeVisible({
    timeout: 15_000,
  });
  await shot(page, "03-pregame-start");
  await page.getByRole("button", { name: "BEGIN" }).click();

  // Conditional arrival-state picker.
  await page.waitForTimeout(800);
  if (await page.getByRole("button", { name: "SET MY FOCUS" }).isVisible().catch(() => false)) {
    await shot(page, "04-pregame-arrival");
    await page.getByRole("button", { name: "SET MY FOCUS" }).click();
  } else {
    await clickIfVisible(page, "Already settled");
  }

  // Walk the setup steps: screenshot, select first chip, CONTINUE.
  for (let step = 1; step <= 7; step++) {
    await page.waitForTimeout(900);
    await shot(page, `05-pregame-step${step}`);

    const chip = page.locator("button[aria-pressed]").first();
    if (await chip.isVisible().catch(() => false)) {
      await chip.click();
    }
    const cont = page.getByRole("button", { name: "CONTINUE" }).first();
    const contVisible = await cont.isVisible().catch(() => false);
    if (!contVisible) break; // player or send-off reached
    const enabled = await cont.isEnabled().catch(() => false);
    if (!enabled) break;
    await cont.click();
  }
  // Whatever screen the loop ended on (player / send-off).
  await page.waitForTimeout(1500);
  await shot(page, "06-pregame-final");
});

test("pre-practice lock-in", async ({ page }) => {
  await page.goto("/athlete/practice");
  await shot(page, "07-practice-entry");
  if (await clickIfVisible(page, /begin|start|lock/i)) {
    await page.waitForTimeout(900);
    await shot(page, "07-practice-step2");
  }
});

test("journey", async ({ page }) => {
  await page.goto("/athlete/journey");
  await shot(page, "08-journey");
});

test("postgame debrief", async ({ page }) => {
  await page.goto("/athlete/postgame");
  await shot(page, "09-postgame");
});
