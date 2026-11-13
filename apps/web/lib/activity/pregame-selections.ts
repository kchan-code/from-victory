import "server-only";

// Anonymous pregame selection counts — SERVER WRITE PATH (server-only).
//
// Writes via the SERVICE-ROLE client because pregame_selection_counts is
// service-role-only (RLS enabled, no policies). This function takes NO athlete
// identifier by design: the caller (lib/actions/activity.ts) uses the athlete's
// id ONLY to confirm an athlete is signed in, and never passes it here. The
// RPC receives just (sport, [{dimension, value}]) — nothing that identifies who
// chose it, and no timestamp beyond the DB's UTC-month bucket.
//
// NEVER throws. On failure it logs one generic line — never the selections,
// never an id.

import { createServiceClient } from "@/lib/supabase/service";

import { buildSelectionCounts, type PregameSelectionsInput } from "./pregame-selection-core";

export async function recordPregameSelectionCounts(
  sport: unknown,
  input: PregameSelectionsInput | null | undefined,
): Promise<void> {
  try {
    const built = buildSelectionCounts(sport, input);
    if (!built || built.selections.length === 0) return;

    const supabase = createServiceClient();
    const { error } = await supabase.rpc("increment_pregame_selection_counts", {
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
