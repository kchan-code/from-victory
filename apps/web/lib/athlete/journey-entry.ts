// Server entry point for the Journey data layer (FV-190).
//
// Mirrors lib/daily/session.ts exactly: auth guard via requireAthlete(),
// real server client, delegates to the injectable core in journey.ts.
// Server-only — not imported by client components.

import { requireAthlete } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

import {
  loadJourney,
  loadJourneyEntry,
  type JourneyEntry,
} from "./journey";

export type { JourneyEntry };

/**
 * Load the signed-in athlete's completed-session history, newest first.
 * Throws (redirect) if the athlete isn't authed.
 */
export async function getJourney(): Promise<JourneyEntry[]> {
  const { userId } = await requireAthlete();
  const supabase = createClient();
  return loadJourney(supabase, userId);
}

/**
 * Load a single completed session entry by day number for the detail view.
 * Returns null if the athlete hasn't completed that day or the day is invalid.
 * Throws (redirect) if the athlete isn't authed.
 */
export async function getJourneyEntry(
  dayNumber: number,
): Promise<JourneyEntry | null> {
  const { userId } = await requireAthlete();
  const supabase = createClient();
  return loadJourneyEntry(supabase, userId, dayNumber);
}
