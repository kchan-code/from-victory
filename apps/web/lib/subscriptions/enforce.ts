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
 * REDIRECT TARGETS (by the BLOCKED user's ACTUAL role — callers pass the
 * dynamic profile.role, not a static literal):
 *   - Blocked parent or adult_athlete → /subscribe  (they can buy / self-remedy)
 *   - Blocked minor athlete → /athlete/paused  (cannot buy; the parent must act)
 *   - Degraded (past_due etc.) → no redirect; returns the level so the caller
 *     can render a "fix your payment" banner if desired.
 *
 * SEAT OVERLAY (FV-585, KC decision D2): a minor athlete whose BILLING level
 * is full/degraded (the payer is entitled) can still be individually PAUSED
 * because the family is over their Apple seat capacity with no (or an
 * over-sized) selection made — see `./seat-state`'s `deriveSeatState`. This
 * is layered ON TOP of the existing billing gate, never replacing it: a
 * `blocked` payer still redirects to `/athlete/paused` with no reason
 * (the existing behavior). A billing-entitled-but-seat-paused athlete
 * redirects to `/athlete/paused?reason=seats` instead of passing through.
 * This overlay is athlete-only — it never applies to the parent or
 * adult_athlete path (adult_athlete never appears in
 * `parent_athlete_links`, so it can never be paused this way).
 *
 * The overlay's own reads fail OPEN (see `./seat-state`'s module doc) — a
 * transient error resolves to "active", never manufacturing an extra block.
 *
 * SCOPE:
 *   Wired onto athlete VALUE surfaces: hub (/athlete), daily, practice,
 *   postgame, journey. /athlete/pregame is intentionally NOT gated here — it
 *   is a static, offline-tolerant shell (FV-107) with no server-side
 *   requireAthlete(); gate it client-side if ever required. NEVER gate:
 *     /subscribe, /signin, /signup, /billing, /auth/*, legal pages,
 *     crisis-resource displays, or the athlete settings/signout paths.
 *
 * NOTE: /athlete/paused is the gentle blocked screen for a MINOR athlete (the
 * parent must reactivate; no checkout link, no billing details — a kids-privacy
 * boundary). A blocked adult_athlete is a self-payer and is routed to /subscribe
 * instead (FV-328), so they never land there via enforcement; the paused page
 * shows them a self-remedy link only if they navigate to it directly.
 */
import "server-only";

import { redirect } from "next/navigation";
import { getAccessForCurrentUser } from "./access";
import type { AccessLevel } from "./access-level";
import { getAthleteSeatStatusForCurrentUser } from "./seat-state";

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

// FV-328: adult_athlete is a self-payer (like a parent) — a blocked adult routes
// to /subscribe, NOT the paused screen. Callers pass the dynamic profile.role.
export type CallerRole = "parent" | "athlete" | "adult_athlete";

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
 * @param opts.role  The current user's ACTUAL profile.role (athlete |
 *                   adult_athlete | parent) — NOT a static literal. Determines
 *                   the redirect target when blocked: only a minor athlete goes
 *                   to /athlete/paused; self-payers (parent, adult_athlete) go
 *                   to /subscribe.
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
    // Seat overlay (FV-585): only the minor athlete path can be individually
    // paused this way — a billing-entitled payer (parent/adult_athlete) is
    // never gated here regardless of seat state. Fails open on any read
    // error (see ./seat-state's module doc), so this can only ever ADD a
    // redirect on top of an already-non-blocked billing level, never remove
    // one.
    if (opts.role === "athlete") {
      const seatStatus = await getAthleteSeatStatusForCurrentUser();
      if (seatStatus !== "active") {
        redirect("/athlete/paused?reason=seats");
      }
    }
    // "degraded" is not a hard block. Callers may inspect the returned level
    // to show a payment-fix banner but must NOT gate content behind it.
    return level;
  }

  // level === "blocked"
  if (opts.role === "athlete") {
    // A MINOR athlete cannot buy — the parent must act. Gentle paused screen.
    redirect("/athlete/paused");
  } else {
    // A parent OR an adult_athlete (FV-328) is the payer and can remedy the
    // block themselves — both route to checkout.
    redirect("/subscribe");
  }

  // TypeScript unreachable after redirect() throws, but satisfies the return type.
  // reason: redirect() never returns; this line is dead code required by TS.
  return "full" as never;
}
