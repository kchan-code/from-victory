/**
 * Unit tests for the centralized `apple_subscriptions` accessor (FV-570,
 * `apps/web/lib/subscriptions/apple.ts`).
 *
 * Covers the named, hard-gate ACs from
 * docs/fv210-ios-iap-decision-record.md Section 4.9:
 *   (a) a Sandbox row never yields "full" for a non-allowlisted payer
 *   (c) an allowlisted payer's Sandbox row grants access in the expected window
 * plus the fail-closed contracts for both exported read functions.
 *
 * FV-596: `getActiveAppleProductIdResult` / `getActiveAppleProductId` are no
 * longer Production-only — they apply the exact same allowlist rule as
 * `getAppleAccessLevelForPayer`. `getDisplayedAppleProductIdResult` is now a
 * thin alias of `getActiveAppleProductIdResult`, so its own describe block
 * below is retained as regression coverage of the exported alias name (the
 * two Settings pages still import it by that name).
 *
 * The service client is mocked (mirrors the style in grants-resolver.test.ts
 * and grants.ts's own tests) so these tests run under vitest's node
 * environment without a real Supabase instance.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

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

let appleSubRows: AppleSubRow[] = [];
let appleSubSelectError: { message: string } | null = null;
let appleSubCount: number | null = 0;
let appleSubCountError: { message: string } | null = null;

let allowlistRow: { payer_id: string } | null = null;
let allowlistError: { message: string } | null = null;

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
        // Two call shapes hit this table across the module:
        //   1. getAppleAccessLevelForPayer / getActiveAppleProductIdResult /
        //      getDisplayedAppleProductIdResult: .select().eq() -> array
        //      (thenable) — all three read every row for the payer and
        //      apply the environment/allowlist filter in application code
        //      (FV-596: the two decision-accessor functions share this
        //      shape with the entitlement gate now).
        //   2. hasEverHeldAppleEntitlement: .select(..., {count,head})
        //      .eq().eq() -> {count} — UNCHANGED, still Production-only,
        //      still its own dedicated query (hard line: never routed
        //      through the shared accessor — see its own describe block).
        // A count-mode select is distinguished by the presence of the count
        // option; we detect it via the second positional arg on `.select()`.
        let isCountQuery = false;
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            isCountQuery = Boolean(opts?.count);
            const chain: Record<string, unknown> = {
              eq: vi.fn(() => chain),
              then: (
                resolve: (v: {
                  data: AppleSubRow[] | null;
                  error: typeof appleSubSelectError;
                  count?: number | null;
                }) => void,
              ) =>
                resolve(
                  isCountQuery
                    ? { data: null, error: appleSubCountError, count: appleSubCount }
                    : { data: appleSubRows, error: appleSubSelectError },
                ),
            };
            return chain;
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  getAppleAccessLevelForPayer,
  hasEverHeldAppleEntitlement,
  getActiveAppleProductId,
  getActiveAppleProductIdResult,
  getDisplayedAppleProductIdResult,
} from "@/lib/subscriptions/apple";

const PAYER_ID = "dddddddd-0000-4000-8000-000000000004";
const NOW = new Date("2026-09-11T12:00:00.000Z");
const FUTURE_ISO = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

function resetState() {
  appleSubRows = [];
  appleSubSelectError = null;
  appleSubCount = 0;
  appleSubCountError = null;
  allowlistRow = null;
  allowlistError = null;
}

beforeEach(() => {
  resetState();
});

// ---------------------------------------------------------------------------
// getAppleAccessLevelForPayer
// ---------------------------------------------------------------------------

describe("getAppleAccessLevelForPayer", () => {
  it("grants full for a Production row that is subscribed", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
      },
    ];
    const service = makeServiceMock();
    expect(
      await getAppleAccessLevelForPayer(service as never, PAYER_ID, NOW),
    ).toBe("full");
  });

  it("a Sandbox row for a NON-allowlisted payer never yields full (record §4.9)", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
      },
    ];
    allowlistRow = null; // not allowlisted
    const service = makeServiceMock();
    expect(
      await getAppleAccessLevelForPayer(service as never, PAYER_ID, NOW),
    ).toBe("blocked");
  });

  it("a Sandbox row for an ALLOWLISTED payer grants access in the expected window (record §4.9)", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getAppleAccessLevelForPayer(service as never, PAYER_ID, NOW),
    ).toBe("full");
  });

  it("returns blocked (fail-closed) on an apple_subscriptions DB error", async () => {
    appleSubSelectError = { message: "DB error" };
    const service = makeServiceMock();
    expect(
      await getAppleAccessLevelForPayer(service as never, PAYER_ID, NOW),
    ).toBe("blocked");
  });

  it("returns blocked when no rows exist at all", async () => {
    appleSubRows = [];
    const service = makeServiceMock();
    expect(
      await getAppleAccessLevelForPayer(service as never, PAYER_ID, NOW),
    ).toBe("blocked");
  });

  it("treats an allowlist read error as NOT allowlisted (fails closed, more restrictive branch)", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
      },
    ];
    allowlistError = { message: "allowlist read failed" };
    const service = makeServiceMock();
    expect(
      await getAppleAccessLevelForPayer(service as never, PAYER_ID, NOW),
    ).toBe("blocked");
  });

  it("returns the BEST level when both a Production and an allowlisted Sandbox row exist", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "revoked",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
      },
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getAppleAccessLevelForPayer(service as never, PAYER_ID, NOW),
    ).toBe("full");
  });
});

// ---------------------------------------------------------------------------
// hasEverHeldAppleEntitlement — Production-only scope, throws on error
// (HARD LINE, FV-596: this function is NOT routed through the shared,
// sandbox-allowlist-aware decision accessor — a sandbox purchase, even by an
// allowlisted payer, must never burn a real family's trial eligibility.)
// ---------------------------------------------------------------------------

describe("hasEverHeldAppleEntitlement", () => {
  it("returns true when a Production row exists", async () => {
    appleSubCount = 1;
    const service = makeServiceMock();
    expect(
      await hasEverHeldAppleEntitlement(service as never, PAYER_ID),
    ).toBe(true);
  });

  it("returns false when no Production row exists", async () => {
    appleSubCount = 0;
    const service = makeServiceMock();
    expect(
      await hasEverHeldAppleEntitlement(service as never, PAYER_ID),
    ).toBe(false);
  });

  it("throws on a DB error (caller aborts checkout, PR-#185 semantics)", async () => {
    appleSubCountError = { message: "connection timeout" };
    const service = makeServiceMock();
    await expect(
      hasEverHeldAppleEntitlement(service as never, PAYER_ID),
    ).rejects.toThrow(/connection timeout/);
  });

  it("ignores a Sandbox row for an ALLOWLISTED payer — trial history stays Production-only regardless of allowlist status (FV-596 hard line)", async () => {
    // The DB itself has no Production row for this payer (only an
    // allowlisted Sandbox row, which this function's own
    // `.eq("environment", "Production")` filter never sees) — so the count
    // this function reads is 0 even though the payer IS allowlisted.
    appleSubCount = 0;
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();

    expect(
      await hasEverHeldAppleEntitlement(service as never, PAYER_ID),
    ).toBe(false);

    // This function never even consults the allowlist table — proves it is
    // NOT routed through the shared sandbox-aware accessor.
    const queriedTables = (service.from as ReturnType<typeof vi.fn>).mock.calls.map(
      (call) => call[0],
    );
    expect(queriedTables).not.toContain("apple_sandbox_testers");
    expect(queriedTables).toEqual(["apple_subscriptions"]);
  });
});

// ---------------------------------------------------------------------------
// getActiveAppleProductId / getActiveAppleProductIdResult — FV-596:
// sandbox-allowlist-aware decision accessor (previously Production-only)
// ---------------------------------------------------------------------------

describe("getActiveAppleProductIdResult", () => {
  it("returns { productId: null, readError: false } when no rows exist at all", async () => {
    appleSubRows = [];
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: false });
  });

  it("returns the product_id for an active 'subscribed' Production row", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: "tier_1_1athlete", readError: false });
  });

  it("returns { productId, readError: false } for a degraded 'in_billing_retry' Production row (degraded policy preserved, not re-litigated)", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "in_billing_retry",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_3_3athletes",
      },
    ];
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: "tier_3_3athletes", readError: false });
  });

  it("returns { productId: null, readError: false } for an 'expired' Production row (stale ceiling must not apply)", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "expired",
        expires_at: FUTURE_ISO, // even with a future expires_at — expired is unconditional
        grace_period_expires_at: null,
        product_id: "tier_2_2athletes",
      },
    ];
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: false });
  });

  it("returns { productId: null, readError: false } for a 'revoked' Production row", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "revoked",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_2_2athletes",
      },
    ];
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: false });
  });

  // -------------------------------------------------------------------------
  // FV-596: sandbox-allowlist eligibility rule (mirrors getAppleAccessLevelForPayer)
  // -------------------------------------------------------------------------

  it("returns the product_id for an ALLOWLISTED payer's subscribed Sandbox row", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: "tier_1_1athlete", readError: false });
  });

  it("returns null for a NON-allowlisted payer's Sandbox row (record §4.9 mirrored)", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = null; // not allowlisted
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: false });
  });

  it("returns the product_id for a Production row regardless of allowlist status", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_2_2athletes",
      },
    ];
    allowlistRow = null;
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: "tier_2_2athletes", readError: false });
  });

  it("prefers the Production row when both an active Production and an allowlisted Sandbox row exist", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
      {
        environment: "Production",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_2_2athletes",
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: "tier_2_2athletes", readError: false });
  });

  it("falls through to an active allowlisted Sandbox row when the Production row is expired (inverse case)", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "expired",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_2_2athletes",
      },
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: "tier_1_1athlete", readError: false });
  });

  it("returns null for an expired/revoked Sandbox row even when the payer is allowlisted", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "revoked",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: false });
  });

  // -------------------------------------------------------------------------
  // Error-visible contract
  // -------------------------------------------------------------------------

  it("returns { productId: null, readError: true } on an apple_subscriptions DB error — never swallows to a false null", async () => {
    appleSubRows = [];
    appleSubSelectError = { message: "connection timeout" };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: true });
  });

  it("returns { productId: null, readError: true } on an allowlist read error — never guesses 'not allowlisted'", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistError = { message: "allowlist read failed" };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: true });
  });
});

describe("getActiveAppleProductId", () => {
  it("returns null when the payer has no active row", async () => {
    appleSubRows = [];
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).toBeNull();
  });

  it("returns the product_id for an active Production row", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).toBe("tier_1_1athlete");
  });

  it("returns the product_id for an allowlisted payer's active Sandbox row (FV-596)", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).toBe("tier_1_1athlete");
  });

  it("returns null for a NON-allowlisted payer's Sandbox row (FV-596)", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = null;
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).toBeNull();
  });

  it("returns null WITHOUT throwing on a subscriptions DB error", async () => {
    appleSubRows = [];
    appleSubSelectError = { message: "connection timeout" };
    const service = makeServiceMock();
    await expect(
      getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).resolves.toBeNull();
  });

  it("returns null (fail-open) on an allowlist read error — the wrapper collapses readError to null", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistError = { message: "allowlist read failed" };
    const service = makeServiceMock();
    await expect(
      getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).resolves.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getDisplayedAppleProductIdResult — now a thin alias of
// getActiveAppleProductIdResult (FV-595/FV-596). Retained as regression
// coverage of the exported alias name the two Settings pages import.
// ---------------------------------------------------------------------------

describe("getDisplayedAppleProductIdResult", () => {
  it("IS getActiveAppleProductIdResult (thin alias, FV-596)", () => {
    expect(getDisplayedAppleProductIdResult).toBe(getActiveAppleProductIdResult);
  });

  it("returns the product_id for an allowlisted payer's subscribed Sandbox row", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getDisplayedAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: "tier_1_1athlete", readError: false });
  });

  it("returns null for a NON-allowlisted payer's Sandbox row (record §4.9 mirrored)", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = null; // not allowlisted
    const service = makeServiceMock();
    expect(
      await getDisplayedAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: false });
  });

  it("returns the product_id for a Production row regardless of allowlist status", async () => {
    appleSubRows = [
      {
        environment: "Production",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_2_2athletes",
      },
    ];
    allowlistRow = null;
    const service = makeServiceMock();
    expect(
      await getDisplayedAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: "tier_2_2athletes", readError: false });
  });

  it("prefers the Production row when both an active Production and an allowlisted Sandbox row exist", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
      {
        environment: "Production",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_2_2athletes",
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getDisplayedAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: "tier_2_2athletes", readError: false });
  });

  it("returns readError:true (never a silent null) on an apple_subscriptions DB error", async () => {
    appleSubSelectError = { message: "connection timeout" };
    const service = makeServiceMock();
    expect(
      await getDisplayedAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: true });
  });

  it("returns readError:true (never a silent null) on an allowlist DB error", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistError = { message: "allowlist read failed" };
    const service = makeServiceMock();
    expect(
      await getDisplayedAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: true });
  });

  it("returns null for an expired/revoked row even when the payer is allowlisted", async () => {
    appleSubRows = [
      {
        environment: "Sandbox",
        status: "revoked",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
        product_id: "tier_1_1athlete",
      },
    ];
    allowlistRow = { payer_id: PAYER_ID };
    const service = makeServiceMock();
    expect(
      await getDisplayedAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: false });
  });

  it("returns null when no rows exist at all", async () => {
    appleSubRows = [];
    const service = makeServiceMock();
    expect(
      await getDisplayedAppleProductIdResult(service as never, PAYER_ID, NOW),
    ).toEqual({ productId: null, readError: false });
  });
});
