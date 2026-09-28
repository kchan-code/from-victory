/**
 * Seat-selection state (FV-585, KC decision D2, 2026-09-17):
 *
 *   "On a plan downgrade with NO athlete selection, PAUSE athlete access AT
 *    RENEWAL until the parent selects who remains active. Preserve ALL
 *    profiles + history. NO automatic deletion. NO automatic selection."
 *
 * This module is the ONE place the seat-selection derivation lives — pure
 * logic in `deriveSeatState` (no I/O, unit-testable without a DB), plus the
 * server-side reads that feed it.
 *
 * CAPACITY: reuses the existing Apple-tier capacity resolution EXACTLY as
 * `apple-capacity.ts`'s `assertAthleteCapacity` does it — the sanctioned
 * `getActiveAppleProductId` accessor (`./apple`, record Section 4.9; FV-596:
 * Production, or Sandbox for allowlisted payers — `apple_sandbox_testers`,
 * same rule as the entitlement gate) feeds `payerCapacityCeiling`. Stripe
 * and comp payers are NEVER capped (the
 * §4.6 invariant) — for them (and for any payer with no active Apple
 * product) capacity resolves to `null` ("uncapped"), so this module never
 * pauses a Stripe family. Do not add a second capacity source here.
 *
 * "AT RENEWAL": there is no scheduled job or webhook wiring in this module.
 * A downgrade's LOWER Apple product id is written into `apple_subscriptions`
 * by the existing FV-571 lifecycle (DID_RENEW / SUBSCRIBED), so simply
 * reading capacity at ACCESS TIME (i.e. whenever `getPayerSeatState` /
 * `getAthleteSeatStatusForCurrentUser` is called) already reflects the
 * post-renewal tier. Persisting a pre-renewal "your plan changes on <date>"
 * heads-up is a SEPARATE follow-up, out of scope here.
 *
 * FAIL-SAFE DIRECTION (read carefully — this is the OPPOSITE of the billing
 * access gate in `./access.ts`): `getParentAccessLevel` fails CLOSED (a read
 * error is treated as "blocked") because granting billing access on an error
 * risks letting a non-payer train for free. Seat selection is the opposite
 * risk profile — a transient read error must NEVER lock an athlete who is
 * otherwise entitled out of training. So every read in this module fails
 * OPEN: any DB error resolves to `"uncapped"` semantics (nobody paused) with
 * `readError: true` set so the caller can log/alert without punishing the
 * athlete for our infrastructure hiccup.
 *
 * NO DELETION: nothing in this module (or `lib/actions/seat-selection.ts`)
 * ever deletes a profile, a link, or a journal entry. A "paused" seat is
 * purely an ATHLETE ACCESS-GATE read (`lib/subscriptions/enforce.ts`) — all
 * rows and all history are preserved indefinitely.
 *
 * STRIPE NON-GOAL: Stripe has no seat-reduction path today (subscription
 * quantity only ever increases via `syncAthleteQuantity` on athlete
 * creation) — so a Stripe payer's `capacity` is always `null` and this
 * module is inert for them. If/when a Stripe seat-DECREASE flow ships, this
 * module's capacity resolution is the one place that would need to widen.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveAppleProductId } from "./apple";
import { payerCapacityCeiling } from "./apple-capacity";

type ServiceClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Pure derivation
// ---------------------------------------------------------------------------

export type SeatStatus =
  | "uncapped"
  | "within_capacity"
  | "selection_required"
  | "selected";

export interface SeatLinkInput {
  athleteId: string;
  seatActive: boolean;
}

export interface SeatState {
  status: SeatStatus;
  capacity: number | null;
  athleteCount: number;
  activeAthleteIds: string[];
  pausedAthleteIds: string[];
}

/**
 * Pure derivation — no I/O. See module doc for the full D2 rationale.
 *
 * Rules:
 *   - `capacity === null` (uncapped provider) OR `athleteCount <= capacity`
 *     -> everyone active. `seatActive` flags are ignored in this branch —
 *     a family at or under capacity is never gated by selection state.
 *   - `athleteCount > capacity`:
 *       - `selected = links.filter(seatActive)`.
 *       - `selected.length > capacity` -> `"selection_required"`: pause ALL
 *         (activeAthleteIds = [], pausedAthleteIds = every athlete). This is
 *         also what a fresh downgrade with NO explicit choice looks like —
 *         every link is still at its `seat_active` column default (`true`),
 *         so `selected` is every athlete, which is `> capacity`, which lands
 *         here. D2: no automatic selection, ever.
 *       - `selected.length <= capacity` (including exactly 0 — a parent may
 *         deliberately deactivate every seat) -> `"selected"`:
 *         activeAthleteIds = selected, pausedAthleteIds = the rest.
 *
 * Never deletes or mutates anything — this function has no side effects.
 */
export function deriveSeatState(input: {
  capacity: number | null;
  links: SeatLinkInput[];
}): SeatState {
  const { capacity, links } = input;
  const athleteCount = links.length;
  const allIds = links.map((l) => l.athleteId);

  if (capacity === null || athleteCount <= capacity) {
    return {
      status: capacity === null ? "uncapped" : "within_capacity",
      capacity,
      athleteCount,
      activeAthleteIds: allIds,
      pausedAthleteIds: [],
    };
  }

  // athleteCount > capacity (capacity is a number here — TS narrows via the
  // `athleteCount <= capacity` branch above being false).
  const selected = links.filter((l) => l.seatActive).map((l) => l.athleteId);

  if (selected.length > capacity) {
    // D2: no valid selection (either untouched defaults or an over-selection
    // left over from a further downgrade) -> pause ALL until the parent acts.
    return {
      status: "selection_required",
      capacity,
      athleteCount,
      activeAthleteIds: [],
      pausedAthleteIds: allIds,
    };
  }

  const activeSet = new Set(selected);
  return {
    status: "selected",
    capacity,
    athleteCount,
    activeAthleteIds: selected,
    pausedAthleteIds: allIds.filter((id) => !activeSet.has(id)),
  };
}

// ---------------------------------------------------------------------------
// Server read — capacity + links for a payer, folded through deriveSeatState
// ---------------------------------------------------------------------------

export type PayerSeatState = SeatState & {
  /** Set when a DB read failed and this result is the fail-OPEN default
   * (see module doc). Callers should log/alert but must NOT treat this as a
   * reason to pause anyone. */
  readError?: boolean;
};

/**
 * Resolves the seat state for a payer (parent or adult_athlete profile id).
 *
 * Capacity resolution mirrors `assertAthleteCapacity` exactly: the
 * sanctioned `getActiveAppleProductId` accessor determines whether this
 * payer is on the Apple provider at all — Production, or Sandbox for an
 * allowlisted payer (record §4.9, FV-596); `payerCapacityCeiling` maps that
 * to a numeric ceiling (or `null` for stripe/comp/none/unmapped-Apple-product,
 * per the §4.6 invariant). `getActiveAppleProductId` itself never throws —
 * it logs and returns `null` on any read error — so a transient
 * `apple_subscriptions` hiccup here already resolves to "uncapped" by
 * construction, matching this module's fail-OPEN direction.
 *
 * An `adult_athlete` payer has no `parent_athlete_links` rows on either
 * side (enforced by `check_parent_athlete_link_roles()`), so `links` is
 * always empty for them and this always resolves to an active/uncapped
 * result — never paused.
 */
export async function getPayerSeatState(
  service: ServiceClient,
  payerId: string,
): Promise<PayerSeatState> {
  const appleProductId = await getActiveAppleProductId(service, payerId);
  const capacity = appleProductId
    ? payerCapacityCeiling({ provider: "apple", appleProductId })
    : null;

  const { data, error } = await service
    .from("parent_athlete_links")
    .select("athlete_id, seat_active")
    .eq("parent_id", payerId);

  if (error) {
    console.error(
      `[subscriptions/seat-state] parent_athlete_links read failed (payer=${payerId}): ${error.message} — failing OPEN (uncapped) so a transient read error never locks an athlete out. This is the OPPOSITE fail direction of the billing access gate (./access.ts), which fails CLOSED for content-gating reads — see this module's doc comment.`,
    );
    return {
      ...deriveSeatState({ capacity: null, links: [] }),
      readError: true,
    };
  }

  const links: SeatLinkInput[] = (data ?? []).map((row) => ({
    athleteId: row.athlete_id,
    seatActive: row.seat_active,
  }));

  return deriveSeatState({ capacity, links });
}

/**
 * Server Component helper for the parent dashboard (FV-585) — resolves the
 * CURRENT signed-in user's own seat state so a "choose who stays active"
 * island can render when `status === "selection_required"`.
 *
 * Does not itself enforce a `parent` role: it simply reads
 * `parent_athlete_links` scoped to `parent_id = <current user id>`, which is
 * empty (and therefore always resolves "uncapped", nobody paused) for any
 * caller who isn't actually a parent/adult_athlete payer with links — there
 * is no privilege to leak by calling this from a non-parent session.
 *
 * Returns the safe "everyone active" default if there is no signed-in user
 * at all (this helper is only ever rendered behind an already-authenticated
 * dashboard route).
 */
export async function getPayerSeatStateForCurrentParent(): Promise<PayerSeatState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ...deriveSeatState({ capacity: null, links: [] }) };
  }

  const service = createServiceClient();
  return getPayerSeatState(service, user.id);
}

// ---------------------------------------------------------------------------
// Athlete overlay — used by enforce.ts, WITHOUT widening AccessLevel
// ---------------------------------------------------------------------------

/**
 * The athlete-facing seat status. Deliberately a NARROW enum (never the full
 * `PayerSeatState` shape, never a capacity number, never a provider name) —
 * the athlete path must only ever learn "am I active or paused," matching
 * the same enum-only privacy boundary `getAccessForCurrentUser` documents
 * for `AccessLevel` (see ./access.ts's module doc, "PRIVACY (athlete
 * path)").
 */
export type AthleteSeatStatus =
  | "active"
  | "paused_selection_required"
  | "paused_not_selected";

function seatStatusForAthlete(state: SeatState, athleteId: string): AthleteSeatStatus {
  if (state.status === "uncapped" || state.status === "within_capacity") {
    return "active";
  }
  if (state.status === "selection_required") {
    return "paused_selection_required";
  }
  // status === "selected"
  return state.activeAthleteIds.includes(athleteId)
    ? "active"
    : "paused_not_selected";
}

/**
 * Resolves the CURRENT signed-in athlete's own seat status. Used by
 * `lib/subscriptions/enforce.ts`'s `requireActiveAccess` to add the seat
 * overlay on top of the existing (unchanged) `AccessLevel` gate.
 *
 * Fail-safe: if there is no session, no parent link can be resolved, or any
 * underlying read errors, returns `"active"` — never lock an athlete out
 * because of a read gap (see module doc's fail-OPEN direction). The
 * `AccessLevel` gate in `./enforce.ts` is the fail-CLOSED layer for billing;
 * this overlay only ever ADDS a pause on top of an already-non-blocked
 * billing level, so its own errors must not manufacture a block.
 */
export async function getAthleteSeatStatusForCurrentUser(): Promise<AthleteSeatStatus> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "active";

  const service = createServiceClient();

  // Resolve the athlete's parent (payer) via the link. Service-role read
  // (mirrors getAccessForCurrentUser's athlete branch in ./access.ts) since
  // this runs from the athlete's own session, which has no reason to read
  // any OTHER table via RLS here.
  const { data: link, error: linkError } = await service
    .from("parent_athlete_links")
    .select("parent_id")
    .eq("athlete_id", user.id)
    .limit(1)
    .maybeSingle();

  if (linkError || !link) {
    // No resolvable parent link (adult_athlete, or a read gap) — fail open.
    return "active";
  }

  const state = await getPayerSeatState(service, link.parent_id);
  return seatStatusForAthlete(state, user.id);
}
