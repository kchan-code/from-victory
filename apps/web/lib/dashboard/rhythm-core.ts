// Dashboard rhythm metadata — PURE CORE (FV-85).
//
// No server imports, no next/headers, no DB client import. Takes plain inputs
// or an injected client parameter. Unit-testable in a node env.
//
// The server entry point that supplies a real Supabase client from createClient()
// lives in ./rhythm.ts (thin wrapper, same pattern as lib/daily/session.ts vs
// lib/daily/progression.ts).
//
// Privacy invariant: this file NEVER selects journal_entries or session content.
// It shapes and fetches ONLY the four view columns from athlete_session_metadata.

import type { SupabaseClient } from "@supabase/supabase-js";

import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";
import type { Database } from "@/lib/supabase/types";

type ServerClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Shape returned to the dashboard per athlete
// ---------------------------------------------------------------------------

export type AthleteRhythmMeta = {
  /** sessions_completed from the view, defaulting 0 if no row exists yet. */
  sessionsCompleted: number;
  /** sessions_started from the view, defaulting 0 if no row exists yet. */
  sessionsStarted: number;
  /**
   * Rhythm ring percentage: round(sessionsCompleted / TOTAL_TRAINING_DAYS * 100).
   * Matches the exact formula on the athlete side (athlete/page.tsx:45,
   * athlete/daily/page.tsx:36).
   */
  progressPct: number;
  /**
   * Display label for the ring.
   * 0 complete → "rhythm starts today" (encouragement, never shame or streak).
   * 1 complete → "1 session complete"
   * N complete → "N sessions complete"
   */
  ringLabel: string;
  /** ISO timestamp or null — display hint for the parent. */
  lastCompletedAt: string | null;
};

// ---------------------------------------------------------------------------
// Pure shaping function (no I/O — fully unit-testable)
// ---------------------------------------------------------------------------

/**
 * Shape raw view columns into the AthleteRhythmMeta display model.
 * Pass null for any field when the athlete has no metadata row yet —
 * maps cleanly to the zero-state (0%, encouraging "rhythm starts today" copy).
 */
export function shapeAthleteRhythm(row: {
  sessions_completed: number | null;
  sessions_started: number | null;
  last_completed_at: string | null;
}): AthleteRhythmMeta {
  const sessionsCompleted = row.sessions_completed ?? 0;
  const sessionsStarted = row.sessions_started ?? 0;
  const progressPct = Math.round(
    (sessionsCompleted / TOTAL_TRAINING_DAYS) * 100,
  );

  const ringLabel =
    sessionsCompleted === 0
      ? "rhythm starts today"
      : sessionsCompleted === 1
        ? "1 session complete"
        : `${sessionsCompleted} sessions complete`;

  return {
    sessionsCompleted,
    sessionsStarted,
    progressPct,
    ringLabel,
    lastCompletedAt: row.last_completed_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Zero-state constant (athlete linked but never started)
// ---------------------------------------------------------------------------

/** Encouraging zero-state used when an athlete has no metadata row yet. */
export const ZERO_RHYTHM: AthleteRhythmMeta = shapeAthleteRhythm({
  sessions_completed: null,
  sessions_started: null,
  last_completed_at: null,
});

// ---------------------------------------------------------------------------
// Data fetch — takes an INJECTED client (no createClient import here)
// ---------------------------------------------------------------------------

/**
 * Fetch session-count metadata for ALL athletes the calling client can see.
 *
 * The view (athlete_session_metadata) is security_invoker = true, so RLS
 * scopes the result to the parent's linked athletes when called with the
 * parent's auth client. Do NOT pass a service-role client.
 *
 * Returns a Map<athlete_id, AthleteRhythmMeta>. Athletes with no view row
 * (never started) are absent — callers use `map.get(id) ?? ZERO_RHYTHM`.
 *
 * On DB error: non-fatal — returns an empty map so the dashboard degrades
 * gracefully rather than crashing.
 */
export async function loadAthleteMetadataMap(
  supabase: ServerClient,
): Promise<Map<string, AthleteRhythmMeta>> {
  // Select ONLY the four view columns. No joins to content or journal tables.
  const { data, error } = await supabase
    .from("athlete_session_metadata")
    .select("athlete_id, sessions_started, sessions_completed, last_completed_at");

  if (error) {
    console.error("dashboard rhythm: metadata fetch failed —", error.message);
    return new Map();
  }

  const map = new Map<string, AthleteRhythmMeta>();
  for (const row of data ?? []) {
    if (!row.athlete_id) continue; // view columns are nullable — guard
    map.set(row.athlete_id, shapeAthleteRhythm(row));
  }
  return map;
}
