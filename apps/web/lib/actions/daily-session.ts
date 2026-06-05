"use server";

// Daily-session WRITE actions (FV-82): start + complete the athlete's current
// session. Both use the RLS client under the athlete's own session — the
// athlete_sessions insert/update-own policies (with check athlete_id = auth.uid)
// permit these; no service role. Idempotent so a re-open / double-submit is safe.

import { revalidatePath } from "next/cache";

import { requireAthlete } from "@/lib/auth/guards";
import { resolveCurrentCatalogId } from "@/lib/daily/progression";
import { createClient } from "@/lib/supabase/server";

/**
 * Mark the athlete's current session as STARTED — ensure a row exists for
 * (athlete, current catalog day). Idempotent: a row that already exists is left
 * untouched (started_at defaults to now() on first insert).
 */
export async function startDailySession(): Promise<void> {
  const { userId, profile } = await requireAthlete();
  const supabase = createClient();
  const { catalogId } = await resolveCurrentCatalogId(
    supabase,
    userId,
    profile.sport,
  );

  const { error } = await supabase
    .from("athlete_sessions")
    .upsert(
      { athlete_id: userId, catalog_id: catalogId },
      { onConflict: "athlete_id,catalog_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`startDailySession: ${error.message}`);

  revalidatePath("/athlete");
}

/**
 * Mark the athlete's current session COMPLETE — stamp completed_at once.
 * Ensures the row exists first (in case complete is called without an explicit
 * start), then sets completed_at only where it is still null so re-completing
 * never rewrites the original completion time. Completing day N advances the
 * progression to day N+1.
 */
export async function completeDailySession(): Promise<void> {
  const { userId, profile } = await requireAthlete();
  const supabase = createClient();
  const { catalogId } = await resolveCurrentCatalogId(
    supabase,
    userId,
    profile.sport,
  );

  const { error: ensureError } = await supabase
    .from("athlete_sessions")
    .upsert(
      { athlete_id: userId, catalog_id: catalogId },
      { onConflict: "athlete_id,catalog_id", ignoreDuplicates: true },
    );
  if (ensureError) {
    throw new Error(`completeDailySession (ensure row): ${ensureError.message}`);
  }

  const { error } = await supabase
    .from("athlete_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("athlete_id", userId)
    .eq("catalog_id", catalogId)
    .is("completed_at", null);
  if (error) throw new Error(`completeDailySession: ${error.message}`);

  revalidatePath("/athlete");
}
