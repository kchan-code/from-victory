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
 * GATED — DO NOT BUILD HERE (unresolved KC policy, record §4.6 "P5"/§4.5
 * trial-to-family, decision record Section 10 "P7"): seat-designation /
 * downgrade-selection UI, trial-to-family conversion UI or charge-disclosure
 * copy, and any Apple trial/intro-offer eligibility display
 * (`isEligibleForIntroOffer`). This component is purchase / restore / manage
 * ONLY.
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
const PURCHASE_ERROR_COPY = "We couldn’t complete that purchase. Please try again.";
const PURCHASE_PENDING_COPY =
  "Your purchase is waiting on approval. Check back soon.";
const PURCHASE_SUCCESS_COPY = "You’re subscribed. Welcome to From Victory.";
const RESTORE_ERROR_COPY =
  "We couldn’t check for a previous purchase. Please try again.";
const RESTORE_EMPTY_COPY = "No previous purchase was found for this Apple ID.";
const RESTORE_SUCCESS_COPY = "Your subscription is restored.";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type Phase = "unavailable" | "ready";

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

export function AppleSubscribeSection() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // SSR-safe default: "unavailable" is exactly what a server render (no
  // `window`) would compute, so the first client render matches it too.
  const [phase, setPhase] = useState<Phase>("unavailable");
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>(IDLE);

  useEffect(() => {
    const configured = getConfiguredAppleProducts();
    if (configured.length === 0 || !isAppleIapBridgeAvailable()) {
      // Shipped state today: NEXT_PUBLIC_APPLE_PRODUCTS is unset, so this is
      // the branch every production render takes. See apple-products.ts.
      return;
    }

    setSelectedProductId(configured[0]?.productId ?? null);
    setPhase("ready");

    let cancelled = false;
    void getStoreKitProducts(configured.map((product) => product.productId)).then(
      (live) => {
        if (cancelled) return;
        const priceById = new Map(live.map((product) => [product.productId, product]));
        setProducts(
          configured.map((product) => ({
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
    // Intentionally empty deps — config + bridge presence are stable for the
    // lifetime of this mount; re-checking on every render would re-fire the
    // StoreKit network call for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePurchase() {
    if (!selectedProductId) return;
    setActionState({ kind: "purchasing" });
    startTransition(async () => {
      const tokenResult = await beginApplePurchase();
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

      setActionState({ kind: "success", message: PURCHASE_SUCCESS_COPY });
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
  // Render — product cards + purchase / restore / manage
  // -------------------------------------------------------------------------

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Subscription plan"
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

      <button
        type="button"
        data-testid="apple-purchase-submit"
        disabled={isPending || !selectedProductId}
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
