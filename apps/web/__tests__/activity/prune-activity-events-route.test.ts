/**
 * Tests for app/api/cron/prune-activity-events/route.ts (FV-382, FV-415).
 *
 * Pins the auth gate (the primary security control) and the GET entrypoint —
 * Vercel Cron invokes the path with HTTP GET. Mirrors the
 * __tests__/pairings/reap-pairings-route.test.ts pattern. The service client
 * is stubbed so the rollup RPC + delete chain resolve without a DB.
 *
 * FV-415 adds the roll-up-then-prune contract:
 *   - the rollup RPC (`rollup_activity_events`) runs BEFORE the prune delete;
 *   - a rollup failure returns 500 and SKIPS the prune (prune never outruns
 *     rollup);
 *   - running twice hits the same idempotent UPSERT (no doubling — the
 *     idempotency itself lives in SQL; here we assert the route re-invokes it
 *     deterministically with the same retention arg);
 *   - only opaque counts are logged (no athlete_id / meta).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const { alertCronFailureMock } = vi.hoisted(() => ({
  alertCronFailureMock: vi.fn(),
}));

vi.mock("@/lib/monitoring/cron-alert", () => ({
  alertCronFailure: (...args: unknown[]) => alertCronFailureMock(...args),
}));

let serviceThrows = false;

// Ordered log of service-client operations so tests can assert rollup-before-prune.
let callLog: string[] = [];
// Controls injected per-test to simulate rollup / prune failures.
let rollupResult: { data: unknown; error: { message: string } | null } = {
  data: 0,
  error: null,
};
let rpcArgs: Array<{ fn: string; params: unknown }> = [];
// FV-749: result / behaviour of the pregame selection totals prune RPC.
let selectionPrune: { data: unknown; error: { message: string; code?: string } | null } = {
  data: 0,
  error: null,
};
let selectionPruneThrows = false;

function makeDeleteChain() {
  const result = { data: [], error: null };
  return {
    lt: (_c: string, _v: unknown) => ({
      select: async (_c2: string) => {
        callLog.push("prune");
        return result;
      },
    }),
  };
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    if (serviceThrows) {
      throw new Error("service key athlete aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    }
    return {
    rpc: async (fn: string, params: unknown) => {
      if (fn === "prune_pregame_selection_totals") {
        callLog.push("selection-prune");
        if (selectionPruneThrows) throw new Error("boom athlete aaaa");
        return selectionPrune;
      }
      callLog.push("rollup");
      rpcArgs.push({ fn, params });
      return rollupResult;
    },
    from: (_t: string) => ({
      delete: () => makeDeleteChain(),
    }),
    };
  },
}));

import { GET, POST } from "@/app/api/cron/prune-activity-events/route";

function makeReq(auth?: string): NextRequest {
  const headers = new Headers();
  if (auth) headers.set("authorization", auth);
  return { headers } as unknown as NextRequest;
}

const ORIGINAL_SECRET = process.env.CRON_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  callLog = [];
  rpcArgs = [];
  serviceThrows = false;
  rollupResult = { data: 0, error: null };
  selectionPrune = { data: 0, error: null };
  selectionPruneThrows = false;
  process.env.CRON_SECRET = "test-cron-secret";
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = ORIGINAL_SECRET;
  }
});

describe("cron prune-activity-events route auth gate", () => {
  it("GET without Authorization header → 401", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("GET with the wrong token → 401", async () => {
    const res = await GET(makeReq("Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeReq("Bearer anything"));
    expect(res.status).toBe(500);
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/prune-activity-events] missing config",
      "CRON_SECRET is not set",
    );
  });

  it("does not touch the DB when unauthorized", async () => {
    await GET(makeReq());
    expect(callLog).toEqual([]);
  });

  it("GET with the valid token → 200 with rolled + pruned counts", async () => {
    rollupResult = { data: 5, error: null };
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ rolled: 5, pruned: 0, selectionPruned: 0 });
  });

  it("POST with the valid token → 200 (manual ops trigger parity)", async () => {
    const res = await POST(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(200);
  });
});

describe("cron prune-activity-events roll-up-then-prune (FV-415)", () => {
  it("rolls up BEFORE pruning", async () => {
    await GET(makeReq("Bearer test-cron-secret"));
    expect(callLog).toEqual(["selection-prune", "rollup", "prune"]);
  });

  it("invokes rollup_activity_events with the retention window", async () => {
    await GET(makeReq("Bearer test-cron-secret"));
    expect(rpcArgs).toHaveLength(1);
    expect(rpcArgs[0]).toEqual({
      fn: "rollup_activity_events",
      params: { retention_days: 90 },
    });
  });

  it("SKIPS the prune and returns 500 when the rollup fails", async () => {
    rollupResult = { data: null, error: { message: "boom" } };
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(500);
    // rollup was attempted, prune was NOT (prune must never outrun rollup).
    // (the independent selection-totals retention ran first — FV-749.)
    expect(callLog).toEqual(["selection-prune", "rollup"]);
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/prune-activity-events] rollup failed",
      "rollup failed and prune was skipped",
      { code: "db" },
    );
    expect(JSON.stringify(alertCronFailureMock.mock.calls)).not.toContain("boom");
  });

  it("is deterministic across repeated runs (same rollup arg, no drift)", async () => {
    rollupResult = { data: 3, error: null };
    const first = await GET(makeReq("Bearer test-cron-secret"));
    const second = await GET(makeReq("Bearer test-cron-secret"));
    expect(await first.json()).toEqual({ rolled: 3, pruned: 0, selectionPruned: 0 });
    expect(await second.json()).toEqual({ rolled: 3, pruned: 0, selectionPruned: 0 });
    // Both runs invoke the same idempotent RPC with the same args — the
    // no-double-count guarantee itself is enforced in SQL (UPSERT).
    expect(rpcArgs).toEqual([
      { fn: "rollup_activity_events", params: { retention_days: 90 } },
      { fn: "rollup_activity_events", params: { retention_days: 90 } },
    ]);
  });

  it("logs only opaque counts (no athlete_id / meta)", async () => {
    rollupResult = { data: 7, error: null };
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    await GET(makeReq("Bearer test-cron-secret"));
    const logged = infoSpy.mock.calls.map((c) => String(c[0])).join(" ");
    expect(logged).toContain("rolled=7");
    expect(logged).toContain("pruned=0");
    expect(logged).not.toMatch(/athlete/i);
    expect(logged).not.toMatch(/meta/i);
    expect(alertCronFailureMock).not.toHaveBeenCalled();
    infoSpy.mockRestore();
  });

  it("alerts with the error name only when the handler throws", async () => {
    serviceThrows = true;
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(500);
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/prune-activity-events] threw",
      "Error",
    );
    expect(JSON.stringify(alertCronFailureMock.mock.calls)).not.toContain(
      "eeeeeeeeeeee",
    );
  });
});

describe("cron prune-activity-events selection totals prune (FV-749)", () => {
  it("runs the selection totals prune (first, independently) and reports its count", async () => {
    selectionPrune = { data: 4, error: null };
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ rolled: 0, pruned: 0, selectionPruned: 4 });
    expect(callLog).toEqual(["selection-prune", "rollup", "prune"]);
  });

  it("a selection prune error is alerted but does NOT fail the route", async () => {
    selectionPrune = { data: null, error: { message: "leaky Confidence", code: "42501" } };
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ rolled: 0, pruned: 0, selectionPruned: 0 });
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/prune-activity-events] selection totals prune failed",
      "pregame selection totals prune failed",
      { code: "42501" },
    );
    expect(JSON.stringify(alertCronFailureMock.mock.calls)).not.toContain("Confidence");
  });

  it("a thrown selection prune is alerted by error name only and does NOT fail the route", async () => {
    selectionPruneThrows = true;
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(200);
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/prune-activity-events] selection totals prune threw",
      "Error",
    );
    expect(JSON.stringify(alertCronFailureMock.mock.calls)).not.toContain("aaaa");
  });

  it("still runs when the rollup fails (retention is never delayed by the rollup)", async () => {
    rollupResult = { data: null, error: { message: "boom" } };
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(500);
    expect(callLog).toEqual(["selection-prune", "rollup"]);
  });
});
