/**
 * google-play-api.ts — Android Publisher REST calls and the pure response
 * parser (FV-661; record 7.3).
 *
 * Calls the REST endpoints directly with `fetch` (no `googleapis` package).
 * Token acquisition is injected (`GetPlayAccessToken`, see ./google-play-auth)
 * so tests use a fake token source and a fake `fetch`: no live Google calls.
 *
 * LOGGING / ERRORS (record 7.1, NON-NEGOTIABLE): the purchase token is part
 * of every request URL and the response carries the obfuscated account id.
 * Nothing in this file logs, and every error returned or thrown is a static
 * code, never a message derived from the request, the response body, or a
 * lower-level error (those can echo the URL or the payload).
 */
import "server-only";

import { z } from "zod";

import type { GoogleSubscriptionStatus } from "./google-access-level";
import { GOOGLE_PLAY_PACKAGE_NAME } from "./google-product-catalog";
import { getPlayAccessToken, type GetPlayAccessToken } from "./google-play-auth";

const API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const REQUEST_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Row shape (pure parser output)
// ---------------------------------------------------------------------------

/** What we keep from a verified `purchases.subscriptionsv2.get` response. */
export interface ParsedGooglePurchase {
  readonly productId: string;
  readonly basePlanId: string;
  readonly status: GoogleSubscriptionStatus;
  /** ISO 8601, or null when Google reports no expiry (never grants access). */
  readonly expiresAt: string | null;
  readonly autoRenewing: boolean;
  /** True when Google's response carries `testPurchase`. */
  readonly isTestPurchase: boolean;
  readonly obfuscatedAccountId: string | null;
  readonly linkedPurchaseToken: string | null;
  readonly acknowledged: boolean;
  readonly offerId: string | null;
}

export type ParseGooglePurchaseResult =
  | { ok: true; purchase: ParsedGooglePurchase }
  | { ok: false; reason: "unparseable" | "unknown_state" };

const STATE_PREFIX = "SUBSCRIPTION_STATE_";

const KNOWN_STATUSES: ReadonlySet<string> = new Set<GoogleSubscriptionStatus>([
  "pending",
  "active",
  "paused",
  "in_grace_period",
  "on_hold",
  "canceled",
  "expired",
  "pending_purchase_canceled",
]);

const LineItemSchema = z.looseObject({
  productId: z.string().min(1),
  expiryTime: z.string().optional(),
  // Google omits this for an item the user does not own yet (the target of a
  // deferred plan change).
  latestSuccessfulOrderId: z.string().optional(),
  // Present on the item the user holds NOW when a change is scheduled for the
  // next renewal.
  deferredItemReplacement: z.unknown().optional(),
  deferredItemRemoval: z.unknown().optional(),
  autoRenewingPlan: z.looseObject({ autoRenewEnabled: z.boolean().optional() }).optional(),
  prepaidPlan: z.looseObject({}).optional(),
  offerDetails: z
    .looseObject({
      basePlanId: z.string().optional(),
      offerId: z.string().optional(),
    })
    .optional(),
});

const ResponseSchema = z.looseObject({
  subscriptionState: z.string(),
  lineItems: z.array(LineItemSchema).min(1),
  linkedPurchaseToken: z.string().optional(),
  acknowledgementState: z.string().optional(),
  testPurchase: z.unknown().optional(),
  externalAccountIdentifiers: z
    .looseObject({ obfuscatedExternalAccountId: z.string().optional() })
    .optional(),
});

function toIso(value: string | undefined): string | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/**
 * Pure parser: Google's `SubscriptionPurchaseV2` JSON to our row shape. No I/O.
 *
 * Fails closed: an unknown `subscriptionState`, a missing line item, or a
 * missing product / base plan id is a parse failure (the caller refuses; it
 * never guesses a status).
 *
 * Several line items (a scheduled, next-renewal plan change lists the plan the
 * user holds and the plan it will become): see `pickCurrentLineItem`.
 */
type LineItem = z.infer<typeof LineItemSchema>;

/**
 * Which line item is the plan the user holds right now.
 *
 * A scheduled (next-renewal) change lists the plan held now and the plan it
 * will become. Google's reference says `latestSuccessfulOrderId` is "not
 * present if the item is not owned by the user yet (e.g. the item being
 * deferred replaced to)", but does not show a full response, so the rule is
 * built to be safe whichever way the details fall (device check: FV-668):
 *   1. candidates are the items the user owns (have a successful order); if no
 *      item carries that field, every item is a candidate;
 *   2. among candidates the EARLIEST parseable expiry wins. The plan held now
 *      always expires no later than the plan replacing it, so this can never
 *      report the later or larger plan (no over-grant);
 *   3. an item with no expiry is chosen only when no candidate has one, so a
 *      not-yet-owned target cannot blank out a paying customer's access (and a
 *      null expiry never grants).
 * The `deferredItemReplacement` / `deferredItemRemoval` markers are parsed but
 * deliberately NOT used to choose: which item carries them is not something to
 * bet access on.
 */
function pickCurrentLineItem(items: LineItem[]): { item: LineItem; iso: string | null } | null {
  const owned = items.filter((i) => !!i.latestSuccessfulOrderId);
  const pool = owned.length > 0 ? owned : items;

  const keyed = pool.map((item) => ({ item, iso: toIso(item.expiryTime) }));
  const dated = keyed
    .filter((k): k is { item: LineItem; iso: string } => k.iso !== null)
    .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());
  return dated[0] ?? keyed[0] ?? null;
}

export function parseSubscriptionPurchaseV2(raw: unknown): ParseGooglePurchaseResult {
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "unparseable" };
  const body = parsed.data;

  if (!body.subscriptionState.startsWith(STATE_PREFIX)) {
    return { ok: false, reason: "unknown_state" };
  }
  const status = body.subscriptionState.slice(STATE_PREFIX.length).toLowerCase();
  if (!KNOWN_STATUSES.has(status)) return { ok: false, reason: "unknown_state" };

  const current = pickCurrentLineItem(body.lineItems);
  if (!current) return { ok: false, reason: "unparseable" };

  const basePlanId = current.item.offerDetails?.basePlanId;
  if (!basePlanId) return { ok: false, reason: "unparseable" };

  return {
    ok: true,
    purchase: {
      productId: current.item.productId,
      basePlanId,
      status: status as GoogleSubscriptionStatus,
      expiresAt: current.iso,
      autoRenewing:
        current.item.prepaidPlan === undefined &&
        current.item.autoRenewingPlan?.autoRenewEnabled === true,
      // `testPurchase` is an (often empty) object whose mere presence marks a
      // license-tester purchase.
      isTestPurchase: body.testPurchase !== undefined && body.testPurchase !== null,
      obfuscatedAccountId:
        body.externalAccountIdentifiers?.obfuscatedExternalAccountId || null,
      linkedPurchaseToken: body.linkedPurchaseToken || null,
      acknowledged: body.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
      offerId: current.item.offerDetails?.offerId || null,
    },
  };
}

// ---------------------------------------------------------------------------
// REST calls
// ---------------------------------------------------------------------------

export interface PlayApiDeps {
  readonly getAccessToken?: GetPlayAccessToken;
  readonly fetchImpl?: typeof fetch;
}

export type GetPurchaseResult =
  | { ok: true; purchase: ParsedGooglePurchase }
  /** Google does not recognise the token (HTTP 400, 404 or 410). */
  | { ok: false; reason: "invalid_token" }
  /** Auth failure, 5xx, network error, timeout, or a response we cannot read. */
  | { ok: false; reason: "unavailable" }
  | { ok: false; reason: "unparseable" | "unknown_state" };

/**
 * `purchases.subscriptionsv2.get`. The token never appears in a log or error.
 */
export async function getSubscriptionPurchaseV2(
  purchaseToken: string,
  deps: PlayApiDeps = {},
): Promise<GetPurchaseResult> {
  const getToken = deps.getAccessToken ?? getPlayAccessToken;
  const doFetch = deps.fetchImpl ?? fetch;

  let response: Response;
  try {
    const accessToken = await getToken();
    response = await doFetch(
      `${API_ROOT}/applications/${GOOGLE_PLAY_PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (response.status === 400 || response.status === 404 || response.status === 410) {
    return { ok: false, reason: "invalid_token" };
  }
  if (!response.ok) return { ok: false, reason: "unavailable" };

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  const parsed = parseSubscriptionPurchaseV2(json);
  return parsed.ok ? { ok: true, purchase: parsed.purchase } : parsed;
}

/**
 * `purchases.subscriptions.acknowledge`. Google exposes acknowledge only on
 * the v1 surface, keyed by product id (there is no subscriptionsv2
 * acknowledge; confirmed against the API reference 2026-11-12, where it is
 * not marked deprecated and the product id path segment is optional since
 * 2025-05-21). Returns true on success.
 */
export async function acknowledgeSubscriptionPurchase(
  productId: string,
  purchaseToken: string,
  deps: PlayApiDeps = {},
): Promise<boolean> {
  const getToken = deps.getAccessToken ?? getPlayAccessToken;
  const doFetch = deps.fetchImpl ?? fetch;
  try {
    const accessToken = await getToken();
    const response = await doFetch(
      `${API_ROOT}/applications/${GOOGLE_PLAY_PACKAGE_NAME}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

export interface AckRetryOptions {
  /** Total attempts, including the first. Default 3. */
  readonly attempts?: number;
  /** Delay before retry n (1-based). Default 250ms then 750ms. */
  readonly sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_ACK_ATTEMPTS = 3;
const ACK_BACKOFF_MS = [250, 750];

/** Bounded retry around acknowledge. True once one attempt succeeds. */
export async function acknowledgeWithRetry(
  productId: string,
  purchaseToken: string,
  deps: PlayApiDeps = {},
  options: AckRetryOptions = {},
): Promise<boolean> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ACK_ATTEMPTS);
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (await acknowledgeSubscriptionPurchase(productId, purchaseToken, deps)) return true;
    if (attempt < attempts) {
      await sleep(ACK_BACKOFF_MS[attempt - 1] ?? 750);
    }
  }
  return false;
}
