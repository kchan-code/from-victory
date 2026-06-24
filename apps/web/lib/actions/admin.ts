"use server";

import { randomUUID } from "crypto";
import { z } from "zod";

import { ageFromBirthdate } from "@/lib/age";
import { requireAdminParent, isAdminEmail } from "@/lib/auth/admin";
import { ATHLETE_SYNTHETIC_EMAIL_DOMAIN } from "@/lib/auth/athlete-email";
import { validateUsername } from "@/lib/auth/athlete-username";
import { SUPPORTED_SPORTS } from "@/lib/sports";
import { syncAthleteQuantity } from "@/lib/stripe/sync-athlete-quantity";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// Admin-only direct-create-athlete server action. Beta-testing affordance —
// creates an athlete with a synthetic email (same model as the normal parent →
// pairing flow) + an admin-supplied username + password so the athlete can
// sign in immediately via the FV-320 username+password Athlete tab on /signin.
// The athlete is linked to the calling admin parent via parent_athlete_links,
// so the data model stays identical to the normal parent → athlete shape.
//
// NOTE: the previous "real email" exception has been removed. Admin-created
// players now carry no more PII than pair-created ones: synthetic email +
// self-chosen username + first name + birthdate. Nothing here is a real
// email address, and no email is ever collected from or for the athlete.

const MIN_ATHLETE_AGE = 13;

const CreateAthleteDirectSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(1, "First name is required.")
      .max(50, "First name is too long."),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
    username: z.string().min(1, "Username is required."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long."),
    // FV-27: optional + defaulted (mirrors athletes.ts). The admin form does
    // NOT collect sport (FV-87) — the athlete picks their real sport at first
    // sign-in via the FV-33 SportPicker (gated on sport_selected_at, left NULL
    // here). This default is just a placeholder the picker overwrites, and
    // keeps the action safe when the field is absent.
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

export type CreateAthleteDirectState =
  | { ok: true; username: string; first_name: string }
  | { ok: false; error: string; field?: string }
  | null;

export async function createAthleteDirect(
  _prev: CreateAthleteDirectState,
  formData: FormData,
): Promise<CreateAthleteDirectState> {
  // Re-check admin status server-side (defense in depth — the route
  // already does this but server actions can be invoked independently).
  const { userId: parentId } = await requireAdminParent();

  // Belt-and-suspenders: confirm caller's email is in the admin list.
  const userClient = createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = CreateAthleteDirectSchema.safeParse({
    first_name: formData.get("first_name"),
    birthdate: formData.get("birthdate"),
    username: formData.get("username"),
    password: formData.get("password"),
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

  // Validate and normalise the username with the pure helper (same as pairings.ts).
  const usernameResult = validateUsername(parsed.data.username);
  if (!usernameResult.ok) {
    return { ok: false, error: usernameResult.error, field: "username" };
  }
  const normalizedUsername = usernameResult.normalized;

  const service = createServiceClient();

  // Step 0: username uniqueness check BEFORE creating the auth user.
  // Doing this first means we never orphan an auth user on a taken username —
  // if the check passes but a race condition hits on the profile write
  // (Step 3), the profile insert carries a unique constraint that catches it.
  const { data: takenProfile, error: takenError } = await service
    .from("profiles")
    .select("id")
    .eq("username", normalizedUsername)
    .eq("role", "athlete")
    .maybeSingle();

  if (takenError) {
    console.error(
      `[admin.createAthleteDirect] username uniqueness check failed: ${takenError.message}`,
    );
    return {
      ok: false,
      error: "Could not verify username availability. Please try again.",
    };
  }
  if (takenProfile) {
    return {
      ok: false,
      error: "That username is already taken. Choose a different one.",
      field: "username",
    };
  }

  // Step 1: create the Supabase auth user with a synthetic email + the
  // admin-supplied password. Mirrors createAthlete in athletes.ts.
  const syntheticEmail = `athlete-${randomUUID()}@${ATHLETE_SYNTHETIC_EMAIL_DOMAIN}`;

  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email: syntheticEmail,
      password: parsed.data.password,
      email_confirm: true,
    });
  if (createError || !created.user) {
    console.error(
      "[admin.createAthleteDirect] auth.admin.createUser failed:",
      createError?.message,
    );
    return {
      ok: false,
      error: "Could not create the account. Please try again.",
    };
  }
  const athleteId = created.user.id;

  // Step 2: insert the athlete profile with the normalised username.
  // A unique-constraint violation on username here means a race condition
  // (another athlete claimed the username between the check and this insert);
  // roll back the auth user cleanly.
  const { error: profileError } = await service.from("profiles").insert({
    id: athleteId,
    role: "athlete",
    first_name: parsed.data.first_name,
    birthdate: parsed.data.birthdate,
    sport: parsed.data.sport,
    username: normalizedUsername,
  });
  if (profileError) {
    const { error: rollbackError } =
      await service.auth.admin.deleteUser(athleteId);

    // Surface a username-collision as a field error.
    if (
      profileError.message?.includes("unique") ||
      (profileError as { code?: string }).code === "23505"
    ) {
      console.error(
        `[admin.createAthleteDirect] username race-collision on profile insert (athleteId=${athleteId}); rolled back auth.users (rollback_ok=${!rollbackError}): ${profileError.message}`,
      );
      return {
        ok: false,
        error: "That username was just taken. Choose a different one.",
        field: "username",
      };
    }

    console.error(
      `[admin.createAthleteDirect] profile insert failed (parentId=${parentId} athleteId=${athleteId}); rolled back auth.users (rollback_ok=${!rollbackError}): ${profileError.message}${
        rollbackError ? ` | rollback error: ${rollbackError.message}` : ""
      }`,
    );
    return {
      ok: false,
      error: "Could not create the athlete profile. Please try again.",
    };
  }

  // Step 3: link the athlete to the admin parent — keeps the data model
  // identical to the standard parent → athlete shape.
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
      `[admin.createAthleteDirect] link insert failed (parentId=${parentId} athleteId=${athleteId}); rolled back profile+auth.users (profile_rollback_ok=${!profileRollback} user_rollback_ok=${!userRollback}): ${linkError.message}${
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

  return {
    ok: true,
    username: normalizedUsername,
    first_name: parsed.data.first_name,
  };
}
