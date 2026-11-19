"use server";

import { redirect } from "next/navigation";

import { getRequestIp, rateLimitGate } from "@/lib/actions/rate-limit-store";
import {
  ADULT_ONBOARD_KEYS,
  OnboardAdultSchema,
  OnboardParentSchema,
  PARENT_ONBOARD_KEYS,
  firstIssue,
  parseSignupRole,
  pick,
} from "@/lib/auth/email-signup-schema";
import { closePendingAccount } from "@/lib/auth/pending-account";
import { newAccountHome, roleHome } from "@/lib/auth/post-signup";
import { isAdultSignupEnabled } from "@/lib/flags";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { createClient } from "@/lib/supabase/server";

import type { AuthActionState } from "./auth";

/**
 * "Use a different account" for a signed-in user who has NOT finished
 * onboarding (FV-671, spec §5.2). The /welcome page (FV-672) wires a confirm
 * step to this action.
 *
 *   1. derive the user from the SESSION (never a client-passed id)
 *   2. cancel_my_pending_account() — takes NO parameters, acts only on
 *      auth.uid(), refuses (`not_pending`) if the account has a profile or any
 *      payer/comp/athlete data
 *   3. on `marked`: revoke hook -> finalize_pending_deletion (re-checks under
 *      the lock; the only delete path) -> sign out -> /signin
 *
 * An established account is never deleted by this action: the database says
 * `not_pending` and nothing is touched.
 */
export async function cancelOnboarding(
  _prev?: AuthActionState,
  _formData?: FormData,
): Promise<AuthActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data, error } = await supabase.rpc("cancel_my_pending_account");
  if (error) {
    console.error(
      `[onboarding.cancel] cancel_my_pending_account failed (code=${error.code ?? "n/a"}): ${error.message}`,
    );
    return {
      ok: false,
      error: "We couldn't do that right now. Please try again.",
    };
  }

  if (data !== "marked") {
    // not_pending: the account is already set up. Nothing was touched.
    return { ok: false, error: "This account is already set up." };
  }

  await closePendingAccount(user.id);
  redirect("/signin");
}

const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

/**
 * Finish onboarding for a signed-in, verified account with no profile yet
 * (FV-672; spec §5.2). Used by /welcome after Apple / Google sign-in, and by
 * the email flow's "verified but never finished" case.
 *
 *   1. validate the role-specific fields (same rules as the email signup)
 *   2. user from the SESSION (never a client-passed id; the email is the auth
 *      email and is not a form field)
 *   3. `sign_up` IP bucket (this is a POST that creates a profile)
 *   4. complete_pending_profile (locked; acts only on auth.uid())
 *        created / already_complete -> role home
 *        reject_underage            -> closePendingAccount -> /signup?error=age
 *        account_closing            -> sign out
 *
 * A failed RPC NEVER deletes the user: they stay verified-and-pending and can
 * retry (the reaper cleans up later through the same lock). Nothing here logs
 * a name, birthdate or email.
 */
export async function completeOnboarding(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const role = parseSignupRole(formData.get("role"));
  if (!role) return { ok: false, error: "Choose an account type.", field: "role" };
  if (role === "adult_athlete" && !isAdultSignupEnabled()) {
    return { ok: false, error: "Self-serve signup isn't available yet." };
  }

  const parsed =
    role === "parent"
      ? OnboardParentSchema.safeParse(pick(formData, PARENT_ONBOARD_KEYS))
      : OnboardAdultSchema.safeParse(pick(formData, ADULT_ONBOARD_KEYS));
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };
  const fields = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const ip = await getRequestIp();
  const { limited } = await rateLimitGate("sign_up", ip);
  if (limited) return { ok: false, error: TOO_MANY };

  const { data: result, error: rpcError } = await supabase.rpc(
    "complete_pending_profile",
    {
      p_role: role,
      p_first_name: fields.first_name,
      p_birthdate: "birthdate" in fields ? fields.birthdate : null,
      p_sport: "sport" in fields ? fields.sport : null,
    },
  );

  if (rpcError) {
    if (rpcError.message?.includes("account_closing")) {
      // A tombstone exists: this signup was closed (cancel / under-18 / reaper).
      await supabase.auth.signOut();
      return {
        ok: false,
        error: "This sign-up was closed. Please start again.",
      };
    }
    console.error(
      `[onboarding.complete] complete_pending_profile failed (code=${rpcError.code ?? "n/a"}): ${rpcError.message}`,
    );
    deliverInBackground(
      notifyError(
        "[auth] complete_pending_profile failed",
        rpcError.message,
        { code: rpcError.code ?? "n/a" },
      ),
    );
    return {
      ok: false,
      error: "Could not create your profile. Please try again.",
    };
  }

  if (result === "reject_underage") {
    // Counts only — never the birthdate. The tombstone is already written;
    // close the account (revoke -> finalize -> sign out).
    console.info("[onboarding.complete] under-18 adult signup rejected");
    await closePendingAccount(user.id);
    redirect("/signup?error=age");
  }

  if (result === "already_complete") {
    // Two tabs / a retry: the profile exists. Route by the REAL role.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    redirect(roleHome(profile?.role ?? (role === "parent" ? "parent" : "athlete")));
  }

  if (result === "created") {
    redirect(newAccountHome(role));
  }

  console.error(
    `[onboarding.complete] unexpected complete_pending_profile result (${String(result)})`,
  );
  return {
    ok: false,
    error: "Could not create your profile. Please try again.",
  };
}
