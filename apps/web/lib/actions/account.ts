"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireParent } from "@/lib/auth/guards";
import {
  isDeletionRateLimited,
  DELETION_RATE_LIMIT,
  DELETION_WINDOW_MINUTES,
} from "@/lib/actions/deletion-rate-limit";
import { isBenignCancelError } from "@/lib/stripe/cancel-errors";
import { getStripe } from "@/lib/stripe/server";
import { syncAthleteQuantity } from "@/lib/stripe/sync-athlete-quantity";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// =============================================================================
// Account deletion — parent-initiated, IMMEDIATE hard delete.
//
// Mechanism: deleting the auth.users row (service.auth.admin.deleteUser)
// cascades through every FK in the schema — profiles → parent_athlete_links,
// subscriptions, device_pairings, athlete_sessions → journal_entries,
// safety_events. There is no soft-delete / grace window: a confirmed deletion
// removes the data now. This trivially satisfies the "within 30 days of
// request" requirement and minimises how long a minor's data is retained.
//
// Two flows:
//   - deleteAthlete: removes ONE athlete this parent manages.
//   - deleteAccount: removes the parent and every athlete they SOLELY manage
//     (athletes also linked to a co-parent are left intact — see below).
//
// Both require a typed confirmation. Deletion events are logged (event only,
// never content) for a durable audit trail (FV-14 — account_deletion_events).
//
// Rate limiting (FV-14):
//   Both actions check the rolling-window count of account_deletion_events
//   rows for this parent before executing. If the count is at or above
//   DELETION_RATE_LIMIT within DELETION_WINDOW_MINUTES, the action is
//   rejected without deleting anything. The pure decision function lives in
//   lib/actions/deletion-rate-limit.ts and is unit-tested independently.
// =============================================================================

export type DeleteAthleteState = { ok: false; error: string } | null;

export async function deleteAthlete(
  _prev: DeleteAthleteState,
  formData: FormData,
): Promise<DeleteAthleteState> {
  const athleteId = String(formData.get("athlete_id") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (!athleteId) return { ok: false, error: "Missing athlete." };

  const { userId: parentId } = await requireParent();
  const service = createServiceClient();

  // Authorization — the athlete MUST be linked to the requesting parent.
  // Without this check a parent could delete any athlete by guessing an id.
  const { data: link } = await service
    .from("parent_athlete_links")
    .select("athlete_id")
    .eq("parent_id", parentId)
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (!link) {
    return { ok: false, error: "That athlete isn't on your account." };
  }

  // Confirmation — the typed value must match the athlete's first name.
  const { data: athlete } = await service
    .from("profiles")
    .select("first_name, role")
    .eq("id", athleteId)
    .maybeSingle();
  if (!athlete) return { ok: false, error: "Athlete not found." };
  // Defense-in-depth: only athlete rows are deletable here. The link
  // role-check trigger already guarantees athlete_id points at an athlete,
  // so this is belt-and-suspenders against ever deleting a parent row.
  if (athlete.role !== "athlete") {
    return { ok: false, error: "That account can't be deleted here." };
  }
  if (confirm.toLowerCase() !== athlete.first_name.trim().toLowerCase()) {
    return {
      ok: false,
      error: `Type "${athlete.first_name}" to confirm deletion.`,
    };
  }

  // ---------------------------------------------------------------------------
  // Rate limiting (FV-14): count recent deletion events for this parent in the
  // rolling window BEFORE the destructive deleteUser call. If at or over the
  // limit, reject without deleting anything.
  // ---------------------------------------------------------------------------
  const windowStart = new Date(
    Date.now() - DELETION_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();
  const { count: recentCount } = await service
    .from("account_deletion_events")
    .select("id", { count: "exact", head: true })
    .eq("actor_parent_id", parentId)
    .gt("created_at", windowStart);

  if (isDeletionRateLimited(recentCount ?? 0)) {
    console.warn(
      `[account.deleteAthlete] rate limit hit (parent=${parentId} count=${recentCount ?? 0} limit=${DELETION_RATE_LIMIT} window=${DELETION_WINDOW_MINUTES}min)`,
    );
    return {
      ok: false,
      error: `Too many deletion requests. Please wait before trying again.`,
    };
  }

  const { error } = await service.auth.admin.deleteUser(athleteId);
  if (error) {
    console.error(
      `[account.deleteAthlete] auth.admin.deleteUser failed (parent=${parentId} athlete=${athleteId}): ${error.message}`,
    );
    return {
      ok: false,
      error: "Could not delete the athlete. Please try again.",
    };
  }

  console.log(
    `[account.deleteAthlete] parent=${parentId} deleted athlete=${athleteId}`,
  );

  // Sync Stripe subscription quantity to reflect the reduced athlete count.
  // Non-blocking: a Stripe failure here must never prevent the deletion from
  // completing. syncAthleteQuantity catches all errors internally.
  void syncAthleteQuantity(parentId);

  // ---------------------------------------------------------------------------
  // Durable audit write (FV-14): best-effort. If this insert fails we log
  // the error but do NOT fail the user's deletion — their right to have data
  // removed must not be blocked by our logging infrastructure.
  // ---------------------------------------------------------------------------
  const { error: auditError } = await service
    .from("account_deletion_events")
    .insert({
      event_type: "athlete_deleted",
      actor_parent_id: parentId,
      target_athlete_id: athleteId,
    });
  if (auditError) {
    console.error(
      `[account.deleteAthlete] audit insert failed (parent=${parentId} athlete=${athleteId}): ${auditError.message}`,
    );
  }

  revalidatePath("/dashboard");
  return null;
}

export type DeleteAccountState = { ok: false; error: string } | null;

export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") {
    return { ok: false, error: 'Type "DELETE" to confirm.' };
  }

  const { userId: parentId } = await requireParent();
  const service = createServiceClient();

  // ---------------------------------------------------------------------------
  // Rate limiting (FV-14): reject BEFORE any side effect — Stripe cancel OR DB
  // delete. Count this parent's deletion events in the rolling window; if at or
  // over the limit, bail without cancelling the subscription or deleting rows.
  // ---------------------------------------------------------------------------
  const windowStart = new Date(
    Date.now() - DELETION_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();
  const { count: recentCount } = await service
    .from("account_deletion_events")
    .select("id", { count: "exact", head: true })
    .eq("actor_parent_id", parentId)
    .gt("created_at", windowStart);

  if (isDeletionRateLimited(recentCount ?? 0)) {
    console.warn(
      `[account.deleteAccount] rate limit hit (parent=${parentId} count=${recentCount ?? 0} limit=${DELETION_RATE_LIMIT} window=${DELETION_WINDOW_MINUTES}min)`,
    );
    return {
      ok: false,
      error: `Too many deletion requests. Please wait before trying again.`,
    };
  }

  // ---------------------------------------------------------------------------
  // Step 1: Cancel the Stripe subscription BEFORE touching any DB rows.
  //
  // Ordering rationale: by cancelling first, an abort-on-unexpected-error
  // leaves NOTHING deleted — the parent and all athletes are still intact and
  // the user can retry cleanly. If we cancelled after deleting athletes, a
  // fatal Stripe error would leave the athletes gone with no manager remaining.
  //
  // Error classification (see lib/stripe/cancel-errors.ts):
  //   - resource_missing / subscription_canceled → benign; sub is already gone,
  //     log and proceed. The user's data-deletion right must not be blocked
  //     because Stripe no longer has the record.
  //   - Any other error → abort and surface to the user. Do NOT proceed with
  //     deleting the parent while a live billing subscription may still exist.
  // ---------------------------------------------------------------------------
  const { data: sub } = await service
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("parent_id", parentId)
    .maybeSingle();

  if (sub?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(sub.stripe_subscription_id);
      console.log(
        `[account.deleteAccount] cancelled Stripe subscription sub=${sub.stripe_subscription_id} for parent=${parentId}`,
      );
    } catch (err) {
      if (isBenignCancelError(err)) {
        // Sub is already gone in Stripe — nothing to cancel. Proceed.
        // reason: err is narrowed to StripeInvalidRequestError by
        // isBenignCancelError, but that narrowing doesn't cross the call
        // boundary, so read .code defensively for the log line.
        const code =
          err instanceof Error
            ? (err as { code?: string }).code ?? "unknown"
            : "unknown";
        console.warn(
          `[account.deleteAccount] Stripe cancel returned benign error (code=${code}) for sub=${sub.stripe_subscription_id} parent=${parentId} — sub already absent, proceeding with deletion`,
        );
      } else {
        // Unexpected error — abort. Log event only (no sub content, no PII).
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[account.deleteAccount] Stripe cancel failed for sub=${sub.stripe_subscription_id} parent=${parentId}: ${message}`,
        );
        return {
          ok: false,
          error:
            "Could not cancel your subscription before deleting your account. Please try again or contact support.",
        };
      }
    }
  }
  // No subscription row or no stripe_subscription_id — nothing to cancel.

  // ---------------------------------------------------------------------------
  // Step 2: Delete sole-managed athletes.
  //
  // Delete only athletes this parent SOLELY manages. An athlete also linked
  // to a co-parent is left intact — deleting this parent's auth.users row
  // cascade-removes just this parent's link, not the shared child's data.
  //
  // If any sole-managed athlete fails to delete, abort BEFORE deleting the
  // parent — otherwise we'd orphan that athlete's data with no manager left.
  // ---------------------------------------------------------------------------
  const { data: links } = await service
    .from("parent_athlete_links")
    .select("athlete_id")
    .eq("parent_id", parentId);
  const athleteIds = (links ?? []).map((l) => l.athlete_id);

  let deletedAthletes = 0;
  for (const athleteId of athleteIds) {
    const { count } = await service
      .from("parent_athlete_links")
      .select("parent_id", { count: "exact", head: true })
      .eq("athlete_id", athleteId);
    if ((count ?? 0) > 1) continue; // shared with a co-parent — keep

    const { error } = await service.auth.admin.deleteUser(athleteId);
    if (error) {
      console.error(
        `[account.deleteAccount] athlete delete failed (parent=${parentId} athlete=${athleteId}); aborting before parent delete: ${error.message}`,
      );
      return {
        ok: false,
        error:
          "Could not delete one of your athletes, so your account was left intact. Please try again.",
      };
    }
    deletedAthletes++;
  }

  // ---------------------------------------------------------------------------
  // Step 3: Delete the parent.
  //
  // Cascades the parent profile, subscription row, and any remaining link rows
  // (co-parented athletes lose just this parent's link). The subscription row
  // cascade-deletion here is safe because we already cancelled in Stripe above —
  // the Stripe webhook (customer.subscription.deleted) will fire after this, look
  // up the row by stripe_customer_id, find nothing (already cascade-deleted), and
  // return 200 with a console.warn. No orphan, no retry loop.
  // ---------------------------------------------------------------------------
  const { error } = await service.auth.admin.deleteUser(parentId);
  if (error) {
    console.error(
      `[account.deleteAccount] parent delete failed (parent=${parentId}): ${error.message}`,
    );
    return { ok: false, error: "Could not delete your account. Please try again." };
  }

  console.log(
    `[account.deleteAccount] deleted parent=${parentId} (athletes_considered=${athleteIds.length} athletes_deleted=${deletedAthletes})`,
  );

  // ---------------------------------------------------------------------------
  // Durable audit write (FV-14): best-effort. The parent's auth.users row is
  // gone by the time we reach here, so actor_parent_id is a surviving opaque
  // UUID (no FK — by design). If this insert fails we log the error but do
  // NOT block the sign-out/redirect — the deletion right must not depend on
  // the audit infrastructure.
  // ---------------------------------------------------------------------------
  const { error: auditError } = await service
    .from("account_deletion_events")
    .insert({
      event_type: "account_deleted",
      actor_parent_id: parentId,
      target_athlete_id: null,
      athletes_deleted: deletedAthletes,
    });
  if (auditError) {
    console.error(
      `[account.deleteAccount] audit insert failed (parent=${parentId}): ${auditError.message}`,
    );
  }

  // Clear the now-orphaned session cookies, then send them home.
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
