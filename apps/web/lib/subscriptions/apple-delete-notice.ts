/**
 * apple-delete-notice.ts — which App Store notice the Delete account section
 * shows (FV-652, decision record §4.7).
 *
 * Deleting a From Victory account cannot cancel an App Store subscription:
 * Apple has no server-side cancel. A payer with an active Apple subscription
 * must be told, before the typed confirmation, to cancel it with Apple.
 *
 * Plain shared module on purpose (no "use client", no "server-only"): the
 * server pages call `appleSubscriptionNoticeFor`, and the client component
 * `DeleteAccountSection` imports the type. A function exported from a
 * "use client" file cannot be called from a Server Component.
 */

/**
 *   - "active":  an active Apple subscription was read for this payer.
 *   - "unknown": the Apple status read errored. Fail toward warning, but the
 *                wording is hedged so a payer who never had an App Store
 *                subscription is not told they have one.
 */
export type AppleSubscriptionNotice = "active" | "unknown";

/**
 * Maps the centralized Apple accessor's result
 * (`getDisplayedAppleProductIdResult`, ./apple.ts) to the notice variant.
 * `null` means no notice. Display only: never feeds an entitlement, capacity,
 * trial, or purchase decision.
 */
export function appleSubscriptionNoticeFor(result: {
  productId: string | null;
  readError: boolean;
}): AppleSubscriptionNotice | null {
  if (result.productId !== null) return "active";
  return result.readError ? "unknown" : null;
}
