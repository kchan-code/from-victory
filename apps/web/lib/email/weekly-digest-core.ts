// Weekly parent digest — PURE CORE (FV-226).
//
// No server imports, no next/headers, no DB client import. Takes an injected
// client parameter. Unit-testable in a node env.
//
// Privacy invariant (NON-NEGOTIABLE):
//   - Sources data ONLY from athlete_session_metadata (sessions_completed,
//     sessions_started, last_completed_at) and profiles (first_name).
//   - NEVER reads journal_entries, journal content, pregame selections, or
//     any athlete-only field.
//   - The parent address is derived from auth.users via service-role (caller's
//     responsibility) — this file never touches auth.users directly.
//   - Tested: columns selected are asserted in digest-query.test.ts.
//
// Consumer: lib/email/weekly-digest.ts (thin server wrapper that supplies the
// real Supabase service-role client).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ServiceClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metadata for one athlete that appears in the digest. */
export type AthleteDigestData = {
  /** Athlete's first name — the only PII. */
  firstName: string;
  /** Total sessions completed across all 30 days. */
  sessionsCompleted: number;
  /** Sessions completed in the past 7 days (Mon 00:00 UTC → now). */
  sessionsThisWeek: number;
  /** Position in the 30-day program: max(sessions_completed, 0). */
  dayPosition: number;
};

/** Full digest payload for one parent, ready to render into the email. */
export type ParentDigestPayload = {
  parentId: string;
  /** Parent email — comes from auth.users, supplied by caller. */
  email: string;
  /** Parent first name for the greeting. */
  firstName: string;
  /** One entry per linked athlete. Empty array when parent has no athletes. */
  athletes: AthleteDigestData[];
  /** Unsubscribe token embedded in the unsubscribe link. */
  unsubscribeToken: string;
};

/** One parent row returned from the DB query. */
type ParentRow = {
  id: string;
  first_name: string;
  digest_opt_out: boolean | null;
  digest_unsubscribe_token: string | null;
};

/** Raw view row from athlete_session_metadata. */
type MetaRow = {
  athlete_id: string | null;
  sessions_completed: number | null;
  sessions_started: number | null;
  last_completed_at: string | null;
};

/** Athlete sessions row subset for weekly count. */
type SessionRow = {
  athlete_id: string;
  completed_at: string | null;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Count sessions from rows where completed_at >= windowStart. */
export function countSessionsInWindow(
  rows: SessionRow[],
  athleteId: string,
  windowStart: Date,
): number {
  return rows.filter((r) => {
    if (r.athlete_id !== athleteId) return false;
    if (!r.completed_at) return false;
    return new Date(r.completed_at) >= windowStart;
  }).length;
}

/** Derive rhythm summary line for a single athlete. Parent voice — never "kid." */
export function rhythmSummaryLine(data: AthleteDigestData): string {
  if (data.sessionsCompleted === 0) {
    return "Your athlete hasn't started yet — the rhythm begins whenever they're ready.";
  }
  if (data.sessionsThisWeek === 0) {
    return `Your athlete is on day ${data.dayPosition} of 30. No sessions this week — that's okay. The rhythm continues.`;
  }
  const plural = data.sessionsThisWeek === 1 ? "session" : "sessions";
  return `Your athlete completed ${data.sessionsThisWeek} ${plural} this week and is on day ${data.dayPosition} of 30.`;
}

// ---------------------------------------------------------------------------
// Data fetch (injected client)
// ---------------------------------------------------------------------------

/**
 * Load all parent rows that should receive a digest this week.
 *
 * Filters out:
 *   - Parents with digest_opt_out = true
 *   - Parents with no unsubscribe token (shouldn't happen post-migration)
 *   - Parents without an active/trialing subscription
 *
 * NOTE: The returned ParentRow list does NOT include the email address —
 * the caller (weekly-digest.ts) fetches emails via service-role Auth admin.
 *
 * On DB error: non-fatal — returns an empty array and logs the error.
 */
export async function loadEligibleParents(
  service: ServiceClient,
): Promise<ParentRow[]> {
  // Join to subscriptions to filter active/trialing only.
  // Service role bypasses RLS — this is intentional for cron use.
  const { data, error } = await service
    .from("profiles")
    .select(
      "id, first_name, digest_opt_out, digest_unsubscribe_token",
    )
    .eq("role", "parent")
    .eq("digest_opt_out", false)
    .not("digest_unsubscribe_token", "is", null);

  if (error) {
    console.error("[weekly-digest] loadEligibleParents failed:", error.message);
    return [];
  }

  return (data ?? []) as ParentRow[];
}

/**
 * Load athlete metadata for all athletes linked to the given parent IDs.
 *
 * Returns:
 *   - athleteMeta: Map<athlete_id, MetaRow>
 *   - weeklyRows: athlete_sessions rows completed within the window (for this-week count)
 *   - athleteNames: Map<athlete_id, string> (first_name only)
 *   - parentLinks: Map<parent_id, athlete_id[]>
 *
 * Privacy invariant: selects ONLY sessions_completed, sessions_started,
 * last_completed_at from the metadata view. NEVER reads journal_entries content.
 */
export async function loadAthleteDataForParents(
  service: ServiceClient,
  parentIds: string[],
  weekStart: Date,
): Promise<{
  athleteMeta: Map<string, MetaRow>;
  weeklyRows: SessionRow[];
  athleteNames: Map<string, string>;
  parentLinks: Map<string, string[]>;
}> {
  if (parentIds.length === 0) {
    return {
      athleteMeta: new Map(),
      weeklyRows: [],
      athleteNames: new Map(),
      parentLinks: new Map(),
    };
  }

  // 1. Fetch parent→athlete links.
  const { data: links, error: linksError } = await service
    .from("parent_athlete_links")
    .select("parent_id, athlete_id")
    .in("parent_id", parentIds);

  if (linksError) {
    console.error("[weekly-digest] loadAthleteDataForParents links failed:", linksError.message);
    return {
      athleteMeta: new Map(),
      weeklyRows: [],
      athleteNames: new Map(),
      parentLinks: new Map(),
    };
  }

  const parentLinks = new Map<string, string[]>();
  const allAthleteIds: string[] = [];

  for (const row of links ?? []) {
    const list = parentLinks.get(row.parent_id) ?? [];
    list.push(row.athlete_id);
    parentLinks.set(row.parent_id, list);
    if (!allAthleteIds.includes(row.athlete_id)) {
      allAthleteIds.push(row.athlete_id);
    }
  }

  if (allAthleteIds.length === 0) {
    return {
      athleteMeta: new Map(),
      weeklyRows: [],
      athleteNames: new Map(),
      parentLinks,
    };
  }

  // 2. Fetch athlete first names only (no birthdate, no journal, no content).
  const { data: profileRows, error: profileError } = await service
    .from("profiles")
    .select("id, first_name")
    .in("id", allAthleteIds)
    .eq("role", "athlete");

  if (profileError) {
    console.error("[weekly-digest] athlete profiles fetch failed:", profileError.message);
  }

  const athleteNames = new Map<string, string>();
  for (const p of profileRows ?? []) {
    athleteNames.set(p.id, p.first_name);
  }

  // 3. Fetch aggregate metadata from the athlete_session_metadata view.
  //    The view selects: athlete_id, sessions_started, sessions_completed, last_completed_at.
  //    No content, no journal fields.
  const { data: metaRows, error: metaError } = await service
    .from("athlete_session_metadata")
    .select("athlete_id, sessions_started, sessions_completed, last_completed_at")
    .in("athlete_id", allAthleteIds);

  if (metaError) {
    console.error("[weekly-digest] athlete_session_metadata fetch failed:", metaError.message);
  }

  const athleteMeta = new Map<string, MetaRow>();
  for (const row of metaRows ?? []) {
    if (!row.athlete_id) continue;
    athleteMeta.set(row.athlete_id, row as MetaRow);
  }

  // 4. Fetch athlete_sessions for this-week count (completed_at only, no content).
  //    We only need: athlete_id, completed_at — no FK joins to catalog content.
  const { data: sessionRows, error: sessionError } = await service
    .from("athlete_sessions")
    .select("athlete_id, completed_at")
    .in("athlete_id", allAthleteIds)
    .gte("completed_at", weekStart.toISOString())
    .not("completed_at", "is", null);

  if (sessionError) {
    console.error("[weekly-digest] athlete_sessions weekly fetch failed:", sessionError.message);
  }

  const weeklyRows: SessionRow[] = (sessionRows ?? []) as SessionRow[];

  return { athleteMeta, weeklyRows, athleteNames, parentLinks };
}

// ---------------------------------------------------------------------------
// Assemble payload
// ---------------------------------------------------------------------------

/**
 * Build the digest payload for a single parent.
 *
 * Pure assembly step — takes pre-fetched data and shapes into AthleteDigestData
 * entries. No I/O.
 */
export function buildParentDigestPayload(opts: {
  parent: ParentRow;
  email: string;
  parentLinks: Map<string, string[]>;
  athleteMeta: Map<string, MetaRow>;
  weeklyRows: SessionRow[];
  athleteNames: Map<string, string>;
  weekStart: Date;
}): ParentDigestPayload {
  const {
    parent,
    email,
    parentLinks,
    athleteMeta,
    weeklyRows,
    athleteNames,
    weekStart,
  } = opts;

  const athleteIds = parentLinks.get(parent.id) ?? [];

  const athletes: AthleteDigestData[] = athleteIds.map((aid) => {
    const meta = athleteMeta.get(aid);
    const firstName = athleteNames.get(aid) ?? "Your athlete";
    const sessionsCompleted = meta?.sessions_completed ?? 0;
    const sessionsThisWeek = countSessionsInWindow(weeklyRows, aid, weekStart);
    const dayPosition = Math.min(30, Math.max(0, sessionsCompleted));

    return {
      firstName,
      sessionsCompleted,
      sessionsThisWeek,
      dayPosition,
    };
  });

  return {
    parentId: parent.id,
    email,
    firstName: parent.first_name,
    athletes,
    unsubscribeToken: parent.digest_unsubscribe_token!,
  };
}
