/**
 * Hand-built `purchases.subscriptionsv2.get` response fixtures (FV-661).
 * Shaped after Google's SubscriptionPurchaseV2 resource; NOT captured from a
 * live call, and every identifier is a made-up sentinel.
 */

export const SENTINEL_TOKEN = "SENTINEL_PURCHASE_TOKEN_9f3a";
export const SENTINEL_LINKED_TOKEN = "SENTINEL_LINKED_TOKEN_c71d";
export const SENTINEL_ACCOUNT_ID = "SENTINEL_OBFUSCATED_ACCT_5b2e";

export interface FixtureOptions {
  state?: string;
  productId?: string;
  basePlanId?: string;
  expiryTime?: string | null;
  autoRenew?: boolean;
  offerId?: string | null;
  testPurchase?: boolean;
  acknowledged?: boolean;
  accountId?: string | null;
  linkedPurchaseToken?: string | null;
  extraLineItems?: Array<Record<string, unknown>>;
}

export function subscriptionV2Fixture(o: FixtureOptions = {}): Record<string, unknown> {
  const lineItem: Record<string, unknown> = {
    productId: o.productId ?? "family.1",
    autoRenewingPlan: { autoRenewEnabled: o.autoRenew ?? true },
    offerDetails: {
      basePlanId: o.basePlanId ?? "monthly",
      ...(o.offerId ? { offerId: o.offerId } : {}),
    },
  };
  if (o.expiryTime !== null) lineItem.expiryTime = o.expiryTime ?? "2026-12-12T12:00:00.000Z";

  const body: Record<string, unknown> = {
    kind: "androidpublisher#subscriptionPurchaseV2",
    regionCode: "US",
    latestOrderId: "GPA.0000-0000-0000-00000",
    startTime: "2026-11-12T12:00:00.000Z",
    subscriptionState: o.state ?? "SUBSCRIPTION_STATE_ACTIVE",
    acknowledgementState: o.acknowledged
      ? "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED"
      : "ACKNOWLEDGEMENT_STATE_PENDING",
    lineItems: [lineItem, ...(o.extraLineItems ?? [])],
  };
  if (o.accountId !== null) {
    body.externalAccountIdentifiers = {
      obfuscatedExternalAccountId: o.accountId ?? SENTINEL_ACCOUNT_ID,
    };
  }
  if (o.testPurchase) body.testPurchase = {};
  if (o.linkedPurchaseToken) body.linkedPurchaseToken = o.linkedPurchaseToken;
  return body;
}
