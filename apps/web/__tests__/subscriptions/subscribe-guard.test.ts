/**
 * Unit tests for `getSubscribeEntitlementState`
 * (apps/web/lib/subscriptions/subscribe-guard.ts, FV-581).
 *
 * Deliberately does NOT mock `./access`, `./apple`, or `./grants` — mirrors
 * the style in `apple-access.test.ts`: only the low-level service-role
 * client is mocked, so this exercises the REAL fold logic
 * (getParentAccessLevel -> hasActiveCompGrant / subscriptionAccessLevel /
 * getAppleAccessLevelForPayer) end to end against a fake Postgres client.
 *
 * Covers:
 *   - entitled via Apple (Production, subscribed)
 *   - entitled via Stripe (active row)
 *   - entitled via a comp grant (no Stripe row, no Apple row)
 *   - not entitled (no subscription anywhere)
 *   - read errors on EACH of the four underlying sources -> "unknown", never
 *     silently treated as "not_entitled"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mutable table state
// ---------------------------------------------------------------------------

type Result<T> = { data: T; error: { message: string } | null };

const PAYER_ID = "eeeeeeee-0000-4000-8000-000000000005";
const NOW = new Date("2026-09-16T12:00:00.000Z");
const FUTURE_ISO = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

let accessGrantsResult: Result<Array<{ id: string; expires_at: string | null }>>;
let subscriptionsResult: Result<{ status: string } | null>;
let appleSubsListResult: Result<
  Array<{
    environment: "Sandbox" | "Production";
    status: string;
    expires_at: string;
    grace_period_expires_at: string | null;
  }>
>;
let appleSubsProductionSingleResult: Result<{
  product_id: string;
  status: string;
  expires_at: string;
  grace_period_expires_at: string | null;
} | null>;
let allowlistResult: Result<{ payer_id: string } | null>;

function resetState() {
  accessGrantsResult = { data: [], error: null };
  subscriptionsResult = { data: null, error: null };
  appleSubsListResult = { data: [], error: null };
  appleSubsProductionSingleResult = { data: null, error: null };
  allowlistResult = { data: null, error: null };
}

beforeEach(() => {
  resetState();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Fake Postgrest-ish query builder
// ---------------------------------------------------------------------------

/**
 * A single table can be queried via more than one chain shape across the
 * modules this test exercises:
 *   - `.select(...).eq(...)`                          -> awaited directly (array)
 *   - `.select(...).eq(...).maybeSingle()`             -> single row
 *   - `.select(...).eq(...).eq(...).maybeSingle()`     -> single row (2 filters)
 *   - `.select(...).eq(...).is(...)`                   -> awaited directly (array)
 * `eqCount` (closed over per `from()` call) distinguishes the 1-eq vs 2-eq
 * `.maybeSingle()` shapes; `.is()` is a no-op passthrough filter.
 */
function makeTable(config: {
  list?: Result<unknown[]>;
  single?: Result<unknown>;
  singleAfterTwoFilters?: Result<unknown>;
}) {
  let eqCount = 0;
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => {
      eqCount += 1;
      return builder;
    },
    is: () => builder,
    maybeSingle: async () => {
      if (eqCount >= 2 && config.singleAfterTwoFilters) {
        return config.singleAfterTwoFilters;
      }
      return config.single ?? { data: null, error: null };
    },
    then: (
      resolve: (v: Result<unknown[]>) => void,
      reject?: (e: unknown) => void,
    ) => Promise.resolve(config.list ?? { data: [], error: null }).then(resolve, reject),
  };
  return builder;
}

function makeServiceMock() {
  return {
    from: (table: string) => {
      switch (table) {
        case "access_grants":
          return makeTable({ list: accessGrantsResult as Result<unknown[]> });
        case "subscriptions":
          return makeTable({ single: subscriptionsResult });
        case "apple_subscriptions":
          return makeTable({
            list: appleSubsListResult as Result<unknown[]>,
            singleAfterTwoFilters: appleSubsProductionSingleResult,
          });
        case "apple_sandbox_testers":
          return makeTable({ single: allowlistResult });
        default:
          throw new Error(`unexpected table: ${table}`);
      }
    },
  };
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => makeServiceMock(),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { getSubscribeEntitlementState } from "@/lib/subscriptions/subscribe-guard";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getSubscribeEntitlementState", () => {
  it("entitled via Apple: Production row with status=subscribed", async () => {
    appleSubsListResult = {
      data: [
        {
          environment: "Production",
          status: "subscribed",
          expires_at: FUTURE_ISO,
          grace_period_expires_at: null,
        },
      ],
      error: null,
    };
    appleSubsProductionSingleResult = {
      data: {
        product_id: "tier_1_1athlete",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
      },
      error: null,
    };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "entitled", provider: "apple" });
  });

  it("entitled via Stripe: active subscriptions row, no Apple row", async () => {
    subscriptionsResult = { data: { status: "active" }, error: null };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "entitled", provider: "stripe" });
  });

  it("entitled via Stripe: trialing subscriptions row", async () => {
    subscriptionsResult = { data: { status: "trialing" }, error: null };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "entitled", provider: "stripe" });
  });

  it("entitled via comp grant: no Stripe row, no Apple row, active grant", async () => {
    accessGrantsResult = {
      data: [{ id: "grant-1", expires_at: null }],
      error: null,
    };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "entitled", provider: "comp" });
  });

  it("not entitled: no comp grant, no Stripe row, no Apple row", async () => {
    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "not_entitled", provider: null });
  });

  it("not entitled: canceled Stripe row (blocked, not full)", async () => {
    subscriptionsResult = { data: { status: "canceled" }, error: null };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "not_entitled", provider: null });
  });

  it("prefers apple as the reported provider when BOTH Apple and Stripe are active (duplicate billing)", async () => {
    subscriptionsResult = { data: { status: "active" }, error: null };
    appleSubsListResult = {
      data: [
        {
          environment: "Production",
          status: "subscribed",
          expires_at: FUTURE_ISO,
          grace_period_expires_at: null,
        },
      ],
      error: null,
    };
    appleSubsProductionSingleResult = {
      data: {
        product_id: "tier_1_1athlete",
        status: "subscribed",
        expires_at: FUTURE_ISO,
        grace_period_expires_at: null,
      },
      error: null,
    };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "entitled", provider: "apple" });
  });

  it("read error: access_grants -> unknown, never not_entitled", async () => {
    accessGrantsResult = { data: [], error: { message: "connection timeout" } };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "unknown", provider: null });
  });

  it("read error: subscriptions -> unknown, never not_entitled", async () => {
    subscriptionsResult = { data: null, error: { message: "connection timeout" } };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "unknown", provider: null });
  });

  it("read error: apple_subscriptions -> unknown, never not_entitled", async () => {
    appleSubsListResult = { data: [], error: { message: "connection timeout" } };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "unknown", provider: null });
  });

  it("read error: apple_sandbox_testers -> unknown, never not_entitled", async () => {
    allowlistResult = { data: null, error: { message: "connection timeout" } };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "unknown", provider: null });
  });

  it("read error takes priority even when the account WOULD have been entitled", async () => {
    // A real Stripe subscriber whose Apple-mirror read happens to fail must
    // never be told "not entitled" and shown a fresh buy button.
    subscriptionsResult = { data: { status: "active" }, error: null };
    appleSubsListResult = { data: [], error: { message: "connection timeout" } };

    const result = await getSubscribeEntitlementState(PAYER_ID);
    expect(result).toEqual({ status: "unknown", provider: null });
  });
});
