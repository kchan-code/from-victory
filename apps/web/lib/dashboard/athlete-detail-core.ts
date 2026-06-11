// Dashboard athlete-detail — PURE CORE (FV-191).
//
// No server imports, no next/headers, no DB client import. Takes plain inputs
// or an injected client parameter. Unit-testable in a node env.
//
// The server entry point that supplies a real Supabase client from createClient()
// lives in ./athlete-detail.ts (thin wrapper — same pattern as rhythm.ts).
//
// Privacy invariant: this file NEVER selects journal_entries or session content.
// It queries ONLY:
//   • profiles: id, first_name, birthdate, sport (parent-linked RLS)
//   • athlete_sessions: athlete_id, completed_at (parent-linked RLS)
//     joined to training_sessions_catalog: day_number (explicit column)
// No select('*') anywhere.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ServerClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Public return shapes — METADATA ONLY
// ---------------------------------------------------------------------------

/**
 * One completed-session record. Contains ONLY the date trained and the
 * catalog day number — zero content fields.
 */
export type AthleteSessionDay = {
  /** ISO timestamp — when this session was completed. */
  completedAt: string;
  /** 1..30 — catalog day number for labeling (e.g. "Day 5"). */
  dayNumber: number;
};

/** Full detail payload. Metadata-only; no content, no journal fields. */
export type AthleteDetailData = {
  athleteId: string;
  firstName: string;
  /** Null if birthdate is missing (type-safe — schema requires it for athletes). */
  birthdate: string | null;
  /** Null if sport has not been set yet (schema column is nullable). */
  sport: string | null;
  /**
   * Completed-session calendar entries sorted ascending by completedAt.
   * Only rows where completed_at IS NOT NULL are included.
   */
  completedDays: AthleteSessionDay[];
  /** Total sessions where completed_at IS NOT NULL. */
  sessionsCompleted: number;
  /** Total session rows (started, with or without completion). */
  sessionsStarted: number;
  /** ISO string of most-recent completion, or null if none. */
  lastActiveAt: string | null;
};

// ---------------------------------------------------------------------------
// Raw row type for the injected-client fetch
// ---------------------------------------------------------------------------

export type RawSessionRow = {
  completed_at: string | null;
  training_sessions_catalog: {
    day_number: number;
  } | null;
};

// ---------------------------------------------------------------------------
// Pure shaping function (no I/O — fully unit-testable)
// ---------------------------------------------------------------------------

/**
 * Shape raw DB rows into AthleteDetailData.
 *
 * Pure function — takes plain data, returns the display model.
 * No DB calls, no imports from server modules. Unit-testable in node env.
 */
export function shapeAthleteDetail(
  athleteId: string,
  firstName: string,
  birthdate: string | null,
  sport: string | null,
  rows: RawSessionRow[],
): AthleteDetailData {
  const sessionsStarted = rows.length;

  // Keep only completed rows; sort ascending for calendar rendering.
  const completedRows = rows
    .filter((r) => r.completed_at !== null)
    .sort((a, b) => {
      const aAt = a.completed_at ?? "";
      const bAt = b.completed_at ?? "";
      return aAt < bAt ? -1 : aAt > bAt ? 1 : 0;
    });

  const sessionsCompleted = completedRows.length;
  const lastActiveAt =
    completedRows.length > 0
      ? (completedRows[completedRows.length - 1]?.completed_at ?? null)
      : null;

  // Exclude rows where the catalog join returned null (FK always present in
  // practice, but the Supabase join type is nullable — guard it here).
  type CompletedWithCatalog = {
    completed_at: string;
    training_sessions_catalog: { day_number: number };
  };
  const completedDays: AthleteSessionDay[] = completedRows
    .filter(
      (r): r is CompletedWithCatalog =>
        r.completed_at !== null && r.training_sessions_catalog !== null,
    )
    .map((r) => ({
      completedAt: r.completed_at,
      dayNumber: r.training_sessions_catalog.day_number,
    }));

  return {
    athleteId,
    firstName,
    birthdate,
    sport,
    completedDays,
    sessionsCompleted,
    sessionsStarted,
    lastActiveAt,
  };
}

// ---------------------------------------------------------------------------
// Data fetch — takes an INJECTED client (no createClient import here)
// ---------------------------------------------------------------------------

/**
 * Fetch athlete profile + session calendar data for ONE athlete.
 *
 * Privacy guarantee: selects ONLY these columns —
 *   profiles:                  id, first_name, birthdate, sport
 *   athlete_sessions:          athlete_id, completed_at
 *   training_sessions_catalog: day_number (via PostgREST FK join)
 *
 * The "athlete_sessions_select_linked_parent" RLS policy scopes rows to the
 * calling parent's linked athletes. An unlinked athlete_id returns no row on
 * the profiles query (via "profiles_parent_select_linked_athlete").
 *
 * Returns null if the athlete profile is not found (unlinked or wrong id).
 * Returns AthleteDetailData with empty completedDays if the athlete has no
 * sessions yet.
 *
 * @param supabase   Injected auth-context client. Do NOT pass a service-role client.
 * @param athleteId  The UUID from the route param.
 */
export async function loadAthleteDetail(
  supabase: ServerClient,
  athleteId: string,
): Promise<AthleteDetailData | null> {
  // 1. Fetch the athlete profile.
  //    RLS "profiles_parent_select_linked_athlete" scopes to linked athletes.
  //    An unlinked id yields no row.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, birthdate, sport")
    .eq("id", athleteId)
    .eq("role", "athlete")
    .maybeSingle();

  if (profileError) {
    console.error(
      "athlete-detail: profile fetch failed —",
      profileError.message,
    );
    return null;
  }
  if (!profile) return null; // unlinked or nonexistent

  // 2. Fetch session calendar rows — ONLY completed_at + catalog day_number.
  //    "athlete_sessions_select_linked_parent" RLS scopes automatically.
  //    Explicit column list: no '*', no content fields.
  const { data: sessionRows, error: sessionError } = await supabase
    .from("athlete_sessions")
    .select("completed_at, training_sessions_catalog(day_number)")
    .eq("athlete_id", athleteId);

  if (sessionError) {
    console.error(
      "athlete-detail: sessions fetch failed —",
      sessionError.message,
    );
    // Non-fatal: return profile-only with empty sessions rather than crashing.
    return shapeAthleteDetail(
      profile.id,
      profile.first_name,
      profile.birthdate ?? null,
      profile.sport ?? null,
      [],
    );
  }

  return shapeAthleteDetail(
    profile.id,
    profile.first_name,
    profile.birthdate ?? null,
    profile.sport ?? null,
    (sessionRows ?? []) as RawSessionRow[],
  );
}
