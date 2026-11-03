/**
 * sport-picker-sign-out.e2e.ts — FV-611
 *
 * The first-run sport picker at /athlete/onboarding/sport used a top-left
 * back arrow whose form signed the athlete out. This spec pins the fix:
 * the header exit is a labeled "Sign out" control, and nothing named Back
 * or drawn as an arrow glyph is that control.
 *
 * Auth: signed-in athlete storageState (chromium-mobile-athlete). The route
 * renders SportPicker for any athlete session. It does not redirect when
 * sport_selected_at is already set, so the shared e2e athlete can open it.
 *
 * Do not click Sign out. That revokes the shared athlete session other
 * specs in this project reuse.
 */

import { expect, test } from "@playwright/test";

test.describe("Sport picker exit (FV-611)", () => {
  test("header sign-out is labeled and is not a back arrow", async ({ page }) => {
    await page.goto("/athlete/onboarding/sport");

    await expect(
      page.getByRole("heading", { name: "What sport do you play?" }),
    ).toBeVisible();

    const header = page.locator("header");
    const signOut = header.getByRole("button", { name: "Sign out" });
    await expect(signOut).toBeVisible();
    await expect(signOut).toHaveText("Sign out");
    await expect(signOut.locator("svg")).toHaveCount(0);

    await expect(header.getByRole("button", { name: /back/i })).toHaveCount(0);
    await expect(header.getByRole("link", { name: /back/i })).toHaveCount(0);
  });
});
