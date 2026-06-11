// Journey view: completed-session history for the athlete (FV-190).
//
// Testable CORE — takes an injected Supabase client (typed only).
// No next/headers, no server-runtime imports here. Mirrors the
// lib/daily/progression.ts pattern exactly.
//
// Data contract:
//   - Queries athlete_sessions where completed_at IS NOT NULL.
//   - Joins to training_sessions_catalog for session content.
//   - Orders newest first (completed_at DESC).
//   - If a catalog row is missing (e.g. sport content not yet seeded),
//     the session entry is returned with null content — never throws.
//     The UI degrades gracefully (AC #6).
//
// No write paths. No journal_entries. No safety imports. (AC non-goals.)

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type ServerClient = SupabaseClient<Database>;

/** A single completed session as rendered by the Journey list. */
export type JourneyEntry = {
  /** The athlete_sessions row id. */
  sessionId: string;
  /** The catalog day number (1–30). */
  dayNumber: number;
  /** ISO timestamp of completion (never null — filtered upstream). */
  completedAt: string;
  /**
   * The catalog content for this day. Null when the catalog row is
   * missing (sport/day gap) — degrade gracefully, don't crash.
   */
  content: {
    title: string;
    scriptureRef: string;
    scriptureText: string;
    mentalSkillMd: string;
  } | null;
};

/**
 * Load all completed sessions for an athlete, newest first.
 * Tolerates missing catalog rows (content = null) rather than throwing.
 *
 * Never queries journal_entries or safety tables (FV-190 non-goals).
 */
export async function loadJourney(
  supabase: ServerClient,
  athleteId: string,
): Promise<JourneyEntry[]> {
  // Fetch completed athlete_sessions with their catalog join in one query.
  // We select the catalog columns we need alongside the session metadata.
  const { data, error } = await supabase
    .from("athlete_sessions")
    .select(
      `
      id,
      completed_at,
      training_sessions_catalog (
        day_number,
        title,
        scripture_ref,
        scripture_text,
        mental_skill_md
      )
    `,
    )
    .eq("athlete_id", athleteId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (error) {
    throw new Error(`journey: session query failed — ${error.message}`);
  }

  if (!data) return [];

  return data.map((row) => {
    // noUncheckedIndexedAccess: row is typed via the Database generic, but
    // the joined table shape comes back as an object or null (not an array).
    // We cast through unknown only here because the Supabase select-join
    // returns a nested object shape that TypeScript narrows as an array type
    // in some versions of the generated types, but is always a single object
    // at runtime for a FK relationship.
    const catalog = row.training_sessions_catalog as
      | {
          day_number: number;
          title: string;
          scripture_ref: string;
          scripture_text: string;
          mental_skill_md: string;
        }
      | null;

    return {
      sessionId: row.id,
      // completed_at is guaranteed non-null by the .not("completed_at","is",null) filter.
      completedAt: row.completed_at as string,
      dayNumber: catalog?.day_number ?? 0,
      content: catalog
        ? {
            title: catalog.title,
            scriptureRef: catalog.scripture_ref,
            scriptureText: catalog.scripture_text,
            mentalSkillMd: catalog.mental_skill_md,
          }
        : null,
    };
  });
}

/**
 * Load a single completed session entry by day number for the detail view.
 * Returns null if not found (athlete hasn't completed that day, or day
 * number is invalid). Never throws on missing data — caller renders 404.
 *
 * Only returns the session if it was actually completed by this athlete
 * (completed_at not null) — no read access to other athletes' sessions.
 */
export async function loadJourneyEntry(
  supabase: ServerClient,
  athleteId: string,
  dayNumber: number,
): Promise<JourneyEntry | null> {
  if (!Number.isInteger(dayNumber) || dayNumber < 1) return null;

  const { data, error } = await supabase
    .from("athlete_sessions")
    .select(
      `
      id,
      completed_at,
      training_sessions_catalog (
        day_number,
        title,
        scripture_ref,
        scripture_text,
        mental_skill_md
      )
    `,
    )
    .eq("athlete_id", athleteId)
    .not("completed_at", "is", null)
    .eq("training_sessions_catalog.day_number", dayNumber)
    .not("training_sessions_catalog", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `journey: entry query failed for day ${dayNumber} — ${error.message}`,
    );
  }

  if (!data || !data.completed_at) return null;

  const catalog = data.training_sessions_catalog as
    | {
        day_number: number;
        title: string;
        scripture_ref: string;
        scripture_text: string;
        mental_skill_md: string;
      }
    | null;

  if (!catalog) return null;

  return {
    sessionId: data.id,
    completedAt: data.completed_at,
    dayNumber: catalog.day_number,
    content: {
      title: catalog.title,
      scriptureRef: catalog.scripture_ref,
      scriptureText: catalog.scripture_text,
      mentalSkillMd: catalog.mental_skill_md,
    },
  };
}
