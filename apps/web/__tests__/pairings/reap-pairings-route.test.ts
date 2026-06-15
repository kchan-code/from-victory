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

// Service-client stub: delete().is().lt().select() and
// delete().not().lt().select() both resolve to an empty result set.
function makeDeleteChain() {
  const result = { data: [], error: null };
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
  createServiceClient: () => ({
    from: (_t: string) => ({
      delete: () => makeDeleteChain(),
    }),
  }),
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
  });
});
