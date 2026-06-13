/**
 * Server-side subscription access helpers.
 *
 * THREE LAYERS:
 *   1. `subscriptionAccessLevel` — pure function, no I/O. Lives in
 *      `./access-level` so tests can exercise it without triggering server-only.
 *      Re-exported here for callers that want a single import path.
 *   2. `getParentAccessLevel(parentId)` — server-side DB read; call from
 *      Server Components / server actions when you have the parent's ID.
 *   3. `getAccessForCurrentUser()` — server-side, resolves the signed-in user
 *      (parent or athlete) to a parent row, then returns the level.
 *
 * COMP GRANTS (FV-69):
 *   An active row in `access_grants` (revoked_at IS NULL AND not expired) grants
 *   full access regardless of the Stripe subscription status. The grant check
 *   runs first; if no active grant exists, the call falls through to the
 *   subscription-status path as before. The `subscriptions` table is never
 *   modified by the grants feature — it remains a pure Stripe mirror.
 *
 * ENFORCEMENT (FV-62):
 *   These helpers return a level; they do NOT redirect or throw by themselves.
 *   Enforcement (locking routes) lives in `./enforce`. When the flag
 *   `ENFORCE_SUBSCRIPTION_GATING` is not set to "true", every enforcement guard
 *   is a no-op and current behavior is preserved.
 *
 *   Never rely on client-side checks for access decisions.
 *
 * Allowed callers: server actions, Server Components, route handlers. No client imports.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { hasActiveCompGrant } from "./grants";
import {
  subscriptionAccessLevel,
  type AccessLevel,
  type SubscriptionStatus,
} from "./access-level";

// Re-export so callers can import from this single path.
export { subscriptionAccessLevel };
export type { AccessLevel, SubscriptionStatus };

// ---------------------------------------------------------------------------
// Server DB reader — by parent ID
// ---------------------------------------------------------------------------

/**
 * Returns the effective access level for a known parent UUID.
 *
 * Resolution order:
 *   1. If the parent has an active comp grant → "full" (bypasses Stripe check).
 *   2. Otherwise: read the subscription row and derive the level from status.
 *
 * Uses the service-role client for the grant check (the grant table has a
 * parent-own SELECT policy, but this function is called from both parent and
 * athlete paths — the athlete path does not hold a parent session).
 *
 * Returns `blocked` if no row exists in either table (pre-Stripe, no grant).
 *
 * @param parentId UUID of the parent's profile row.
 */
export async function getParentAccessLevel(
  parentId: string,
): Promise<AccessLevel> {
  const service = createServiceClient();

  // Step 1: comp grant short-circuit (FV-69).
  // Fail-closed inside hasActiveCompGrant — on DB error it returns false and
  // we fall through to the subscription check rather than granting access.
  const hasGrant = await hasActiveCompGrant(service, parentId);
  if (hasGrant) {
    return "full";
  }

  // Step 2: subscription-status path (unchanged from before FV-69).
  // Use the service client here too — this function is called from the athlete
  // path (via getAccessForCurrentUser) where the session belongs to the athlete,
  // not the parent, so the RLS-scoped client would return 0 rows.
  const { data, error } = await service
    .from("subscriptions")
    .select("status, cancel_at_period_end, current_period_end")
    .eq("parent_id", parentId)
    .maybeSingle();

  if (error) {
    console.error(
      `[subscriptions/access] Error fetching subscription for parent=${parentId}:`,
      error.message,
    );
    // Fail-closed: treat DB errors as blocked rather than granting access.
    return "blocked";
  }

  if (!data) {
    // No subscription row — parent hasn't subscribed yet (and has no comp grant).
    return "blocked";
  }

  return subscriptionAccessLevel(
    data.status as SubscriptionStatus,
    data.cancel_at_period_end,
    data.current_period_end,
  );
}

// ---------------------------------------------------------------------------
// Server reader — resolves current user to a parent, then returns level
// ---------------------------------------------------------------------------

/**
 * Derives the access level for the currently signed-in user.
 *
 *   - If the current user is a `parent`: calls getParentAccessLevel(userId).
 *   - If the current user is an `athlete`: resolves their parent via
 *     `parent_athlete_links` (athlete may read their own link row via RLS),
 *     then calls getParentAccessLevel(parent_id).
 *
 * PRIVACY (athlete path):
 *   The athlete never receives the parent's subscription row, billing
 *   identifiers, or grant details. This function returns ONLY the AccessLevel
 *   enum ("full" | "degraded" | "blocked"). The service-role entitlement
 *   computation in getParentAccessLevel is opaque to the athlete.
 *
 * Returns `blocked` if there is no session, no subscription row, no active
 * comp grant, or if the parent chain cannot be resolved.
 */
export async function getAccessForCurrentUser(): Promise<AccessLevel> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "blocked";

  // Fetch role without trusting any client-supplied value.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return "blocked";

  if (profile.role === "parent") {
    return getParentAccessLevel(user.id);
  }

  if (profile.role === "athlete") {
    // Resolve parent via parent_athlete_links.
    // RLS allows the athlete to read rows where athlete_id = auth.uid().
    const { data: link, error: linkError } = await supabase
      .from("parent_athlete_links")
      .select("parent_id")
      .eq("athlete_id", user.id)
      .limit(1)
      .maybeSingle();

    if (linkError || !link) {
      // Athlete has no parent link — shouldn't happen in normal flow, but
      // fail-closed rather than granting access.
      return "blocked";
    }

    // getParentAccessLevel uses the service client internally — returns ONLY
    // the AccessLevel enum. No billing data is reachable from this call path.
    return getParentAccessLevel(link.parent_id);
  }

  return "blocked";
}
