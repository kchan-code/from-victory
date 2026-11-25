/**
 * FV-669: account-only Google Play pilot. The payer-scoped gate, the
 * entitlement reads, purchase admission, the stall check and the reconcile
 * pass, each as a matrix:
 *   both flags unset | pilot on + allowlisted | pilot on + NOT allowlisted |
 *   pilot on + allowlist lookup error | global on (existing behavior).
 * Supabase is an in-memory fake; Google is never called.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/subscriptions/google-play-auth", () => ({
  getPlayAccessToken: async () => "FAKE_ACCESS_TOKEN",
}));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: () => {} }));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: () => Promise.resolve() }));
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({ subscriptions: { retrieve: vi.fn(), list: vi.fn() } }),
}));
vi.mock("@/lib/subscriptions/apple-lifecycle", () => ({ reconcileAppleSubscription: vi.fn() }));

const processMock = vi.fn();
vi.mock("@/lib/subscriptions/google-play-rtdn", () => ({
  processGoogleNotification: (...a: unknown[]) => processMock(...a),
}));

type Row = Record<string, unknown>;
type Query = { table: string; eq: Array<[string, unknown]>; in: Array<[string, unknown[]]> };

const PAYER = "bbbbbbbb-0000-4000-8000-000000000002";
const OTHER = "cccccccc-0000-4000-8000-000000000003";
const FUTURE = "2099-01-01T00:00:00.000Z";

let testers: Set<string>;
let testerError: boolean;
let testerThrows: boolean;
let subRows: Row[];
let queries: Query[];

function fakeService() {
  return {
    from: (table: string) => {
      const q: Query = { table, eq: [], in: [] };
      queries.push(q);
      const result = (): { data: unknown; error: unknown; count?: number } => {
        if (table === "google_license_testers") {
          if (testerThrows) throw new Error("exploded");
          if (testerError) return { data: null, error: { code: "XX000", message: "boom" } };
          const payer = q.eq.find(([c]) => c === "payer_id")?.[1];
          if (payer !== undefined) {
            return { data: testers.has(payer as string) ? { payer_id: payer } : null, error: null };
          }
          return { data: [...testers].map((p) => ({ payer_id: p })), error: null };
        }
        let rows = subRows;
        for (const [c, v] of q.eq) rows = rows.filter((r) => r[c] === v);
        for (const [c, v] of q.in) rows = rows.filter((r) => v.includes(r[c]));
        return { data: rows, error: null, count: rows.length };
      };
      const api: Record<string, unknown> = {};
      const chain = () => api;
      api.select = chain;
      api.not = chain;
      api.lt = chain;
      api.lte = chain;
      api.gt = chain;
      api.order = chain;
      api.range = chain;
      api.eq = (c: string, v: unknown) => {
        q.eq.push([c, v]);
        return api;
      };
      api.in = (c: string, v: unknown[]) => {
        q.in.push([c, v]);
        return api;
      };
      api.limit = async () => result();
      api.maybeSingle = async () => result();
      api.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve()
          .then(result)
          .then(res, rej);
      return api;
    },
  };
}

vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => fakeService() }));

import {
  isGooglePlayActiveForPayer,
  listAllowlistedPayerIds,
} from "@/lib/subscriptions/google-play-pilot";
import {
  isGooglePlayCatalogActive,
  isGooglePlayPilotActive,
} from "@/lib/subscriptions/google-product-catalog";
import {
  getGoogleCancelableSubscriptionsForPayer,
  getGoogleEntitlementSnapshotForPayer,
  hasEverHeldGoogleEntitlement,
} from "@/lib/subscriptions/google";
import { GoogleDbError, checkPurchaseAdmission } from "@/lib/subscriptions/google-play-sync";
import { parseSubscriptionPurchaseV2 } from "@/lib/subscriptions/google-play-api";
import { checkGooglePipelineStalls } from "@/lib/subscriptions/google-play-health";
import { reconcileGooglePass } from "@/lib/subscriptions/google-reconcile";
import { subscriptionV2Fixture, type FixtureOptions } from "../fixtures/google-play-fixtures";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: test double only
const service = () => fakeService() as any;
const subQueries = () => queries.filter((q) => q.table === "google_subscriptions");
const testerQueries = () => queries.filter((q) => q.table === "google_license_testers");

function purchase(o: FixtureOptions = {}) {
  const parsed = parseSubscriptionPurchaseV2(subscriptionV2Fixture(o));
  if (!parsed.ok) throw new Error("fixture did not parse");
  return parsed.purchase;
}

const activeRow = (over: Row = {}): Row => ({
  payer_id: PAYER,
  product_id: "family.1",
  purchase_token: "tok",
  status: "active",
  expires_at: FUTURE,
  is_test_purchase: true,
  acknowledged: true,
  ...over,
});

function flags(o: { global?: string; pilot?: string }) {
  if (o.global === undefined) delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
  else process.env.GOOGLE_PLAY_CATALOG_ACTIVE = o.global;
  if (o.pilot === undefined) delete process.env.GOOGLE_PLAY_PILOT_ACTIVE;
  else process.env.GOOGLE_PLAY_PILOT_ACTIVE = o.pilot;
}

beforeEach(() => {
  testers = new Set();
  testerError = false;
  testerThrows = false;
  subRows = [];
  queries = [];
  processMock.mockReset();
  processMock.mockResolvedValue("applied");
  flags({});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  flags({});
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------

describe("isGooglePlayPilotActive", () => {
  it("is on only for the exact string \"1\"", () => {
    for (const v of [undefined, "", "0", "true", "yes", " 1", "1 "]) {
      flags({ pilot: v });
      expect(isGooglePlayPilotActive()).toBe(false);
    }
    flags({ pilot: "1" });
    expect(isGooglePlayPilotActive()).toBe(true);
    // The pilot flag never turns the global flag on.
    expect(isGooglePlayCatalogActive()).toBe(false);
  });
});

describe("isGooglePlayActiveForPayer", () => {
  it("both flags unset: false, no lookup", async () => {
    testers.add(PAYER);
    expect(await isGooglePlayActiveForPayer(service(), PAYER)).toBe(false);
    expect(queries).toEqual([]);
  });

  it("global flag on: true for any payer, no lookup", async () => {
    flags({ global: "1" });
    expect(await isGooglePlayActiveForPayer(service(), OTHER)).toBe(true);
    expect(queries).toEqual([]);
  });

  it("pilot on + allowlisted: true; pilot on + not allowlisted: false", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    expect(await isGooglePlayActiveForPayer(service(), PAYER)).toBe(true);
    expect(await isGooglePlayActiveForPayer(service(), OTHER)).toBe(false);
  });

  it("pilot on: empty / missing payer id is false with no lookup", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    expect(await isGooglePlayActiveForPayer(service(), "")).toBe(false);
    expect(await isGooglePlayActiveForPayer(service(), null)).toBe(false);
    expect(await isGooglePlayActiveForPayer(service(), undefined)).toBe(false);
    expect(queries).toEqual([]);
  });

  it("pilot on: a database error or a thrown exception is false, never thrown", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    testerError = true;
    expect(await isGooglePlayActiveForPayer(service(), PAYER)).toBe(false);
    testerError = false;
    testerThrows = true;
    expect(await isGooglePlayActiveForPayer(service(), PAYER)).toBe(false);
  });
});

describe("listAllowlistedPayerIds", () => {
  it("returns ids, or null on error / throw", async () => {
    testers.add(PAYER);
    expect(await listAllowlistedPayerIds(service())).toEqual([PAYER]);
    testerError = true;
    expect(await listAllowlistedPayerIds(service())).toBeNull();
    testerError = false;
    testerThrows = true;
    expect(await listAllowlistedPayerIds(service())).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Entitlement reads
// ---------------------------------------------------------------------------

describe("getGoogleEntitlementSnapshotForPayer", () => {
  it("both flags unset: blocked, no query at all", async () => {
    subRows = [activeRow()];
    testers.add(PAYER);
    expect((await getGoogleEntitlementSnapshotForPayer(service(), PAYER)).level).toBe("blocked");
    expect(queries).toEqual([]);
  });

  it("pilot + allowlisted + TEST row: full access, and the read is scoped to test rows", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    subRows = [activeRow()];
    const snap = await getGoogleEntitlementSnapshotForPayer(service(), PAYER);
    expect(snap).toMatchObject({ level: "full", activeProductId: "family.1" });
    expect(subQueries()[0]?.eq).toContainEqual(["is_test_purchase", true]);
  });

  it("pilot + allowlisted + only a REAL row: blocked (a non-test row never grants in pilot mode)", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    subRows = [activeRow({ is_test_purchase: false })];
    expect((await getGoogleEntitlementSnapshotForPayer(service(), PAYER)).level).toBe("blocked");
  });

  it("pilot + NOT allowlisted: blocked, google_subscriptions is never read", async () => {
    flags({ pilot: "1" });
    subRows = [activeRow()];
    expect((await getGoogleEntitlementSnapshotForPayer(service(), PAYER)).level).toBe("blocked");
    expect(subQueries()).toEqual([]);
  });

  it("pilot + allowlist lookup error: blocked, google_subscriptions is never read", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    testerError = true;
    subRows = [activeRow()];
    expect((await getGoogleEntitlementSnapshotForPayer(service(), PAYER)).level).toBe("blocked");
    expect(subQueries()).toEqual([]);
  });

  it("global flag on: unchanged (a real row grants, no allowlist lookup, no test-row filter)", async () => {
    flags({ global: "1", pilot: "1" });
    subRows = [activeRow({ is_test_purchase: false })];
    expect((await getGoogleEntitlementSnapshotForPayer(service(), PAYER)).level).toBe("full");
    expect(testerQueries()).toEqual([]);
    expect(subQueries()[0]?.eq.some(([c]) => c === "is_test_purchase")).toBe(false);
  });
});

describe("getGoogleCancelableSubscriptionsForPayer", () => {
  it("both flags unset: empty, no query", async () => {
    subRows = [activeRow()];
    expect(await getGoogleCancelableSubscriptionsForPayer(service(), PAYER)).toEqual({ rows: [], readError: false });
    expect(queries).toEqual([]);
  });

  it("pilot + allowlisted: only TEST rows are returned", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    subRows = [activeRow({ purchase_token: "t" }), activeRow({ purchase_token: "r", is_test_purchase: false })];
    const res = await getGoogleCancelableSubscriptionsForPayer(service(), PAYER);
    expect(res.rows.map((r) => r.purchase_token)).toEqual(["t"]);
  });

  it("pilot + NOT allowlisted, or lookup error: empty, google_subscriptions never read", async () => {
    flags({ pilot: "1" });
    subRows = [activeRow()];
    expect((await getGoogleCancelableSubscriptionsForPayer(service(), PAYER)).rows).toEqual([]);
    testers.add(PAYER);
    testerError = true;
    expect((await getGoogleCancelableSubscriptionsForPayer(service(), PAYER)).rows).toEqual([]);
    expect(subQueries()).toEqual([]);
  });

  it("global flag on: unchanged (real rows included)", async () => {
    flags({ global: "1" });
    subRows = [activeRow({ is_test_purchase: false })];
    expect((await getGoogleCancelableSubscriptionsForPayer(service(), PAYER)).rows).toHaveLength(1);
  });
});

describe("hasEverHeldGoogleEntitlement", () => {
  it("both flags unset, or pilot + not allowlisted, or lookup error: false with no google_subscriptions read", async () => {
    subRows = [activeRow({ is_test_purchase: false })];
    expect(await hasEverHeldGoogleEntitlement(service(), PAYER)).toBe(false);
    flags({ pilot: "1" });
    expect(await hasEverHeldGoogleEntitlement(service(), PAYER)).toBe(false);
    testers.add(PAYER);
    testerError = true;
    expect(await hasEverHeldGoogleEntitlement(service(), PAYER)).toBe(false);
    expect(subQueries()).toEqual([]);
  });

  it("pilot + allowlisted: reads, and a test row does not count as ever-held (existing rule)", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    subRows = [activeRow()];
    expect(await hasEverHeldGoogleEntitlement(service(), PAYER)).toBe(false);
    expect(subQueries()).toHaveLength(1);
  });

  it("global flag on: unchanged", async () => {
    flags({ global: "1" });
    subRows = [activeRow({ is_test_purchase: false })];
    expect(await hasEverHeldGoogleEntitlement(service(), PAYER)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Purchase admission
// ---------------------------------------------------------------------------

describe("checkPurchaseAdmission", () => {
  it("pilot (global off) + allowlisted + TEST purchase: admitted", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    expect(await checkPurchaseAdmission(service(), PAYER, purchase({ testPurchase: true }))).toBeNull();
  });

  it("pilot + allowlisted + REAL purchase: pilot_real_purchase_rejected", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    expect(await checkPurchaseAdmission(service(), PAYER, purchase())).toBe("pilot_real_purchase_rejected");
  });

  it("pilot + NOT allowlisted + TEST purchase: test_purchase_rejected", async () => {
    flags({ pilot: "1" });
    expect(await checkPurchaseAdmission(service(), PAYER, purchase({ testPurchase: true }))).toBe(
      "test_purchase_rejected",
    );
  });

  it("pilot + NOT allowlisted + REAL purchase: pilot_real_purchase_rejected", async () => {
    flags({ pilot: "1" });
    expect(await checkPurchaseAdmission(service(), PAYER, purchase())).toBe("pilot_real_purchase_rejected");
  });

  it("pilot + allowlist lookup error on a TEST purchase: throws (nothing admitted)", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    testerError = true;
    await expect(checkPurchaseAdmission(service(), PAYER, purchase({ testPurchase: true }))).rejects.toBeInstanceOf(
      GoogleDbError,
    );
  });

  it("unknown product is refused first, in either mode", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    expect(await checkPurchaseAdmission(service(), PAYER, purchase({ productId: "nope", testPurchase: true }))).toBe(
      "unknown_product",
    );
  });

  it("global flag on: existing rules (a real purchase is admitted for any payer; a test purchase needs the allowlist)", async () => {
    flags({ global: "1", pilot: "1" });
    expect(await checkPurchaseAdmission(service(), PAYER, purchase())).toBeNull();
    expect(await checkPurchaseAdmission(service(), PAYER, purchase({ testPurchase: true }))).toBe(
      "test_purchase_rejected",
    );
    testers.add(PAYER);
    expect(await checkPurchaseAdmission(service(), PAYER, purchase({ testPurchase: true }))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Stall check (health) and reconcile pass
// ---------------------------------------------------------------------------

const NOW = new Date("2030-06-15T12:00:00.000Z");
const stalledRow = (over: Row = {}): Row =>
  activeRow({ expires_at: "2030-06-01T00:00:00.000Z", last_verified_at: null, ...over });

describe("checkGooglePipelineStalls", () => {
  it("both flags unset: null, no database access", async () => {
    expect(await checkGooglePipelineStalls({ now: () => NOW })).toBeNull();
    expect(queries).toEqual([]);
  });

  it("pilot + allowlisted: counts only allowlisted payers' TEST rows", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    subRows = [
      stalledRow(),
      stalledRow({ payer_id: OTHER }),
      stalledRow({ is_test_purchase: false }),
    ];
    expect(await checkGooglePipelineStalls({ now: () => NOW })).toBe(1);
    const q = subQueries()[0];
    expect(q?.in).toContainEqual(["payer_id", [PAYER]]);
    expect(q?.eq).toContainEqual(["is_test_purchase", true]);
  });

  it("pilot + empty allowlist: 0 and google_subscriptions never read; lookup error: null", async () => {
    flags({ pilot: "1" });
    subRows = [stalledRow()];
    expect(await checkGooglePipelineStalls({ now: () => NOW })).toBe(0);
    testerError = true;
    expect(await checkGooglePipelineStalls({ now: () => NOW })).toBeNull();
    expect(subQueries()).toEqual([]);
  });

  it("global flag on: unchanged (no allowlist lookup, no payer scoping)", async () => {
    flags({ global: "1" });
    subRows = [stalledRow({ is_test_purchase: false }), stalledRow({ payer_id: OTHER })];
    expect(await checkGooglePipelineStalls({ now: () => NOW })).toBe(2);
    expect(testerQueries()).toEqual([]);
    expect(subQueries()[0]?.in.some(([c]) => c === "payer_id")).toBe(false);
  });
});

describe("reconcileGooglePass", () => {
  const dueRow = (over: Row = {}): Row =>
    activeRow({ id: "row-1", purchase_token: "tok-1", expires_at: "2030-06-15T18:00:00.000Z", ...over });
  const deadline = () => Date.now() + 60_000;

  it("both flags unset: nothing listed, nothing processed", async () => {
    subRows = [dueRow()];
    const counts = await reconcileGooglePass(service(), deadline(), NOW);
    expect(counts.checked).toBe(0);
    expect(queries).toEqual([]);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("pilot + allowlisted: only allowlisted payers' TEST rows are processed", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    subRows = [
      dueRow(),
      dueRow({ id: "row-2", purchase_token: "tok-2", payer_id: OTHER }),
      dueRow({ id: "row-3", purchase_token: "tok-3", is_test_purchase: false }),
    ];
    const counts = await reconcileGooglePass(service(), deadline(), NOW);
    expect(counts.checked).toBe(1);
    expect(processMock).toHaveBeenCalledTimes(1);
    expect(processMock.mock.calls[0]?.[0]).toEqual({ kind: "subscription", purchaseToken: "tok-1" });
  });

  it("pilot + NOT allowlisted (empty allowlist): nothing listed or processed", async () => {
    flags({ pilot: "1" });
    subRows = [dueRow()];
    const counts = await reconcileGooglePass(service(), deadline(), NOW);
    expect(counts.checked).toBe(0);
    expect(subQueries()).toEqual([]);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("pilot + allowlist lookup error: nothing processed, counted as a failure", async () => {
    flags({ pilot: "1" });
    testers.add(PAYER);
    testerError = true;
    subRows = [dueRow()];
    const counts = await reconcileGooglePass(service(), deadline(), NOW);
    expect(counts.failed).toBe(1);
    expect(subQueries()).toEqual([]);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("global flag on: unchanged (every due row is processed, no allowlist lookup)", async () => {
    flags({ global: "1" });
    subRows = [dueRow({ is_test_purchase: false }), dueRow({ id: "row-2", purchase_token: "tok-2", payer_id: OTHER })];
    const counts = await reconcileGooglePass(service(), deadline(), NOW);
    expect(counts.checked).toBe(2);
    expect(testerQueries()).toEqual([]);
  });
});
