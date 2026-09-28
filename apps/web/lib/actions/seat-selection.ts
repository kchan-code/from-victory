"use server";

/**
 * FV-585 (KC decision D2): the parent-facing action that resolves a
 * `selection_required` seat state by choosing which athletes stay active.
 *
 * "PAUSE athlete access AT RENEWAL until the parent selects who remains
 *  active. Preserve ALL profiles + history. NO automatic deletion. NO
 *  automatic selection."
 *
 * This action is the ONLY writer of `parent_athlete_links.seat_active`
 * (the column's migration comment and RLS assertions pin that no client
 * role has an UPDATE grant on the table at all) — every write here goes
 * through the service-role client, after re-deriving the caller's identity
 * and ownership server-side. Never trusts a client-supplied parent id.
 *
 * Does NOT delete anything. Does NOT touch Stripe quantity, Apple
 * lifecycle, or any other subscription row — purely a per-link boolean
 * flip, scoped to links the caller (a parent) actually owns.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireParent } from "@/lib/auth/guards";
import { createServiceClient } from "@/lib/supabase/service";
import { getPayerSeatState, type PayerSeatState } from "@/lib/subscriptions/seat-state";

const SetActiveSeatsSchema = z.object({
  athleteIds: z.array(z.string().uuid()),
});

export type SetActiveSeatsResult =
  | { ok: true; state: PayerSeatState }
  | {
      ok: false;
      code: "invalid_input" | "not_parent" | "unlinked_athlete" | "selection_not_needed" | "over_capacity" | "write_failed";
    };

/**
 * Sets the ACTIVE seat set for the calling parent's athletes.
 *
 * - Role: caller MUST be a `parent` (an athlete or adult_athlete session is
 *   refused outright — `requireParent()` already redirects a non-parent
 *   session away, so this function is only ever reached by a real parent).
 * - Ownership: every id in `athleteIds` must be one of THIS parent's own
 *   `parent_athlete_links` rows (service-role-checked) — an id that isn't
 *   linked to the caller is refused, not silently dropped, so a client bug
 *   or tampering never silently activates a stranger's athlete or silently
 *   no-ops.
 * - Capacity is RECOMPUTED server-side (never trusts a client-supplied
 *   capacity number): if the payer isn't currently over capacity at all,
 *   there is nothing to select (`selection_not_needed`); if the chosen set
 *   is itself too large, refuse (`over_capacity`) rather than truncating it
 *   silently.
 * - On success: the chosen ids get `seat_active = true`, every OTHER link
 *   owned by this parent gets `seat_active = false` — scoped strictly to
 *   `parent_id = <this parent's id>`, so this can never touch another
 *   parent's links. No row is ever deleted.
 *
 * Logs athlete ids only on failure paths that matter operationally — never
 * names, never any other PII.
 */
export async function setActiveSeats(
  athleteIds: string[],
): Promise<SetActiveSeatsResult> {
  const parsed = SetActiveSeatsSchema.safeParse({ athleteIds });
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  // requireParent() redirects away (throws) if the caller isn't a
  // signed-in parent — a non-parent session never reaches the code below.
  const { userId: parentId } = await requireParent();
  const service = createServiceClient();

  // Load ALL of this parent's links (service role) — this is both the
  // ownership check and the input to capacity recomputation.
  const { data: linkRows, error: linksError } = await service
    .from("parent_athlete_links")
    .select("athlete_id, seat_active")
    .eq("parent_id", parentId);

  if (linksError) {
    console.error(
      `[seat-selection.setActiveSeats] link read failed (parent=${parentId}): ${linksError.message}`,
    );
    return { ok: false, code: "write_failed" };
  }

  const ownedIds = new Set((linkRows ?? []).map((row) => row.athlete_id));
  const requestedIds = new Set(parsed.data.athleteIds);

  for (const id of requestedIds) {
    if (!ownedIds.has(id)) {
      console.warn(
        `[seat-selection.setActiveSeats] refused: athleteId not linked to caller (parent=${parentId}, athleteId=${id})`,
      );
      return { ok: false, code: "unlinked_athlete" };
    }
  }

  // Recompute capacity server-side — never trust a client-supplied number.
  const currentState = await getPayerSeatState(service, parentId);

  if (
    currentState.capacity === null ||
    currentState.status === "uncapped" ||
    currentState.status === "within_capacity"
  ) {
    // Uncapped provider (or no active Apple product), OR the family is not
    // over capacity — nothing to select. Mirrors deriveSeatState's own
    // `athleteCount <= capacity` rule so a direct/replayed call can never
    // write seat flags while the payer isn't actually over capacity (qa
    // should-fix, FV-585).
    return { ok: false, code: "selection_not_needed" };
  }

  if (requestedIds.size > currentState.capacity) {
    return { ok: false, code: "over_capacity" };
  }

  // Write: chosen ids -> true, every other one of THIS parent's links -> false.
  // Two scoped updates rather than one upsert, so each stays a simple,
  // auditable boolean flip with no risk of touching another parent's rows.
  const activateIds = Array.from(requestedIds);
  const deactivateIds = Array.from(ownedIds).filter((id) => !requestedIds.has(id));

  if (activateIds.length > 0) {
    const { error: activateError } = await service
      .from("parent_athlete_links")
      .update({ seat_active: true })
      .eq("parent_id", parentId)
      .in("athlete_id", activateIds);
    if (activateError) {
      console.error(
        `[seat-selection.setActiveSeats] activate write failed (parent=${parentId}): ${activateError.message}`,
      );
      return { ok: false, code: "write_failed" };
    }
  }

  if (deactivateIds.length > 0) {
    const { error: deactivateError } = await service
      .from("parent_athlete_links")
      .update({ seat_active: false })
      .eq("parent_id", parentId)
      .in("athlete_id", deactivateIds);
    if (deactivateError) {
      console.error(
        `[seat-selection.setActiveSeats] deactivate write failed (parent=${parentId}): ${deactivateError.message}`,
      );
      return { ok: false, code: "write_failed" };
    }
  }

  revalidatePath("/dashboard");

  const newState = await getPayerSeatState(service, parentId);
  return { ok: true, state: newState };
}
