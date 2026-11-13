/**
 * Tests for the Play notification-pipeline stall check (FV-662).
 * Pure function first; then the server-only checker with a fake database.
 * The clock is injected: nothing depends on the calendar.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let rows: Array<Record<string, unknown>>;
let readError: { code?: string; message: string } | null;
let createServiceCalls: number;
let queries: Array<{ in?: [string, unknown[]]; lt?: [string, unknown] }>;
let alerts: unknown[][];
let logged: string[];

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    createServiceCalls += 1;
    const q: { in?: [string, unknown[]]; lt?: [string, unknown] } = {};
    queries.push(q);
    const api = {
      select: () => api,
      in: (c: string, v: unknown[]) => {
        q.in = [c, v];
        return api;
      },
      lt: (c: string, v: unknown) => {
        q.lt = [c, v];
        return api;
      },
      limit: async () => ({ data: readError ? null : rows, error: readError }),
    };
    return { from: () => api };
  },
}));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: () => {} }));
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: (...args: unknown[]) => {
    alerts.push(args);
    return Promise.resolve();
  },
}));

import {
  GOOGLE_STALL_THRESHOLD_HOURS,
  checkGooglePipelineStalls,
  isGoogleRowStalled,
} from "@/lib/subscriptions/google-play-health";

const NOW = new Date("2030-06-15T12:00:00.000Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();

describe("isGoogleRowStalled (pure)", () => {
  it("flags a granting row past expiry (beyond the threshold) never re-verified", () => {
    expect(isGoogleRowStalled({ status: "active", expires_at: hoursAgo(30), last_verified_at: null }, NOW)).toBe(true);
    expect(isGoogleRowStalled({ status: "canceled", expires_at: hoursAgo(30), last_verified_at: hoursAgo(100) }, NOW)).toBe(true);
    expect(isGoogleRowStalled({ status: "in_grace_period", expires_at: hoursAgo(25), last_verified_at: hoursAgo(25) }, NOW)).toBe(true);
    expect(isGoogleRowStalled({ status: "on_hold", expires_at: hoursAgo(48), last_verified_at: null }, NOW)).toBe(true);
  });

  it("does not flag a row inside the threshold, or one verified recently", () => {
    expect(isGoogleRowStalled({ status: "active", expires_at: hoursAgo(GOOGLE_STALL_THRESHOLD_HOURS - 1), last_verified_at: null }, NOW)).toBe(false);
    expect(isGoogleRowStalled({ status: "active", expires_at: hoursAgo(40), last_verified_at: hoursAgo(2) }, NOW)).toBe(false);
    expect(isGoogleRowStalled({ status: "active", expires_at: "2099-01-01T00:00:00.000Z", last_verified_at: null }, NOW)).toBe(false);
  });

  it("ignores statuses that do not grant, and rows with no expiry", () => {
    for (const status of ["pending", "paused", "expired", "pending_purchase_canceled"]) {
      expect(isGoogleRowStalled({ status, expires_at: hoursAgo(500), last_verified_at: null }, NOW)).toBe(false);
    }
    expect(isGoogleRowStalled({ status: "active", expires_at: null, last_verified_at: null }, NOW)).toBe(false);
  });

  it("honours a custom threshold and tolerates unparseable dates", () => {
    expect(isGoogleRowStalled({ status: "active", expires_at: hoursAgo(5), last_verified_at: null }, NOW, 4)).toBe(true);
    expect(isGoogleRowStalled({ status: "active", expires_at: "garbage", last_verified_at: null }, NOW)).toBe(false);
    expect(isGoogleRowStalled({ status: "active", expires_at: hoursAgo(50), last_verified_at: "garbage" }, NOW)).toBe(true);
  });
});

describe("checkGooglePipelineStalls", () => {
  beforeEach(() => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
    rows = [];
    readError = null;
    createServiceCalls = 0;
    queries = [];
    alerts = [];
    logged = [];
    for (const m of ["log", "info", "warn", "error"] as const) {
      vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
        logged.push(a.map(String).join(" "));
      });
    }
  });
  afterEach(() => {
    delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
    vi.restoreAllMocks();
  });

  it("is dormant when the flag is off: no database call, no alert", async () => {
    delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
    expect(await checkGooglePipelineStalls({ now: () => NOW })).toBeNull();
    expect(createServiceCalls).toBe(0);
    expect(alerts).toEqual([]);
  });

  it("alerts with a COUNT only (no row id, token, payer or product)", async () => {
    rows = [
      { status: "active", expires_at: hoursAgo(30), last_verified_at: null, id: "row-1", purchase_token: "TOKEN_SENTINEL", payer_id: "PAYER_SENTINEL" },
      { status: "on_hold", expires_at: hoursAgo(80), last_verified_at: hoursAgo(80) },
      { status: "active", expires_at: hoursAgo(30), last_verified_at: hoursAgo(1) },
    ];
    expect(await checkGooglePipelineStalls({ now: () => NOW })).toBe(2);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.[2]).toEqual({ count: "2" });
    const text = JSON.stringify({ alerts, logged });
    for (const s of ["TOKEN_SENTINEL", "PAYER_SENTINEL", "row-1"]) expect(text).not.toContain(s);
  });

  it("scopes the query to granting statuses with an expiry older than the threshold", async () => {
    await checkGooglePipelineStalls({ now: () => NOW });
    expect(queries[0]?.in).toEqual(["status", ["active", "in_grace_period", "canceled", "on_hold"]]);
    expect(queries[0]?.lt).toEqual(["expires_at", hoursAgo(GOOGLE_STALL_THRESHOLD_HOURS)]);
  });

  it("no stalls: no alert", async () => {
    expect(await checkGooglePipelineStalls({ now: () => NOW })).toBe(0);
    expect(alerts).toEqual([]);
  });

  it("a read failure alerts with the Postgres code only and returns null", async () => {
    readError = { code: "XX000", message: "boom TOKEN_SENTINEL" };
    expect(await checkGooglePipelineStalls({ now: () => NOW })).toBeNull();
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.[2]).toEqual({ error: "XX000" });
    expect(JSON.stringify({ alerts, logged })).not.toContain("TOKEN_SENTINEL");
  });
});
