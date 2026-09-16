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
let appleSubSingleRow: AppleSubRow | null = null;
let appleSubSingleError: { message: string } | null = null;

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
        // Three call shapes hit this table across the module:
        //   1. getAppleAccessLevelForPayer: .select().eq() -> array (thenable)
        //   2. hasEverHeldAppleEntitlement: .select(..., {count,head}).eq().eq() -> {count}
        //   3. getActiveAppleProductId: .select().eq().eq().maybeSingle() -> single row
        // A count-mode select is distinguished by the presence of the count
        // option; we detect it via the second positional arg on `.select()`.
        let isCountQuery = false;
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            isCountQuery = Boolean(opts?.count);
            const chain: Record<string, unknown> = {
              eq: vi.fn(() => chain),
              maybeSingle: vi.fn().mockResolvedValue({
                data: appleSubSingleRow,
                error: appleSubSingleError,
              }),
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
} from "@/lib/subscriptions/apple";

const PAYER_ID = "dddddddd-0000-4000-8000-000000000004";
const NOW = new Date("2026-09-11T12:00:00.000Z");
const FUTURE_ISO = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

function resetState() {
  appleSubRows = [];
  appleSubSelectError = null;
  appleSubCount = 0;
  appleSubCountError = null;
  appleSubSingleRow = null;
  appleSubSingleError = null;
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
});

// ---------------------------------------------------------------------------
// getActiveAppleProductId — capacity-gate helper (qa-reviewer should-fix #1)
// ---------------------------------------------------------------------------

describe("getActiveAppleProductId", () => {
  it("returns null when the payer has no Production row", async () => {
    appleSubSingleRow = null;
    appleSubSingleError = null;
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).toBeNull();
  });

  it("returns the product_id for an active 'subscribed' row (within expires_at)", async () => {
    appleSubSingleRow = {
      environment: "Production",
      status: "subscribed",
      expires_at: FUTURE_ISO,
      grace_period_expires_at: null,
      product_id: "tier_1_1athlete",
    };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).toBe("tier_1_1athlete");
  });

  it("returns null for a 'expired' row (stale ceiling must not apply)", async () => {
    appleSubSingleRow = {
      environment: "Production",
      status: "expired",
      expires_at: FUTURE_ISO, // even with a future expires_at — expired is unconditional
      grace_period_expires_at: null,
      product_id: "tier_2_2athletes",
    };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).toBeNull();
  });

  it("returns null for a 'revoked' row", async () => {
    appleSubSingleRow = {
      environment: "Production",
      status: "revoked",
      expires_at: FUTURE_ISO,
      grace_period_expires_at: null,
      product_id: "tier_2_2athletes",
    };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).toBeNull();
  });

  it("still returns the product_id for 'in_billing_retry' (degraded, not blocked)", async () => {
    appleSubSingleRow = {
      environment: "Production",
      status: "in_billing_retry",
      expires_at: FUTURE_ISO,
      grace_period_expires_at: null,
      product_id: "tier_3_3athletes",
    };
    const service = makeServiceMock();
    expect(
      await getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).toBe("tier_3_3athletes");
  });

  it("returns null WITHOUT throwing on a DB error", async () => {
    appleSubSingleRow = null;
    appleSubSingleError = { message: "connection timeout" };
    const service = makeServiceMock();
    await expect(
      getActiveAppleProductId(service as never, PAYER_ID, NOW),
    ).resolves.toBeNull();
  });
});
