/**
 * Service-role reader for access_grants.
 *
 * This file is `server-only`. The grant check always uses the service-role
 * client because:
 *   - The authenticated RLS policy on access_grants is keyed to
 *     `parent_id = auth.uid()`. The service-role client bypasses RLS and can
 *     look up any parent's grant by id without a session.
 *   - The entitlement computation in `getParentAccessLevel` (access.ts) runs
 *     server-side and calls this with a known parent_id derived from the
 *     session — never from untrusted client input.
 *
 * PRIVACY: this module reads `access_grants`, not `subscriptions`. No billing
 * identifiers (stripe_customer_id, price_id, etc.) are ever returned.
 * The returned value is a plain `boolean` — the caller derives the enum.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ServiceClient = SupabaseClient<Database>;

/**
 * Returns `true` if the parent has at least one active comp grant:
 *   - `revoked_at IS NULL` (not revoked), AND
 *   - `expires_at IS NULL OR expires_at > now()` (not expired)
 *
 * Expiry is evaluated in app time (JS) via a two-step approach to avoid Supabase JS
 * `.or()` filter type complexity: first fetch active (not revoked) grants for
 * the parent, then evaluate expiry in JS against the current time. The volume
 * of grant rows per parent is tiny (typically 0–3) so the in-process check is
 * correct and efficient.
 *
 * @param service  Service-role Supabase client (bypasses RLS).
 * @param parentId UUID of the parent's profile row.
 */
export async function hasActiveCompGrant(
  service: ServiceClient,
  parentId: string,
): Promise<boolean> {
  // Fetch all non-revoked grants for this parent. Typically 0–3 rows.
  const { data, error } = await service
    .from("access_grants")
    .select("id, expires_at")
    .eq("parent_id", parentId)
    .is("revoked_at", null);

  if (error) {
    console.error(
      `[subscriptions/grants] Error checking comp grant for parent=${parentId}:`,
      error.message,
    );
    // Fail-closed: on DB error, do NOT grant access. The underlying
    // subscription check in getParentAccessLevel will still run.
    return false;
  }

  if (!data || data.length === 0) {
    return false;
  }

  // Check whether any non-revoked grant is also not expired.
  // Perpetual grants (expires_at = null) are always active.
  const now = Date.now();
  return data.some((grant) => {
    if (grant.expires_at === null) return true;
    return new Date(grant.expires_at).getTime() > now;
  });
}
