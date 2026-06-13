/**
 * multi-athlete.spec.ts
 *
 * Flow: A parent adds TWO athletes in sequence, then asserts that:
 *   - Both athletes appear on the dashboard athlete list.
 *   - The "Add athlete" affordance is still present (no artificial limit).
 *   - No error alert is shown anywhere in the flow.
 *
 * Auth: storageState written by global-setup (already signed-in parent).
 * Teardown: deletes the two athletes created in this spec via service role.
 * Audience-language guard: asserts the athlete-list section contains none of
 *   "kid", "kids", "kiddo", "youngster" in user-visible text.
 */

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a Supabase service-role client from the test env vars.
 * Used in afterEach for cleanup only — never in assertions.
 */
function makeServiceClient() {
  const url = process.env.E2E_SUPABASE_URL ?? "";
  const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Deletes an athlete by first name that is prefixed with "E2E ".
 * Looks up by first_name; safe because test names are unique in the test run.
 */
async function deleteAthleteByFirstName(firstName: string): Promise<void> {
  const service = makeServiceClient();

  const { data: profiles } = await service
    .from("profiles")
    .select("id")
    .eq("first_name", firstName)
    .eq("role", "athlete");

  for (const profile of profiles ?? []) {
    await service.from("profiles").delete().eq("id", profile.id);
    await service.auth.admin.deleteUser(profile.id);
  }
}

// ---------------------------------------------------------------------------
// Dates — both athletes must be ≥13 years old.
// Using a fixed past date well above the threshold so the test never
// requires updating as the calendar moves.
// ---------------------------------------------------------------------------

const BIRTHDATE_ALPHA = "2005-06-15"; // ~19 years old at time of writing
const BIRTHDATE_BRAVO = "2008-03-22"; // ~16 years old at time of writing

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

test.describe("Multi-athlete flow", () => {
  const createdAthletes: string[] = [];

  test.afterEach(async () => {
    // Clean up in reverse order of creation. Each athlete's first name is
    // unique within the test run (prefixed with "E2E ").
    for (const firstName of createdAthletes.splice(0)) {
      await deleteAthleteByFirstName(firstName);
    }
  });

  test("parent can add two athletes and both appear on the dashboard without hitting a limit", async ({
    page,
  }) => {
    // ------------------------------------------------------------------
    // Step 1: Navigate to the dashboard as the pre-authed parent.
    // ------------------------------------------------------------------
    await page.goto("/dashboard");

    // Confirm we landed on the dashboard, not a redirect to /signin.
    await expect(page).toHaveURL(/\/dashboard$/);

    // The "Add athlete" link must be present before any athletes exist.
    const addAthleteLink = page.getByRole("link", { name: "Add athlete" });
    await expect(addAthleteLink).toBeVisible();

    // ------------------------------------------------------------------
    // Step 2: Add the first athlete — "E2E Alpha".
    // ------------------------------------------------------------------
    await addAthleteLink.click();
    await expect(page).toHaveURL(/\/dashboard\/athletes\/new$/);

    // No error alerts on the form page yet.
    // Exclude #__next-route-announcer__ which always has role="alert" in Next.js.
    await expect(
      page.locator('[role="alert"]:not(#__next-route-announcer__)'),
    ).toHaveCount(0);

    // Fill the form fields.
    await page.fill('input[name="first_name"]', "E2E Alpha");
    await page.fill('input[name="birthdate"]', BIRTHDATE_ALPHA);

    // Submit — the form action is a Next.js server action; after success it
    // redirects back to /dashboard.
    await page.click('button[type="submit"]');

    // Wait for the redirect back to /dashboard.
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    createdAthletes.push("E2E Alpha");

    // "E2E Alpha" must appear in the athlete list.
    await expect(page.getByText("E2E Alpha")).toBeVisible();

    // ------------------------------------------------------------------
    // Step 3: Add the second athlete — "E2E Bravo" — from the same session.
    // ------------------------------------------------------------------
    // The "Add athlete" link must still be present after adding the first.
    const addAthleteLinkAfterOne = page.getByRole("link", {
      name: "Add athlete",
    });
    await expect(addAthleteLinkAfterOne).toBeVisible();

    await addAthleteLinkAfterOne.click();
    await expect(page).toHaveURL(/\/dashboard\/athletes\/new$/);

    await expect(
      page.locator('[role="alert"]:not(#__next-route-announcer__)'),
    ).toHaveCount(0);

    await page.fill('input[name="first_name"]', "E2E Bravo");
    await page.fill('input[name="birthdate"]', BIRTHDATE_BRAVO);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    createdAthletes.push("E2E Bravo");

    // ------------------------------------------------------------------
    // Step 4: Assert both athletes are visible simultaneously.
    // ------------------------------------------------------------------
    await expect(page.getByText("E2E Alpha")).toBeVisible();
    await expect(page.getByText("E2E Bravo")).toBeVisible();

    // The athlete list uses <ul> with <li> items. global-setup seeds an
    // E2E-Athlete linked to this same parent, so the count is ≥3, not 2.
    // Check that both newly created athletes appear; don't hard-code total.
    const athleteList = page.locator("ul").filter({
      has: page.getByText("E2E Alpha"),
    });
    const listItems = athleteList.locator("li");
    expect(await listItems.count()).toBeGreaterThanOrEqual(2);

    // ------------------------------------------------------------------
    // Step 5: "Add athlete" affordance must still be present — no limit.
    // ------------------------------------------------------------------
    await expect(
      page.getByRole("link", { name: "Add athlete" }),
    ).toBeVisible();

    // ------------------------------------------------------------------
    // Step 6: No error alerts anywhere on the final dashboard state.
    // ------------------------------------------------------------------
    await expect(
      page.locator('[role="alert"]:not(#__next-route-announcer__)'),
    ).toHaveCount(0);

    // ------------------------------------------------------------------
    // Step 7: Audience-language guard.
    //   Parent-facing dashboard — parent-facing copy ("your child") is
    //   allowed, but athlete names and UI copy must not call athletes
    //   "kid", "kids", "kiddo", or "youngster".
    //   We scope to the athletes section specifically.
    // ------------------------------------------------------------------
    const athletesSectionText = await athleteList.innerText();
    const forbidden = ["kid", "kids", "kiddo", "youngster"];

    for (const word of forbidden) {
      expect(
        athletesSectionText.toLowerCase(),
        `Audience-language violation: found "${word}" in the athlete list section`,
      ).not.toContain(word);
    }
  });
});
