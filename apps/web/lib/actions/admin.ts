"use server";

import { z } from "zod";

import { ageFromBirthdate } from "@/lib/age";
import { requireAdminParent, isAdminEmail } from "@/lib/auth/admin";
import { isSyntheticAthleteEmail } from "@/lib/auth/athlete-email";
import { SUPPORTED_SPORTS } from "@/lib/sports";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// Admin-only direct-create-athlete server action. Beta-testing affordance —
// creates an athlete with a real email + password (instead of the
// synthetic-email + device-pairing flow) so KC can hand credentials to
// a friendly tester. The athlete is linked to the calling admin parent
// via parent_athlete_links, so the data model stays identical to the
// normal parent → athlete shape; no orphan athletes.

const MIN_ATHLETE_AGE = 13;

// Note on CLAUDE.md "Minor athlete PII" rule (allowed fields: first name,
// birthdate, parent link, account ID):
// Direct-created athletes intentionally have a REAL email by design — KC
// needs to hand credentials to a beta tester who'll sign in from any
// device. The email lives in auth.users.email exactly the same way
// synthetic emails do for paired athletes. Documented exception to
// rule #6, acceptable because (a) admin-only / hidden surface, (b)
// beta-testing affordance not a permanent product, (c) athlete is still
// parent-linked + 13+ verified.

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
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email.")
      .max(320, "Email is too long."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long."),
    // FV-27: optional + defaulted (mirrors athletes.ts). The admin direct-
    // create form supplies this via a sport selector (FV-74); the default
    // keeps the action safe if the field is ever absent.
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
  )
  .refine((data) => !isSyntheticAthleteEmail(data.email), {
    message:
      "That domain is reserved for paired athletes. Use a real email.",
    path: ["email"],
  });

export type CreateAthleteDirectState =
  | { ok: true; email: string; first_name: string }
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
    email: formData.get("email"),
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

  const service = createServiceClient();

  // Step 1: create the Supabase auth user with the real email + password.
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email: parsed.data.email,
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
      error:
        "Could not create the account. The email may already be in use.",
      field: "email",
    };
  }
  const athleteId = created.user.id;

  // Step 2: insert the athlete profile.
  const { error: profileError } = await service.from("profiles").insert({
    id: athleteId,
    role: "athlete",
    first_name: parsed.data.first_name,
    birthdate: parsed.data.birthdate,
    sport: parsed.data.sport,
  });
  if (profileError) {
    const { error: rollbackError } =
      await service.auth.admin.deleteUser(athleteId);
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

  return {
    ok: true,
    email: parsed.data.email,
    first_name: parsed.data.first_name,
  };
}
