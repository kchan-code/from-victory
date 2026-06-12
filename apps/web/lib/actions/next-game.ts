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
 * Date computation (server-side, timezone-aware):
 *   The client passes its IANA timezone (e.g. "America/New_York") so the
 *   server can compute the athlete's LOCAL today. This prevents the UTC-
 *   rollover bug where an athlete answering late in the evening (US time)
 *   has already rolled into the next UTC day, causing the stored date to be
 *   off by one from the cron's `(now() at time zone ps.timezone)::date` check.
 *
 *   "tonight"      → local today
 *   "tomorrow"     → local today + 1 day
 *   "this weekend" → next Saturday from local today (or today if already Sat)
 *   "not_sure"     → NULL (no date stored; clears any prior value)
 *
 * Privacy contract:
 *   - Coarse date only. No time, location, opponent, or venue.
 *   - Self-reported; the athlete can change or ignore the prompt.
 *   - Column on profiles → cascades with profile deletion automatically.
 *   - NEVER surfaced on the parent dashboard (explicit-column queries there).
 *   - Input validated server-side from a closed enum — no free-text accepted.
 *   - The IANA timezone is validated server-side; falls back to UTC on invalid.
 */

import { z } from "zod";

import { requireAthlete } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  computeNextGameDate,
  NextGameAnswer,
  NEXT_GAME_ANSWERS,
} from "@/lib/daily/next-game-shared";

// Re-export so callers that need only the action file don't have to split
// their imports. The "use server" constraint applies to exports from THIS
// file — the shared module is plain TS and has no such constraint.
export type { NextGameAnswer };
export { NEXT_GAME_ANSWERS, computeNextGameDate };

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const NextGameAnswerSchema = z.enum(NEXT_GAME_ANSWERS);

const SaveNextGameSchema = z.object({
  answer: NextGameAnswerSchema,
  // Client passes Intl.DateTimeFormat().resolvedOptions().timeZone.
  // We validate it server-side; fall back to UTC on invalid/missing.
  timezone: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Timezone helper — server-side validation + local-today derivation
// ---------------------------------------------------------------------------

/**
 * Given an IANA timezone string from the client, returns today's date in
 * that timezone as YYYY-MM-DD. Falls back to UTC if the timezone is invalid
 * or missing.
 *
 * Validation: construct an Intl.DateTimeFormat with the candidate tz inside
 * a try/catch. Intl throws RangeError on an invalid timezone identifier.
 */
function localTodayInTz(tz: string | undefined): string {
  if (!tz) {
    return new Date().toLocaleDateString("en-CA", { timeZone: "UTC" });
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }); // throws on invalid
    return new Date().toLocaleDateString("en-CA", { timeZone: tz });
  } catch {
    // Invalid timezone — fall back to UTC. Non-fatal: worst case the date
    // is off by one for users straddling midnight; better than crashing.
    console.warn(
      `[next-game] invalid timezone "${tz}", falling back to UTC`,
    );
    return new Date().toLocaleDateString("en-CA", { timeZone: "UTC" });
  }
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
 *
 * @param answer    One of NEXT_GAME_ANSWERS, or unknown (validated here).
 * @param timezone  IANA timezone string from the client browser (optional).
 *                  Used to compute local-today so the stored date aligns with
 *                  what the cron matches.
 */
export async function saveNextGame(
  answer: unknown,
  timezone?: unknown,
): Promise<NextGameResult> {
  const parsed = SaveNextGameSchema.safeParse({
    answer,
    timezone: typeof timezone === "string" ? timezone : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid answer — please pick one of the four options.",
    };
  }

  const { userId } = await requireAthlete();
  const supabase = createClient();

  const localToday = localTodayInTz(parsed.data.timezone);
  const nextGameOn = computeNextGameDate(parsed.data.answer, localToday);

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
