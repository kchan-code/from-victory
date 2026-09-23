"use client";
// client: reads the injected `window.Capacitor` bridge (lib/native/apple-iap.ts),
// interactive plan selection (useState), useTransition for the purchase /
// restore / manage async flows, router.refresh() so the parent Server
// Component re-resolves entitlement after a successful purchase/restore.

/**
 * AppleSubscribeSection (FV-572; simplified selection UI FV-600)
 *
 * Rendered by app/subscribe/page.tsx ONLY when the request's shell
 * capability is `"ios-iap"` (see lib/native-shell.ts getRequestShellCapability()) —
 * an iOS build new enough to carry the StoreKit 2 purchase bridge.
 *
 * SSR/hydration note: the injected `window.Capacitor` global does not exist
 * during server rendering, so the very first client render MUST render the
 * same markup the server did or React logs a hydration mismatch. This
 * component follows the same pattern already used in this codebase for
 * browser-API detection (see components/athlete/InstallPrompt.tsx): state
 * defaults to the SSR-safe "unavailable" shape, and the real bridge/config
 * check runs inside a `useEffect` (post-mount, client-only), upgrading to
 * the selector view only after mount confirms both a configured product
 * list AND a live native bridge.
 *
 * STILL GATED — DO NOT BUILD HERE (unresolved KC policy, record §4.6 "P5"):
 * seat-designation / downgrade-selection UI, and any Apple trial/intro-offer
 * eligibility display (`isEligibleForIntroOffer`). This component is
 * purchase / restore / manage / upgrade ONLY.
 *
 * Trial-to-family conversion UI for Apple IS built here (FV-586, KC decision
 * D3, 2026-09-17) as the `"upgrade"` mode below — Apple's own purchase sheet
 * (which shows Apple's own price and charges the card) IS the explicit
 * confirmation D3 requires for this provider; our server has no other
 * mechanism to end an Apple trial (see
 * `lib/subscriptions/trial-conversion.ts`'s module doc). This mode is a
 * purchase of a specific higher-capacity product, not a generic
 * charge-disclosure surface — it still doesn't show Apple trial/intro-offer
 * eligibility.
 *
 * FV-600 (KC-requested, product-strategist APPROVED WITH NARROWING):
 * replaces the original "one tall card per configured product" purchase UI
 * (8-10 cards for a 5-capacity x 2-interval catalog) with a compact
 * SELECTION MODEL — an athlete-count control + a Monthly/Yearly control that
 * together resolve to exactly one product id — plus ONE selected-plan
 * summary showing the StoreKit-fetched price. This keeps the primary CTA
 * and Restore reachable without scrolling through a product list. An
 * existing subscriber (mode "manage"/"upgrade") sees a "Current plan" block
 * instead, with any upgrade offer folded into a collapsed, clearly-secondary
 * "Change plan" disclosure rather than a second buy surface.
 *
 * `mode` prop (FV-581, decision record §4.4 "duplicate-billing guard"):
 *   - "purchase" (default) — a first-time payer: the selector, the plan
 *     summary, "Subscribe", and "Restore Purchases". No Manage Subscription
 *     affordance here — there is nothing to manage before a first purchase.
 *     Every existing call site (`app/subscribe/page.tsx`'s not_entitled
 *     branch) omits the prop and is unaffected.
 *   - "manage" — rendered ONLY for a payer app/subscribe/page.tsx has
 *     already determined is entitled via Apple. Heading "Manage your plan",
 *     a "Current plan" block (capacity/interval/price when known, else a
 *     calm status line), "Manage Subscription", and "Restore Purchases".
 *     No fresh-purchase affordance — a fresh purchase must never be offered
 *     to an already-full payer.
 *   - "upgrade" (FV-586, KC decision D3) — rendered ONLY for a payer
 *     app/subscribe/page.tsx has determined is Apple-entitled AND for whom a
 *     strictly-higher-capacity product is configured (see
 *     `currentAppleCapacity` below). Same "manage" base view, plus a
 *     collapsed "Change plan" disclosure that, once expanded, offers ONLY
 *     the configured products whose presentational `athleteCapacity`
 *     exceeds `currentAppleCapacity` via the same selector, with a
 *     disclosure that confirming ends any trial and charges immediately.
 *     The real capacity-increase gate is server-side
 *     (`isStrictAppleCapacityUpgrade`, consulted by `beginApplePurchase`) —
 *     this mode's product filtering is presentational only, same as every
 *     other use of `athleteCapacity` in this file.
 */

import { useEffect, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  getConfiguredAppleProducts,
  type AppleProductConfig,
} from "@/lib/subscriptions/apple-products";
import {
  getProducts as getStoreKitProducts,
  isAppleIapBridgeAvailable,
  manageSubscriptions as manageSubscriptionsWithBridge,
  purchase as purchaseWithBridge,
  restore as restoreWithBridge,
} from "@/lib/native/apple-iap";
import {
  beginApplePurchase,
  submitApplePurchase,
} from "@/lib/actions/apple-subscription";

// ---------------------------------------------------------------------------
// Copy — calm, parent-facing, no Apple jargon, no error codes (record §4.4/
// audience-language rules: this surface is payer-facing, "your athlete").
// ---------------------------------------------------------------------------

const UNAVAILABLE_COPY = "Subscriptions aren’t available in this version yet.";
const MANAGE_HEADING = "Manage your plan";
const MANAGE_STATUS_COPY = "You’re subscribed. Manage or restore below.";
const CURRENT_PLAN_LABEL = "Current plan";
const YOUR_PLAN_LABEL = "Your plan";
const ATHLETES_GROUP_LABEL = "Athletes";
const INTERVAL_GROUP_LABEL = "Billing interval";
const CHANGE_PLAN_LABEL = "Change plan";
// Neutral, non-promissory line for first-purchase mode only — Apple's own
// sheet is the sole source of trial/price/terms claims (no trial/eligibility
// copy is ever rendered by this component itself).
const APPLE_TERMS_NOTE = "Apple shows the final price and terms before you confirm.";
const PRODUCT_UNAVAILABLE_COPY =
  "This plan isn’t available right now. Please try again in a moment.";
const PURCHASE_ERROR_COPY = "We couldn’t complete that purchase. Please try again.";
const PURCHASE_PENDING_COPY =
  "Your purchase is waiting on approval. Check back soon.";
const PURCHASE_SUCCESS_COPY = "You’re subscribed. Welcome to From Victory.";
const RESTORE_ERROR_COPY =
  "We couldn’t check for a previous purchase. Please try again.";
const RESTORE_EMPTY_COPY = "No previous purchase was found for this Apple ID.";
const RESTORE_SUCCESS_COPY = "Your subscription is restored.";
// FV-586 (KC decision D3, KC-audited correction 6c7ec96): worded to Apple's
// verified behavior only — never claims WE charge, never promises proration
// details we can't verify, and never asserts a charge timing Apple doesn't
// actually guarantee.
const UPGRADE_DISCLOSURE_COPY =
  "Confirming with Apple switches you to this plan right away and ends any free trial. Apple bills the new plan on its own schedule and shows the price before you confirm.";
const UPGRADE_SUCCESS_COPY = "You’re upgraded. Welcome to your family plan.";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type Phase = "unavailable" | "ready";
type Interval = "month" | "year";

export interface AppleSubscribeSectionProps {
  /** Defaults to "purchase" so every existing call site is unaffected. */
  mode?: "purchase" | "manage" | "upgrade";
  /**
   * The payer's CURRENT Apple product's athlete-capacity ceiling, resolved
   * server-side (`getActiveAppleProductId` + `capacityForAppleProduct` in
   * app/subscribe/page.tsx). Used two ways:
   *   - `mode === "upgrade"`: filters the configured product catalog to
   *     strictly-higher-capacity products only (see file header).
   *   - `mode === "manage"` or `"upgrade"`: labels the "Current plan" block.
   *     `undefined`/`null` (unmapped current product, or capacity-map gap —
   *     see apple-capacity.ts) degrades calmly to a generic status line,
   *     never a guessed number.
   * Presentational only — the real capacity-increase gate is server-side,
   * re-checked at purchase time by `beginApplePurchase` via
   * `isStrictAppleCapacityUpgrade`.
   */
  currentAppleCapacity?: number;
  /**
   * The payer's CURRENT Apple product id (FV-600), only meaningful for
   * `mode === "manage"` or `"upgrade"`. Used to fetch that product's live
   * StoreKit `displayPrice` for the "Current plan" block. Omitted entirely
   * degrades to a capacity-only (or fully generic) Current Plan display —
   * never blocks Manage/Restore.
   */
  currentAppleProductId?: string;
}

type DisplayProduct = AppleProductConfig & { livePrice?: string };

type ActionState =
  | { kind: "idle" }
  | { kind: "purchasing" }
  | { kind: "purchase-pending" }
  | { kind: "purchase-error"; message: string }
  | { kind: "restoring" }
  | { kind: "restore-empty" }
  | { kind: "restore-error"; message: string }
  | { kind: "success"; message: string };

const IDLE: ActionState = { kind: "idle" };

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function capacityLabel(count: number): string {
  return count === 1 ? "1 athlete" : `Up to ${count} athletes`;
}

/**
 * Resolves a product's billing period. Prefers the injected config's
 * `interval` field (see apple-products.ts) — StoreKit's `getProducts` bridge
 * call returns only a price/name string, never a machine-readable period, so
 * it is NEVER parsed from StoreKit.
 *
 * FALLBACK ONLY: when `interval` isn't configured yet (App Store Connect
 * config, Open Item P2), best-effort-parses the product id's suffix so the
 * plan summary / Current-plan block still reads sensibly during that gap,
 * and so the FV-600 same-interval "Change plan" filter (below) still has
 * something to compare against. Used for both display AND the upgrade
 * filter — unlike the old display-only fallback, an unresolvable interval
 * here now means "don't offer this as an upgrade" (fail closed), so this
 * function itself stays comment-flagged as a best-effort guess, never
 * authoritative.
 */
function resolveInterval(interval: Interval | undefined, productId: string): Interval | null {
  if (interval === "month" || interval === "year") return interval;
  if (!productId) return null;
  const id = productId.toLowerCase();
  if (id.includes("year") || id.includes("annual")) return "year";
  if (id.includes("month")) return "month";
  return null;
}

function intervalDisplayLabel(interval: Interval | null): string | null {
  if (interval === "month") return "Monthly";
  if (interval === "year") return "Yearly";
  return null;
}

function computeDefaults(catalog: DisplayProduct[]): {
  capacity: number | null;
  interval: Interval | null;
} {
  if (catalog.length === 0) return { capacity: null, interval: null };
  const capacities = Array.from(new Set(catalog.map((product) => product.athleteCapacity))).sort(
    (a, b) => a - b,
  );
  const capacity = capacities[0] ?? null;
  // FV-600: route through `resolveInterval` (config first, id-suffix
  // fallback) rather than the raw `interval` field — a catalog served
  // without `interval` set (e.g. today's FV-593 catalog emitter) must still
  // default to Monthly rather than silently defaulting to `null`/whatever
  // happens to sort first.
  const intervalsForCapacity = catalog
    .filter((product) => product.athleteCapacity === capacity)
    .map((product) => resolveInterval(product.interval, product.productId))
    .filter((value): value is Interval => value != null);
  const interval = intervalsForCapacity.includes("month")
    ? "month"
    : (intervalsForCapacity[0] ?? null);
  return { capacity, interval };
}

/**
 * Arrow-key navigation within a `role="radiogroup"` selector (ARIA
 * radiogroup / roving-tabindex pattern) — a keyboard-only parent can move
 * the selection without a mouse. Per the roving-tabindex pattern, moving the
 * selection MUST also move DOM focus to the newly-selected option (not just
 * update its `aria-checked`/`tabIndex`) — otherwise focus visibly stays
 * behind on the deselected control. The radio buttons render in the same
 * order as `options`, so the newly-selected DOM node is found by index
 * within the group container (`event.currentTarget`) rather than via a
 * second ref/id lookup.
 */
function makeArrowKeyHandler<T>(
  options: T[],
  selected: T | null,
  onSelect: (value: T) => void,
): (event: KeyboardEvent<HTMLDivElement>) => void {
  return (event) => {
    if (options.length === 0) return;
    const currentIndex = selected != null ? options.indexOf(selected) : 0;
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % options.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    }
    if (nextIndex === null) return;
    const nextValue = options[nextIndex];
    if (nextValue === undefined) return;
    onSelect(nextValue);
    const radios = event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]');
    radios[nextIndex]?.focus();
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SegmentedOption({
  selected,
  testId,
  ariaLabel,
  onSelect,
  children,
}: {
  selected: boolean;
  testId: string;
  ariaLabel?: string;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      tabIndex={selected ? 0 : -1}
      data-testid={testId}
      onClick={onSelect}
      className={[
        "min-h-[44px] flex-1 rounded-xl border font-display font-bold text-[16px] transition-colors duration-fast ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
        selected
          ? "bg-gold text-onyx border-gold"
          : "bg-charcoal text-cream border-hairline hover:border-hairline-strong",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/**
 * FV-600: the athlete-count + Monthly/Yearly selection model that resolves
 * to exactly one product id. Renders only the controls a catalog actually
 * has real options for — a single-product catalog (today's config-gap
 * default, or a strict-upgrade catalog with only one eligible tier) shows no
 * picker at all, just the plan summary below it.
 */
function PlanSelector({
  products,
  selectedAthleteCount,
  selectedInterval,
  onSelectAthleteCount,
  onSelectInterval,
}: {
  products: DisplayProduct[];
  selectedAthleteCount: number | null;
  selectedInterval: Interval | null;
  onSelectAthleteCount: (count: number) => void;
  onSelectInterval: (interval: Interval) => void;
}) {
  const athleteCountOptions = Array.from(
    new Set(products.map((product) => product.athleteCapacity)),
  ).sort((a, b) => a - b);
  // FV-600: route through `resolveInterval` (config first, id-suffix
  // fallback) rather than the raw `interval` field — the live catalog
  // (FV-593 emitter) doesn't set `interval` yet, so reading the raw field
  // here would hide the Monthly/Yearly control entirely and strand yearly
  // plans as unreachable.
  const intervalOptions = Array.from(
    new Set(
      products
        .map((product) => resolveInterval(product.interval, product.productId))
        .filter((value): value is Interval => value != null),
    ),
  ).sort();

  if (athleteCountOptions.length <= 1 && intervalOptions.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6">
      {athleteCountOptions.length > 1 ? (
        <div className="mb-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
            {ATHLETES_GROUP_LABEL}
          </p>
          <div
            role="radiogroup"
            aria-label={ATHLETES_GROUP_LABEL}
            onKeyDown={makeArrowKeyHandler(athleteCountOptions, selectedAthleteCount, onSelectAthleteCount)}
            className="flex gap-2"
          >
            {athleteCountOptions.map((count) => (
              <SegmentedOption
                key={count}
                selected={selectedAthleteCount === count}
                testId={`apple-athlete-count-${count}`}
                ariaLabel={capacityLabel(count)}
                onSelect={() => onSelectAthleteCount(count)}
              >
                {count}
              </SegmentedOption>
            ))}
          </div>
        </div>
      ) : null}

      {intervalOptions.length > 1 ? (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
            {INTERVAL_GROUP_LABEL}
          </p>
          <div
            role="radiogroup"
            aria-label={INTERVAL_GROUP_LABEL}
            onKeyDown={makeArrowKeyHandler(intervalOptions, selectedInterval, onSelectInterval)}
            className="flex gap-2"
          >
            {intervalOptions.map((interval) => (
              <SegmentedOption
                key={interval}
                selected={selectedInterval === interval}
                testId={`apple-interval-${interval}`}
                onSelect={() => onSelectInterval(interval)}
              >
                {interval === "month" ? "Monthly" : "Yearly"}
              </SegmentedOption>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** FV-600: ONE selected-plan summary — capacity, interval, and the
 * StoreKit-fetched live price (never hardcoded). */
function PlanSummary({
  product,
  athleteCount,
  pricesLoaded,
  unavailable,
}: {
  product: DisplayProduct | null;
  athleteCount: number | null;
  pricesLoaded: boolean;
  unavailable: boolean;
}) {
  if (athleteCount == null) return null;
  const label = intervalDisplayLabel(resolveInterval(product?.interval, product?.productId ?? ""));

  return (
    <div
      data-testid="apple-plan-summary"
      className="mb-6 bg-charcoal border border-gold/40 rounded-2xl px-5 py-5"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
        {YOUR_PLAN_LABEL}
      </p>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display font-bold text-cream text-[17px]">
          {capacityLabel(athleteCount)}
          {label ? ` · ${label}` : ""}
        </p>
        {!pricesLoaded ? (
          <span
            aria-hidden
            data-testid="apple-plan-summary-price-loading"
            className="font-display text-cream/40 text-[14px]"
          >
            …
          </span>
        ) : unavailable ? null : product?.livePrice ? (
          <span
            data-testid="apple-plan-summary-price"
            className="flex-shrink-0 font-display font-extrabold text-cream text-[20px] leading-none"
          >
            {product.livePrice}
          </span>
        ) : null}
      </div>
      {pricesLoaded && unavailable ? (
        <p
          role="status"
          data-testid="apple-product-unavailable"
          className="mt-3 font-body text-[13px] text-cream/60 leading-snug"
        >
          {PRODUCT_UNAVAILABLE_COPY}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppleSubscribeSection({
  mode = "purchase",
  currentAppleCapacity,
  currentAppleProductId,
}: AppleSubscribeSectionProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // SSR-safe default: "unavailable" is exactly what a server render (no
  // `window`) would compute, so the first client render matches it too.
  const [phase, setPhase] = useState<Phase>("unavailable");
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [selectedAthleteCount, setSelectedAthleteCount] = useState<number | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<Interval | null>(null);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [currentProductLive, setCurrentProductLive] = useState<{ displayPrice?: string } | null>(
    null,
  );
  // FV-600: the payer's CURRENT billing interval, resolved from the
  // configured catalog entry matching `currentAppleProductId` (falling back
  // to `resolveInterval`'s id-suffix guess) — used both to label "Current
  // plan" and to constrain "Change plan" to the SAME interval only.
  const [currentInterval, setCurrentInterval] = useState<Interval | null>(null);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [actionState, setActionState] = useState<ActionState>(IDLE);

  useEffect(() => {
    let catalog: DisplayProduct[] = [];
    let resolvedCurrentInterval: Interval | null = null;

    if (mode === "manage" || mode === "upgrade") {
      // Manage/Restore need only the native bridge, NOT the product catalog
      // — an already-entitled payer must never be stranded from managing or
      // restoring their subscription by an unrelated product-config gap
      // (NEXT_PUBLIC_APPLE_PRODUCTS). See AppleSubscribeSectionProps doc.
      if (!isAppleIapBridgeAvailable()) return;

      // Resolve the payer's CURRENT billing interval — needed for the
      // "Current plan" label (FV-600) and, in "upgrade" mode, to constrain
      // "Change plan" to the SAME interval (below). Reading the full
      // catalog here is presentational-only and never gates Manage/Restore
      // — skipped entirely when there's no current product id to look up
      // (e.g. the base "manage" mode test with no upgrade data at all), so
      // manage mode still never depends on the catalog for anything but
      // this cosmetic lookup.
      if (mode === "upgrade" || currentAppleProductId) {
        const configured = getConfiguredAppleProducts();
        if (currentAppleProductId) {
          const currentEntry = configured.find(
            (product) => product.productId === currentAppleProductId,
          );
          resolvedCurrentInterval = resolveInterval(currentEntry?.interval, currentAppleProductId);
        }

        if (mode === "upgrade") {
          // FV-586 "upgrade" mode + FV-600 same-interval narrowing: offer
          // ONLY products whose capacity strictly exceeds the payer's
          // current one AND whose interval matches the payer's CURRENT
          // interval — a monthly<->yearly switch is Manage Subscription's
          // job, never this surface's (see PlanSelector's doc: "no monthly
          // <-> yearly switch"). If the current interval can't be resolved
          // at all, fail CLOSED — offer nothing rather than risk a
          // cross-interval "upgrade" (mirrors isStrictAppleCapacityUpgrade's
          // fail-closed stance in apple-capacity.ts).
          catalog = resolvedCurrentInterval
            ? configured.filter(
                (product) =>
                  product.athleteCapacity > (currentAppleCapacity ?? Infinity) &&
                  resolveInterval(product.interval, product.productId) === resolvedCurrentInterval,
              )
            : [];
          if (catalog.length === 0) {
            // Nothing to offer — stay in the calm unavailable state rather
            // than rendering an empty change-plan disclosure.
            return;
          }
        }
      }
    } else {
      catalog = getConfiguredAppleProducts();
      if (catalog.length === 0 || !isAppleIapBridgeAvailable()) {
        // Shipped state today: NEXT_PUBLIC_APPLE_PRODUCTS is unset, so this
        // is the branch every production render takes. See apple-products.ts.
        return;
      }
    }

    setCurrentInterval(resolvedCurrentInterval);
    setProducts(catalog);
    const defaults = computeDefaults(catalog);
    setSelectedAthleteCount(defaults.capacity);
    setSelectedInterval(defaults.interval);
    setPhase("ready");

    const priceIds = [
      ...(currentAppleProductId ? [currentAppleProductId] : []),
      ...catalog.map((product) => product.productId),
    ];

    if (priceIds.length === 0) {
      setPricesLoaded(true);
      return;
    }

    let cancelled = false;
    void getStoreKitProducts(priceIds).then((live) => {
      if (cancelled) return;
      const priceById = new Map(live.map((product) => [product.productId, product]));

      if (currentAppleProductId) {
        const match = priceById.get(currentAppleProductId);
        if (match) setCurrentProductLive({ displayPrice: match.displayPrice });
      }

      if (catalog.length > 0) {
        setProducts(
          catalog.map((product) => ({
            ...product,
            livePrice: priceById.get(product.productId)?.displayPrice,
            displayName: priceById.get(product.productId)?.displayName ?? product.displayName,
          })),
        );
      }

      setPricesLoaded(true);
    });

    return () => {
      cancelled = true;
    };
    // `mode`/`currentAppleCapacity`/`currentAppleProductId` are stable props
    // for the lifetime of this mount (the parent Server Component never
    // toggles them), so this still only fires once per mount, same as before.
  }, [mode, currentAppleCapacity, currentAppleProductId]);

  const selectedProduct =
    products.find((product) => {
      if (product.athleteCapacity !== selectedAthleteCount) return false;
      // FV-600: resolve via `resolveInterval` (config first, id-suffix
      // fallback) — a catalog without `interval` set (FV-593 emitter) must
      // still resolve the exact selected product, not fall through to "any
      // product at this capacity" (which would silently ignore the
      // athlete's Monthly/Yearly choice).
      const productInterval = resolveInterval(product.interval, product.productId);
      if (selectedInterval != null && productInterval != null) {
        return productInterval === selectedInterval;
      }
      return true;
    }) ?? null;
  const selectedProductId = selectedProduct?.productId ?? null;
  const productUnavailable =
    pricesLoaded &&
    selectedAthleteCount != null &&
    (!selectedProduct || !selectedProduct.livePrice);

  function handlePurchase() {
    if (!selectedProductId) return;
    setActionState({ kind: "purchasing" });
    startTransition(async () => {
      // FV-586 (KC decision D3): passing the product id enables the server's
      // one-exception upgrade allowance for an already-entitled Apple payer
      // (isStrictAppleCapacityUpgrade). It's a no-op for "purchase" mode's
      // not_entitled payer — the server only consults it when the payer is
      // already entitled.
      const tokenResult = await beginApplePurchase(selectedProductId);
      if (!tokenResult.ok) {
        setActionState({ kind: "purchase-error", message: PURCHASE_ERROR_COPY });
        return;
      }

      const purchaseResult = await purchaseWithBridge({
        productId: selectedProductId,
        appAccountToken: tokenResult.appAccountToken,
      });

      if (!purchaseResult.ok) {
        if (purchaseResult.error === "cancelled") {
          // Quiet reset — cancellation is not an error state (spec).
          setActionState(IDLE);
          return;
        }
        if (purchaseResult.error === "pending") {
          setActionState({ kind: "purchase-pending" });
          return;
        }
        setActionState({ kind: "purchase-error", message: PURCHASE_ERROR_COPY });
        return;
      }

      const submitResult = await submitApplePurchase({
        signedTransactionInfo: purchaseResult.signedTransactionInfo,
        signedRenewalInfo: purchaseResult.signedRenewalInfo,
      });

      if (!submitResult.ok) {
        setActionState({ kind: "purchase-error", message: PURCHASE_ERROR_COPY });
        return;
      }

      setActionState({
        kind: "success",
        message: mode === "upgrade" ? UPGRADE_SUCCESS_COPY : PURCHASE_SUCCESS_COPY,
      });
      router.refresh();
    });
  }

  function handleRestore() {
    setActionState({ kind: "restoring" });
    startTransition(async () => {
      const restoreResult = await restoreWithBridge();

      if (!restoreResult.ok) {
        if (restoreResult.error === "cancelled") {
          // Quiet reset — dismissing the sign-in prompt mid-restore is not
          // an error state (mirrors purchase cancellation above).
          setActionState(IDLE);
          return;
        }
        setActionState({ kind: "restore-error", message: RESTORE_ERROR_COPY });
        return;
      }

      // Native returns transactions newest-first (bridge contract) —
      // transactions[0] is "the current one."
      const newest = restoreResult.transactions[0];
      if (!newest) {
        setActionState({ kind: "restore-empty" });
        return;
      }

      const submitResult = await submitApplePurchase({
        signedTransactionInfo: newest.signedTransactionInfo,
        signedRenewalInfo: newest.signedRenewalInfo,
      });

      if (!submitResult.ok) {
        setActionState({ kind: "restore-error", message: RESTORE_ERROR_COPY });
        return;
      }

      setActionState({ kind: "success", message: RESTORE_SUCCESS_COPY });
      router.refresh();
    });
  }

  function handleManage() {
    startTransition(async () => {
      await manageSubscriptionsWithBridge();
    });
  }

  // -------------------------------------------------------------------------
  // Render — unavailable state (shipped default; also the SSR-matching state)
  // -------------------------------------------------------------------------

  if (phase === "unavailable") {
    return (
      <div
        role="status"
        data-testid="apple-subscribe-unavailable"
        className="bg-charcoal border border-hairline rounded-xl px-5 py-5"
      >
        <p className="font-body text-cream/70 text-[15px] leading-relaxed">
          {UNAVAILABLE_COPY}
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render — manage / upgrade mode (FV-581 + FV-586 + FV-600): an already
  // Apple-entitled payer. No fresh-purchase affordance — a fresh purchase
  // must never be offered to a payer app/subscribe/page.tsx already
  // determined is entitled. Any upgrade offer is folded into a collapsed,
  // clearly-secondary "Change plan" disclosure rather than a second buy
  // surface.
  // -------------------------------------------------------------------------

  if (mode === "manage" || mode === "upgrade") {
    const currentIntervalLabel = intervalDisplayLabel(currentInterval);
    const hasCurrentPlanInfo =
      currentAppleCapacity != null || currentProductLive?.displayPrice != null;

    return (
      <div>
        <h2 className="font-display font-bold uppercase tracking-[0.04em] text-cream text-[20px] mb-5">
          {MANAGE_HEADING}
        </h2>

        {hasCurrentPlanInfo ? (
          <div
            data-testid="apple-current-plan"
            className="mb-6 bg-charcoal border border-hairline rounded-2xl px-5 py-5"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
              {CURRENT_PLAN_LABEL}
            </p>
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-display font-bold text-cream text-[17px]">
                {currentAppleCapacity != null ? capacityLabel(currentAppleCapacity) : "Your subscription"}
                {currentIntervalLabel ? ` · ${currentIntervalLabel}` : ""}
              </p>
              {currentProductLive?.displayPrice ? (
                <span className="flex-shrink-0 font-display font-extrabold text-cream text-[18px] leading-none">
                  {currentProductLive.displayPrice}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <p
            role="status"
            data-testid="apple-manage-status"
            className="mb-6 font-body text-cream/70 text-[15px] leading-relaxed"
          >
            {MANAGE_STATUS_COPY}
          </p>
        )}

        {actionState.kind === "restore-error" ? (
          <p
            role="alert"
            data-testid="apple-subscribe-error"
            className="mb-5 font-body text-[14px] text-danger leading-snug"
          >
            {actionState.message}
          </p>
        ) : null}

        {actionState.kind === "restore-empty" ? (
          <p
            role="status"
            data-testid="apple-restore-empty"
            className="mb-5 font-body text-[14px] text-cream/60 leading-snug"
          >
            {RESTORE_EMPTY_COPY}
          </p>
        ) : null}

        {actionState.kind === "success" ? (
          <p
            role="status"
            data-testid="apple-subscribe-success"
            className="mb-5 font-body text-[14px] text-gold leading-snug"
          >
            {actionState.message}
          </p>
        ) : null}

        <button
          type="button"
          data-testid="apple-manage-link"
          disabled={isPending}
          onClick={handleManage}
          className="w-full bg-gold text-onyx border border-gold font-heading font-semibold text-[16px] rounded-pill px-6 min-h-[56px] transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx mb-4"
        >
          Manage Subscription
        </button>

        <button
          type="button"
          data-testid="apple-restore-submit"
          disabled={isPending}
          onClick={handleRestore}
          className="w-full bg-charcoal text-cream border border-hairline font-heading font-semibold text-[14px] rounded-pill px-6 py-3 transition-colors duration-fast ease-out hover:border-hairline-strong disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {actionState.kind === "restoring" ? "Restoring…" : "Restore Purchases"}
        </button>

        {mode === "upgrade" ? (
          <div className="mt-6">
            <button
              type="button"
              data-testid="apple-change-plan-toggle"
              aria-expanded={changePlanOpen}
              aria-controls="apple-change-plan-panel"
              onClick={() => setChangePlanOpen((open) => !open)}
              className="w-full flex items-center justify-between font-heading font-semibold text-[14px] text-cream/70 hover:text-cream py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx rounded-lg"
            >
              <span>{CHANGE_PLAN_LABEL}</span>
              <span
                aria-hidden
                className={[
                  "transition-transform duration-fast ease-out",
                  changePlanOpen ? "rotate-180" : "",
                ].join(" ")}
              >
                ⌄
              </span>
            </button>

            {changePlanOpen ? (
              <div id="apple-change-plan-panel" className="pt-2">
                <PlanSelector
                  products={products}
                  selectedAthleteCount={selectedAthleteCount}
                  selectedInterval={selectedInterval}
                  onSelectAthleteCount={setSelectedAthleteCount}
                  onSelectInterval={setSelectedInterval}
                />

                <PlanSummary
                  product={selectedProduct}
                  athleteCount={selectedAthleteCount}
                  pricesLoaded={pricesLoaded}
                  unavailable={productUnavailable}
                />

                {actionState.kind === "purchase-error" ? (
                  <p
                    role="alert"
                    data-testid="apple-subscribe-error"
                    className="mb-5 font-body text-[14px] text-danger leading-snug"
                  >
                    {actionState.message}
                  </p>
                ) : null}

                {actionState.kind === "purchase-pending" ? (
                  <p
                    role="status"
                    data-testid="apple-subscribe-pending"
                    className="mb-5 font-body text-[14px] text-cream/70 leading-snug"
                  >
                    {PURCHASE_PENDING_COPY}
                  </p>
                ) : null}

                {/* FV-586 (KC decision D3) — upgrade-only disclosure: worded
                    to Apple's verified behavior, never claiming WE charge or
                    promising proration details. Shown above the confirming
                    tap so a parent reads it before committing, not after. */}
                <p
                  data-testid="apple-upgrade-disclosure"
                  className="mb-4 font-body text-cream/55 text-[13px] leading-relaxed"
                >
                  {UPGRADE_DISCLOSURE_COPY}
                </p>

                <button
                  type="button"
                  data-testid="apple-upgrade-submit"
                  disabled={isPending || !selectedProductId || productUnavailable}
                  onClick={handlePurchase}
                  className="w-full bg-gold text-onyx border border-gold font-heading font-semibold text-[16px] rounded-pill px-6 min-h-[56px] transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
                >
                  {actionState.kind === "purchasing" ? "Confirming with Apple…" : "Add Athletes"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render — first purchase (FV-600): selector + summary + Subscribe +
  // Restore. No Manage Subscription affordance — there is nothing to manage
  // before a first purchase.
  // -------------------------------------------------------------------------

  return (
    <div>
      <PlanSelector
        products={products}
        selectedAthleteCount={selectedAthleteCount}
        selectedInterval={selectedInterval}
        onSelectAthleteCount={setSelectedAthleteCount}
        onSelectInterval={setSelectedInterval}
      />

      <PlanSummary
        product={selectedProduct}
        athleteCount={selectedAthleteCount}
        pricesLoaded={pricesLoaded}
        unavailable={productUnavailable}
      />

      {actionState.kind === "purchase-error" || actionState.kind === "restore-error" ? (
        <p
          role="alert"
          data-testid="apple-subscribe-error"
          className="mb-5 font-body text-[14px] text-danger leading-snug"
        >
          {actionState.message}
        </p>
      ) : null}

      {actionState.kind === "purchase-pending" ? (
        <p
          role="status"
          data-testid="apple-subscribe-pending"
          className="mb-5 font-body text-[14px] text-cream/70 leading-snug"
        >
          {PURCHASE_PENDING_COPY}
        </p>
      ) : null}

      {actionState.kind === "restore-empty" ? (
        <p
          role="status"
          data-testid="apple-restore-empty"
          className="mb-5 font-body text-[14px] text-cream/60 leading-snug"
        >
          {RESTORE_EMPTY_COPY}
        </p>
      ) : null}

      {actionState.kind === "success" ? (
        <p
          role="status"
          data-testid="apple-subscribe-success"
          className="mb-5 font-body text-[14px] text-gold leading-snug"
        >
          {actionState.message}
        </p>
      ) : null}

      <p
        data-testid="apple-purchase-note"
        className="mb-4 font-body text-cream/55 text-[13px] leading-relaxed"
      >
        {APPLE_TERMS_NOTE}
      </p>

      <button
        type="button"
        data-testid="apple-purchase-submit"
        disabled={isPending || !selectedProductId || productUnavailable}
        onClick={handlePurchase}
        className="w-full bg-gold text-onyx border border-gold font-heading font-semibold text-[16px] rounded-pill px-6 min-h-[56px] transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx mb-4"
      >
        {actionState.kind === "purchasing" ? "Completing purchase…" : "Subscribe"}
      </button>

      <button
        type="button"
        data-testid="apple-restore-submit"
        disabled={isPending}
        onClick={handleRestore}
        className="w-full bg-charcoal text-cream border border-hairline font-heading font-semibold text-[14px] rounded-pill px-6 py-3 transition-colors duration-fast ease-out hover:border-hairline-strong disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {actionState.kind === "restoring" ? "Restoring…" : "Restore Purchases"}
      </button>
    </div>
  );
}
