import "server-only";

// activity_events — SERVER WRITE PATH (server-only).
//
// Fire-and-forget event logging. Writes via the SERVICE-ROLE client because
// activity_events is service-role-only (RLS enabled, no client policies — the
// same model as safety_events). This is NOT a "use server" action: it is a
// server-only utility called directly from Server Components and other server
// actions, so it is never exposed as a client-callable RPC.
//
// Trust model: the caller passes the athlete_id it already resolved via
// requireAthlete() in the same server request. The function attributes the
// event to that id. It is never reachable from the client.
//
// NEVER throws. A logging failure (table missing pre-migration, transient DB
// error) must never break the athlete's request — every path is wrapped and
// swallowed with a console.error breadcrumb.

import { createServiceClient } from "@/lib/supabase/service";

import { buildEventRow, type ActivityEventInput } from "./event-core";

function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

/**
 * Record one activity event for an authenticated athlete. Validates + sanitizes
 * via buildEventRow() (enforces the closed vocabulary + meta allow-list), then
 * inserts via service-role. Returns void and never throws.
 *
 * `app_open` is de-duplicated to at most one row per athlete per UTC day so a
 * server re-render or quick re-navigation doesn't spam the table; DAU is a
 * distinct-athlete-per-day count, so one row per day is all that's needed.
 */
export async function recordActivityEvent(
  athleteId: string,
  input: ActivityEventInput,
): Promise<void> {
  try {
    const row = buildEventRow(athleteId, input);
    if (!row) return;

    const supabase = createServiceClient();

    if (row.event_name === "app_open") {
      const { count, error } = await supabase
        .from("activity_events")
        .select("id", { count: "exact", head: true })
        .eq("athlete_id", athleteId)
        .eq("event_name", "app_open")
        .gte("occurred_at", startOfUtcDayIso());
      if (error) {
        // Table may not exist yet (pre-migration) — degrade silently.
        console.error("recordActivityEvent (app_open dedup):", error.message);
        return;
      }
      if ((count ?? 0) > 0) return;
    }

    const { error } = await supabase.from("activity_events").insert(row);
    if (error) console.error("recordActivityEvent (insert):", error.message);
  } catch (e) {
    console.error(
      "recordActivityEvent failed (non-fatal):",
      e instanceof Error ? e.message : String(e),
    );
  }
}

/** Convenience for the most common call — an app-open on a given surface. */
export async function recordAppOpen(
  athleteId: string,
  surface: ActivityEventInput["surface"],
  sport?: string | null,
): Promise<void> {
  await recordActivityEvent(athleteId, { event_name: "app_open", surface, sport });
}
