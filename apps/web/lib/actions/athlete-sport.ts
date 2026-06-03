"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAthlete } from "@/lib/auth/guards";
import { SUPPORTED_SPORTS } from "@/lib/sports";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// State type
//
// Success never returns a value — Next.js throws the redirect, so the
// calling useActionState hook only sees this type on error. null means
// "not yet submitted" (the initial state).
// ---------------------------------------------------------------------------

export type SelectSportState = { ok: false; error: string } | null;

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const SelectSportSchema = z.object({
  // Zod v4: custom message via `error` (the v3 `errorMap` option was removed).
  sport: z.enum(SUPPORTED_SPORTS, { error: "Pick a sport to continue." }),
});

// ---------------------------------------------------------------------------
// selectSport — athlete updates their own sport.
//
// Used by:
//   1. First-run sport picker (FV-33) — sport_selected_at transitions from
//      NULL to a real timestamp, hiding the picker on next load.
//   2. Settings sport-switch (future) — same action, overwrites the timestamp.
//
// Auth model: uses the RLS client (createClient) under the athlete's own
// session, NOT the service client. The existing profiles_update_own policy
// permits an athlete to update their own row — sport + sport_selected_at are
// included in that. A parent session cannot satisfy profiles_update_own for an
// athlete row (auth.uid() ≠ athlete id), so cross-role writes are blocked by
// RLS at the DB level without any application-layer guard needed here.
// ---------------------------------------------------------------------------

export async function selectSport(
  _prev: SelectSportState,
  formData: FormData,
): Promise<SelectSportState> {
  const parsed = SelectSportSchema.safeParse({
    sport: formData.get("sport"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Pick a sport to continue.",
    };
  }

  const { userId } = await requireAthlete();
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      sport: parsed.data.sport,
      sport_selected_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error(
      "[athlete-sport.selectSport] update failed:",
      error.message,
    );
    return {
      ok: false,
      error: "Couldn't save your sport — try again.",
    };
  }

  // Revalidate the athlete dashboard so it re-reads sport_selected_at on the
  // next request and skips the first-run picker without a hard reload.
  revalidatePath("/athlete");
  redirect("/athlete");
}
