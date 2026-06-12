/**
 * Tests for app/api/cron/weekly-digest/route.ts (FV-226).
 *
 * Pins the auth gate (the primary security control on this route) and the
 * GET entrypoint — Vercel Cron invokes the path with HTTP GET, so a
 * POST-only export 405s every scheduled run (PR #192 review finding 2).
 * These cases mirror the webhook-route test pattern.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: vi.fn(),
}));

vi.mock("@/lib/email/weekly-digest", () => ({
  runWeeklyDigest: vi
    .fn()
    .mockResolvedValue({ eligible: 0, sent: 0, skipped: 0, errors: 0 }),
}));

import { GET, POST } from "@/app/api/cron/weekly-digest/route";
import { deliverInBackground } from "@/lib/monitoring/deliver";

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

describe("cron weekly-digest route auth gate", () => {
  it("GET without Authorization header → 401, digest never started", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    expect(deliverInBackground).not.toHaveBeenCalled();
  });

  it("GET with the wrong token → 401, digest never started", async () => {
    const res = await GET(makeReq("Bearer wrong-secret"));
    expect(res.status).toBe(401);
    expect(deliverInBackground).not.toHaveBeenCalled();
  });

  it("GET with the valid token → 202 accepted, digest dispatched in background", async () => {
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(202);
    expect(deliverInBackground).toHaveBeenCalledTimes(1);
  });

  it("POST with the valid token → 202 (manual ops trigger parity)", async () => {
    const res = await POST(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(202);
    expect(deliverInBackground).toHaveBeenCalledTimes(1);
  });

  it("CRON_SECRET unset → 500 fail-closed, even with a bearer header", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeReq("Bearer anything"));
    expect(res.status).toBe(500);
    expect(deliverInBackground).not.toHaveBeenCalled();
  });
});
