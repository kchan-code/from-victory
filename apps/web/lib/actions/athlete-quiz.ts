"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAthlete } from "@/lib/auth/guards";
import { FOCUS_AREA_KEYS } from "@/lib/quiz-config";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Shared validation
//
// position: optional text — checked against allowed DB values. NULL / undefined
// is accepted (athlete skipped position step or sport has no roles).
// focus_area: enum of the 5 quiz values, optional (skippable).
//
// Source-of-truth: the DB CHECK constraint in migration 20260613010000.
// The Zod schema mirrors it so validation is caught before any DB write.
//
// SECURITY NOTE: both fields are derived from the athlete's own session via
// requireAthlete() — we never accept an explicit user ID from client input.
// The profiles_update_own RLS policy (existing) enforces that the athlete can
// only UPDATE their own row. No service-client bypass needed here.
// ---------------------------------------------------------------------------

const ALLOWED_POSITIONS = [
  // Hockey
  "Forward", "Defense", "Goalie",
  // Basketball
  "Guard", "Wing", "Big",
  // Baseball (v2)
  "Pitcher", "Catcher", "Infield", "Outfield",
] as const;

const QuizSchema = z.object({
  position: z
    .enum(ALLOWED_POSITIONS, { error: "Invalid position." })
    .nullable()
    .optional(),
  focus_area: z
    .enum(FOCUS_AREA_KEYS, { error: "Invalid focus area." })
    .nullable()
    .optional(),
});

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
  const rawPosition   = formData.get("position");
  const rawFocusArea  = formData.get("focus_area");

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

  const { userId } = await requireAthlete();
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
  const rawPosition  = formData.get("position");
  const rawFocusArea = formData.get("focus_area");

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

  const { userId } = await requireAthlete();
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
