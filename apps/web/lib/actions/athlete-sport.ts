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
  // FV-228: after the athlete picks their sport for the first time, route them
  // to the personalization quiz rather than directly to the hub. The quiz is
  // always skippable and redirects to /athlete on any submit path.
  redirect("/athlete/onboarding/quiz");
}

// ---------------------------------------------------------------------------
// changeSport — athlete changes their sport from Settings (FV-159 / FV-56 §2).
//
// Same persistence as selectSport (writes sport + sport_selected_at under the
// athlete's own RLS session) but returns to /athlete/settings with a confirm
// toast instead of the first-run /athlete redirect. Kept as a sibling action
// rather than parameterizing selectSport so the onboarding gate's redirect
// contract stays untouched.
//
// Data rule (FV-56 §2.4 — non-negotiable): this re-keys the sport-scoped daily
// content + pregame and resets NOTHING. day_number and rhythm live on separate,
// sport-agnostic rows (athlete_sessions) that this update never touches, so
// place-in-the-arc and participation history carry over by construction. Do not
// add any progress/rhythm mutation here.
//
// EXCEPTION (FV-228): position is sport-specific — "Forward" (hockey) is not a
// valid position in basketball. After a sport switch, position is nulled so the
// pregame personalization default (FV-253) does not pre-seed a stale cross-sport
// role. focus_area is sport-agnostic and is intentionally preserved.
// ---------------------------------------------------------------------------

export async function changeSport(
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
      // Null out position on sport switch — position is sport-specific.
      // focus_area is sport-agnostic and preserved (FV-228).
      position: null,
    })
    .eq("id", userId);

  if (error) {
    console.error(
      "[athlete-sport.changeSport] update failed:",
      error.message,
    );
    return {
      ok: false,
      error: "Couldn't save your sport — try again.",
    };
  }

  // Re-read sport everywhere it drives content. The hub and daily/pregame all
  // read profile.sport at request time, but revalidate the cached segments so
  // nothing stale survives the switch.
  revalidatePath("/athlete");
  revalidatePath("/athlete/settings");
  redirect(`/athlete/settings?switched=${parsed.data.sport}`);
}
