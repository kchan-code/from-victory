/**
 * Shared (non-server) module for next-game answer types and date computation.
 *
 * Extracted from the "use server" action so that client components and tests
 * can import types and the pure date helper without hitting Next.js's
 * constraint that "use server" modules may only export async functions.
 *
 * FV-240
 */

// ---------------------------------------------------------------------------
// Enum + types
// ---------------------------------------------------------------------------

export const NEXT_GAME_ANSWERS = [
  "tonight",
  "tomorrow",
  "this_weekend",
  "not_sure",
] as const;

export type NextGameAnswer = (typeof NEXT_GAME_ANSWERS)[number];

// ---------------------------------------------------------------------------
// Date computation — pure, exportable for tests
// ---------------------------------------------------------------------------

/**
 * Derives the next_game_on date from the athlete's answer.
 * Returns null for "not_sure".
 *
 * @param answer    Validated NextGameAnswer
 * @param localToday  Caller-supplied local "today" as YYYY-MM-DD.
 *   Pass the athlete's local date (derived from their IANA timezone) so the
 *   stored date matches what the cron will match against
 *   `(now() at time zone ps.timezone)::date`.
 *   Defaults to UTC today if omitted — use this default only in tests that
 *   don't care about timezone rollover edge cases.
 *
 * Accepting localToday as a parameter makes this function fully testable
 * without Date mocking and without depending on the server action's timezone
 * validation logic.
 */
export function computeNextGameDate(
  answer: NextGameAnswer,
  localToday?: string,
): string | null {
  if (answer === "not_sure") return null;

  // Build a UTC-midnight base from the supplied local date string.
  // Using T00:00:00Z on a YYYY-MM-DD string is safe: Date.UTC() arithmetic
  // operates entirely in UTC so local-system-tz variation is irrelevant here.
  const base = localToday
    ? new Date(`${localToday}T00:00:00Z`)
    : new Date();
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
  // If today IS Saturday (day 6), use today itself.
  // Otherwise, compute how many days until next Saturday.
  // (6 - day + 7) % 7 gives:
  //   Sun(0) → 6,  Mon(1) → 5,  Tue(2) → 4,
  //   Wed(3) → 3,  Thu(4) → 2,  Fri(5) → 1,  Sat(6) → 0
  const day = utcMidnight.getUTCDay();
  const daysUntilSat = day === 6 ? 0 : (6 - day + 7) % 7;
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() + daysUntilSat);
  return utcMidnight.toISOString().slice(0, 10);
}
