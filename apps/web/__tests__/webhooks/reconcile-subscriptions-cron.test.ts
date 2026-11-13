/**
 * Tests for app/api/cron/reconcile-subscriptions/route.ts (FV-709).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: vi.fn() }));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: vi.fn().mockResolvedValue(undefined) }));

const retrieveMock = vi.fn();
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({ subscriptions: { retrieve: retrieveMock } }),
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
let appleFilters: Array<[string, unknown]> = [];
// Row returned by the post-reconcile re-read (appleRowChanged).
let appleAfter: Row | null = null;

function builder(table: string) {
  let isUpdate = false;
  const b: Record<string, unknown> = {};
  const self = () => b;
  for (const m of ["select", "not", "order", "range", "is", "lte"]) b[m] = self;
  b.eq = (col: string, val: unknown) => {
    if (table === "apple_subscriptions") appleFilters.push([col, val]);
    return b;
  };
  b.in = (col: string, val: unknown) => {
    if (table === "apple_subscriptions") appleFilters.push([col, val]);
    return b;
  };
  b.update = (payload: Row) => {
    isUpdate = true;
    updates.push(payload);
    return b;
  };
  b.maybeSingle = () => Promise.resolve({ data: appleAfter, error: null });
  b.then = (resolve: (v: unknown) => void) =>
    resolve({
      data: isUpdate ? updateResult : table === "subscriptions" ? stripeRows : appleRows,
      error: null,
    });
  return b;
}
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: (t: string) => builder(t) }),
}));

import { GET, POST } from "@/app/api/cron/reconcile-subscriptions/route";
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

const ORIGINAL = process.env.CRON_SECRET;
beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-cron-secret";
  stripeRows = [];
  appleRows = [];
  updates = [];
  appleFilters = [];
  appleAfter = null;
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

describe("apple pass", () => {
  it("Production row with live renewal -> reconcile called and counted", async () => {
    const before = {
      payer_id: "payer-1",
      status: "subscribed",
      product_id: "fv.monthly",
      expires_at: "2026-11-01T00:00:00+00:00",
      grace_period_expires_at: null,
    };
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
    const before = {
      payer_id: "payer-1",
      status: "subscribed",
      product_id: "fv.monthly",
      expires_at: "2026-11-14T00:00:00+00:00",
      grace_period_expires_at: null,
    };
    appleRows = [before];
    // Same instant, different serialization: must still compare equal.
    appleAfter = { ...before, expires_at: "2026-11-14T00:00:00.000Z" };
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: true });
    const body = await (await GET(makeReq(OK))).json();
    expect(body.apple).toMatchObject({ checked: 1, corrected: 0 });
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("query is restricted to Production and live statuses (Sandbox skipped)", async () => {
    await GET(makeReq(OK));
    expect(appleFilters).toContainEqual(["environment", "Production"]);
    expect(appleFilters).toContainEqual([
      "status",
      ["subscribed", "in_grace_period", "in_billing_retry"],
    ]);
  });

  it("apple row throwing is counted failed and does not stop the next", async () => {
    appleRows = [{ payer_id: "p1" }, { payer_id: "p2" }];
    reconcileAppleMock
      .mockRejectedValueOnce(new Error("apple down"))
      .mockResolvedValueOnce({ ok: true, applied: false });
    const body = await (await GET(makeReq(OK))).json();
    expect(body.apple).toMatchObject({ checked: 2, failed: 1, corrected: 0 });
  });

  it("clean run -> no alert", async () => {
    appleRows = [{ payer_id: "p1" }];
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: false });
    await GET(makeReq(OK));
    expect(notifyError).not.toHaveBeenCalled();
  });
});

describe("no PII in alert or response", () => {
  it("alert context and body carry counts only", async () => {
    stripeRows = [dbRow()];
    retrieveMock.mockResolvedValue(stripeSub({ status: "canceled" }));
    appleRows = [{ payer_id: "payer-uuid-xyz" }];
    reconcileAppleMock.mockResolvedValue({ ok: true, applied: true });
    const res = await GET(makeReq(OK));
    const body = JSON.stringify(await res.json());
    const alert = JSON.stringify(vi.mocked(notifyError).mock.calls[0]);
    for (const s of [body, alert]) {
      expect(s).not.toMatch(/cus_|sub_|payer-uuid|1111111|@/);
    }
  });
});
