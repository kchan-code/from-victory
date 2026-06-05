// Daily-training progression + sport-keyed catalog resolution (FV-82).
//
// This module is the testable CORE of the daily-session data layer. It takes an
// injected Supabase client (typed only) and pure inputs, so it carries NO
// next/headers / server-runtime imports and can be unit-tested in a node env.
// The server entry points that supply a real client live in:
//   - lib/daily/session.ts            (read — getDailySession)
//   - lib/actions/daily-session.ts    (writes — start/complete)
//
// Progression model (KC call 2026-06-05, product-strategist scope):
//   current day = completed-session count + 1, capped at TOTAL_TRAINING_DAYS.
//   SEQUENTIAL free-advance — NOT calendar-date gated, NO one-per-day throttle.
//   This is the anti-shame choice encoded in content_schema.sql L72-75 and the
//   gamification non-negotiables (an athlete returning after a gap is never
//   punished). Day N+1 unlocks when day N is completed, regardless of date.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Sport } from "@/lib/sports";
import type { Database } from "@/lib/supabase/types";

type ServerClient = SupabaseClient<Database>;

export const TOTAL_TRAINING_DAYS = 30;

export type DailySessionContent =
  Database["public"]["Tables"]["training_sessions_catalog"]["Row"];

export type DailySessionView = {
  /** The day to show (1..TOTAL_TRAINING_DAYS). */
  dayNumber: number;
  /** Completed-session count behind the progression. */
  completedCount: number;
  /** True once the athlete has completed all days (stays on the last day). */
  allComplete: boolean;
  /** The catalog row for (dayNumber, sport). */
  session: DailySessionContent;
};

/**
 * Pure progression: current day = completedCount + 1, capped at
 * TOTAL_TRAINING_DAYS. A negative/garbage count clamps to day 1.
 */
export function currentDayNumber(completedCount: number): number {
  const safe = Number.isFinite(completedCount) ? Math.max(completedCount, 0) : 0;
  return Math.min(safe + 1, TOTAL_TRAINING_DAYS);
}

/** Count an athlete's COMPLETED sessions (completed_at is not null). */
async function countCompleted(
  supabase: ServerClient,
  athleteId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("athlete_sessions")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athleteId)
    .not("completed_at", "is", null);
  if (error) {
    throw new Error(`daily progression: count failed — ${error.message}`);
  }
  return count ?? 0;
}

/**
 * Resolve the full catalog row for the athlete's current day + sport.
 * The sport comes from the athlete's profile, so basketball "just works" the
 * moment FV-32 content lands — never hardcodes 'hockey'.
 */
export async function loadDailySession(
  supabase: ServerClient,
  athleteId: string,
  sport: Sport,
): Promise<DailySessionView> {
  const completedCount = await countCompleted(supabase, athleteId);
  const dayNumber = currentDayNumber(completedCount);

  const { data: session, error } = await supabase
    .from("training_sessions_catalog")
    .select("*")
    .eq("day_number", dayNumber)
    .eq("sport", sport)
    .single();

  if (error || !session) {
    throw new Error(
      `daily session: no catalog row for day ${dayNumber} sport "${sport}" — ${error?.message ?? "not found"}`,
    );
  }

  return {
    dayNumber,
    completedCount,
    allComplete: completedCount >= TOTAL_TRAINING_DAYS,
    session,
  };
}

/**
 * Resolve just the current day's catalog id (for the start/complete writes,
 * which don't need the full body). Same (day_number, sport) keying as the read.
 */
export async function resolveCurrentCatalogId(
  supabase: ServerClient,
  athleteId: string,
  sport: Sport,
): Promise<{ catalogId: string; dayNumber: number }> {
  const completedCount = await countCompleted(supabase, athleteId);
  const dayNumber = currentDayNumber(completedCount);

  const { data, error } = await supabase
    .from("training_sessions_catalog")
    .select("id")
    .eq("day_number", dayNumber)
    .eq("sport", sport)
    .single();

  if (error || !data) {
    throw new Error(
      `daily session: no catalog row for day ${dayNumber} sport "${sport}" — ${error?.message ?? "not found"}`,
    );
  }

  return { catalogId: data.id, dayNumber };
}
