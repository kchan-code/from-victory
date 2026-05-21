"use server";

import { randomBytes, randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireParent } from "@/lib/auth/guards";
import { createServiceClient } from "@/lib/supabase/service";

const ATHLETE_EMAIL_DOMAIN = "athletes.fromvictory.app";
const MIN_ATHLETE_AGE = 13;

function yearsBetween(birthdate: Date, ref: Date): number {
  let years = ref.getFullYear() - birthdate.getFullYear();
  const monthDiff = ref.getMonth() - birthdate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && ref.getDate() < birthdate.getDate())
  ) {
    years--;
  }
  return years;
}

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
  })
  .refine(
    (data) => {
      const d = new Date(`${data.birthdate}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) return false;
      return yearsBetween(d, new Date()) >= MIN_ATHLETE_AGE;
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

  const email = `athlete-${randomUUID()}@${ATHLETE_EMAIL_DOMAIN}`;
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

  const { error: profileError } = await service.from("profiles").insert({
    id: athleteId,
    role: "athlete",
    first_name: parsed.data.first_name,
    birthdate: parsed.data.birthdate,
  });
  if (profileError) {
    const { error: rollbackError } =
      await service.auth.admin.deleteUser(athleteId);
    console.error(
      "[athletes.createAthlete] profile insert failed; rolled back auth.users:",
      profileError.message,
      rollbackError ? `rollback error: ${rollbackError.message}` : "",
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
      "[athletes.createAthlete] link insert failed; rolled back profile+auth.users:",
      linkError.message,
      profileRollback ? `profile rollback error: ${profileRollback.message}` : "",
      userRollback ? `user rollback error: ${userRollback.message}` : "",
    );
    return {
      ok: false,
      error: "Could not link the athlete to your account. Please try again.",
    };
  }

  redirect("/dashboard");
}
