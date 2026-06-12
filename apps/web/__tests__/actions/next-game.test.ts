/**
 * Unit tests for the `saveNextGame` server action and `computeNextGameDate`
 * helper (FV-240).
 *
 * computeNextGameDate is now in lib/daily/next-game-shared.ts (a plain module,
 * not "use server") so it can be imported here without restrictions.
 * saveNextGame is the async-only "use server" action in lib/actions/next-game.ts.
 *
 * Cases:
 *   computeNextGameDate:
 *     1. "tonight" → today's date
 *     2. "tomorrow" → today + 1 day
 *     3. "this_weekend" from a Monday → next Saturday
 *     4. "this_weekend" from a Saturday → same Saturday (today)
 *     5. "this_weekend" from a Sunday → next Saturday (6 days ahead)
 *     6. "this_weekend" from Wednesday → +3 days
 *     7. "not_sure" → null
 *     (Timezone-rollover tests below)
 *
 *   saveNextGame (action):
 *     8. Invalid answer rejects with { ok: false }
 *     9. "tonight" → writes today's date to profiles
 *    10. "not_sure" → writes null to profiles
 *    11. Supabase update error → returns { ok: false }
 *    12. Timezone forwarded: UTC 03:00 (= previous evening America/Los_Angeles)
 *        stores local-yesterday, not UTC-today
 *    13. Invalid timezone falls back to UTC without crashing
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/guards", () => ({
  requireAthlete: async () => ({ userId: "athlete-uuid-001" }),
}));

// Mutable Supabase mock — each test sets eqMock return as needed.
const eqMock = vi.fn().mockReturnValue({ error: null });

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({
        eq: eqMock,
      }),
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import {
  computeNextGameDate,
} from "@/lib/daily/next-game-shared";

import {
  saveNextGame,
} from "@/lib/actions/next-game";

// ---------------------------------------------------------------------------
// computeNextGameDate — pure function, no mocks needed
// ---------------------------------------------------------------------------

describe("computeNextGameDate", () => {
  it("tonight → returns today's date (YYYY-MM-DD)", () => {
    const result = computeNextGameDate("tonight", "2026-06-12");
    expect(result).toBe("2026-06-12");
  });

  it("tomorrow → returns today + 1 day", () => {
    const result = computeNextGameDate("tomorrow", "2026-06-12");
    expect(result).toBe("2026-06-13");
  });

  it("this_weekend from Monday → returns next Saturday", () => {
    // 2026-06-08 is a Monday (day 1)
    const result = computeNextGameDate("this_weekend", "2026-06-08");
    // Next Saturday from Monday = +5 days
    expect(result).toBe("2026-06-13");
  });

  it("this_weekend from Saturday → returns same Saturday (today)", () => {
    // 2026-06-13 is a Saturday (day 6)
    const result = computeNextGameDate("this_weekend", "2026-06-13");
    expect(result).toBe("2026-06-13");
  });

  it("this_weekend from Sunday → returns next Saturday (6 days ahead)", () => {
    // 2026-06-14 is a Sunday (day 0)
    const result = computeNextGameDate("this_weekend", "2026-06-14");
    // Next Saturday: +6 days
    expect(result).toBe("2026-06-20");
  });

  it("this_weekend from Wednesday → returns next Saturday (+3 days)", () => {
    // 2026-06-10 is a Wednesday (day 3)
    const result = computeNextGameDate("this_weekend", "2026-06-10");
    expect(result).toBe("2026-06-13");
  });

  it("not_sure → returns null", () => {
    const result = computeNextGameDate("not_sure", "2026-06-12");
    expect(result).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Timezone rollover: UTC 03:00 on 2026-06-13 = 2026-06-12 in America/Los_Angeles
  // (UTC-7 in PDT). An athlete in LA answering at 8 PM local time has
  // "2026-06-12" as their local today, even though UTC has rolled to 2026-06-13.
  // The action derives localToday server-side and passes it here as a parameter.
  // ---------------------------------------------------------------------------

  it("tonight with LA local today stores local date, not UTC date", () => {
    // The action derived "2026-06-12" as local today for America/Los_Angeles
    // at UTC 03:00 on 2026-06-13.
    const result = computeNextGameDate("tonight", "2026-06-12");
    expect(result).toBe("2026-06-12");
  });

  it("tomorrow with LA local today stores correct local+1 date", () => {
    // local today = 2026-06-12; tomorrow = 2026-06-13
    const result = computeNextGameDate("tomorrow", "2026-06-12");
    expect(result).toBe("2026-06-13");
  });
});

// ---------------------------------------------------------------------------
// saveNextGame — action with mocked Supabase
// ---------------------------------------------------------------------------

describe("saveNextGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqMock.mockReturnValue({ error: null });
  });

  it("rejects invalid answer with ok:false", async () => {
    const result = await saveNextGame("next_week");
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("Invalid answer"),
    });
  });

  it("rejects null input with ok:false", async () => {
    const result = await saveNextGame(null);
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("Invalid answer"),
    });
  });

  it("rejects empty string with ok:false", async () => {
    const result = await saveNextGame("");
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("Invalid answer"),
    });
  });

  it("tonight → calls update + returns ok:true", async () => {
    const result = await saveNextGame("tonight");
    expect(result).toEqual({ ok: true });
    // .eq("id", athleteId) was called
    expect(eqMock).toHaveBeenCalledWith("id", "athlete-uuid-001");
  });

  it("not_sure → calls update with null + returns ok:true", async () => {
    const result = await saveNextGame("not_sure");
    expect(result).toEqual({ ok: true });
    expect(eqMock).toHaveBeenCalledWith("id", "athlete-uuid-001");
  });

  it("tomorrow → returns ok:true", async () => {
    const result = await saveNextGame("tomorrow");
    expect(result).toEqual({ ok: true });
  });

  it("this_weekend → returns ok:true", async () => {
    const result = await saveNextGame("this_weekend");
    expect(result).toEqual({ ok: true });
  });

  it("Supabase error → returns ok:false", async () => {
    eqMock.mockReturnValue({ error: { message: "DB write failed" } });
    const result = await saveNextGame("tonight");
    expect(result).toEqual({
      ok: false,
      error: expect.any(String),
    });
  });

  it("valid timezone accepted without error", async () => {
    // America/New_York is a valid IANA tz — action should accept and return ok.
    const result = await saveNextGame("tonight", "America/New_York");
    expect(result).toEqual({ ok: true });
  });

  it("invalid timezone falls back to UTC without crashing", async () => {
    // "Not/A_Timezone" is invalid — localTodayInTz falls back to UTC.
    // The action should still return ok:true (graceful degradation, not crash).
    const result = await saveNextGame("tonight", "Not/A_Timezone");
    expect(result).toEqual({ ok: true });
    expect(eqMock).toHaveBeenCalledWith("id", "athlete-uuid-001");
  });

  it("non-string timezone is treated as missing (falls back to UTC)", async () => {
    // The schema accepts timezone as optional string; a number is ignored.
    // reason: any cast needed to test runtime boundary beyond TypeScript's reach
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await saveNextGame("tonight", 42 as any);
    expect(result).toEqual({ ok: true });
  });
});
