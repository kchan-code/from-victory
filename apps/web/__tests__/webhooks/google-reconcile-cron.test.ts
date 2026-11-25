/**
 * Google Play pass + stall check inside /api/cron/reconcile-subscriptions
 * (FV-662/663). Flag off: nothing Google runs. Flag on: rows are re-read via
 * the webhook's path, failures are isolated, the cap holds, and the stall
 * check alerts a count only.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: vi.fn() }));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({ subscriptions: { retrieve: vi.fn(), list: vi.fn() } }),
}));
vi.mock("@/lib/subscriptions/apple-lifecycle", () => ({
  reconcileAppleSubscription: vi.fn(),
}));

const processMock = vi.fn();
vi.mock("@/lib/subscriptions/google-play-rtdn", () => ({
  processGoogleNotification: (...a: unknown[]) => processMock(...a),
}));

type Row = Record<string, unknown>;
let googleRows: Row[] = [];
let googleListError: { code: string } | null = null;
let stallRows: Row[] = [];
let googleAfter: Row | null = null;
let googleFromCalls = 0;

function builder(table: string) {
  const b: Record<string, unknown> = {};
  const self = () => b;
  const isGoogle = table === "google_subscriptions";
  if (isGoogle) googleFromCalls++;
  for (const m of ["select", "not", "order", "range", "lte", "gt", "lt", "eq", "is", "in"]) b[m] = self;
  b.limit = () => Promise.resolve({ data: stallRows, error: null });
  b.maybeSingle = () => Promise.resolve({ data: googleAfter, error: null });
  b.then = (resolve: (v: unknown) => void) => {
    if (isGoogle) {
      resolve(googleListError ? { data: null, error: googleListError } : { data: googleRows, error: null });
    } else {
      resolve({ data: [], error: null });
    }
  };
  return b;
}
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: (t: string) => builder(t) }),
}));

import { GET } from "@/app/api/cron/reconcile-subscriptions/route";
import { GOOGLE_BATCH_CAP } from "@/lib/subscriptions/google-reconcile";
import { notifyError } from "@/lib/monitoring/notify";

function makeReq(): NextRequest {
  const headers = new Headers({ authorization: "Bearer test-cron-secret" });
  return { headers } as unknown as NextRequest;
}

function gRow(over: Row = {}): Row {
  return {
    id: "row-1",
    purchase_token: "SECRET_TOKEN_1",
    status: "active",
    product_id: "family.1",
    base_plan_id: "monthly",
    expires_at: "2030-01-01T00:00:00.000Z",
    auto_renewing: true,
    ...over,
  };
}

const ORIG_SECRET = process.env.CRON_SECRET;
const ORIG_FLAG = process.env.GOOGLE_PLAY_CATALOG_ACTIVE;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-cron-secret";
  googleRows = [];
  googleListError = null;
  stallRows = [];
  googleAfter = null;
  googleFromCalls = 0;
  processMock.mockResolvedValue("applied");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  if (ORIG_SECRET === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIG_SECRET;
  if (ORIG_FLAG === undefined) delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
  else process.env.GOOGLE_PLAY_CATALOG_ACTIVE = ORIG_FLAG;
});

describe("flag off (inert)", () => {
  for (const value of [undefined, "0", "true", " 1"]) {
    it(`GOOGLE_PLAY_CATALOG_ACTIVE=${String(value)}: no Google call, no Google DB access, no alert, same shape`, async () => {
      if (value === undefined) delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
      else process.env.GOOGLE_PLAY_CATALOG_ACTIVE = value;
      googleRows = [gRow()];
      stallRows = [gRow({ expires_at: "2000-01-01T00:00:00.000Z" })];

      const body = await (await GET(makeReq())).json();

      expect(Object.keys(body).sort()).toEqual(["apple", "stripe"]);
      expect(processMock).not.toHaveBeenCalled();
      expect(googleFromCalls).toBe(0);
      expect(notifyError).not.toHaveBeenCalled();
    });
  }
});

describe("flag on", () => {
  beforeEach(() => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
  });

  it("re-reads each row by token through the webhook path; changed row counts corrected and alerts counts only", async () => {
    googleRows = [gRow()];
    googleAfter = gRow({ status: "expired" });

    const body = await (await GET(makeReq())).json();

    expect(processMock).toHaveBeenCalledTimes(1);
    expect(processMock.mock.calls[0]?.[0]).toEqual({ kind: "subscription", purchaseToken: "SECRET_TOKEN_1" });
    expect(body.google).toMatchObject({ checked: 1, corrected: 1, failed: 0, missing: 0 });
    expect(notifyError).toHaveBeenCalledTimes(1);
    const ctx = vi.mocked(notifyError).mock.calls[0]?.[2] as Record<string, string>;
    expect(ctx.google).toContain("corrected=1");
    // Privacy: nothing in the alert or the response carries the token.
    expect(JSON.stringify(vi.mocked(notifyError).mock.calls)).not.toContain("SECRET_TOKEN");
    expect(JSON.stringify(body)).not.toContain("SECRET_TOKEN");
  });

  it("unchanged row: no correction, no alert", async () => {
    googleRows = [gRow()];
    googleAfter = gRow();
    const body = await (await GET(makeReq())).json();
    expect(body.google).toMatchObject({ checked: 1, corrected: 0, failed: 0 });
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("ignored -> missing, retry -> failed", async () => {
    googleRows = [gRow({ id: "a", purchase_token: "t-a" }), gRow({ id: "b", purchase_token: "t-b" })];
    processMock.mockImplementation(async (n: { purchaseToken: string }) =>
      n.purchaseToken === "t-a" ? "ignored" : "retry",
    );
    const body = await (await GET(makeReq())).json();
    expect(body.google).toMatchObject({ checked: 2, missing: 1, failed: 1, corrected: 0 });
    expect(notifyError).toHaveBeenCalledTimes(1);
  });

  it("one row throwing does not stop the others", async () => {
    googleRows = [gRow({ id: "a", purchase_token: "t-a" }), gRow({ id: "b", purchase_token: "t-b" })];
    googleAfter = gRow({ status: "expired" });
    processMock.mockImplementation(async (n: { purchaseToken: string }) => {
      if (n.purchaseToken === "t-a") throw new Error("boom SECRET");
      return "applied";
    });
    const body = await (await GET(makeReq())).json();
    expect(body.google).toMatchObject({ checked: 2, failed: 1, corrected: 1 });
  });

  it("respects the cap and reports the rest as deferred", async () => {
    googleRows = Array.from({ length: GOOGLE_BATCH_CAP + 5 }, (_, i) =>
      gRow({ id: `r${i}`, purchase_token: `t${i}` }),
    );
    googleAfter = gRow();
    const body = await (await GET(makeReq())).json();
    expect(processMock).toHaveBeenCalledTimes(GOOGLE_BATCH_CAP);
    expect(body.google).toMatchObject({ checked: GOOGLE_BATCH_CAP, deferred: 5 });
  });

  it("Google pass throwing (row listing fails) leaves Stripe and Apple results intact", async () => {
    googleListError = { code: "XX000" };
    const body = await (await GET(makeReq())).json();
    expect(body.stripe).toMatchObject({ checked: 0, failed: 0 });
    expect(body.apple).toMatchObject({ checked: 0, failed: 0 });
    expect(body.google).toMatchObject({ failed: 1 });
    expect(processMock).not.toHaveBeenCalled();
  });

  it("stall check alerts a count when granting rows sit past expiry unverified", async () => {
    stallRows = [
      { status: "active", expires_at: "2000-01-01T00:00:00.000Z", last_verified_at: null },
      { status: "canceled", expires_at: "2000-01-01T00:00:00.000Z", last_verified_at: null },
    ];
    const body = await (await GET(makeReq())).json();
    expect(body.googleStalled).toBe(2);
    const calls = vi.mocked(notifyError).mock.calls;
    const stall = calls.find((c) => String(c[0]).includes("stalled subscriptions"));
    expect(stall?.[2]).toEqual({ count: "2" });
  });

  it("stall check is silent when healthy", async () => {
    stallRows = [];
    const body = await (await GET(makeReq())).json();
    expect(body.googleStalled).toBe(0);
    expect(notifyError).not.toHaveBeenCalled();
  });
});

// FV-669: pilot flag only. The fake database returns an EMPTY allowlist
// (every table but google_subscriptions is empty), so nothing is in scope.
describe("pilot flag only (FV-669)", () => {
  const ORIG_PILOT = process.env.GOOGLE_PLAY_PILOT_ACTIVE;
  beforeEach(() => {
    delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
    process.env.GOOGLE_PLAY_PILOT_ACTIVE = "1";
  });
  afterEach(() => {
    if (ORIG_PILOT === undefined) delete process.env.GOOGLE_PLAY_PILOT_ACTIVE;
    else process.env.GOOGLE_PLAY_PILOT_ACTIVE = ORIG_PILOT;
  });

  it("with no allowlisted payer: the Google pass runs but processes nothing, and nothing alerts", async () => {
    googleRows = [gRow()];
    stallRows = [gRow({ expires_at: "2000-01-01T00:00:00.000Z" })];

    const body = await (await GET(makeReq())).json();

    expect(body.google).toMatchObject({ checked: 0, corrected: 0, failed: 0 });
    expect(body.googleStalled).toBe(0);
    expect(processMock).not.toHaveBeenCalled();
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("pilot flag not exactly \"1\": inert, same shape as today", async () => {
    process.env.GOOGLE_PLAY_PILOT_ACTIVE = "true";
    googleRows = [gRow()];
    const body = await (await GET(makeReq())).json();
    expect(Object.keys(body).sort()).toEqual(["apple", "stripe"]);
    expect(googleFromCalls).toBe(0);
    expect(processMock).not.toHaveBeenCalled();
  });
});
