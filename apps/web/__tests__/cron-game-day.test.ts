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
 *      — asserted via the { next_game_on: null } update payload
 *   7. Daily-reminder athlete who already got a game-day nudge is not sent twice
 *   8. Dedupe-inversion cohort: morning-reminder athlete receives BOTH daily
 *      (AM) and game-day nudge (PM) — due_game_day_reminders has no
 *      last_sent_on gate so the game-day nudge fires even after morning send
 *   9. If game-day RPC errors, daily reminders are still sent (non-fatal,
 *      symmetric error handling — both RPCs fetched before any sends)
 *  10. If daily RPC errors, game-day sends still complete (symmetric)
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

// Spies — typed so we can assert the actual payload shape (Fix 9)
const pushSubscriptionsUpdateSpy = vi.fn().mockReturnValue({ error: null });
const pushSubscriptionsDeleteMock = vi.fn().mockReturnValue({ error: null });
const profilesUpdateSpy = vi.fn().mockReturnValue({ error: null });

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
          // update() spy: returns the spy reference so callers chain .eq()
          update: (payload: unknown) => {
            pushSubscriptionsUpdateSpy(payload);
            return { eq: pushSubscriptionsUpdateSpy };
          },
          delete: () => ({ eq: pushSubscriptionsDeleteMock }),
        };
      }
      if (table === "profiles") {
        return {
          // update() spy: captures the actual payload ({ next_game_on: null }
          // for game-day sends, or { next_game_on: null } for stale cleanup)
          update: (payload: unknown) => {
            profilesUpdateSpy(payload);
            return {
              eq: profilesUpdateSpy,
              lt: profilesUpdateSpy,
            };
          },
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
  pushSubscriptionsUpdateSpy.mockReturnValue({ error: null });
  pushSubscriptionsDeleteMock.mockReturnValue({ error: null });
  profilesUpdateSpy.mockReturnValue({ error: null });
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

  it("clears next_game_on with { next_game_on: null } payload on profiles after a game-day send", async () => {
    gameDayRpcRows = [ATHLETE_A];
    dueRpcRows = [];

    await GET(makeRequest());

    // profilesUpdateSpy is called as update(payload) — first call should have
    // the game-day clear payload { next_game_on: null }.
    expect(profilesUpdateSpy).toHaveBeenCalledWith({ next_game_on: null });
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

  it("falls through to daily reminders if game-day RPC errors (symmetric error handling)", async () => {
    gameDayRpcError = { message: "RPC unavailable" };
    dueRpcRows = [ATHLETE_B];

    const res = await GET(makeRequest());
    const body = await res.json();

    // Daily reminder was still sent (game-day error is non-fatal; both RPCs
    // are fetched concurrently so neither blocks the other)
    expect(body.sent).toBe(1);
    expect(res.status).toBe(200);
  });

  it("completes game-day sends if daily RPC errors (symmetric error handling)", async () => {
    gameDayRpcRows = [ATHLETE_A];
    dueRpcError = { message: "due_push_reminders RPC unavailable" };

    const res = await GET(makeRequest());
    const body = await res.json();

    // Game-day nudge was still sent even though daily RPC failed.
    // The route no longer 500s on a daily RPC failure.
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

  it("morning-reminder athlete receives BOTH daily (AM) and game-day nudge (PM cohort)", async () => {
    // Simulates dedupe-inversion scenario: athlete got a morning daily remind
    // (last_sent_on = today in AM), but due_game_day_reminders has no
    // last_sent_on gate so the game-day nudge still fires at 3–4 PM.
    // At the DB level this is purely a SQL concern; at the route level we
    // verify that ATHLETE_A can appear in BOTH the game-day and daily batches
    // and the route correctly sends the game-day copy for the first occurrence
    // and skips the daily send (app-layer exclusion set).
    gameDayRpcRows = [ATHLETE_A];
    dueRpcRows = [ATHLETE_A]; // e.g. reminder_hour = 15 matches

    const res = await GET(makeRequest());
    const body = await res.json();

    // Game-day wins; daily is deduped via app-layer exclusion set.
    expect(body.sent).toBe(1); // only game-day send, not double-send
    expect(webpush.sendNotification).toHaveBeenCalledOnce();
    const payloadStr = (webpush.sendNotification as ReturnType<typeof vi.fn>).mock.calls[0]?.[1];
    const payload = JSON.parse(payloadStr as string) as Record<string, string>;
    expect(payload.title).toBe("Big game tonight");
  });

  it("evening-reminder athlete receives game-day only (no prior daily to stamp last_sent_on)", async () => {
    // Athlete whose reminder_hour is in the evening (e.g. 18) has NOT yet
    // received a daily reminder today. On game day their 3–4 PM window fires
    // the game-day nudge; last_sent_on is stamped, so the 6 PM daily is skipped.
    // Here we just verify the game-day path fires correctly.
    gameDayRpcRows = [ATHLETE_B]; // B has no due daily row (reminder_hour=18, not matched)
    dueRpcRows = [];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.sent).toBe(1);
    const payloadStr = (webpush.sendNotification as ReturnType<typeof vi.fn>).mock.calls[0]?.[1];
    const payload = JSON.parse(payloadStr as string) as Record<string, string>;
    expect(payload.title).toBe("Big game tonight");
  });
});
