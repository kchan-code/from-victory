// Dashboard rhythm metadata — server entry point (FV-85).
//
// Thin server wrapper: resolves the Supabase client and delegates to the
// testable core in ./rhythm-core.ts. Same split as lib/daily/session.ts
// vs lib/daily/progression.ts (FV-82).
//
// Consumers: app/dashboard/page.tsx (Server Component only).
// Do NOT import this file in tests — import from ./rhythm-core directly.

import { createClient } from "@/lib/supabase/server";
import { loadAthleteMetadataMap } from "./rhythm-core";

// Re-export the pure types + helpers so callers only need one import path.
export type { AthleteRhythmMeta } from "./rhythm-core";
export { shapeAthleteRhythm, ZERO_RHYTHM } from "./rhythm-core";

/**
 * Server-Component entry: fetch rhythm metadata for all athletes visible to
 * the currently signed-in parent. The view is security_invoker = true —
 * RLS scopes results automatically. No service-role client. No manual filter.
 *
 * Returns Map<athlete_id, AthleteRhythmMeta>.
 * Athletes absent from the view (never started) → caller uses ZERO_RHYTHM.
 */
export async function getAthleteMetadataMap(): Promise<
  ReturnType<typeof loadAthleteMetadataMap>
> {
  return loadAthleteMetadataMap(createClient());
}
