/**
 * Unit + guard-integration tests for the FV-590 Stripe test-clock harness
 * (scripts/stripe-test-clock-d3.ts).
 *
 * This harness proves D3 (FV-586) against REAL Stripe TEST MODE and is not
 * meant to be exercised against a live account or mocked network in
 * production use — but this test file verifies:
 *   (a) the dormant-safety GUARDS (missing/live key, live Supabase URL,
 *       --dry-run) via real subprocess invocations of the actual script, so
 *       the exact exit codes and message text are proven against the real
 *       CLI entrypoint, not just the exported helper functions; and
 *   (b) the SCENARIO assertion logic (runScenarioA / runScenarioB / cleanup)
 *       via a hand-built fake Stripe client, so the pass/fail logic is
 *       verified even though this machine has no Stripe test-mode key and
 *       cannot make the real network calls itself.
 *
 * No live or test Stripe key is used anywhere in this file.
 */

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

import {
  GuardFailure,
  MISSING_OR_LIVE_KEY_MESSAGE,
  SUPABASE_URL_REFUSAL_MESSAGE,
  PRODUCT_NAME,
  TIER_ONE_UNIT_AMOUNT_CENTS,
  TIER_REST_UNIT_AMOUNT_CENTS,
  assertTestModeStripeKey,
  assertSupabaseUrlIsNotLive,
  parseArgs,
  buildPlan,
  isStripeCardError,
  describeError,
  shortId,
  toIso,
  runScenarioA,
  runScenarioB,
  cleanupPriorRuns,
  cleanup,
} from "../../scripts/stripe-test-clock-d3.ts";

// ---------------------------------------------------------------------------
// Pure guard / helper unit tests
// ---------------------------------------------------------------------------

describe("assertTestModeStripeKey", () => {
  it("throws GuardFailure(exit 2) with the exact message when the key is missing", () => {
    expect(() => assertTestModeStripeKey(undefined)).toThrowError(GuardFailure);
    try {
      assertTestModeStripeKey(undefined);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(GuardFailure);
      expect((err as GuardFailure).message).toBe(MISSING_OR_LIVE_KEY_MESSAGE);
      expect((err as GuardFailure).exitCode).toBe(2);
    }
  });

  it("throws the same GuardFailure when the key is empty", () => {
    expect(() => assertTestModeStripeKey("")).toThrowError(GuardFailure);
  });

  it("refuses a LIVE key (sk_live_x) with the exact message", () => {
    try {
      assertTestModeStripeKey("sk_live_x");
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(GuardFailure);
      expect((err as GuardFailure).message).toBe(MISSING_OR_LIVE_KEY_MESSAGE);
    }
  });

  it("accepts a restricted TEST-MODE key (rk_test_…)", () => {
    expect(assertTestModeStripeKey("rk_test_abc123")).toBe("rk_test_abc123");
  });

  it("refuses a restricted LIVE key (rk_live_x)", () => {
    expect(() => assertTestModeStripeKey("rk_live_x")).toThrowError(GuardFailure);
  });

  it("refuses a key that merely contains sk_test_ but doesn't start with it", () => {
    expect(() => assertTestModeStripeKey("prefix_sk_test_123")).toThrowError(GuardFailure);
  });

  it("accepts and returns a TEST-MODE key", () => {
    expect(assertTestModeStripeKey("sk_test_abc123")).toBe("sk_test_abc123");
  });
});

describe("assertSupabaseUrlIsNotLive", () => {
  it("throws GuardFailure(exit 2) with the exact message for a *.supabase.co URL", () => {
    try {
      assertSupabaseUrlIsNotLive("https://kumrgeosgzdlxgljbyju.supabase.co");
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(GuardFailure);
      expect((err as GuardFailure).message).toBe(SUPABASE_URL_REFUSAL_MESSAGE);
      expect((err as GuardFailure).exitCode).toBe(2);
    }
  });

  it("throws for a supabase.co URL with a path/port suffix too", () => {
    expect(() =>
      assertSupabaseUrlIsNotLive("https://abc.supabase.co:443/rest/v1"),
    ).toThrowError(GuardFailure);
  });

  it("does not throw for undefined", () => {
    expect(() => assertSupabaseUrlIsNotLive(undefined)).not.toThrow();
  });

  it("does not throw for a local Supabase URL", () => {
    expect(() => assertSupabaseUrlIsNotLive("http://127.0.0.1:54321")).not.toThrow();
  });
});

describe("parseArgs", () => {
  it("defaults both flags to false", () => {
    expect(parseArgs([])).toEqual({ dryRun: false, with3ds: false });
  });

  it("recognizes --dry-run", () => {
    expect(parseArgs(["--dry-run"])).toEqual({ dryRun: true, with3ds: false });
  });

  it("recognizes --with-3ds", () => {
    expect(parseArgs(["--with-3ds"])).toEqual({ dryRun: false, with3ds: true });
  });

  it("recognizes both together, in either order", () => {
    expect(parseArgs(["--with-3ds", "--dry-run"])).toEqual({ dryRun: true, with3ds: true });
  });
});

describe("buildPlan", () => {
  it("mentions the product name and both price tiers", () => {
    const plan = buildPlan({ with3ds: false });
    expect(plan).toContain(PRODUCT_NAME);
    expect(plan).toContain(`${TIER_ONE_UNIT_AMOUNT_CENTS} cents`);
    expect(plan).toContain(`${TIER_REST_UNIT_AMOUNT_CENTS} cents`);
  });

  it("says Scenario C is skipped when with3ds is false", () => {
    expect(buildPlan({ with3ds: false })).toContain("Scenario C: skipped");
  });

  it("describes Scenario C when with3ds is true", () => {
    const plan = buildPlan({ with3ds: true });
    expect(plan).toContain("Scenario C (--with-3ds)");
    expect(plan).not.toContain("Scenario C: skipped");
  });

  it("documents the D3 update verbatim", () => {
    const plan = buildPlan({ with3ds: false });
    expect(plan).toContain('trial_end: "now"');
    expect(plan).toContain('payment_behavior: "error_if_incomplete"');
  });
});

describe("isStripeCardError", () => {
  it("recognizes a StripeCardError with statusCode 402", () => {
    expect(isStripeCardError({ type: "StripeCardError", statusCode: 402 })).toBe(true);
  });

  it("rejects a different error type", () => {
    expect(isStripeCardError({ type: "StripeInvalidRequestError", statusCode: 400 })).toBe(false);
  });

  it("rejects a StripeCardError-shaped object with the wrong status code", () => {
    expect(isStripeCardError({ type: "StripeCardError", statusCode: 500 })).toBe(false);
  });

  it("rejects null/undefined/non-objects", () => {
    expect(isStripeCardError(null)).toBe(false);
    expect(isStripeCardError(undefined)).toBe(false);
    expect(isStripeCardError("nope")).toBe(false);
  });
});

describe("small formatting helpers", () => {
  it("shortId truncates long ids to 8 chars + ellipsis", () => {
    expect(shortId("cus_1234567890")).toBe("cus_1234…");
  });

  it("shortId leaves short ids untouched", () => {
    expect(shortId("abc")).toBe("abc");
  });

  it("toIso converts unix seconds to an ISO string", () => {
    expect(toIso(0)).toBe("1970-01-01T00:00:00.000Z");
  });

  it("toIso returns 'null' for null/undefined", () => {
    expect(toIso(null)).toBe("null");
    expect(toIso(undefined)).toBe("null");
  });

  it("describeError formats a Stripe-error-shaped object", () => {
    const msg = describeError({ type: "StripeCardError", code: "card_declined", statusCode: 402, message: "Your card was declined." });
    expect(msg).toContain("StripeCardError");
    expect(msg).toContain("code=card_declined");
    expect(msg).toContain("statusCode=402");
    expect(msg).toContain("Your card was declined.");
  });

  it("describeError falls back to String() for non-objects", () => {
    expect(describeError("boom")).toBe("boom");
  });
});

// ---------------------------------------------------------------------------
// Scenario logic against a hand-built fake Stripe client (no real network)
// ---------------------------------------------------------------------------

/**
 * Minimal structural fake covering only the Stripe methods the harness
 * calls. Cast to `unknown as Stripe` at each call site — mirrors this
 * repo's existing style for mocking the Stripe client (see
 * __tests__/stripe/sync-athlete-quantity.test.ts).
 */
function makeFakeStripeForScenarioA() {
  return {
    customers: {
      create: async () => ({ id: "cus_A1234567" }),
    },
    subscriptions: {
      create: async () => ({
        id: "sub_A1234567",
        status: "trialing",
        trial_end: 1_900_000_000,
        items: { data: [{ id: "si_A1234567", quantity: 1 }] },
      }),
      update: async () => ({ id: "sub_A1234567" }),
      retrieve: async () => ({
        id: "sub_A1234567",
        status: "active",
        trial_end: 1_000_000_000, // well in the past relative to "now"
        items: { data: [{ id: "si_A1234567", quantity: 2 }] },
        latest_invoice: {
          id: "in_A1234567",
          status: "paid",
          amount_paid: 800,
          billing_reason: "subscription_update",
          payment_intent: { status: "succeeded" },
        },
      }),
    },
    invoices: {
      list: async () => ({
        data: [
          { id: "in_A0trial00", status: "paid", amount_paid: 0 },
          { id: "in_A1234567", status: "paid", amount_paid: 800 },
        ],
      }),
    },
  };
}

function makeFakeStripeForScenarioB(opts: { throwsCardError: boolean }) {
  const trialEnd = 1_900_000_000;
  return {
    customers: {
      create: async () => ({ id: "cus_B1234567" }),
    },
    subscriptions: {
      create: async () => ({
        id: "sub_B1234567",
        status: "trialing",
        trial_end: trialEnd,
        items: { data: [{ id: "si_B1234567", quantity: 1 }] },
      }),
      update: async () => {
        if (opts.throwsCardError) {
          const err = {
            type: "StripeCardError",
            code: "card_declined",
            statusCode: 402,
            message: "Your card was declined.",
          };
          throw err;
        }
        return { id: "sub_B1234567" };
      },
      retrieve: async () => ({
        id: "sub_B1234567",
        status: "trialing",
        trial_end: trialEnd,
        items: { data: [{ id: "si_B1234567", quantity: 1 }] },
      }),
    },
    invoices: {
      list: async () => ({
        data: [
          { id: "in_B0trial00", status: "paid", amount_paid: 0 },
          { id: "in_B1234567", status: "open", amount_paid: 0 },
        ],
      }),
    },
  };
}

describe("runScenarioA (success) against a fake Stripe client", () => {
  it("passes when the fake Stripe client returns the expected converted-subscription shape", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal structural Stripe fake, see helper doc comment above.
    const fakeStripe = makeFakeStripeForScenarioA() as any;
    const result = await runScenarioA(fakeStripe, "clock_1", "price_1");
    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.evidence.amountPaidCents).toBe(800);
    expect(result.evidence.paymentIntentStatus).toBe("succeeded");
    expect(result.evidence.paidInvoiceCount).toBe(2);
    expect(result.evidence.chargedInvoiceCount).toBe(1);
    expect(result.evidence.zeroAmountTrialInvoiceCount).toBe(1);
  });

  it("fails when the post-update quantity is wrong", async () => {
    const base = makeFakeStripeForScenarioA();
    base.subscriptions.retrieve = async () => ({
      id: "sub_A1234567",
      status: "active",
      trial_end: 1_000_000_000,
      items: { data: [{ id: "si_A1234567", quantity: 1 }] }, // wrong: should be 2
      latest_invoice: {
        id: "in_A1234567",
        status: "paid",
        amount_paid: 800,
        billing_reason: "subscription_update",
        payment_intent: { status: "succeeded" },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal structural Stripe fake.
    const result = await runScenarioA(base as any, "clock_1", "price_1");
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("quantity 2"))).toBe(true);
  });

  it("fails when the D3 update throws unexpectedly", async () => {
    const base = makeFakeStripeForScenarioA();
    base.subscriptions.update = async () => {
      throw { type: "StripeInvalidRequestError", statusCode: 400, message: "bad request" };
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal structural Stripe fake.
    const result = await runScenarioA(base as any, "clock_1", "price_1");
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("threw unexpectedly"))).toBe(true);
  });
});

describe("runScenarioB (decline) against a fake Stripe client", () => {
  it("passes when the D3 update throws a real StripeCardError and state is left untouched", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal structural Stripe fake.
    const fakeStripe = makeFakeStripeForScenarioB({ throwsCardError: true }) as any;
    const result = await runScenarioB(fakeStripe, "clock_1", "price_1");
    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
    expect(String(result.evidence.updateError)).toContain("StripeCardError");
    expect(result.evidence.paidInvoiceCount).toBe(1);
    expect(result.evidence.chargedInvoiceCount).toBe(0);
  });

  it("fails when the D3 update unexpectedly succeeds (no throw)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal structural Stripe fake.
    const fakeStripe = makeFakeStripeForScenarioB({ throwsCardError: false }) as any;
    const result = await runScenarioB(fakeStripe, "clock_1", "price_1");
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("expected the D3 update to throw"))).toBe(true);
  });

  it("fails when the thrown error is not a StripeCardError/402", async () => {
    const base = makeFakeStripeForScenarioB({ throwsCardError: false });
    base.subscriptions.update = async () => {
      throw { type: "StripeInvalidRequestError", statusCode: 400, message: "nope" };
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal structural Stripe fake.
    const result = await runScenarioB(base as any, "clock_1", "price_1");
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("expected a StripeCardError"))).toBe(true);
  });
});

describe("cleanup helpers never throw even when the fake Stripe client errors", () => {
  it("cleanupPriorRuns swallows list/delete errors", async () => {
    const fakeStripe = {
      testHelpers: {
        testClocks: {
          list: async () => {
            throw new Error("network down");
          },
          del: async () => undefined,
        },
      },
      products: {
        list: async () => {
          throw new Error("network down");
        },
        update: async () => undefined,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal structural Stripe fake.
    } as any;
    await expect(cleanupPriorRuns(fakeStripe)).resolves.toBeUndefined();
  });

  it("cleanup deletes the test clock and deactivates price + product, swallowing errors", async () => {
    const calls: string[] = [];
    const fakeStripe = {
      testHelpers: {
        testClocks: {
          del: async (id: string) => {
            calls.push(`del-clock:${id}`);
          },
        },
      },
      prices: {
        update: async (id: string) => {
          calls.push(`deactivate-price:${id}`);
          throw new Error("price already archived");
        },
      },
      products: {
        update: async (id: string) => {
          calls.push(`deactivate-product:${id}`);
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal structural Stripe fake.
    } as any;

    await expect(
      cleanup(fakeStripe, { testClockId: "clock_1", productId: "prod_1", priceId: "price_1" }),
    ).resolves.toBeUndefined();

    expect(calls).toEqual([
      "del-clock:clock_1",
      "deactivate-price:price_1",
      "deactivate-product:prod_1",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Guard integration tests — spawn the REAL script so the exact exit codes
// and message text are verified against the actual CLI entrypoint.
// ---------------------------------------------------------------------------

const SCRIPT_PATH = path.resolve(process.cwd(), "scripts", "stripe-test-clock-d3.ts");

/**
 * Asserts that some LINE of `output` is exactly `expected`, once trimmed.
 * Tolerant of extra noise lines a sandboxed dev shell may inject around the
 * subprocess's real stderr (observed locally: an unrelated
 * `<claude-code-hint .../>` line from this interactive session's terminal
 * wrapper, not something the script itself prints) while still requiring
 * the script's own message to appear verbatim on its own line, not merely
 * as a substring buried in something else.
 */
function expectExactLine(output: string, expected: string): void {
  const lines = output.split("\n").map((line) => line.trim());
  expect(lines).toContain(expected);
}

function runScript(
  args: string[],
  envOverrides: Record<string, string | undefined>,
): { stdout: string; stderr: string; status: number } {
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_NO_WARNINGS: "1" };
  // Always start from a clean slate for the two guarded vars regardless of
  // what the ambient shell/CI environment happens to have set, so these
  // tests are deterministic.
  delete env.STRIPE_SECRET_KEY;
  delete env.NEXT_PUBLIC_SUPABASE_URL;
  for (const [key, value] of Object.entries(envOverrides)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }

  try {
    const stdout = execFileSync(process.execPath, ["--experimental-strip-types", SCRIPT_PATH, ...args], {
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { stdout, stderr: "", status: 0 };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number | null };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", status: e.status ?? -1 };
  }
}

describe("CLI guard integration (spawns the real script, no network)", () => {
  it("exits 2 with the exact message when STRIPE_SECRET_KEY is missing", () => {
    const { status, stderr } = runScript([], {});
    expect(status).toBe(2);
    expectExactLine(stderr, MISSING_OR_LIVE_KEY_MESSAGE);
  });

  it("exits 2 with the exact message when STRIPE_SECRET_KEY is a LIVE key", () => {
    const { status, stderr } = runScript([], { STRIPE_SECRET_KEY: "sk_live_x" });
    expect(status).toBe(2);
    expectExactLine(stderr, MISSING_OR_LIVE_KEY_MESSAGE);
  });

  it("exits 2 with the exact message when NEXT_PUBLIC_SUPABASE_URL points at *.supabase.co", () => {
    const { status, stderr } = runScript([], {
      NEXT_PUBLIC_SUPABASE_URL: "https://kumrgeosgzdlxgljbyju.supabase.co",
    });
    expect(status).toBe(2);
    expectExactLine(stderr, SUPABASE_URL_REFUSAL_MESSAGE);
  });

  it("checks the Supabase-URL guard before the key guard", () => {
    // No STRIPE_SECRET_KEY at all AND a live Supabase URL — the Supabase
    // message must win, proving the ordering documented in the script's
    // module doc ("GUARD ORDERING").
    const { status, stderr } = runScript([], {
      NEXT_PUBLIC_SUPABASE_URL: "https://kumrgeosgzdlxgljbyju.supabase.co",
    });
    expect(status).toBe(2);
    expectExactLine(stderr, SUPABASE_URL_REFUSAL_MESSAGE);
    expect(stderr).not.toContain("STRIPE_SECRET_KEY");
  });

  it("--dry-run exits 0 and prints the plan even with NO key and a live Supabase URL present", () => {
    // Proves --dry-run is checked FIRST and bypasses both guards — the
    // exact scenario this script must support on a machine with no Stripe
    // credentials at all.
    const { status, stdout, stderr } = runScript(["--dry-run"], {
      NEXT_PUBLIC_SUPABASE_URL: "https://kumrgeosgzdlxgljbyju.supabase.co",
    });
    expect(status).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("DRY RUN");
    expect(stdout).toContain(PRODUCT_NAME);
  });

  it("--dry-run --with-3ds describes Scenario C in the printed plan", () => {
    const { status, stdout } = runScript(["--dry-run", "--with-3ds"], {});
    expect(status).toBe(0);
    expect(stdout).toContain("Scenario C (--with-3ds)");
  });
});
