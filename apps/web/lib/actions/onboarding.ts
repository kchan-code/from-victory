"use server";

import { redirect } from "next/navigation";

import { closePendingAccount } from "@/lib/auth/pending-account";
import { createClient } from "@/lib/supabase/server";

import type { AuthActionState } from "./auth";

/**
 * "Use a different account" for a signed-in user who has NOT finished
 * onboarding (FV-671, spec §5.2). The /welcome page (A3) wires a confirm step
 * to this action.
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
