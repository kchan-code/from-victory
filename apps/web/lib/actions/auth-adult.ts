"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { ageFromBirthdate } from "@/lib/age";
import { getRequestIp, rateLimitGate } from "@/lib/actions/rate-limit-store";
import { isAdultSignupEnabled } from "@/lib/flags";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { SUPPORTED_SPORTS } from "@/lib/sports";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

import type { AuthActionState } from "./auth";

// 18+ floor for the self-serve adult path. The DB backstops this with the
// adult_athlete_min_age_18 constraint (FV-325); this is the app-layer gate.
const MIN_ADULT_AGE = 18;

const SignUpAdultSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long."),
    first_name: z
      .string()
      .trim()
      .min(1, "First name is required.")
      .max(50, "First name is too long."),
    birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
    sport: z.enum(SUPPORTED_SPORTS, { message: "Choose your sport." }),
    // Explicit 18+ affirmation, separate from the computed birthdate check —
    // the documented attestation surface (kids-privacy-officer, FV-325 review).
    age_attestation: z.literal("on", {
      message: "Please confirm you are 18 or older.",
    }),
    consent: z.literal("on", {
      message:
        "You need to agree to the Terms of Use and acknowledge the Privacy Policy.",
    }),
  })
  .refine(
    (data) => {
      const age = ageFromBirthdate(data.birthdate);
      return age !== null && age >= MIN_ADULT_AGE;
    },
    {
      message: `You must be ${MIN_ADULT_AGE} or older to create your own account.`,
      path: ["birthdate"],
    },
  );

/**
 * 18+ self-serve signup (FV-326). The adult is BOTH the payer and the athlete:
 * mirrors the parent signUp() (real email, self-insert via the profiles_insert_own
 * RLS policy) but writes a role='adult_athlete' profile with birthdate + sport,
 * then hands off to training.
 *
 * Post-signup routes to /athlete: the adult-aware checkout step (/subscribe) is
 * FV-327, and enforcement is off today (everyone trains until
 * ENFORCE_SUBSCRIPTION_GATING flips), so the new account lands directly in the
 * training app. Once FV-327/FV-328 land the flow becomes signup → checkout →
 * /athlete.
 *
 * Gated by ENABLE_ADULT_SIGNUP — the entry link and route are also flag-gated;
 * this server-side check is defense-in-depth so the action cannot be invoked
 * directly while the feature is dark.
 */
export async function signUpAdultAthlete(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isAdultSignupEnabled()) {
    return { ok: false, error: "Self-serve signup isn't available yet." };
  }

  const parsed = SignUpAdultSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    first_name: formData.get("first_name"),
    birthdate: formData.get("birthdate"),
    sport: formData.get("sport"),
    age_attestation: formData.get("age_attestation"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  // Rate limiting — same threat + key as the parent signUp (mass-account
  // creation / email-send-quota exhaustion); keyed on request IP (no stable
  // identity at signup yet).
  const ip = await getRequestIp();
  const { limited } = await rateLimitGate("sign_up", ip);
  if (limited) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    // Generic message (returning the raw Supabase error enables account
    // enumeration); full diagnostic to server logs.
    console.error(
      `[auth-adult.signUpAdultAthlete] supabase.auth.signUp failed: ${error?.message ?? "no user returned"} (status=${error?.status ?? "n/a"} code=${error?.code ?? "n/a"})`,
    );
    return {
      ok: false,
      error:
        "We couldn't create that account. Try signing in, or use a different email.",
    };
  }

  // Self-insert the adult_athlete profile via the new user's own session
  // (profiles_insert_own RLS: id = auth.uid()). sport + sport_selected_at are set
  // now so the athlete skips the sport-onboarding step.
  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role: "adult_athlete",
    first_name: parsed.data.first_name,
    birthdate: parsed.data.birthdate,
    sport: parsed.data.sport,
    sport_selected_at: new Date().toISOString(),
  });
  if (profileError) {
    // Atomic rollback: delete the orphan auth.users row so the email is freed
    // for a retry (same pattern as parent signUp).
    const service = createServiceClient();
    const userId = data.user.id;
    const { error: rollbackError } =
      await service.auth.admin.deleteUser(userId);
    console.error(
      `[auth-adult.signUpAdultAthlete] profile insert failed (userId=${userId}); rolled back auth.users (rollback_ok=${!rollbackError}): ${profileError.message}${
        rollbackError ? ` | rollback error: ${rollbackError.message}` : ""
      }`,
    );
    deliverInBackground(
      notifyError(
        "[auth-adult] signUpAdultAthlete profile insert failed",
        profileError.message,
        { rollback_ok: String(!rollbackError) },
      ),
    );
    return {
      ok: false,
      error: "Could not create your profile. Please try again.",
    };
  }

  redirect("/athlete");
}
