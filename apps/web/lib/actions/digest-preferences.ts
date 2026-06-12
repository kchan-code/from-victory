/**
 * Server action: toggle the weekly digest opt-out preference (FV-226).
 *
 * Accessible from /dashboard/settings. Parent-only. Derives the parent_id
 * server-side from requireParent() — never trusts a client-passed id.
 *
 * Schema: profiles.digest_opt_out (boolean, null on athlete rows).
 * RLS: profiles_update_own already covers this — parents update their own row.
 *
 * Also ensures digest_unsubscribe_token is populated when the parent first
 * opts in (or on first toggle attempt), so the cron can embed the token.
 *
 * Privacy: no PII in error returns. No logging of preferences.
 */

"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireParent } from "@/lib/auth/guards";

export type DigestPrefState =
  | { ok: true; optOut: boolean }
  | { ok: false; error: string };

const Schema = z.object({
  optOut: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function setDigestOptOut(
  _prev: DigestPrefState | null,
  formData: FormData,
): Promise<DigestPrefState> {
  // 1. Gate to authenticated parent. Redirects to /signin if not authed.
  const { userId } = await requireParent();

  // 2. Validate the incoming value. formData carries "optOut" = "true"/"false".
  const parsed = Schema.safeParse({ optOut: formData.get("optOut") });
  if (!parsed.success) {
    return { ok: false, error: "Invalid preference value." };
  }

  const { optOut } = parsed.data;

  // 3. Use service role for the update so we can also stamp the unsubscribe
  //    token in the same call. RLS update policy on profiles_update_own would
  //    also work (session client), but service role avoids a second round-trip
  //    to check whether the token is already set.
  //
  //    We ONLY update the calling parent's own row (userId = derived from session).
  //    Service role is safe here because we scope the update to userId explicitly.
  const service = createServiceClient();

  // Fetch existing token so we don't overwrite a valid one.
  const { data: existing, error: fetchError } = await service
    .from("profiles")
    .select("digest_unsubscribe_token")
    .eq("id", userId)
    .eq("role", "parent")
    .maybeSingle();

  if (fetchError) {
    console.error(
      `[digest-preferences] fetch failed for parent=${userId}: ${fetchError.message}`,
    );
    return { ok: false, error: "Couldn't update your preference right now. Try again." };
  }

  // If no token exists yet, generate one so the cron can embed it.
  // Use crypto.randomUUID() — the token is a UUID; no DB generation needed.
  const needsToken = !existing?.digest_unsubscribe_token;

  // Build a typed update object for the Supabase client. The two optional
  // fields map to the new profiles columns from migration 20260611140000.
  const updatePayload: {
    digest_opt_out: boolean;
    digest_unsubscribe_token?: string;
  } = {
    digest_opt_out: optOut,
  };

  if (needsToken) {
    const { randomUUID } = await import("node:crypto");
    updatePayload.digest_unsubscribe_token = randomUUID();
  }

  const { error: updateError } = await service
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .eq("role", "parent");

  if (updateError) {
    console.error(
      `[digest-preferences] update failed for parent=${userId}: ${updateError.message}`,
    );
    return { ok: false, error: "Couldn't update your preference right now. Try again." };
  }

  return { ok: true, optOut };
}

/**
 * Process an unsubscribe via the email link token.
 *
 * Looks up the parent row by digest_unsubscribe_token and sets digest_opt_out=true.
 * Uses service-role (unauthenticated caller — the parent clicks a link in email).
 *
 * Returns the parent's first_name on success for a personalized confirmation page.
 */
export async function processUnsubscribeToken(
  token: string,
): Promise<{ ok: true; firstName: string } | { ok: false; reason: string }> {
  // Basic UUID format validation.
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return { ok: false, reason: "invalid_token" };
  }

  // Server session client — check if this is an authenticated request.
  // If the parent is signed in, use their session; if not (email link click),
  // fall back to service role after token lookup.
  const service = createServiceClient();

  const { data: parent, error } = await service
    .from("profiles")
    .select("id, first_name, digest_opt_out")
    .eq("digest_unsubscribe_token", token)
    .eq("role", "parent")
    .maybeSingle();

  if (error) {
    console.error(`[digest-preferences] token lookup failed: ${error.message}`);
    return { ok: false, reason: "lookup_failed" };
  }

  if (!parent) {
    return { ok: false, reason: "invalid_token" };
  }

  if (parent.digest_opt_out) {
    // Already opted out — idempotent success.
    return { ok: true, firstName: parent.first_name };
  }

  const { error: updateError } = await service
    .from("profiles")
    .update({ digest_opt_out: true })
    .eq("id", parent.id)
    .eq("role", "parent");

  if (updateError) {
    console.error(
      `[digest-preferences] unsubscribe update failed parent=${parent.id}: ${updateError.message}`,
    );
    return { ok: false, reason: "update_failed" };
  }

  return { ok: true, firstName: parent.first_name };
}

/**
 * Read the current digest opt-out preference for the calling parent.
 * Used by the settings page to show the correct toggle state.
 * Uses the session-scoped client (RLS: profiles_select_own).
 */
export async function getDigestOptOut(): Promise<boolean> {
  const { userId } = await requireParent();
  const supabase = createClient();

  const { data } = await supabase
    .from("profiles")
    .select("digest_opt_out")
    .eq("id", userId)
    .maybeSingle();

  // null means not yet set (pre-migration or new account) → default opted in.
  return data?.digest_opt_out ?? false;
}
