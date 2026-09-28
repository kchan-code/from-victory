/**
 * FV-596 downstream integration coverage: proves the sandbox-allowlist-aware
 * environment rule in `./apple`'s `getActiveAppleProductId` /
 * `getActiveAppleProductIdResult` (previously Production-only) correctly
 * flows through to the two capacity-adjacent callers whose behavior changes
 * as a result:
 *   - `isStrictAppleCapacityUpgrade` (./apple-capacity)
 *   - `getPayerSeatState` (./seat-state)
 *
 * `getSubscribeEntitlementState`'s equivalent case is covered directly in
 * subscribe-guard.test.ts, which already exercises the real fold against a
 * mocked service client in the same style used here.
 *
 * Deliberately does NOT mock `@/lib/subscriptions/apple`,
 * `@/lib/subscriptions/apple-capacity`, or `@/lib/subscriptions/seat-state`
 * — only the low-level service-role client is mocked (mirrors
 * apple-access.test.ts), so these tests run the REAL accessor + capacity /
 * seat logic end to end.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mutable table state
// ---------------------------------------------------------------------------

type AppleSubRow = {
  environment: "Sandbox" | "Production";
  status: string;
  expires_at: string;
  grace_period_expires_at: string | null;
  product_id?: string;
};

const PAYER_ID = "ffffffff-0000-4000-8000-000000000006";
const FAR_FUTURE_ISO = "2099-01-01T00:00:00.000Z";

let appleSubRows: AppleSubRow[] = [];
let appleSubError: { message: string } | null = null;
let allowlistRow: { payer_id: string } | null = null;
let allowlistError: { message: string } | null = null;
let linksRows: Array<{ athlete_id: string; seat_active: boolean }> = [];
let linksError: { message: string } | null = null;

function resetState() {
  appleSubRows = [];
  appleSubError = null;
  allowlistRow = null;
  allowlistError = null;
  linksRows = [];
  linksError = null;
}

beforeEach(() => {
  resetState();
});

function makeServiceMock() {
  return {
    from: vi.fn((table: string) => {
      if (table === "apple_sandbox_testers") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: allowlistRow,
            error: allowlistError,
          }),
        };
      }
      if (table === "apple_subscriptions") {
        // getActiveAppleProductIdResult's shape: .select(...).eq("payer_id")
        // -> array (thenable), single eq call, no .maybeSingle().
        const chain: Record<string, unknown> = {
          eq: vi.fn(() => chain),
          then: (
            resolve: (v: {
              data: AppleSubRow[] | null;
              error: typeof appleSubError;
            }) => void,
          ) => resolve({ data: appleSubRows, error: appleSubError }),
        };
        return { select: vi.fn(() => chain) };
      }
      if (table === "parent_athlete_links") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: linksRows, error: linksError }),
        };
      }
      throw new Error(`unexpected table in test double: ${table}`);
    }),
  };
}

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { isStrictAppleCapacityUpgrade } from "@/lib/subscriptions/apple-capacity";
import { getPayerSeatState } from "@/lib/subscriptions/seat-state";

// ---------------------------------------------------------------------------
// isStrictAppleCapacityUpgrade
// ---------------------------------------------------------------------------

describe("isStrictAppleCapacityUpgrade — sandbox-allowlist-aware current-product resolution (FV-596)", () => {
  it("refuses for a NON-allowlisted Sandbox current row — the row is invisible, so there is no current product to upgrade from", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FAR_FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = null; // not allowlisted
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const service = makeServiceMock();

    const result = await isStrictAppleCapacityUpgrade(
      service as never,
      PAYER_ID,
      "tier_5_5athletes",
    );

    expect(result).toBe(false);
    // Never reaches capacityForAppleProduct at all: currentProductId
    // resolved null (environment-filtered), so the function short-circuits
    // on `if (!currentProductId) return false;` before any capacity lookup
    // / warn — the Sandbox row was never "seen" by this decision.
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("evaluates normally (resolves the real current product) for an ALLOWLISTED Sandbox current row", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FAR_FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    // NOTE: `APPLE_CATALOG_ACTIVE` is not read anywhere in the current
    // codebase (verified: no reference exists outside this test) — stubbed
    // here per the issue's test ask, but it has no effect on today's
    // behavior. The meaningful assertion is observable from the accessor's
    // own side effects below: an allowlisted Sandbox row IS resolved to a
    // real current product id and reaches the (still fail-closed,
    // APPLE_PRODUCT_CAPACITY is empty pending Open Item P2) capacity
    // lookup for BOTH product ids, rather than being filtered out before
    // ever reaching it, as the non-allowlisted case above is.
    vi.stubEnv("APPLE_CATALOG_ACTIVE", "1");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const service = makeServiceMock();

    const result = await isStrictAppleCapacityUpgrade(
      service as never,
      PAYER_ID,
      "tier_5_5athletes",
    );

    // Still false overall — APPLE_PRODUCT_CAPACITY is empty today — but for
    // a DIFFERENT reason than the non-allowlisted case above: the current
    // product WAS resolved (the allowlisted Sandbox row counts), so the
    // function proceeded to the fail-closed capacity lookup for both
    // product ids, each of which warns on an unmapped id. That's the proof
    // this "evaluated normally" instead of being short-circuited by
    // environment scoping.
    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls[0]?.[0]).toMatch(/tier_1_1athlete/);
    expect(warnSpy.mock.calls[1]?.[0]).toMatch(/tier_5_5athletes/);

    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });
});

// ---------------------------------------------------------------------------
// getPayerSeatState
// ---------------------------------------------------------------------------

describe("getPayerSeatState — sandbox-allowlist-aware capacity resolution (FV-596)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stays uncapped for a NON-allowlisted Sandbox current row, regardless of athlete count", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FAR_FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_2_2athletes",
      },
    ];
    allowlistRow = null; // not allowlisted
    linksRows = [
      { athlete_id: "aaaaaaaa-0000-4000-8000-000000000001", seat_active: true },
      { athlete_id: "aaaaaaaa-0000-4000-8000-000000000002", seat_active: true },
      { athlete_id: "aaaaaaaa-0000-4000-8000-000000000003", seat_active: true },
    ];
    const service = makeServiceMock();

    const result = await getPayerSeatState(service as never, PAYER_ID);

    // The Sandbox row is environment-filtered out for a non-allowlisted
    // payer, so getActiveAppleProductId resolves null -> payerCapacityCeiling
    // resolves null ("apple: none" for capacity purposes) -> uncapped,
    // regardless of athlete count.
    expect(result.status).toBe("uncapped");
    expect(result.capacity).toBeNull();
    expect(result.readError).toBeUndefined();
    expect(result.activeAthleteIds).toHaveLength(3);
    expect(result.pausedAthleteIds).toEqual([]);
  });
});
