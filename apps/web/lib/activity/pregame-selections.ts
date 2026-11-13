import "server-only";

// Pregame selection counts — SERVER WRITE PATH (server-only).
//
// Writes via the SERVICE-ROLE client because the count tables are service-role-
// only (RLS enabled, no policies). The caller (lib/actions/activity.ts) passes
// the signed-in athlete's id so the database can count that athlete AT MOST
// ONCE PER UTC MONTH (FV-749). The id is used by the database ONLY for that
// once-per-month marker: it is never stored with the counts and must never be
// logged or returned from here. The selections themselves are only the
// validated {dimension, value} pairs.
//
// NEVER throws. On failure it logs one generic line — never the selections,
// never an id.

import { createServiceClient } from "@/lib/supabase/service";

import { buildSelectionCounts, type PregameSelectionsInput } from "./pregame-selection-core";

export async function recordPregameSelectionCounts(
  athleteId: string,
  sport: unknown,
  input: PregameSelectionsInput | null | undefined,
): Promise<void> {
  try {
    const built = buildSelectionCounts(sport, input);
    if (!built || built.selections.length === 0) return;

    const supabase = createServiceClient();
    const { error } = await supabase.rpc("record_pregame_selections", {
      p_athlete_id: athleteId,
      p_sport: built.sport,
      p_selections: built.selections,
    });
    if (error) {
      console.error("[activity] pregame selection counts write failed");
    }
  } catch {
    console.error("[activity] pregame selection counts write failed");
  }
}
