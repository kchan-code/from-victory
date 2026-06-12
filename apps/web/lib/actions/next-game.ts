"use server";

/**
 * Server action: saveNextGame (FV-240)
 *
 * Saves a coarse self-reported next-game date on the athlete's profile row.
 * Called from the daily-session completion surface after the athlete taps
 * one of the four options in the NextGamePrompt component.
 *
 * Auth model: requireAthlete() — the action runs under the athlete's own
 * RLS session. The profiles_update_own policy permits athletes to update
 * their own row. No service-role needed.
 *
 * Date computation (server-side, not client-side):
 *   "tonight"      → today's date in UTC (game is tonight; the push is already
 *                    scoped to local hour 15-16 via the cron function)
 *   "tomorrow"     → today + 1 day
 *   "this weekend" → the next Saturday from today (or today if today is Saturday)
 *   "not_sure"     → NULL (no date stored; clears any prior value)
 *
 * Privacy contract:
 *   - Coarse date only. No time, location, opponent, or venue.
 *   - Self-reported; the athlete can change or ignore the prompt.
 *   - Column on profiles → cascades with profile deletion automatically.
 *   - NEVER surfaced on the parent dashboard (explicit-column queries there).
 *   - Input validated server-side from a closed enum — no free-text accepted.
 */

import { z } from "zod";

import { requireAthlete } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Enum + schema
// ---------------------------------------------------------------------------

export const NEXT_GAME_ANSWERS = [
  "tonight",
  "tomorrow",
  "this_weekend",
  "not_sure",
] as const;

export type NextGameAnswer = (typeof NEXT_GAME_ANSWERS)[number];

const NextGameAnswerSchema = z.enum(NEXT_GAME_ANSWERS);

// ---------------------------------------------------------------------------
// Date computation — pure, exportable for tests
// ---------------------------------------------------------------------------

/**
 * Derives the next_game_on date from the athlete's answer.
 * Returns null for "not_sure".
 * @param answer  Validated NextGameAnswer
 * @param today   Caller-supplied "today" (YYYY-MM-DD). Defaults to UTC today.
 *                Accepting this as a param makes the function fully testable
 *                without Date mocking.
 */
export function computeNextGameDate(
  answer: NextGameAnswer,
  today?: string,
): string | null {
  if (answer === "not_sure") return null;

  const base = today ? new Date(`${today}T00:00:00Z`) : new Date();
  // Normalise to midnight UTC so arithmetic is clean
  const utcMidnight = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()),
  );

  if (answer === "tonight") {
    return utcMidnight.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  if (answer === "tomorrow") {
    utcMidnight.setUTCDate(utcMidnight.getUTCDate() + 1);
    return utcMidnight.toISOString().slice(0, 10);
  }

  // "this_weekend" → next Saturday (day 6).
  // If today IS Saturday, use today.
  const day = utcMidnight.getUTCDay(); // 0=Sun, 6=Sat
  const daysUntilSat = day === 6 ? 0 : (6 - day + 7) % 7;
  // If daysUntilSat is 0 (Sunday path: (6-0+7)%7=6) let it roll; but
  // if today is Saturday day===6 → 0, use today itself.
  const adjustedDays = day === 6 ? 0 : daysUntilSat === 0 ? 7 : daysUntilSat;
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() + adjustedDays);
  return utcMidnight.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type NextGameResult = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// saveNextGame — main action
// ---------------------------------------------------------------------------

/**
 * Saves (or clears) the athlete's next_game_on date.
 * "not_sure" sets next_game_on to null.
 * Calling this a second time overwrites the previous answer — no history kept.
 */
export async function saveNextGame(
  answer: unknown,
): Promise<NextGameResult> {
  const parsed = NextGameAnswerSchema.safeParse(answer);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid answer — please pick one of the four options.",
    };
  }

  const { userId } = await requireAthlete();
  const supabase = createClient();

  const nextGameOn = computeNextGameDate(parsed.data);

  const { error } = await supabase
    .from("profiles")
    .update({ next_game_on: nextGameOn })
    .eq("id", userId);

  if (error) {
    console.error("[next-game.saveNextGame] update failed:", error.message);
    return { ok: false, error: "Couldn't save — tap to try again." };
  }

  return { ok: true };
}
