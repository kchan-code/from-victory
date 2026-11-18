"use server";

import { createHash } from "node:crypto";
import Stripe from "stripe";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireParent, requireSubscriber } from "@/lib/auth/guards";
import {
  isDeletionRateLimited,
  DELETION_RATE_LIMIT,
  DELETION_WINDOW_MINUTES,
} from "@/lib/actions/deletion-rate-limit";
import {
  isBenignCancelError,
  isBenignCustomerDeleteError,
} from "@/lib/stripe/cancel-errors";
import { getStripe } from "@/lib/stripe/server";
import { syncAthleteQuantity } from "@/lib/stripe/sync-athlete-quantity";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { isNativeShell } from "@/lib/native-shell";
import {
  cancelSubscriptionRenewal,
  getSubscriptionPurchaseV2,
} from "@/lib/subscriptions/google-play-api";
import { GOOGLE_PLAY_PACKAGE_NAME } from "@/lib/subscriptions/google-product-catalog";
import { getGoogleCancelableSubscriptionsForPayer } from "@/lib/subscriptions/google";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// =============================================================================
// Account deletion — payer-initiated, IMMEDIATE hard delete.
//
// Mechanism: deleting the auth.users row (service.auth.admin.deleteUser)
// cascades through every FK in the schema — profiles → parent_athlete_links,
// subscriptions, device_pairings, athlete_sessions → journal_entries,
// safety_events. There is no soft-delete / grace window: a confirmed deletion
// removes the data now. This trivially satisfies the "within 30 days of
// request" requirement and minimises how long a minor's data is retained.
//
// Two flows:
//   - deleteAthlete: removes ONE athlete this parent manages. PARENT-ONLY
//     (requireParent) — an adult_athlete never appears as a parent_id in
//     parent_athlete_links (link-role trigger enforced), so this flow has no
//     adult_athlete equivalent and is deliberately NOT widened (FV-440).
//   - deleteAccount: removes the caller's own account and every athlete they
//     SOLELY manage (athletes also linked to a co-parent are left intact —
//     see below). Widened in FV-440 (requireSubscriber) so an adult_athlete
//     can self-delete; for an adult_athlete the sole-managed-athletes loop is
//     structurally empty (adults never own parent_athlete_links rows), so it
//     reduces to "cancel Stripe, delete the caller's own row."
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
  // deliverInBackground registers the promise with waitUntil so the
  // serverless runtime can't freeze the instance mid-Stripe-write — a
  // dropped sync is silent under-/over-billing, not a caught error.
  deliverInBackground(syncAthleteQuantity(parentId));

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
const MAX_CHECKOUT_SESSION_LIST_ITERATIONS = 20;

function googleTokenTag(token: string): string {
  return createHash("sha256").update(token.slice(-8)).digest("hex").slice(0, 12);
}

export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") {
    return { ok: false, error: 'Type "DELETE" to confirm.' };
  }

  // FV-440: widened from requireParent() to requireSubscriber() so an
  // adult_athlete (18+ self-serve payer) can delete their own account, not
  // just a parent. The delete target is always the SESSION user's own id —
  // never trust a client-passed id. `parentId` below is that session id; the
  // name is kept (rather than renamed to `payerId`) to minimize the diff
  // against the rest of this well-tested function.
  const { userId: parentId } = await requireSubscriber();
  const service = createServiceClient();
  let googleCancelFailureNoticeRequired = false;
  let googleCancelUnknownNoticeRequired = false;
  const getStripeErrorCode = (err: unknown): string =>
    err instanceof Error ? (err as { code?: string }).code ?? "unknown" : "unknown";
  const logCheckoutResourceMissing = ({
    operation,
    customerId,
    sessionId,
    code,
  }: {
    operation: "list" | "expire";
    customerId: string;
    sessionId?: string;
    code: string;
  }) => {
    const target = sessionId ? ` session=${sessionId}` : "";
    console.warn(
      `[account.deleteAccount] Checkout Session ${operation} returned resource_missing (code=${code}) for customer=${customerId}${target} parent=${parentId} — already absent, proceeding`,
    );
  };
  const abortCheckoutSessionCleanup = (logMessage: string): DeleteAccountState => {
    console.error(logMessage);
    return {
      ok: false,
      error:
        "Could not clear pending checkout sessions before deleting your account. None of your account data was deleted, though your subscription may already be canceled. Please try again in a few minutes. If it keeps happening, contact us and we will delete the account for you.",
    };
  };

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
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("parent_id", parentId)
    .maybeSingle();
  const { data: mirroredCustomer, error: mirroredCustomerError } = await service
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("payer_id", parentId)
    .maybeSingle();
  if (mirroredCustomerError) {
    console.error(
      `[account.deleteAccount] stripe_customers read failed (parent=${parentId}): ${mirroredCustomerError.message}`,
    );
    return {
      ok: false,
      error: "Could not delete your account. Please try again.",
    };
  }

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
  // Step 1b (FV-760): expire every OPEN Checkout Session for each Stripe
  // customer id we hold for this payer, BEFORE deleting the customer and
  // BEFORE any local database delete. This prevents abandoned, still-open
  // Checkout URLs from lingering after account deletion.
  //
  // Delete EVERY customer id we hold for this payer (deduped) from both
  // mirrors. Comp grants / App Store / Play payers usually have none.
  // Logs carry ids only, never the customer's email or name.
  // ---------------------------------------------------------------------------
  const customerIds = [...new Set([
    sub?.stripe_customer_id ?? null,
    mirroredCustomer?.stripe_customer_id ?? null,
  ].filter((id): id is string => Boolean(id)))];
  for (const customerId of customerIds) {
    const attemptedSessionIds = new Set<string>();
    const retrievedSessionIds = new Set<string>();
    let hitCheckoutSessionListCap = true;
    for (let iteration = 0; iteration < MAX_CHECKOUT_SESSION_LIST_ITERATIONS; iteration++) {
      try {
        const sessions = await getStripe().checkout.sessions.list({
          customer: customerId,
          status: "open",
          limit: 100,
        });
        if (sessions.data.length === 0) {
          hitCheckoutSessionListCap = false;
          break;
        }

        const sessionsToExpire = sessions.data.filter(
          (session) => !attemptedSessionIds.has(session.id),
        );
        if (sessionsToExpire.length === 0) {
          if (sessions.has_more) {
            return abortCheckoutSessionCleanup(
              `[account.deleteAccount] Checkout Session list remained stuck with has_more=true for customer=${customerId} parent=${parentId} — aborting to avoid skipping open sessions`,
            );
          }

          const idsToCheck = sessions.data.filter(
            (session) => !retrievedSessionIds.has(session.id),
          );
          if (idsToCheck.length === 0) {
            hitCheckoutSessionListCap = false;
            break;
          }

          for (const session of idsToCheck) {
            try {
              const current = await getStripe().checkout.sessions.retrieve(session.id);
              if (current.status === "open") {
                return abortCheckoutSessionCleanup(
                  `[account.deleteAccount] Checkout Session list returned only already-attempted ids but session remained open for session=${session.id} customer=${customerId} parent=${parentId} — aborting to avoid skipping open sessions`,
                );
              }
              retrievedSessionIds.add(session.id);
              console.warn(
                `[account.deleteAccount] Checkout Session list returned already-attempted id with non-open status for session=${session.id} customer=${customerId} parent=${parentId} status=${current.status} — treating as benign`,
              );
            } catch (retrieveErr) {
              const message =
                retrieveErr instanceof Error ? retrieveErr.message : String(retrieveErr);
              return abortCheckoutSessionCleanup(
                `[account.deleteAccount] Checkout Session retrieve failed while validating already-attempted ids for session=${session.id} customer=${customerId} parent=${parentId}: ${message}`,
              );
            }
          }
          continue;
        }

        for (const session of sessionsToExpire) {
          attemptedSessionIds.add(session.id);
          try {
            await getStripe().checkout.sessions.expire(session.id);
            console.log(
              `[account.deleteAccount] expired Checkout Session session=${session.id} customer=${customerId} parent=${parentId}`,
            );
          } catch (err) {
            if (isBenignCustomerDeleteError(err)) {
              logCheckoutResourceMissing({
                operation: "expire",
                customerId,
                sessionId: session.id,
                code: getStripeErrorCode(err),
              });
              continue;
            }

            if (err instanceof Stripe.errors.StripeInvalidRequestError) {
              const code = getStripeErrorCode(err);
              const message = err.message;
              try {
                const current = await getStripe().checkout.sessions.retrieve(session.id);
                if (current.status !== "open") {
                  console.warn(
                    `[account.deleteAccount] Checkout Session expire raced to terminal state for session=${session.id} customer=${customerId} parent=${parentId} status=${current.status} code=${code} message=${message} — proceeding`,
                  );
                  continue;
                }

                return abortCheckoutSessionCleanup(
                  `[account.deleteAccount] Checkout Session expire failed but retrieve remained open for session=${session.id} customer=${customerId} parent=${parentId} code=${code} message=${message}`,
                );
              } catch (retrieveErr) {
                const message =
                  retrieveErr instanceof Error ? retrieveErr.message : String(retrieveErr);
                return abortCheckoutSessionCleanup(
                  `[account.deleteAccount] Checkout Session retrieve failed after expire error for session=${session.id} customer=${customerId} parent=${parentId}: ${message}`,
                );
              }
            }

            const message = err instanceof Error ? err.message : String(err);
            return abortCheckoutSessionCleanup(
              `[account.deleteAccount] Checkout Session expire failed for session=${session.id} customer=${customerId} parent=${parentId}: ${message}`,
            );
          }
        }
      } catch (err) {
        if (iteration === 0 && isBenignCustomerDeleteError(err)) {
          logCheckoutResourceMissing({
            operation: "list",
            customerId,
            code: getStripeErrorCode(err),
          });
          hitCheckoutSessionListCap = false;
          break;
        }

        const message = err instanceof Error ? err.message : String(err);
        return abortCheckoutSessionCleanup(
          `[account.deleteAccount] Checkout Session list failed for customer=${customerId} parent=${parentId}: ${message}`,
        );
      }
    }
    if (hitCheckoutSessionListCap) {
      return abortCheckoutSessionCleanup(
        `[account.deleteAccount] Checkout Session list hit cap for customer=${customerId} parent=${parentId} cap=${MAX_CHECKOUT_SESSION_LIST_ITERATIONS} — aborting to avoid skipping open sessions`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Step 1c (FV-726): delete the Stripe CUSTOMER so the payer's email and name
  // do not outlive the account. Stripe keeps the invoices/payment records it
  // must retain. Runs after Checkout Session expiry and BEFORE any database
  // delete, with the same abort-on-unexpected-error rule: a non-benign
  // failure leaves our data fully intact so the user can retry.
  // ---------------------------------------------------------------------------
  for (const customerId of customerIds) {
    try {
      await getStripe().customers.del(customerId);
      console.log(
        `[account.deleteAccount] deleted Stripe customer=${customerId} for parent=${parentId}`,
      );
    } catch (err) {
      if (isBenignCustomerDeleteError(err)) {
        console.warn(
          `[account.deleteAccount] Stripe customer delete returned resource_missing for customer=${customerId} parent=${parentId} — already absent, proceeding with deletion`,
        );
      } else {
        deliverInBackground(
          notifyError(
            "[account.deleteAccount] Stripe customer delete failed",
            "Stripe customer delete failed during account deletion",
            {
              parent_id: parentId,
              customer_id: customerId,
            },
          ),
        );
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[account.deleteAccount] Stripe customer delete failed for customer=${customerId} parent=${parentId}: ${message}`,
        );
        return {
          ok: false,
          error:
            "Could not remove your billing profile before deleting your account. None of your account data was deleted, though your subscription may already be canceled. Please try again in a few minutes. If it keeps happening, contact us and we will delete the account for you.",
        };
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 1d: clear any local billing rows for this payer BEFORE deleting
  // athletes/parent. If either delete fails, abort so nothing is partially
  // deleted past this point.
  // ---------------------------------------------------------------------------
  const { error: subDeleteError } = await service
    .from("subscriptions")
    .delete()
    .eq("parent_id", parentId);
  if (subDeleteError) {
    console.error(
      `[account.deleteAccount] subscriptions delete failed (parent=${parentId}): ${subDeleteError.message}`,
    );
    return {
      ok: false,
      error:
        "Could not remove your subscription record before deleting your account. Please try again.",
    };
  }

  const { error: mirrorDeleteError } = await service
    .from("stripe_customers")
    .delete()
    .eq("payer_id", parentId);
  if (mirrorDeleteError) {
    console.error(
      `[account.deleteAccount] stripe_customers delete failed (parent=${parentId}): ${mirrorDeleteError.message}`,
    );
    return {
      ok: false,
      error:
        "Could not remove your billing profile before deleting your account. Please try again.",
    };
  }

  // ---------------------------------------------------------------------------
  // Step 1e (FV-663 / G5): best-effort Google Play renewal cancellation.
  // Never blocks deletion. We cancel every row that may still bill, not just
  // whichever row is currently carrying access.
  // ---------------------------------------------------------------------------
  const google = await getGoogleCancelableSubscriptionsForPayer(service, parentId);
  if (google.readError) {
    googleCancelUnknownNoticeRequired = true;
    deliverInBackground(
      notifyError(
        "[account.deleteAccount] Google Play cancel skipped",
        "Could not read Google entitlement state during account deletion; user should check Google Play subscriptions manually",
      ),
    );
  } else {
    const failedCancels: string[] = [];

    for (const row of google.rows) {
      let canceled = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        canceled = await cancelSubscriptionRenewal(row.purchase_token);
        if (canceled) break;
      }
      if (!canceled) {
        let orderId = "unknown";
        const live = await getSubscriptionPurchaseV2(row.purchase_token);
        if (live.ok && live.purchase.latestOrderId) {
          orderId = live.purchase.latestOrderId;
        }
        failedCancels.push(
          `${GOOGLE_PLAY_PACKAGE_NAME}/${row.product_id} order_id=${orderId} status=${row.status} expires=${row.expires_at ?? "null"} token_tag=${googleTokenTag(row.purchase_token)}`,
        );
      }
    }

    if (failedCancels.length > 0) {
      googleCancelFailureNoticeRequired = true;
      deliverInBackground(
        notifyError(
          "[account.deleteAccount] Google Play cancel failed",
          `Google Play cancel failed during account deletion; user must cancel in Google Play. targets=${failedCancels.join(";")}`,
        ),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Step 2: Delete sole-managed athletes.
  //
  // Delete only athletes this parent SOLELY manages. An athlete also linked
  // to a co-parent is left intact — deleting this parent's auth.users row
  // cascade-removes just this parent's link, not the shared child's data.
  //
  // If any sole-managed athlete fails to delete, abort BEFORE deleting the
  // parent — otherwise we'd orphan that athlete's data with no manager left.
  //
  // FV-440: for an adult_athlete caller this query is structurally empty —
  // an adult_athlete never appears as parent_id in parent_athlete_links
  // (check_parent_athlete_link_roles() only permits role='parent' on that
  // side; see 20260625000000_adult_athlete_role.sql). So `links` is always
  // `[]` for an adult, the loop below runs zero iterations, and the flow
  // reduces to "cancel Stripe (step 1, above), delete the caller (step 3)."
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
  const supabase = await createClient();
  await supabase.auth.signOut();
  // FV-754: every completed deletion carries account_deleted=1, so the
  // landing page (AccountDeletionNotice on "/", ClearCacheOnMount on /signin)
  // can clear what this device still holds for the deleted account. The
  // Google Play flags stay additive: the notices only show when one of them
  // is present too.
  let redirectUrl = "?account_deleted=1";
  if (googleCancelFailureNoticeRequired) {
    redirectUrl = "?account_deleted=1&google_play_cancel=1";
  } else if (googleCancelUnknownNoticeRequired) {
    redirectUrl = "?account_deleted=1&google_play_cancel_unknown=1";
  }
  if (googleCancelFailureNoticeRequired || googleCancelUnknownNoticeRequired) {
    console.warn(
      "[account.deleteAccount] account deleted but Google Play cancel was not confirmed; user should cancel in Google Play.",
    );
  }
  // Same shell/browser split as signOut() in lib/actions/auth.ts (FV-489):
  // "/" is the gated marketing root in-shell (real prices, trial CTA), a
  // Play Payments violation on this account-deletion sign-out too. Browser
  // behavior is unchanged.
  redirect((await isNativeShell()) ? `/signin${redirectUrl}` : `/${redirectUrl}`);
}
