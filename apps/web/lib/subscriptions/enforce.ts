/**
 * Subscription enforcement guard (FV-62).
 *
 * DEFAULT: flag off → every call is a no-op. Current behavior is preserved
 * and no users are blocked. KC flips the flag in Vercel env vars when ready.
 *
 * USAGE (in a Server Component or server action):
 *
 *   import { requireActiveAccess } from "@/lib/subscriptions/enforce";
 *   // Inside an async server function:
 *   await requireActiveAccess({ role: "athlete" });
 *
 * FLAG:
 *   Set `ENFORCE_SUBSCRIPTION_GATING=true` in Vercel env vars to enable.
 *   Any other value (including unset) leaves enforcement off.
 *
 * REDIRECT TARGETS:
 *   - Blocked parent  → /subscribe    (parent can remedy the block)
 *   - Blocked athlete → /athlete/paused  (athletes cannot buy; parent must act)
 *   - Degraded (past_due etc.) → no redirect; returns the level so the caller
 *     can render a "fix your payment" banner if desired.
 *
 * SCOPE:
 *   Wired onto athlete VALUE surfaces: hub (/athlete), daily, practice,
 *   postgame, journey. /athlete/pregame is intentionally NOT gated here — it
 *   is a static, offline-tolerant shell (FV-107) with no server-side
 *   requireAthlete(); gate it client-side if ever required. NEVER gate:
 *     /subscribe, /signin, /signup, /billing, /auth/*, legal pages,
 *     crisis-resource displays, or the athlete settings/signout paths.
 *
 * NOTE: /athlete/paused does not yet exist as a frontend screen. The lead's
 * frontend pass must build it. It should show a calm message explaining that
 * the parent's subscription needs attention, with no checkout link (athletes
 * cannot buy). It must NOT expose any billing details to the athlete.
 */
import "server-only";

import { redirect } from "next/navigation";
import { getAccessForCurrentUser } from "./access";
import type { AccessLevel } from "./access-level";

// ---------------------------------------------------------------------------
// Flag helper — exported so tests can assert it reads the right env var
// ---------------------------------------------------------------------------

/**
 * Returns true only when ENFORCE_SUBSCRIPTION_GATING is exactly "true".
 * Reads fresh from process.env on every call (no module-level caching)
 * so toggling the env var during a test works without module reload tricks.
 */
export function isSubscriptionEnforcementEnabled(): boolean {
  return process.env.ENFORCE_SUBSCRIPTION_GATING === "true";
}

// ---------------------------------------------------------------------------
// Role type (narrows the redirect target)
// ---------------------------------------------------------------------------

export type CallerRole = "parent" | "athlete";

// ---------------------------------------------------------------------------
// Main guard
// ---------------------------------------------------------------------------

/**
 * Call at the top of a Server Component render or server action before serving
 * value content. Behaviour:
 *
 *   - Enforcement off → immediate return (no-op).
 *   - "full"          → immediate return.
 *   - "degraded"      → returns the level WITHOUT redirecting. The caller can
 *                        surface a "fix your payment" banner. Content remains
 *                        accessible so the athlete is not hard-blocked mid-session.
 *   - "blocked"       → redirect(). Never returns to the caller.
 *
 * @param opts.role  Pass "athlete" from athlete routes, "parent" from parent routes.
 *                   Determines the redirect target when blocked.
 * @returns The AccessLevel ("full" | "degraded") when no redirect occurs.
 *          ("blocked" is never returned — the function redirects before that.)
 */
export async function requireActiveAccess(opts: {
  role: CallerRole;
}): Promise<Exclude<AccessLevel, "blocked">> {
  // Flag off → no-op. Return "full" so callers can use the return value
  // without branching on undefined.
  if (!isSubscriptionEnforcementEnabled()) {
    return "full";
  }

  const level = await getAccessForCurrentUser();

  if (level === "full" || level === "degraded") {
    // "degraded" is not a hard block. Callers may inspect the returned level
    // to show a payment-fix banner but must NOT gate content behind it.
    return level;
  }

  // level === "blocked"
  if (opts.role === "athlete") {
    // Athletes cannot buy subscriptions — the parent must act.
    // Send to a gentle paused screen (frontend must build this route).
    redirect("/athlete/paused");
  } else {
    // Parent can remedy the block by subscribing.
    redirect("/subscribe");
  }

  // TypeScript unreachable after redirect() throws, but satisfies the return type.
  // reason: redirect() never returns; this line is dead code required by TS.
  return "full" as never;
}
