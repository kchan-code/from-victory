"use server";

// Client-facing activity logging.
//
// The pregame flow (and other interactive surfaces) are Client Components, so
// they cannot call the server-only writer (lib/activity/record.ts) directly.
// This thin "use server" action is the bridge:
//   1. It resolves the athlete SERVER-SIDE from the session — the client cannot
//      spoof athlete_id; an event is always attributed to the actual caller.
//   2. It restricts the event_name to the CLIENT-allowed set, so this RPC can
//      only ever write the handful of client-driven events (app_open / daily_*
//      are logged server-side and must not be client-triggerable).
//   3. It delegates to recordActivityEvent, which validates + sanitizes (the
//      meta allow-list) and never throws.
// Fire-and-forget from the client; this action never throws and never navigates.

import type { ActivityEventInput } from "@/lib/activity/event-core";
import type { PregameSelectionsInput } from "@/lib/activity/pregame-selection-core";
import { recordPregameSelectionCounts } from "@/lib/activity/pregame-selections";
import { recordActivityEvent } from "@/lib/activity/record";
import { createClient } from "@/lib/supabase/server";

// Events that may be triggered from the client. Deliberately excludes app_open
// and daily_start/daily_complete (those are written server-side only).
const CLIENT_ALLOWED_EVENTS = new Set([
  "pregame_start",
  "pregame_complete",
  "practice_start",
  "practice_complete",
  "postgame_open",
  "push_click",
]);

export async function logActivityEvent(input: ActivityEventInput): Promise<void> {
  try {
    if (!CLIENT_ALLOWED_EVENTS.has(input.event_name)) return;

    // Resolve the athlete WITHOUT requireAthlete()'s redirect side-effect —
    // telemetry must never navigate the user. A non-athlete / signed-out caller
    // is simply a no-op.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || (profile.role !== "athlete" && profile.role !== "adult_athlete")) {
      return;
    }

    await recordActivityEvent(user.id, input);
  } catch {
    // Telemetry is best-effort: never surface an error to the client.
  }
}

// Pregame selection totals (FV-724 follow-up, FV-749). Called once per completed
// pregame. The caller must be a signed-in athlete so this cannot be spammed
// anonymously. The athlete's id is passed to the database ONLY for the
// once-per-UTC-month marker that counts each athlete at most once; it is never
// stored with the counts, and nothing is logged alongside the selections. The
// writer validates every value against the sport's fixed vocabulary and drops
// the rest (the cue word is never accepted). Best-effort: never throws, never
// navigates.
export async function logPregameSelections(
  sport: string,
  selections: PregameSelectionsInput,
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || (profile.role !== "athlete" && profile.role !== "adult_athlete")) {
      return;
    }

    // The id goes to the database only for the once-per-month marker.
    await recordPregameSelectionCounts(user.id, sport, selections);
  } catch {
    // Telemetry is best-effort: never surface an error to the client.
  }
}
