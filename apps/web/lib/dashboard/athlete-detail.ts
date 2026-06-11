// Dashboard athlete-detail — server entry point (FV-191).
//
// Thin server wrapper: resolves the Supabase client and delegates to the
// testable core in ./athlete-detail-core.ts. Same split as lib/dashboard/rhythm.ts
// vs lib/dashboard/rhythm-core.ts.
//
// Consumers: app/dashboard/athletes/[id]/page.tsx (Server Component only).
// Do NOT import this file in tests — import from ./athlete-detail-core directly.

import { createClient } from "@/lib/supabase/server";
import { loadAthleteDetail } from "./athlete-detail-core";

// Re-export the pure types + helpers so callers only need one import path.
export type { AthleteDetailData, AthleteSessionDay } from "./athlete-detail-core";
export { shapeAthleteDetail } from "./athlete-detail-core";

/**
 * Server-Component entry: fetch athlete detail for the currently signed-in
 * parent. The auth-context client carries the parent's JWT so RLS scopes
 * results automatically.
 *
 * Returns null if the athlete is not found or not linked to the calling parent.
 */
export async function getAthleteDetail(
  athleteId: string,
): Promise<ReturnType<typeof loadAthleteDetail>> {
  return loadAthleteDetail(createClient(), athleteId);
}
