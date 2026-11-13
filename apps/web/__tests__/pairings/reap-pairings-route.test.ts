/**
 * Tests for app/api/cron/reap-pairings/route.ts (FV-177).
 *
 * Pins the auth gate (the primary security control) and the GET entrypoint —
 * Vercel Cron invokes the path with HTTP GET. Mirrors the
 * __tests__/digest-cron-route.test.ts pattern. The service client is stubbed
 * so the delete chains resolve without a DB.
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
let deleteResult: { data: unknown[]; error: { message: string } | null } = {
  data: [],
  error: null,
};

// Service-client stub: delete().is().lt().select() and
// delete().not().lt().select() both resolve to an empty result set.
function makeDeleteChain() {
  const result = deleteResult;
  const tail = {
    select: async (_c: string) => result,
  };
  return {
    is: (_c: string, _v: unknown) => ({
      lt: (_c2: string, _v2: unknown) => tail,
    }),
    not: (_c: string, _op: string, _v: unknown) => ({
      lt: (_c2: string, _v2: unknown) => tail,
    }),
  };
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    if (serviceThrows) {
      throw new Error("service key athlete aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    }
    return {
      from: (_t: string) => ({
        delete: () => makeDeleteChain(),
      }),
    };
  },
}));

import { GET, POST } from "@/app/api/cron/reap-pairings/route";

function makeReq(auth?: string): NextRequest {
  const headers = new Headers();
  if (auth) headers.set("authorization", auth);
  return { headers } as unknown as NextRequest;
}

const ORIGINAL_SECRET = process.env.CRON_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  serviceThrows = false;
  deleteResult = { data: [], error: null };
  process.env.CRON_SECRET = "test-cron-secret";
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = ORIGINAL_SECRET;
  }
});

describe("cron reap-pairings route auth gate", () => {
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
      "[cron/reap-pairings] missing config",
      "CRON_SECRET is not set",
    );
  });

  it("GET with the valid token → 200 with prune counts", async () => {
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ expiredPruned: 0, consumedPruned: 0 });
  });

  it("POST with the valid token → 200 (manual ops trigger parity)", async () => {
    const res = await POST(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(200);
    expect(alertCronFailureMock).not.toHaveBeenCalled();
  });

  it("sends one alert when a delete fails, without the database message", async () => {
    deleteResult = { data: [], error: { message: "athlete aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" } };
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(200);
    expect(alertCronFailureMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(alertCronFailureMock.mock.calls)).not.toContain(
      "eeeeeeeeeeee",
    );
    expect(alertCronFailureMock.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({ reasons: "expired+consumed" }),
    );
  });

  it("alerts with the error name only when the handler throws", async () => {
    serviceThrows = true;
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(500);
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/reap-pairings] threw",
      "Error",
    );
  });
});
