/**
 * Unit tests for the game-day nudge logic in /api/cron/send-reminders (FV-240).
 *
 * Tests the key behavioral rules:
 *   1. Game-day rows → receive GAME_DAY_COPY and URL /athlete/pregame
 *   2. Game-day athlete is excluded from daily-reminder batch (dedupe)
 *   3. Past-date athletes are NOT returned by due_game_day_reminders
 *      (the SQL WHERE clause handles this; we verify the route skips them
 *       by returning an empty game-day list from the RPC mock)
 *   4. Dead endpoint (410) prunes the push_subscriptions row
 *   5. Both batches return correct counts in the response JSON
 *   6. game-day send clears next_game_on on profiles (opportunistic null)
 *   7. Daily-reminder athlete who already got a game-day nudge is not sent twice
 *
 * NOTE: The route is a Next.js App Router route handler. We test it by calling
 * the exported GET function directly, bypassing HTTP. This is the same pattern
 * used in the existing stripe/webhook-route.test.ts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Stable mock shapes
// ---------------------------------------------------------------------------

type PushRow = {
  athlete_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
};

// Mutable state that each test controls
let gameDayRpcRows: PushRow[] = [];
let gameDayRpcError: { message: string } | null = null;
let dueRpcRows: PushRow[] = [];
let dueRpcError: { message: string } | null = null;
let sendNotificationError: Error | null = null;

const pushSubscriptionsUpdateMock = vi.fn().mockReturnValue({ error: null });
const pushSubscriptionsDeleteMock = vi.fn().mockReturnValue({ error: null });
const profilesUpdateMock = vi.fn().mockReturnValue({ error: null });

// ---------------------------------------------------------------------------
// Module mocks (must be hoisted)
// ---------------------------------------------------------------------------

vi.mock("web-push", () => {
  class WebPushError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  }

  return {
    default: {
      setVapidDetails: vi.fn(),
      sendNotification: vi.fn().mockImplementation(async () => {
        if (sendNotificationError) throw sendNotificationError;
        return { statusCode: 201 };
      }),
      WebPushError,
    },
    WebPushError,
  };
});

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    rpc: (name: string) => {
      if (name === "due_game_day_reminders") {
        return Promise.resolve({
          data: gameDayRpcError ? null : gameDayRpcRows,
          error: gameDayRpcError,
        });
      }
      if (name === "due_push_reminders") {
        return Promise.resolve({
          data: dueRpcError ? null : dueRpcRows,
          error: dueRpcError,
        });
      }
      return Promise.resolve({ data: [], error: null });
    },
    from: (table: string) => {
      if (table === "push_subscriptions") {
        return {
          update: () => ({ eq: pushSubscriptionsUpdateMock }),
          delete: () => ({ eq: pushSubscriptionsDeleteMock }),
        };
      }
      if (table === "profiles") {
        return {
          update: () => ({ eq: profilesUpdateMock }),
        };
      }
      return {};
    },
  }),
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

// eslint-disable-next-line import/order
import { GET } from "@/app/api/cron/send-reminders/route";
// reason: import must come after vi.mock calls; lint order rule conflicts here
// eslint-disable-next-line import/order
import webpush from "web-push";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/cron/send-reminders", {
    method: "GET",
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

const ATHLETE_A: PushRow = {
  athlete_id: "ath-aaa",
  endpoint: "https://fcm.example.com/a",
  p256dh: "p256-a",
  auth: "auth-a",
  timezone: "America/New_York",
};

const ATHLETE_B: PushRow = {
  athlete_id: "ath-bbb",
  endpoint: "https://fcm.example.com/b",
  p256dh: "p256-b",
  auth: "auth-b",
  timezone: "America/Chicago",
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "vapid-pub";
  process.env.VAPID_PRIVATE_KEY = "vapid-priv";

  gameDayRpcRows = [];
  gameDayRpcError = null;
  dueRpcRows = [];
  dueRpcError = null;
  sendNotificationError = null;

  vi.clearAllMocks();

  // Reset per-call mocks to success
  pushSubscriptionsUpdateMock.mockReturnValue({ error: null });
  pushSubscriptionsDeleteMock.mockReturnValue({ error: null });
  profilesUpdateMock.mockReturnValue({ error: null });
  (webpush.sendNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
    statusCode: 201,
  });
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/cron/send-reminders — game-day nudge (FV-240)", () => {
  it("sends GAME_DAY_COPY and routes to /athlete/pregame for game-day athletes", async () => {
    gameDayRpcRows = [ATHLETE_A];
    dueRpcRows = [];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ sent: 1, pruned: 0, failed: 0 });

    // The payload sent to sendNotification should be the game-day copy
    expect(webpush.sendNotification).toHaveBeenCalledOnce();
    const allCalls = (webpush.sendNotification as ReturnType<typeof vi.fn>).mock.calls;
    const rawPayload = allCalls[0]?.[1];
    expect(typeof rawPayload).toBe("string");
    const payload = JSON.parse(rawPayload as string) as Record<string, string>;
    expect(payload.title).toBe("Big game tonight");
    expect(payload.url).toBe("/athlete/pregame");
  });

  it("clears next_game_on on profiles after a game-day send", async () => {
    gameDayRpcRows = [ATHLETE_A];
    dueRpcRows = [];

    await GET(makeRequest());

    // profiles.update().eq("id", athleteId) should have been called
    expect(profilesUpdateMock).toHaveBeenCalledWith("id", "ath-aaa");
  });

  it("excludes game-day athlete from the daily reminder batch (dedupe)", async () => {
    gameDayRpcRows = [ATHLETE_A];
    // ATHLETE_A also appears in daily-reminder rows (e.g. it happens to be
    // their reminder hour too)
    dueRpcRows = [ATHLETE_A, ATHLETE_B];

    const res = await GET(makeRequest());
    const body = await res.json();

    // ATHLETE_A receives game-day nudge. ATHLETE_B receives daily reminder.
    // Total sent = 2, but sendNotification called twice total.
    expect(body.sent).toBe(2);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);

    // Verify ATHLETE_A got game-day copy (first call)
    const firstCallPayload = JSON.parse(
      (webpush.sendNotification as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string,
    ) as Record<string, string>;
    expect(firstCallPayload.title).toBe("Big game tonight");

    // Verify ATHLETE_B got daily reminder copy (second call)
    const secondCallPayload = JSON.parse(
      (webpush.sendNotification as ReturnType<typeof vi.fn>).mock.calls[1]?.[1] as string,
    ) as Record<string, string>;
    expect(secondCallPayload.title).toBe("Time to train");
  });

  it("does not call sendNotification for past-date athletes (RPC returns empty)", async () => {
    // The SQL WHERE clause filters past dates; the mock simulates 0 rows returned
    gameDayRpcRows = [];
    dueRpcRows = [];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body).toEqual({ sent: 0, pruned: 0, failed: 0 });
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it("prunes dead endpoint (410) for game-day athlete", async () => {
    gameDayRpcRows = [ATHLETE_A];
    dueRpcRows = [];

    // Make sendNotification throw a 410 WebPushError
    const { default: webpushMod } = await import("web-push");
    // reason: dynamic import needed to access mocked WebPushError class
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WebPushError = (webpushMod as any).WebPushError as new (
      msg: string,
      code: number,
    ) => Error & { statusCode: number };
    (webpush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValue(
      new WebPushError("Gone", 410),
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ sent: 0, pruned: 1, failed: 0 });

    // delete was called on push_subscriptions
    expect(pushSubscriptionsDeleteMock).toHaveBeenCalledWith(
      "athlete_id",
      "ath-aaa",
    );
    // next_game_on was NOT cleared (row is gone, no sense clearing)
    // Actually our code tries to clear regardless — that's fine, test the count
  });

  it("counts a failed sendNotification as failed (not sent)", async () => {
    gameDayRpcRows = [ATHLETE_A];
    dueRpcRows = [];

    (webpush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body).toEqual({ sent: 0, pruned: 0, failed: 1 });
  });

  it("falls through to daily reminders if game-day RPC errors", async () => {
    gameDayRpcError = { message: "RPC unavailable" };
    dueRpcRows = [ATHLETE_B];

    const res = await GET(makeRequest());
    const body = await res.json();

    // Daily reminder was still sent (game-day error is non-fatal)
    expect(body.sent).toBe(1);
    expect(res.status).toBe(200);
  });

  it("returns 401 without correct CRON_SECRET", async () => {
    const req = new NextRequest("http://localhost/api/cron/send-reminders", {
      method: "GET",
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("sends daily REMINDER_COPY for non-game-day athletes", async () => {
    gameDayRpcRows = [];
    dueRpcRows = [ATHLETE_B];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.sent).toBe(1);

    const callPayload = JSON.parse(
      (webpush.sendNotification as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string,
    ) as Record<string, string>;
    expect(callPayload.title).toBe("Time to train");
    expect(callPayload.url).toBe("/athlete");
  });
});
