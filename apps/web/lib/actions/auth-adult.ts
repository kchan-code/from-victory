"use server";

import { startEmailSignup } from "@/lib/actions/email-signup";

import type { AuthActionState } from "./auth";

/**
 * @deprecated FV-671 — 18+ self-serve signup, kept so the existing form keeps
 * compiling. It is now step 1 of the verified two-step signup: it delegates to
 * startEmailSignup (role "adult_athlete"), which validates the whole schema
 * (18+ birthdate, attestation, consent, sport, ENABLE_ADULT_SIGNUP gate) BEFORE
 * `auth.signUp`, then returns `{ ok: true, step: "verify_code" }`.
 *
 * The profile is no longer inserted here (there is no session until the email
 * code is verified) and the legacy delete-on-insert-failure rollback is GONE:
 * completeEmailSignup -> complete_pending_profile creates the role='adult_athlete'
 * profile, and post-signup routing (/subscribe, or /athlete in the legacy-native
 * shell — FV-482/FV-577) lives there. New UI should call startEmailSignup /
 * completeEmailSignup directly.
 */
export async function signUpAdultAthlete(
  prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const f = new FormData();
  for (const [k, v] of formData.entries()) f.append(k, v);
  f.set("role", "adult_athlete");
  return startEmailSignup(prev, f);
}
