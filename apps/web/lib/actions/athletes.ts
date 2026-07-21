"use server";

import { randomBytes, randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ageFromBirthdate } from "@/lib/age";
import { ATHLETE_SYNTHETIC_EMAIL_DOMAIN } from "@/lib/auth/athlete-email";
import { requireParent } from "@/lib/auth/guards";
import { SUPPORTED_SPORTS } from "@/lib/sports";
import { syncAthleteQuantity } from "@/lib/stripe/sync-athlete-quantity";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { createServiceClient } from "@/lib/supabase/service";

const MIN_ATHLETE_AGE = 13;

const CreateAthleteSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(1, "First name is required.")
      .max(50, "First name is too long."),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
    // FV-27: captured-if-provided, defaulted otherwise. The onboarding sport
    // selector is FV-33; until it ships the create forms omit `sport`, so an
    // athlete defaults to hockey (the launch sport). FV-33 adds the field so a
    // parent can choose basketball; sport is editable later regardless.
    sport: z.enum(SUPPORTED_SPORTS).optional().default("hockey"),
  })
  .refine(
    (data) => {
      const age = ageFromBirthdate(data.birthdate);
      return age !== null && age >= MIN_ATHLETE_AGE;
    },
    {
      message: `Athletes must be ${MIN_ATHLETE_AGE} or older.`,
      path: ["birthdate"],
    },
  );

export type CreateAthleteState =
  | { ok: true }
  | { ok: false; error: string; field?: string }
  | null;

export async function createAthlete(
  _prev: CreateAthleteState,
  formData: FormData,
): Promise<CreateAthleteState> {
  const parsed = CreateAthleteSchema.safeParse({
    first_name: formData.get("first_name"),
    birthdate: formData.get("birthdate"),
    sport: formData.get("sport") ?? undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  const { userId: parentId } = await requireParent();
  const service = createServiceClient();

  const email = `athlete-${randomUUID()}@${ATHLETE_SYNTHETIC_EMAIL_DOMAIN}`;
  const tempPassword = randomBytes(32).toString("base64url");

  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });
  if (createError || !created.user) {
    console.error(
      "[athletes.createAthlete] auth.admin.createUser failed:",
      createError?.message,
    );
    return {
      ok: false,
      error: "Could not create the athlete account. Please try again.",
    };
  }
  const athleteId = created.user.id;

  // FV-448 (13-25 expansion arc, D5 turn-18 deferral mitigation): the arc
  // removes the upper age bound on parent-created athletes, so a parent may
  // create a profile for someone already 18+. That stays on the minor-schema
  // `role: "athlete"` shape (no UI change, no self-serve billing — see
  // project_13-25-expansion-discovery memory), but the row is marked so a
  // future turn-18 consent/takeover flow (FV-450) has a population to act on.
  const createdAsAdultByParent =
    (ageFromBirthdate(parsed.data.birthdate) ?? 0) >= 18;

  const { error: profileError } = await service.from("profiles").insert({
    id: athleteId,
    role: "athlete",
    first_name: parsed.data.first_name,
    birthdate: parsed.data.birthdate,
    sport: parsed.data.sport,
    created_as_adult_by_parent: createdAsAdultByParent,
  });
  if (profileError) {
    const { error: rollbackError } =
      await service.auth.admin.deleteUser(athleteId);
    console.error(
      `[athletes.createAthlete] profile insert failed (parentId=${parentId} athleteId=${athleteId}); rolled back auth.users (rollback_ok=${!rollbackError}): ${profileError.message}${
        rollbackError ? ` | rollback error: ${rollbackError.message}` : ""
      }`,
    );
    return {
      ok: false,
      error: "Could not create the athlete profile. Please try again.",
    };
  }

  const { error: linkError } = await service
    .from("parent_athlete_links")
    .insert({
      parent_id: parentId,
      athlete_id: athleteId,
    });
  if (linkError) {
    const { error: profileRollback } = await service
      .from("profiles")
      .delete()
      .eq("id", athleteId);
    const { error: userRollback } =
      await service.auth.admin.deleteUser(athleteId);
    console.error(
      `[athletes.createAthlete] link insert failed (parentId=${parentId} athleteId=${athleteId}); rolled back profile+auth.users (profile_rollback_ok=${!profileRollback} user_rollback_ok=${!userRollback}): ${linkError.message}${
        profileRollback ? ` | profile rollback error: ${profileRollback.message}` : ""
      }${userRollback ? ` | user rollback error: ${userRollback.message}` : ""}`,
    );
    return {
      ok: false,
      error: "Could not link the athlete to your account. Please try again.",
    };
  }

  // Sync Stripe subscription quantity to reflect the new athlete count.
  // Non-blocking: a Stripe failure here must never prevent the athlete from
  // being created. syncAthleteQuantity catches all errors internally.
  // deliverInBackground registers the promise with waitUntil so the
  // serverless runtime can't freeze the instance mid-Stripe-write — a
  // dropped sync is silent under-/over-billing, not a caught error.
  deliverInBackground(syncAthleteQuantity(parentId));

  redirect("/dashboard");
}
