"use client";
// client: reads the injected `window.Capacitor` bridge (lib/native/apple-iap.ts),
// interactive plan selection (useState), useTransition for the purchase /
// restore / manage async flows, router.refresh() so the parent Server
// Component re-resolves entitlement after a successful purchase/restore.

/**
 * AppleSubscribeSection (FV-572)
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
 * the product-card view only after mount confirms both a configured product
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
 * `mode` prop (FV-581, decision record §4.4 "duplicate-billing guard"):
 *   - "purchase" (default) — today's behavior, byte-identical. Every
 *     existing call site (`app/subscribe/page.tsx`'s not_entitled branch)
 *     omits the prop and is unaffected.
 *   - "manage" — rendered ONLY for a payer app/subscribe/page.tsx has
 *     already determined is entitled via Apple. No plan cards, no Subscribe
 *     button (a fresh purchase must never be offered to an already-full
 *     payer) — just a status line plus the existing Manage/Restore actions.
 *   - "upgrade" (FV-586, KC decision D3) — rendered ONLY for a payer
 *     app/subscribe/page.tsx has determined is Apple-entitled AND for whom a
 *     strictly-higher-capacity product is configured (see
 *     `currentAppleCapacity` below). Offers ONLY the configured products
 *     whose presentational `athleteCapacity` exceeds `currentAppleCapacity`
 *     as "add athletes" cards, with a disclosure that confirming ends any
 *     trial and switches billing to the new plan. The real capacity-increase
 *     gate is server-side (`isStrictAppleCapacityUpgrade`, consulted by
 *     `beginApplePurchase`) — this mode's product filtering is presentational
 *     only, same as every other use of `athleteCapacity` in this file.
 */

import { useEffect, useState, useTransition } from "react";
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
const MANAGE_STATUS_COPY = "You’re subscribed. Manage or restore below.";
const PURCHASE_ERROR_COPY = "We couldn’t complete that purchase. Please try again.";
const PURCHASE_PENDING_COPY =
  "Your purchase is waiting on approval. Check back soon.";
const PURCHASE_SUCCESS_COPY = "You’re subscribed. Welcome to From Victory.";
const RESTORE_ERROR_COPY =
  "We couldn’t check for a previous purchase. Please try again.";
const RESTORE_EMPTY_COPY = "No previous purchase was found for this Apple ID.";
const RESTORE_SUCCESS_COPY = "Your subscription is restored.";
// FV-586 (KC decision D3): worded to Apple's verified behavior only — never
// claims WE charge, never promises proration details we can't verify.
const UPGRADE_DISCLOSURE_COPY =
  "Confirming with Apple switches you to this plan right away and ends any free trial. Apple bills the new plan on its own schedule and shows the price before you confirm.";
const UPGRADE_SUCCESS_COPY = "You’re upgraded. Welcome to your family plan.";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type Phase = "unavailable" | "ready";

export interface AppleSubscribeSectionProps {
  /** Defaults to "purchase" so every existing call site is unaffected. */
  mode?: "purchase" | "manage" | "upgrade";
  /**
   * Only meaningful when `mode === "upgrade"`: the payer's CURRENT Apple
   * product's athlete-capacity ceiling, resolved server-side
   * (`getActiveAppleProductId` + `capacityForAppleProduct` in
   * app/subscribe/page.tsx). Configured products whose presentational
   * `athleteCapacity` is not strictly greater than this value are filtered
   * out of the upgrade catalog. Presentational filtering only — the real
   * capacity-increase gate is server-side, re-checked at purchase time by
   * `beginApplePurchase` via `isStrictAppleCapacityUpgrade`.
   */
  currentAppleCapacity?: number;
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
// Component
// ---------------------------------------------------------------------------

export function AppleSubscribeSection({
  mode = "purchase",
  currentAppleCapacity,
}: AppleSubscribeSectionProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // SSR-safe default: "unavailable" is exactly what a server render (no
  // `window`) would compute, so the first client render matches it too.
  const [phase, setPhase] = useState<Phase>("unavailable");
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>(IDLE);

  useEffect(() => {
    if (mode === "manage") {
      // Manage/Restore need only the native bridge, NOT the product catalog
      // — an already-entitled payer must never be stranded from managing or
      // restoring their subscription by an unrelated product-config gap
      // (NEXT_PUBLIC_APPLE_PRODUCTS). See AppleSubscribeSectionProps doc.
      if (!isAppleIapBridgeAvailable()) return;
      setPhase("ready");
      return;
    }

    const configured = getConfiguredAppleProducts();
    // FV-586 "upgrade" mode: offer ONLY products whose presentational
    // athleteCapacity strictly exceeds the payer's current one. Purchase
    // mode is unaffected (currentAppleCapacity is undefined there, so this
    // filter is a no-op — every configured product passes).
    const catalog =
      mode === "upgrade"
        ? configured.filter(
            (product) => product.athleteCapacity > (currentAppleCapacity ?? Infinity),
          )
        : configured;

    if (catalog.length === 0 || !isAppleIapBridgeAvailable()) {
      // Shipped state today: NEXT_PUBLIC_APPLE_PRODUCTS is unset, so this is
      // the branch every production render takes. See apple-products.ts.
      return;
    }

    setSelectedProductId(catalog[0]?.productId ?? null);
    setPhase("ready");

    let cancelled = false;
    void getStoreKitProducts(catalog.map((product) => product.productId)).then(
      (live) => {
        if (cancelled) return;
        const priceById = new Map(live.map((product) => [product.productId, product]));
        setProducts(
          catalog.map((product) => ({
            ...product,
            livePrice: priceById.get(product.productId)?.displayPrice,
            displayName: priceById.get(product.productId)?.displayName ?? product.displayName,
          })),
        );
      },
    );

    return () => {
      cancelled = true;
    };
    // `mode`/`currentAppleCapacity` are stable props for the lifetime of this
    // mount (the parent Server Component never toggles them), so this still
    // only fires once per mount, same as before.
  }, [mode, currentAppleCapacity]);

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
  // Render — manage mode (FV-581): an already Apple-entitled payer. No plan
  // cards, no Subscribe button — a fresh purchase must never be offered to a
  // payer app/subscribe/page.tsx already determined is entitled. Reuses the
  // same handleManage/handleRestore + restore-path action-state rendering as
  // purchase mode; the purchase-only states (purchasing/purchase-pending/
  // purchase-error) can never occur here since handlePurchase is never
  // wired to a button in this mode.
  // -------------------------------------------------------------------------

  if (mode === "manage") {
    return (
      <div>
        <p
          role="status"
          data-testid="apple-manage-status"
          className="mb-6 font-body text-cream/70 text-[15px] leading-relaxed"
        >
          {MANAGE_STATUS_COPY}
        </p>

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
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render — product cards + purchase / restore / manage
  // -------------------------------------------------------------------------

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={mode === "upgrade" ? "Add athletes" : "Subscription plan"}
        aria-required="true"
        // Arrow-key navigation within the radiogroup (ARIA radiogroup
        // pattern) — mirrors SubscribeForm's handleGroupKeyDown so a
        // keyboard-only parent can reach every plan once P2 config ships
        // more than one product (qa review, PR #518).
        onKeyDown={(e) => {
          const ids = products.map((p) => p.productId);
          if (ids.length === 0) return;
          const currentIndex = selectedProductId
            ? ids.indexOf(selectedProductId)
            : 0;
          if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault();
            const next = ids[(currentIndex + 1) % ids.length];
            if (next != null) setSelectedProductId(next);
          }
          if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault();
            const prev = ids[(currentIndex - 1 + ids.length) % ids.length];
            if (prev != null) setSelectedProductId(prev);
          }
        }}
        className="flex flex-col gap-5 mb-7"
      >
        {products.map((product) => {
          const selected = selectedProductId === product.productId;
          return (
            <div
              key={product.productId}
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-testid={`apple-plan-card-${product.productId}`}
              onClick={() => setSelectedProductId(product.productId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedProductId(product.productId);
                }
              }}
              className={[
                "cursor-pointer rounded-2xl border px-5 py-5 transition-all duration-base ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
                selected
                  ? "bg-charcoal border-gold shadow-glow-gold"
                  : "bg-charcoal border-hairline hover:border-hairline-strong",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display font-bold uppercase tracking-[0.06em] text-cream text-[17px] leading-tight">
                    {product.displayName ?? "From Victory"}
                  </p>
                  {/* Presentational capacity label only — entitlement
                      capacity is enforced server-side (apple-capacity.ts). */}
                  <p
                    data-testid={`apple-plan-capacity-${product.productId}`}
                    className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-cream/50"
                  >
                    {product.athleteCapacity === 1
                      ? "1 athlete"
                      : `Up to ${product.athleteCapacity} athletes`}
                  </p>
                </div>
                {product.livePrice ? (
                  <span className="flex-shrink-0 font-display font-extrabold text-cream text-[20px] leading-none">
                    {product.livePrice}
                  </span>
                ) : null}
              </div>
              <div
                className={[
                  "mt-4 ml-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-fast ease-out",
                  selected
                    ? "border-gold bg-gold"
                    : "border-hairline-strong bg-transparent",
                ].join(" ")}
                aria-hidden
              >
                {selected ? <div className="w-2 h-2 rounded-full bg-onyx" /> : null}
              </div>
            </div>
          );
        })}
      </div>

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

      {/* FV-586 (KC decision D3) — upgrade-only disclosure: worded to
          Apple's verified behavior, never claiming WE charge or promising
          proration details. Shown above the confirming tap so a parent
          reads it before committing, not after. */}
      {mode === "upgrade" ? (
        <p
          data-testid="apple-upgrade-disclosure"
          className="mb-4 font-body text-cream/55 text-[13px] leading-relaxed"
        >
          {UPGRADE_DISCLOSURE_COPY}
        </p>
      ) : null}

      <button
        type="button"
        data-testid={mode === "upgrade" ? "apple-upgrade-submit" : "apple-purchase-submit"}
        disabled={isPending || !selectedProductId}
        onClick={handlePurchase}
        className="w-full bg-gold text-onyx border border-gold font-heading font-semibold text-[16px] rounded-pill px-6 min-h-[56px] transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx mb-4"
      >
        {actionState.kind === "purchasing"
          ? mode === "upgrade"
            ? "Confirming with Apple…"
            : "Completing purchase…"
          : mode === "upgrade"
            ? "Add Athletes"
            : "Subscribe"}
      </button>

      <button
        type="button"
        data-testid="apple-restore-submit"
        disabled={isPending}
        onClick={handleRestore}
        className="w-full bg-charcoal text-cream border border-hairline font-heading font-semibold text-[14px] rounded-pill px-6 py-3 transition-colors duration-fast ease-out hover:border-hairline-strong disabled:opacity-60 disabled:cursor-not-allowed mb-3"
      >
        {actionState.kind === "restoring" ? "Restoring…" : "Restore Purchases"}
      </button>

      <button
        type="button"
        data-testid="apple-manage-link"
        disabled={isPending}
        onClick={handleManage}
        className="w-full font-body text-[13px] text-cream/55 underline underline-offset-2 hover:text-cream/80 disabled:opacity-60 disabled:cursor-not-allowed text-center"
      >
        Manage Subscription
      </button>
    </div>
  );
}
