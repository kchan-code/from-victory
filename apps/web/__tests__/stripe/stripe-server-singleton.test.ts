/**
 * Unit tests for the Stripe server singleton (getStripe / __resetStripeForTests).
 *
 * Uses the REAL implementation — no vi.mock of @/lib/stripe/server in this file.
 * network calls at construction time, so these are safe to run without a live
 * Stripe account.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

// We must vi.mock("server-only") before importing server.ts, because server.ts
// imports it at module level and vitest's node environment doesn't have the
// Next.js server-only guard.
import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { getStripe, __resetStripeForTests } from "@/lib/stripe/server";

describe("getStripe singleton", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.STRIPE_SECRET_KEY;
    // Start each test with a clean singleton.
    __resetStripeForTests();
  });

  afterEach(() => {
    // Restore env var and clear the singleton after each test.
    if (originalKey !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalKey;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
    __resetStripeForTests();
  });

  it("returns the same instance on two consecutive calls (singleton identity)", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";

    const a = getStripe();
    const b = getStripe();

    expect(a).toBe(b);
  });

  it("returns a DIFFERENT instance after __resetStripeForTests()", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";

    const a = getStripe();
    __resetStripeForTests();
    const b = getStripe();

    expect(a).not.toBe(b);
  });

  it("throws after __resetStripeForTests() when STRIPE_SECRET_KEY is unset", () => {
    // Reset first, then remove the key.
    __resetStripeForTests();
    delete process.env.STRIPE_SECRET_KEY;

    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY is not set/);
  });
});
