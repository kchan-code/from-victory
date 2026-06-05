// Daily-session READ entry point (FV-82).
//
// Server-only: resolves the signed-in athlete, then loads their current day's
// session for their sport. Consumed by the daily-session screen (FV-83). The
// testable core lives in ./progression (which takes an injected client).

import { requireAthlete } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { loadDailySession, type DailySessionView } from "./progression";

/**
 * Load the current daily session for the signed-in athlete (their sport, their
 * progression). Throws if the athlete isn't authed (redirect) or no catalog row
 * exists for (currentDay, sport).
 */
export async function getDailySession(): Promise<DailySessionView> {
  const { userId, profile } = await requireAthlete();
  const supabase = createClient();
  return loadDailySession(supabase, userId, profile.sport);
}
