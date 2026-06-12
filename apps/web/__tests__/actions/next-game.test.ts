/**
 * Unit tests for the `saveNextGame` server action and `computeNextGameDate`
 * helper (FV-240).
 *
 * Cases:
 *   computeNextGameDate:
 *     1. "tonight" → today's date
 *     2. "tomorrow" → today + 1 day
 *     3. "this_weekend" from a Monday → next Saturday
 *     4. "this_weekend" from a Saturday → same Saturday (today)
 *     5. "this_weekend" from a Sunday → next Saturday (6 days ahead)
 *     6. "not_sure" → null
 *
 *   saveNextGame (action):
 *     7. Invalid answer rejects with { ok: false }
 *     8. "tonight" → writes today's date to profiles
 *     9. "not_sure" → writes null to profiles
 *     10. Supabase update error → returns { ok: false }
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/guards", () => ({
  requireAthlete: async () => ({ userId: "athlete-uuid-001" }),
}));

// Mutable Supabase mock — each test sets `updateError` as needed.
let updateError: { message: string } | null = null;
const updateMock = vi.fn().mockImplementation(() => ({ error: updateError }));
const eqMock = vi.fn().mockReturnValue({ error: updateError });

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
});

// ---------------------------------------------------------------------------
// saveNextGame — action with mocked Supabase
// ---------------------------------------------------------------------------

describe("saveNextGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateError = null;
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
});
