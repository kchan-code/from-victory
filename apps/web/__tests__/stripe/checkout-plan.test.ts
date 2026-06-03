/**
 * Unit tests for the `planToPriceEnvVar` pure helper.
 *
 * This function is the only pure, side-effect-free export from
 * `lib/actions/subscription.ts` that can be tested in isolation without
 * mocking Supabase, Stripe, Next.js server internals, or `server-only` guards.
 *
 * The test verifies:
 *   1. Each plan value maps to the correct env-var name.
 *   2. The mapping is exhaustive over the `z.enum(["monthly","annual"])` set
 *      — if a new plan is added to the zod schema, a test should be added here.
 *
 * Import path: the function is exported from the action module. The test
 * imports it directly — no network, no DB, no server session required.
 *
 * Note on `server-only`:
 *   `lib/actions/subscription.ts` contains `"use server"` at the top but does
 *   NOT import `server-only` directly (it relies on `lib/stripe/server.ts` and
 *   `lib/supabase/server.ts` for that guard). Vitest runs under Node, so the
 *   `server-only` package (which throws only in browser/edge environments) does
 *   not block the import here. If a future change adds a top-level
 *   `import "server-only"` to this action file, the test will need a mock:
 *     vi.mock("server-only", () => ({}))
 */

import { describe, it, expect } from "vitest";

import { planToPriceEnvVar } from "@/lib/subscriptions/plans";

describe("planToPriceEnvVar", () => {
  it('maps "monthly" to STRIPE_PRICE_ID_MONTHLY', () => {
    expect(planToPriceEnvVar("monthly")).toBe("STRIPE_PRICE_ID_MONTHLY");
  });

  it('maps "annual" to STRIPE_PRICE_ID_ANNUAL', () => {
    expect(planToPriceEnvVar("annual")).toBe("STRIPE_PRICE_ID_ANNUAL");
  });

  it("returns distinct env-var names for each plan (no collision)", () => {
    const monthly = planToPriceEnvVar("monthly");
    const annual = planToPriceEnvVar("annual");
    expect(monthly).not.toBe(annual);
  });

  it("env-var names start with STRIPE_PRICE_ID_ (naming convention guard)", () => {
    expect(planToPriceEnvVar("monthly")).toMatch(/^STRIPE_PRICE_ID_/);
    expect(planToPriceEnvVar("annual")).toMatch(/^STRIPE_PRICE_ID_/);
  });
});
