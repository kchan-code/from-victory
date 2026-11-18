/**
 * Tests for app/api/cron/reconcile-subscriptions/route.ts (FV-709).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: vi.fn() }));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: vi.fn().mockResolvedValue(undefined) }));

const retrieveMock = vi.fn();
const listMock = vi.fn();
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({ subscriptions: { retrieve: retrieveMock, list: listMock } }),
}));

const reconcileAppleMock = vi.fn();
vi.mock("@/lib/subscriptions/apple-lifecycle", () => ({
  reconcileAppleSubscription: (...a: unknown[]) => reconcileAppleMock(...a),
}));

type Row = Record<string, unknown>;
let stripeRows: Row[] = [];
let appleRows: Row[] = [];
let updates: Row[] = [];
let updateResult: Row[] = [{ parent_id: "p" }];
type AppleFilterOp = "eq" | "in" | "gt" | "lte";
type AppleFilter = [AppleFilterOp, string, unknown];
let appleQueryFilters: AppleFilter[][] = [];
// Filters applied to `subscriptions` AFTER .update() — i.e. the write guard.
let stripeUpdateFilters: Array<[string, string, unknown]> = [];
// Row returned by the post-reconcile re-read (appleRowChanged).
let appleAfter: Row | null = null;

function applyAppleFilters(rows: Row[], filters: AppleFilter[]) {
  return rows.filter((row) =>
    filters.every(([op, col, value]) => {
      const cell = row[col];
      if (op === "eq") return cell === value;
      if (op === "in") {
        return Array.isArray(value) && value.includes(cell as string | number);
      }
      if (op === "gt") {
        return (
          typeof cell === "string" &&
          typeof value === "string" &&
          Date.parse(cell) > Date.parse(value)
        );
      }
      if (op === "lte") {
        return (
          typeof cell === "string" &&
          typeof value === "string" &&
          Date.parse(cell) <= Date.parse(value)
        );
      }
      return false;
    }),
  );
}

function builder(table: string) {
  let isUpdate = false;
  let appleFilters: AppleFilter[] = [];
  const b: Record<string, unknown> = {};
  const self = () => b;
  for (const m of ["select", "not", "order", "range"]) b[m] = self;
  b.lte = (col: string, val: unknown) => {
    if (table === "apple_subscriptions")
      appleFilters.push(["lte", col, val] as AppleFilter);
    return b;
  };
  b.gt = (col: string, val: unknown) => {
    if (table === "apple_subscriptions")
      appleFilters.push(["gt", col, val] as AppleFilter);
    return b;
  };
  b.is = (col: string, val: unknown) => {
    if (table === "subscriptions" && isUpdate) stripeUpdateFilters.push(["is", col, val]);
    return b;
  };
  b.eq = (col: string, val: unknown) => {
    if (table === "apple_subscriptions")
      appleFilters.push(["eq", col, val] as AppleFilter);
    if (table === "subscriptions" && isUpdate) stripeUpdateFilters.push(["eq", col, val]);
    return b;
  };
  b.in = (col: string, val: unknown) => {
    if (table === "apple_subscriptions")
      appleFilters.push(["in", col, val] as AppleFilter);
    return b;
  };
  b.update = (payload: Row) => {
    isUpdate = true;
    updates.push(payload);
    return b;
  };
  b.maybeSingle = () => Promise.resolve({ data: appleAfter, error: null });
  b.then = (resolve: (v: unknown) => void) => {
    if (table === "apple_subscriptions") {
      appleQueryFilters.push([...appleFilters]);
    }
    resolve({
      data:
        isUpdate
          ? updateResult
          : table === "subscriptions"
            ? stripeRows
            : applyAppleFilters(appleRows, appleFilters),
      error: null,
    });
  };
  return b;
}
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: (t: string) => builder(t) }),
}));

import { GET, POST } from "@/app/api/cron/reconcile-subscriptions/route";
import {
  APPLE_BATCH_CAP,
  APPLE_EXPIRED_LOOKBACK_MS,
  CLOCK_SKEW_MARGIN_MS,
  STRIPE_BATCH_CAP,
  reconcileApplePass,
  reconcileStripePass,
  rotateWindow,
} from "@/lib/subscriptions/reconcile";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";

function makeReq(auth?: string): NextRequest {
  const headers = new Headers();
  if (auth) headers.set("authorization", auth);
  return { headers } as unknown as NextRequest;
}
const OK = "Bearer test-cron-secret";

function dbRow(over: Row = {}): Row {
  return {
    parent_id: "11111111-1111-1111-1111-111111111111",
    stripe_subscription_id: "sub_1",
    stripe_customer_id: "cus_secret",
    status: "active",
    price_id: "price_1",
    current_period_end: "2030-01-01T00:00:00.000Z",
    cancel_at_period_end: false,
    last_stripe_event_at: null,
    ...over,
  };
}
function stripeSub(over: Row = {}) {
  return {
    id: "sub_1",
    customer: "cus_secret",
    status: "active",
    cancel_at_period_end: false,
    items: { data: [{ price: { id: "price_1" }, current_period_end: 1893456000 }] },
    ...over,
  };
}

function appleRow(over: Row = {}): Row {
  return {
    payer_id: "payer-1",
    environment: "Production",
    status: "subscribed",
    product_id: "fv.monthly",
    expires_at: "2026-11-01T00:00:00.000Z",
    grace_period_expires_at: null,
    ...over,
  };
}

const ORIGINAL = process.env.CRON_SECRET;
beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-cron-secret";
  stripeRows = [];
  appleRows = [];
  updates = [];
  appleQueryFilters = [];
  stripeUpdateFilters = [];
  appleAfter = null;
  // Default: the customer has no other subscription (no survivor).
  listMock.mockResolvedValue({ data: [] });
  updateResult = [{ parent_id: "p" }];
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL;
});

describe("auth", () => {
  it("missing header -> 401", async () => {
    expect((await GET(makeReq())).status).toBe(401);
  });
  it("wrong secret -> 401", async () => {
    expect((await POST(makeReq("Bearer nope"))).status).toBe(401);
    expect(retrieveMock).not.toHaveBeenCalled();
  });
  it("secret unset -> 500 (fail closed)", async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(makeReq(OK))).status).toBe(500);
  });
});

describe("stripe pass", () => {
  it("row stuck active while Stripe says canceled -> corrected + alert", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    const res = await GET(makeReq(OK));
    const body = await res.json();
    expect(body.stripe).toMatchObject({ checked: 1, corrected: 1, failed: 0 });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ status: "canceled" });
    expect(typeof updates[0]?.last_stripe_event_at).toBe("string");
    expect(notifyError).toHaveBeenCalledTimes(1);
    expect(deliverInBackground).toHaveBeenCalledTimes(1);
  });

  it("already in sync -> no write, no alert", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub());
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({ checked: 1, corrected: 0 });
    expect(updates).toHaveLength(0);
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("resource_missing -> no status change, counted, alerted", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockRejectedValue(Object.assign(new Error("gone"), { code: "resource_missing" }));
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({ checked: 1, missing: 1, failed: 0, corrected: 0 });
    expect(updates).toHaveLength(0);
    expect(notifyError).toHaveBeenCalledTimes(1);
  });

  it("one row throwing does not stop the others", async () => {
    stripeRows = [
      dbRow({ parent_id: "a", stripe_subscription_id: "sub_bad" }),
      dbRow({ parent_id: "b", stripe_subscription_id: "sub_ok" }),
    ];
    retrieveMock.mockImplementation(async (id: string) => {
      if (id === "sub_bad") throw new Error("boom");
      return stripeSub({ id, status: "canceled" });
    });
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({ checked: 2, failed: 1, corrected: 1 });
    expect(notifyError).toHaveBeenCalledTimes(1);
  });

  it("webhook raced the update (0 rows matched) -> counted raced, no alert", async () => {
    stripeRows = [dbRow()];
    updateResult = [];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({ corrected: 0, raced: 1 });
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("stored watermark newer than our retrieve -> no write", async () => {
    stripeRows = [dbRow({ last_stripe_event_at: "2999-01-01T00:00:00.000Z" })];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({ raced: 1, corrected: 0 });
    expect(updates).toHaveLength(0);
  });
});

describe("tracked subscription ended, another is live (FV-711 survivor)", () => {
  it("moves the row to the surviving live subscription instead of canceling", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    listMock.mockResolvedValue({
      data: [
        { ...stripeSub({ status: "canceled" }), created: 1 },
        { ...stripeSub({ id: "sub_2", status: "active" }), created: 2 },
      ],
    });
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({ corrected: 1 });
    expect(updates[0]).toMatchObject({ stripe_subscription_id: "sub_2", status: "active" });
    expect(listMock).toHaveBeenCalledWith(
      { customer: "cus_secret", status: "all", limit: 20 },
      { timeout: 10_000 },
    );
  });

  it("no survivor -> row goes canceled as before", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    await GET(makeReq(OK));
    expect(updates[0]).toMatchObject({ stripe_subscription_id: "sub_1", status: "canceled" });
  });

  it("survivor lookup fails -> row untouched, counted failed", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    listMock.mockRejectedValue(new Error("stripe down"));
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({ failed: 1, corrected: 0 });
    expect(updates).toHaveLength(0);
  });

  it("live tracked subscription -> no survivor lookup", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub());
    await GET(makeReq(OK));
    expect(listMock).not.toHaveBeenCalled();
  });
});

describe("stripe watermark + write guard", () => {
  const NOW = new Date("2026-11-13T04:30:07.400Z");
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("null stored watermark: writes floor(now) minus skew margin, guarded by IS NULL", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    await GET(makeReq(OK));
    const expected = new Date(
      Date.parse("2026-11-13T04:30:07.000Z") - CLOCK_SKEW_MARGIN_MS,
    ).toISOString();
    expect(updates[0]?.last_stripe_event_at).toBe(expected);
    expect(stripeUpdateFilters).toContainEqual(["is", "last_stripe_event_at", null]);
    expect(stripeUpdateFilters).toContainEqual(["eq", "parent_id", dbRow().parent_id]);
    // Guarded on the tracked subscription too (checkout can move it without a watermark).
    expect(stripeUpdateFilters).toContainEqual(["eq", "stripe_subscription_id", "sub_1"]);
  });

  it("older stored watermark: advances it, guarded by equality on the value read", async () => {
    const stored = "2026-11-01T00:00:00+00:00";
    stripeRows = [dbRow({ last_stripe_event_at: stored })];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    await GET(makeReq(OK));
    expect(Date.parse(updates[0]?.last_stripe_event_at as string)).toBe(
      Date.parse("2026-11-13T04:30:07.000Z") - CLOCK_SKEW_MARGIN_MS,
    );
    expect(stripeUpdateFilters).toContainEqual(["eq", "last_stripe_event_at", stored]);
  });

  it("stored watermark inside the skew margin -> raced, no write", async () => {
    stripeRows = [dbRow({ last_stripe_event_at: "2026-11-13T04:30:05.000Z" })];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({ raced: 1, corrected: 0 });
    expect(updates).toHaveLength(0);
  });

  it("passes a per-call timeout to Stripe", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub());
    await GET(makeReq(OK));
    expect(retrieveMock).toHaveBeenCalledWith("sub_1", {}, { timeout: 10_000 });
  });
});

describe("drift detection covers every synced field", () => {
  it.each([
    ["price", stripeSub({ items: { data: [{ price: { id: "price_2" }, current_period_end: 1893456000 }] } })],
    ["period end", stripeSub({ items: { data: [{ price: { id: "price_1" }, current_period_end: 1893456001 }] } })],
    ["cancel flag", stripeSub({ cancel_at_period_end: true })],
    ["customer", stripeSub({ customer: "cus_other" })],
  ])("%s differs -> corrected", async (_name, sub) => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(sub);
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({ corrected: 1 });
  });
});

describe("bounded work", () => {
  it("rotateWindow: under the cap is untouched; over the cap every row is reached across days", () => {
    const small = [1, 2, 3];
    expect(rotateWindow(small, 5, new Date(0))).toEqual(small);
    const rows = Array.from({ length: 250 }, (_, i) => i);
    const seen = new Set<number>();
    for (let day = 0; day < 5; day++) {
      const w = rotateWindow(rows, 100, new Date(day * 86_400_000)).slice(0, 100);
      w.forEach((r) => seen.add(r));
    }
    expect(seen.size).toBe(250);
  });

  it("250 eligible rows: checks the cap, defers the rest, and alerts", async () => {
    stripeRows = Array.from({ length: 250 }, (_, i) =>
      dbRow({ parent_id: `p${i}`, stripe_subscription_id: `sub_${i}` }),
    );
    retrieveMock.mockImplementation(async (id: string) => stripeSub({ id }));
    const body = await (await GET(makeReq(OK))).json();
    expect(body.stripe).toMatchObject({
      checked: STRIPE_BATCH_CAP,
      deferred: 250 - STRIPE_BATCH_CAP,
      corrected: 0,
    });
    expect(notifyError).toHaveBeenCalledTimes(1);
  });

  it("deadline already passed: starts nothing and reports everything deferred", async () => {
    stripeRows = [dbRow(), dbRow({ parent_id: "b" })];
    const counts = await reconcileStripePass(
      { from: (t: string) => builder(t) } as never,
      Date.now() - 1,
    );
    expect(counts).toMatchObject({ checked: 0, deferred: 2 });
    expect(retrieveMock).not.toHaveBeenCalled();
  });
});

describe("apple pass", () => {
  it("pins the expired lookback window to exactly 7 days", () => {
    expect(APPLE_EXPIRED_LOOKBACK_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("Production row with live renewal -> reconcile called and counted", async () => {
    const before = appleRow({
      payer_id: "payer-1",
      status: "subscribed",
      expires_at: "2026-11-01T00:00:00+00:00",
    });
    appleRows = [before];
    // The lost DID_RENEW: Apple says the period was extended.
    appleAfter = { ...before, expires_at: "2026-12-01T00:00:00+00:00" };
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: true });
    const body = await (await GET(makeReq(OK))).json();
    expect(reconcileAppleMock).toHaveBeenCalledWith(expect.anything(), "payer-1", "Production");
    expect(body.apple).toMatchObject({ checked: 1, corrected: 1 });
    expect(notifyError).toHaveBeenCalledTimes(1);
  });

  it("snapshot applied but access columns unchanged -> not drift, no alert", async () => {
    const before = appleRow({
      payer_id: "payer-1",
      status: "subscribed",
      expires_at: "2026-11-14T00:00:00+00:00",
    });
    appleRows = [before];
    // Same instant, different serialization: must still compare equal.
    appleAfter = { ...before, expires_at: "2026-11-14T00:00:00.000Z" };
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: true });
    const body = await (await GET(makeReq(OK))).json();
    expect(body.apple).toMatchObject({ checked: 1, corrected: 0 });
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("records live and expired query filters independently", async () => {
    const now = new Date("2026-11-18T15:00:00.000Z");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(now);
      const liveHorizonIso = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const floorIso = new Date(now.getTime() - APPLE_EXPIRED_LOOKBACK_MS).toISOString();
      const nowIso = now.toISOString();
      appleRows = [appleRow({ payer_id: "live-row", expires_at: liveHorizonIso })];

      await GET(makeReq(OK));

      const liveQuery = appleQueryFilters.find((filters) =>
        filters.some(([op, col]) => op === "in" && col === "status"),
      );
      const expiredQuery = appleQueryFilters.find((filters) =>
        filters.some(
          ([op, col, value]) => op === "eq" && col === "status" && value === "expired",
        ),
      );
      expect(liveQuery).toEqual(
        expect.arrayContaining([
          ["eq", "environment", "Production"],
          [
            "in",
            "status",
            ["subscribed", "in_grace_period", "in_billing_retry"],
          ],
          ["lte", "expires_at", liveHorizonIso],
        ]),
      );
      expect(expiredQuery).toEqual(
        expect.arrayContaining([
          ["eq", "environment", "Production"],
          ["eq", "status", "expired"],
          ["gt", "expires_at", floorIso],
          ["lte", "expires_at", nowIso],
        ]),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("expired bucket enforces window boundaries and excludes revoked/sandbox/old rows", async () => {
    const now = new Date("2026-11-18T15:00:00.000Z");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(now);
      const floorIso = new Date(
        now.getTime() - APPLE_EXPIRED_LOOKBACK_MS,
      ).toISOString();
      const floorPlusOneIso = new Date(
        now.getTime() - APPLE_EXPIRED_LOOKBACK_MS + 1,
      ).toISOString();
      const nowIso = now.toISOString();
      const nowPlusOneIso = new Date(now.getTime() + 1).toISOString();
      const oldIso = new Date(
        now.getTime() - APPLE_EXPIRED_LOOKBACK_MS - 1,
      ).toISOString();

      appleRows = [
        appleRow({ payer_id: "expired-at-floor", status: "expired", expires_at: floorIso }),
        appleRow({
          payer_id: "expired-after-floor",
          status: "expired",
          expires_at: floorPlusOneIso,
        }),
        appleRow({ payer_id: "expired-at-now", status: "expired", expires_at: nowIso }),
        appleRow({
          payer_id: "expired-after-now",
          status: "expired",
          expires_at: nowPlusOneIso,
        }),
        appleRow({ payer_id: "expired-old", status: "expired", expires_at: oldIso }),
        appleRow({ payer_id: "revoked-inside-window", status: "revoked", expires_at: nowIso }),
        appleRow({
          payer_id: "sandbox-expired",
          environment: "Sandbox",
          status: "expired",
          expires_at: nowIso,
        }),
      ];

      await GET(makeReq(OK));

      const payers = reconcileAppleMock.mock.calls.map(([, payerId]) => String(payerId));
      expect(payers).toContain("expired-after-floor");
      expect(payers).toContain("expired-at-now");
      expect(payers).not.toContain("expired-at-floor");
      expect(payers).not.toContain("expired-after-now");
      expect(payers).not.toContain("expired-old");
      expect(payers).not.toContain("revoked-inside-window");
      expect(payers).not.toContain("sandbox-expired");
    } finally {
      vi.useRealTimers();
    }
  });

  it("apple row throwing is counted failed and does not stop the next", async () => {
    appleRows = [appleRow({ payer_id: "p1" }), appleRow({ payer_id: "p2" })];
    reconcileAppleMock
      .mockRejectedValueOnce(new Error("apple down"))
      .mockResolvedValueOnce({ ok: true, applied: false });
    const body = await (await GET(makeReq(OK))).json();
    expect(body.apple).toMatchObject({ checked: 2, failed: 1, corrected: 0 });
  });

  it("clean run -> no alert", async () => {
    appleRows = [appleRow({ payer_id: "p1" })];
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: false });
    await GET(makeReq(OK));
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("reconciles expired-window rows when live bucket is empty", async () => {
    const recentExpired = new Date(Date.now() - 1_000).toISOString();
    appleRows = [
      appleRow({
        payer_id: "expired-payer",
        status: "expired",
        expires_at: recentExpired,
      }),
    ];
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: false });

    const body = await (await GET(makeReq(OK))).json();

    expect(reconcileAppleMock).toHaveBeenCalledWith(
      expect.anything(),
      "expired-payer",
      "Production",
    );
    expect(body.apple).toMatchObject({ checked: 1, corrected: 0 });
  });

  it("cap priority: live rows consume the cap before expired rows", async () => {
    const recentExpired = new Date(Date.now() - 1_000).toISOString();
    appleRows = [
      ...Array.from({ length: APPLE_BATCH_CAP + 20 }, (_, i) =>
        appleRow({
          payer_id: `live-${i}`,
          status: "subscribed",
        }),
      ),
      ...Array.from({ length: 50 }, (_, i) =>
        appleRow({
          payer_id: `expired-${i}`,
          status: "expired",
          expires_at: recentExpired,
        }),
      ),
    ];
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: false });

    const body = await (await GET(makeReq(OK))).json();
    const payers = reconcileAppleMock.mock.calls.map(([, payerId]) => payerId);
    expect(body.apple).toMatchObject({
      checked: APPLE_BATCH_CAP,
      deferred: 70,
    });
    expect(payers.every((payer) => String(payer).startsWith("live-"))).toBe(true);
  });

  it("cap priority: expired rows fill only the remaining slots after live rows", async () => {
    const recentExpired = new Date(Date.now() - 1_000).toISOString();
    appleRows = [
      ...Array.from({ length: 60 }, (_, i) =>
        appleRow({
          payer_id: `live-${i}`,
          status: "subscribed",
        }),
      ),
      ...Array.from({ length: 80 }, (_, i) =>
        appleRow({
          payer_id: `expired-${i}`,
          status: "expired",
          expires_at: recentExpired,
        }),
      ),
    ];
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: false });

    const body = await (await GET(makeReq(OK))).json();
    const payers = reconcileAppleMock.mock.calls.map(([, payerId]) => String(payerId));
    const liveCalls = payers.filter((p) => p.startsWith("live-"));
    const expiredCalls = payers.filter((p) => p.startsWith("expired-"));
    expect(body.apple).toMatchObject({
      checked: APPLE_BATCH_CAP,
      deferred: 40,
    });
    expect(liveCalls).toHaveLength(60);
    expect(expiredCalls).toHaveLength(40);
  });

  it("rotation: expired rows are still rotated across days when they fill remaining capacity", async () => {
    const recentExpired = new Date(Date.now() - 1_000).toISOString();
    appleRows = Array.from({ length: APPLE_BATCH_CAP + 20 }, (_, i) =>
      appleRow({
        payer_id: `expired-${i}`,
        status: "expired",
        expires_at: recentExpired,
      }),
    );
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: false });

    await reconcileApplePass(
      { from: (t: string) => builder(t) } as never,
      Date.now() + 60_000,
      new Date("2026-11-18T00:00:00.000Z"),
    );
    const dayOneFirst = String(reconcileAppleMock.mock.calls[0]?.[1]);
    reconcileAppleMock.mockClear();

    await reconcileApplePass(
      { from: (t: string) => builder(t) } as never,
      Date.now() + 60_000,
      new Date("2026-11-19T00:00:00.000Z"),
    );
    const dayTwoFirst = String(reconcileAppleMock.mock.calls[0]?.[1]);
    expect(dayOneFirst).not.toBe(dayTwoFirst);
  });
});

describe("no PII in alert or response", () => {
  it("alert context and body carry counts only", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    appleRows = [appleRow({ payer_id: "payer-uuid-xyz" })];
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: true });
    const res = await GET(makeReq(OK));
    const body = JSON.stringify(await res.json());
    const alert = JSON.stringify(vi.mocked(notifyError).mock.calls[0]);
    for (const s of [body, alert]) {
      expect(s).not.toMatch(/cus_|sub_|payer-uuid|1111111|@/);
    }
  });
});
