"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAthlete } from "@/lib/auth/guards";
import { FOCUS_AREA_KEYS } from "@/lib/quiz-config";
import { createClient } from "@/lib/supabase/server";
import {
  getSportConfig,
} from "@/components/pregame/sport-registry";
import type { Sport as RegistrySport } from "@/components/pregame/sport-registry";
import type { Sport } from "@/lib/sports";

// ---------------------------------------------------------------------------
// Shared validation
//
// position: validated against the athlete's OWN sport's roles (from
// SPORT_REGISTRY via getSportConfig). This prevents a hockey athlete from
// persisting "Guard" via a crafted request. The sport is read from the
// athlete's own authenticated session (requireAthlete returns it) — no
// client-supplied sport value is trusted.
//
// DB CHECK constraint (migration 20260613010000) is the cross-sport union
// backstop: it must duplicate all literal role names (SQL cannot reference
// TS constants), but the application-layer narrowing here prevents cross-sport
// writes before the DB ever sees them.
//
// focus_area: enum of the 5 quiz values, optional (skippable).
//
// SECURITY NOTE: both fields are derived from the athlete's own session via
// requireAthlete() — we never accept an explicit user ID from client input.
// The profiles_update_own RLS policy (existing) enforces that the athlete can
// only UPDATE their own row. No service-client bypass needed here.
// ---------------------------------------------------------------------------

/**
 * Build a per-sport QuizSchema that validates position against the sport's own
 * roles. If the sport has no roles (roles is undefined/empty), position is
 * accepted as null/undefined only.
 */
function buildQuizSchema(sport: Sport) {
  const config = getSportConfig(sport as RegistrySport);
  const sportRoles = config.roles;

  const positionSchema =
    sportRoles && sportRoles.length > 0
      ? z
          .enum(sportRoles as [string, ...string[]], { error: "Invalid position." })
          .nullable()
          .optional()
      : z.null().optional();

  return z.object({
    position: positionSchema,
    focus_area: z
      .enum(FOCUS_AREA_KEYS, { error: "Invalid focus area." })
      .nullable()
      .optional(),
  });
}

// ---------------------------------------------------------------------------
// State type
// ---------------------------------------------------------------------------

export type QuizActionState = { ok: false; error: string } | null;

// ---------------------------------------------------------------------------
// savePersonalizationQuiz
//
// Called from the FIRST-RUN onboarding quiz (after sport selection).
// On success: redirects to /athlete (the hub), revalidating the athlete path
// so the hub picks up the new focus_area for its Daily card subtitle.
//
// The "skip" path passes null for both fields — that is valid and the DB
// accepts nulls for both columns. We treat a skip as a write of nulls so
// the caller always gets a clean redirect on any path.
//
// Named separately from updatePersonalizationQuiz so the onboarding redirect
// contract is untouched if the settings edit path changes in the future.
// ---------------------------------------------------------------------------

export async function savePersonalizationQuiz(
  _prev: QuizActionState,
  formData: FormData,
): Promise<QuizActionState> {
  // requireAthlete first: sport drives per-sport position validation.
  const { userId, profile } = await requireAthlete();

  const rawPosition   = formData.get("position");
  const rawFocusArea  = formData.get("focus_area");

  const QuizSchema = buildQuizSchema(profile.sport);
  const parsed = QuizSchema.safeParse({
    // formData.get() returns null when field absent — normalize to undefined
    // so Zod's optional() treats it as skipped rather than an invalid value.
    position:   rawPosition  === null ? undefined : rawPosition  || null,
    focus_area: rawFocusArea === null ? undefined : rawFocusArea || null,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid selection.",
    };
  }

  const supabase = createClient();

  // Both forms (primary submit + skip) always include both hidden inputs.
  // Write whatever the schema resolved — null for skipped/omitted fields.
  const { error } = await supabase
    .from("profiles")
    .update({
      position:   parsed.data.position   ?? null,
      focus_area: parsed.data.focus_area ?? null,
    })
    .eq("id", userId);

  if (error) {
    console.error("[athlete-quiz.savePersonalizationQuiz] update failed:", error.message);
    return { ok: false, error: "Couldn't save — try again." };
  }

  revalidatePath("/athlete");
  redirect("/athlete");
}

// ---------------------------------------------------------------------------
// updatePersonalizationQuiz
//
// Called from the SETTINGS edit surface (/athlete/settings/training).
// On success: redirects back to /athlete/settings with a `?updated=training`
// param for the confirmation toast.
// ---------------------------------------------------------------------------

export async function updatePersonalizationQuiz(
  _prev: QuizActionState,
  formData: FormData,
): Promise<QuizActionState> {
  // requireAthlete first: sport drives per-sport position validation.
  const { userId, profile } = await requireAthlete();

  const rawPosition  = formData.get("position");
  const rawFocusArea = formData.get("focus_area");

  const QuizSchema = buildQuizSchema(profile.sport);
  const parsed = QuizSchema.safeParse({
    position:   rawPosition  === null ? undefined : rawPosition  || null,
    focus_area: rawFocusArea === null ? undefined : rawFocusArea || null,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid selection.",
    };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      position:   parsed.data.position   ?? null,
      focus_area: parsed.data.focus_area ?? null,
    })
    .eq("id", userId);

  if (error) {
    console.error("[athlete-quiz.updatePersonalizationQuiz] update failed:", error.message);
    return { ok: false, error: "Couldn't save — try again." };
  }

  revalidatePath("/athlete");
  revalidatePath("/athlete/settings");
  redirect("/athlete/settings?updated=training");
}
