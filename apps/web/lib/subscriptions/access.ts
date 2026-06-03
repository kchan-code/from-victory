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
 * ENFORCEMENT:
 *   These helpers return a level; they do NOT redirect or throw by themselves.
 *   Enforcement (locking routes, degrading the UI) is a SEPARATE sub-issue
 *   (FV-8 or a designated access-enforcement issue). Do NOT wire enforcement
 *   here before Stripe is live — it would lock out all current users who have
 *   no subscription row yet.
 *
 *   When enforcement lands, the recommended pattern is:
 *     - Check the level in the relevant Server Component or server action.
 *     - Redirect to `/subscribe` or render a paywall component as appropriate.
 *     - Never rely on client-side checks for access decisions.
 *
 * Allowed callers: server actions, Server Components, route handlers. No client imports.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";
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
 * Reads the subscription row for a known parent UUID and returns the access
 * level. Uses the RLS-scoped server client — the parent's own row is readable
 * under the `subscriptions_select_own_parent` policy.
 *
 * Returns `blocked` if no row exists (pre-Stripe state).
 *
 * @param parentId UUID of the parent's profile row.
 */
export async function getParentAccessLevel(
  parentId: string,
): Promise<AccessLevel> {
  const supabase = createClient();

  const { data, error } = await supabase
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
    // No subscription row — parent hasn't subscribed yet (pre-Stripe state).
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
 *   - If the current user is a `parent`: reads their own subscription row.
 *   - If the current user is an `athlete`: resolves their parent via
 *     `parent_athlete_links`, then reads the parent's subscription row.
 *
 * Returns `blocked` if there is no session, no subscription row, or if the
 * parent chain cannot be resolved (e.g. athlete not yet linked).
 *
 * KNOWN LIMITATION (athlete path): this uses the RLS-scoped client, and the
 * `subscriptions_select_own_parent` policy is `parent_id = auth.uid()`. For an
 * athlete, `auth.uid()` is the athlete's id, so reading the *parent's* row
 * returns zero rows → this currently ALWAYS returns `blocked` for athletes.
 * That is privacy-correct (an athlete must never read parent billing data) but
 * means this helper cannot yet OPEN the gate for an athlete. Before access
 * enforcement is wired, the athlete path must derive the level via a
 * service-role-mediated reader that returns ONLY the `AccessLevel` enum (never
 * the subscription row). Tracked as a follow-up — do NOT wire enforcement on
 * this helper for athletes until that lands.
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

    return getParentAccessLevel(link.parent_id);
  }

  return "blocked";
}
