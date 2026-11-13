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

const { deliverInBackgroundMock, alertCronFailureMock, runWeeklyDigestMock } =
  vi.hoisted(() => ({
    deliverInBackgroundMock: vi.fn((promise: Promise<unknown>) => promise),
    alertCronFailureMock: vi.fn(),
    runWeeklyDigestMock: vi.fn(async (..._args: unknown[]) => ({
      eligible: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
    })),
  }));

vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: deliverInBackgroundMock,
}));

vi.mock("@/lib/monitoring/cron-alert", () => ({
  alertCronFailure: (...args: unknown[]) => alertCronFailureMock(...args),
  CRON_FAILURE_ALERT_THRESHOLD: 0,
}));

vi.mock("@/lib/email/weekly-digest", () => ({
  runWeeklyDigest: (...args: unknown[]) => runWeeklyDigestMock(...args),
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
  process.env.RESEND_API_KEY = "re_test";
  process.env.DIGEST_EMAIL_FROM = "digest@example.com";
  runWeeklyDigestMock.mockResolvedValue({
    eligible: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  });
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
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/weekly-digest] missing config",
      "CRON_SECRET is not set",
    );
  });

  it("alerts once when mail config is missing, and still accepts the cron", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(202);
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/weekly-digest] missing config",
      "RESEND_API_KEY or DIGEST_EMAIL_FROM is not set",
    );
  });

  it("alerts when the background run's error count is over the threshold", async () => {
    runWeeklyDigestMock.mockResolvedValueOnce({
      eligible: 4,
      sent: 2,
      skipped: 0,
      errors: 2,
    });
    const res = await GET(makeReq("Bearer test-cron-secret"));
    expect(res.status).toBe(202);
    await deliverInBackgroundMock.mock.results[0]?.value;
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/weekly-digest] send failures",
      "digest run error count exceeded threshold",
      { eligible: "4", sent: "2", skipped: "0", errors: "2" },
    );
  });

  it("alerts when the background run rejects, with the error name only", async () => {
    runWeeklyDigestMock.mockRejectedValueOnce(
      new Error("parent=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee smtp down"),
    );
    await GET(makeReq("Bearer test-cron-secret"));
    await deliverInBackgroundMock.mock.results[0]?.value;
    expect(alertCronFailureMock).toHaveBeenCalledTimes(1);
    expect(alertCronFailureMock).toHaveBeenCalledWith(
      "[cron/weekly-digest] background run rejected",
      "Error",
    );
    expect(JSON.stringify(alertCronFailureMock.mock.calls)).not.toContain(
      "eeeeeeeeeeee",
    );
  });

  it("does not alert a clean run", async () => {
    await GET(makeReq("Bearer test-cron-secret"));
    await deliverInBackgroundMock.mock.results[0]?.value;
    expect(alertCronFailureMock).not.toHaveBeenCalled();
  });
});
