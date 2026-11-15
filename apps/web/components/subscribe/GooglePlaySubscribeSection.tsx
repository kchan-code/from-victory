"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  beginGooglePlayPurchase,
  submitGooglePurchase,
  type GooglePurchaseErrorCode,
} from "@/lib/actions/google-play-subscription";
import {
  getProducts,
  manageSubscriptions,
  purchase,
  restore,
  type PlayBillingError,
} from "@/lib/native/play-billing";

type Interval = "month" | "year";

export interface GoogleCatalogUiEntry {
  productId: string;
  basePlanId: string;
  athleteCapacity: number;
  interval: Interval;
  trialOfferId: string | null;
}

type PurchaseState =
  | "idle"
  | "pending"
  | "cancelled"
  | "already_owned_restore"
  | "already_owned_other_account"
  | "play_unavailable"
  | "offline"
  | "error"
  | "plan_limit";

type GoogleManageState = {
  statusLabel: "Active" | "Free trial";
  productId: string;
  basePlanId: string;
  athleteCapacity: number;
  interval: Interval;
  offerId: string | null;
  priceSuffix: "/ month" | "/ year";
  expiresAtLabel: string | null;
  trial: boolean;
};

type Props = {
  mode: "purchase" | "manage" | "entitled_elsewhere";
  catalog: GoogleCatalogUiEntry[];
  trialEligible?: boolean;
  manageState?: GoogleManageState;
  entitledElsewhereProvider?: "stripe" | "apple";
  dashboardHref?: string;
};

function periodLabel(interval: Interval): "per month" | "per year" {
  return interval === "month" ? "per month" : "per year";
}

function restoreLabel(interval: Interval): "/ month" | "/ year" {
  return interval === "month" ? "/ month" : "/ year";
}

function actionLabel(state: PurchaseState): string {
  switch (state) {
    case "pending":
      return "OK";
    case "cancelled":
      return "Try again";
    case "play_unavailable":
      return "OK";
    case "offline":
      return "Try again";
    case "error":
      return "Try again";
    case "plan_limit":
      return "Go to dashboard";
    default:
      return "OK";
  }
}

export function GooglePlaySubscribeSection({
  mode,
  catalog,
  trialEligible = false,
  manageState,
  entitledElsewhereProvider,
  dashboardHref = "/dashboard",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [athleteCount, setAthleteCount] = useState(1);
  const [interval, setInterval] = useState<Interval>("year");
  const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle");
  const [prices, setPrices] = useState<Map<string, string>>(new Map());
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const visibleCatalog = useMemo(() => {
    if (mode === "purchase") return catalog;
    if (!manageState) return [];
    return catalog.filter((entry) => entry.productId === manageState.productId);
  }, [catalog, mode, manageState]);

  const selected = useMemo(() => {
    return visibleCatalog.find(
      (entry) =>
        entry.athleteCapacity === athleteCount &&
        entry.interval === interval,
    );
  }, [visibleCatalog, athleteCount, interval]);

  const useTrial = Boolean(
    mode === "purchase" &&
      selected &&
      trialEligible &&
      athleteCount === 1 &&
      selected.trialOfferId,
  );

  const selectedPriceKey = selected
    ? `${selected.productId}:${selected.basePlanId}:${useTrial ? selected.trialOfferId ?? "" : ""}`
    : null;
  const selectedPrice =
    (selectedPriceKey ? prices.get(selectedPriceKey) : null) ??
    "{price from Google Play}";

  useEffect(() => {
    let active = true;
    const ids = Array.from(
      new Set(visibleCatalog.map((entry) => entry.productId)),
    );
    if (ids.length === 0) {
      setPricesLoaded(true);
      return;
    }
    void getProducts(ids).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setPricesLoaded(true);
        return;
      }
      const next = new Map<string, string>();
      for (const product of result.products) {
        for (const offer of product.offers) {
          const phase = offer.pricingPhases[0];
          if (!phase?.formattedPrice) continue;
          const offerId = offer.offerId ?? "";
          next.set(
            `${product.productId}:${offer.basePlanId}:${offerId}`,
            phase.formattedPrice,
          );
          if (!offerId) {
            next.set(`${product.productId}:${offer.basePlanId}:`, phase.formattedPrice);
          }
        }
      }
      setPrices(next);
      setPricesLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [visibleCatalog]);

  const clearState = () => {
    setPurchaseState("idle");
    setMessage(null);
  };

  function mapBridgeError(error: PlayBillingError): PurchaseState {
    if (error === "already_owned") return "already_owned_restore";
    if (error === "unavailable") return "play_unavailable";
    if (error === "network") return navigator.onLine ? "error" : "offline";
    if (!navigator.onLine) return "offline";
    return "error";
  }

  function mapSubmitError(error: GooglePurchaseErrorCode): PurchaseState {
    if (error === "account_mismatch" || error === "ownership_conflict") {
      return "already_owned_other_account";
    }
    if (error === "verification_unavailable") return "play_unavailable";
    if (!navigator.onLine) return "offline";
    return "error";
  }

  function handlePrimaryPurchase() {
    if (!selected) return;
    startTransition(async () => {
      const begin = await beginGooglePlayPurchase();
      if (!begin.ok) {
        setPurchaseState("error");
        return;
      }
      const purchased = await purchase({
        productId: selected.productId,
        basePlanId: selected.basePlanId,
        offerId: useTrial ? selected.trialOfferId : null,
        obfuscatedAccountId: begin.obfuscatedAccountId,
      });
      if (purchased.status === "cancelled") {
        setPurchaseState("cancelled");
        return;
      }
      if (purchased.status === "pending") {
        setPurchaseState("pending");
        return;
      }
      if (purchased.status === "error") {
        setPurchaseState(mapBridgeError(purchased.error));
        return;
      }
      if (purchased.status === "deferred") {
        setPurchaseState("error");
        return;
      }
      const submitted = await submitGooglePurchase({
        purchaseToken: purchased.purchaseToken,
      });
      if (!submitted.ok) {
        setPurchaseState(mapSubmitError(submitted.error));
        return;
      }
      if (!submitted.entitled) {
        setPurchaseState("pending");
        return;
      }
      setMessage("Purchase complete.");
      router.refresh();
    });
  }

  function handleRestore() {
    startTransition(async () => {
      const restored = await restore();
      if (!restored.ok) {
        setPurchaseState(mapBridgeError(restored.error));
        return;
      }
      if (restored.purchases.length === 0) {
        setPurchaseState("already_owned_restore");
        return;
      }
      for (const restoredPurchase of restored.purchases) {
        const submitted = await submitGooglePurchase({
          purchaseToken: restoredPurchase.purchaseToken,
        });
        if (submitted.ok && submitted.entitled) {
          setMessage("Your subscription is restored.");
          setPurchaseState("idle");
          router.refresh();
          return;
        }
        if (!submitted.ok) {
          setPurchaseState(mapSubmitError(submitted.error));
          return;
        }
      }
      setPurchaseState("error");
    });
  }

  function handleManage(productId?: string) {
    startTransition(async () => {
      await manageSubscriptions(productId);
    });
  }

  if (mode === "entitled_elsewhere") {
    return (
      <div
        data-testid="google-entitled-elsewhere"
        className="bg-charcoal border border-hairline rounded-xl px-5 py-5"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-3">
          Subscription
        </p>
        <p className="font-body text-cream text-[28px] leading-tight mb-5">
          Settings
        </p>
        <p className="font-body text-cream/85 text-[16px] leading-relaxed">
          {entitledElsewhereProvider === "stripe"
            ? "You're subscribed on the web. Manage your plan from a browser at fromvictoryapp.com."
            : "You're subscribed through the App Store. Manage it on your iPhone."}
        </p>
      </div>
    );
  }

  if (mode === "manage" && manageState) {
    const managePriceKey = `${manageState.productId}:${manageState.basePlanId}:`;
    const managePrice = prices.get(managePriceKey) ?? "{price from Google Play}";
    return (
      <div data-testid="google-manage-section">
        <div className="bg-charcoal border border-hairline rounded-xl px-5 py-5 mb-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-3">
            Subscription
          </p>
          <div className="grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 text-[15px]">
            <span className="text-cream/60">Status</span>
            <span className="text-cream text-right">{manageState.statusLabel}</span>
            <span className="text-cream/60">Plan</span>
            <span className="text-cream text-right">{`${manageState.athleteCapacity} athlete${manageState.athleteCapacity === 1 ? "" : "s"}, ${manageState.interval === "month" ? "monthly" : "yearly"}`}</span>
            {manageState.trial ? (
              <>
                <span className="text-cream/60">After trial</span>
                <span className="text-cream text-right">{`${managePrice} ${manageState.priceSuffix}`}</span>
                <span className="text-cream/60">Trial ends</span>
                <span className="text-cream text-right">{manageState.expiresAtLabel ?? "—"}</span>
              </>
            ) : (
              <>
                <span className="text-cream/60">Price</span>
                <span className="text-cream text-right">{`${managePrice} ${manageState.priceSuffix}`}</span>
                <span className="text-cream/60">Renews</span>
                <span className="text-cream text-right">{manageState.expiresAtLabel ?? "—"}</span>
              </>
            )}
          </div>
        </div>
        <p className="font-body text-cream/70 text-[15px] leading-relaxed mb-4">
          To change your plan or cancel, use Google Play.
        </p>
        <button
          type="button"
          data-testid="google-manage-open-play"
          onClick={() => handleManage(manageState.productId)}
          disabled={pending}
          className="w-full bg-gold text-onyx border border-gold rounded-pill min-h-[52px] font-heading font-semibold text-[16px] mb-3 disabled:opacity-60"
        >
          Manage in Google Play
        </button>
        <button
          type="button"
          data-testid="google-manage-restore"
          onClick={handleRestore}
          disabled={pending}
          className="w-full bg-transparent text-cream border border-hairline rounded-pill min-h-[52px] font-heading font-semibold text-[16px] disabled:opacity-60"
        >
          Restore purchases
        </button>
        {message ? (
          <p className="mt-3 text-cream/70 text-[13px]" role="status">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  if (purchaseState !== "idle") {
    const titleMap: Record<Exclude<PurchaseState, "idle">, string> = {
      pending: "Purchase pending",
      cancelled: "Purchase cancelled",
      already_owned_restore: "Already subscribed",
      already_owned_other_account: "Already subscribed",
      play_unavailable: "Google Play unavailable",
      offline: "You're offline",
      error: "Something went wrong",
      plan_limit: "Plan limit reached",
    };
    const bodyMap: Record<Exclude<PurchaseState, "idle">, string> = {
      pending:
        "Your purchase is waiting on Google Play. Training unlocks when Google Play confirms it. This can take a little while.",
      cancelled: "You weren't charged. You can subscribe whenever you're ready.",
      already_owned_restore:
        "This Google account already has a From Victory subscription. If that's your purchase, restore it here.",
      already_owned_other_account:
        "This Google Play subscription belongs to another From Victory account. Sign in to that account to use it.",
      play_unavailable:
        "Google Play isn't available on this device right now, so you can't subscribe or restore a purchase here.",
      offline: "Connect to the internet to subscribe or restore a purchase.",
      error: "Google Play couldn't complete this. Please try again.",
      plan_limit:
        "Your plan covers up to 5 athletes, the most available in the app. To change who is covered, remove an athlete on the dashboard, under Your athletes.",
    };
    return (
      <div
        data-testid={`google-state-${purchaseState}`}
        className="bg-charcoal border border-hairline rounded-xl px-5 py-5"
      >
        <h3 className="font-body text-cream text-[42px] leading-[1.1] mb-4">
          {titleMap[purchaseState]}
        </h3>
        <p className="font-body text-cream/80 text-[16px] leading-relaxed mb-6">
          {bodyMap[purchaseState]}
        </p>
        {purchaseState === "already_owned_restore" ? (
          <button
            type="button"
            onClick={handleRestore}
            disabled={pending}
            className="w-full bg-gold text-onyx border border-gold rounded-pill min-h-[52px] font-heading font-semibold text-[16px] mb-3 disabled:opacity-60"
          >
            Restore purchases
          </button>
        ) : null}
        <button
          type="button"
          data-testid="google-state-primary"
          onClick={() => {
            if (purchaseState === "plan_limit") {
              window.location.href = dashboardHref;
              return;
            }
            clearState();
          }}
          className="w-full bg-transparent text-cream border border-hairline rounded-pill min-h-[52px] font-heading font-semibold text-[16px]"
        >
          {actionLabel(purchaseState)}
        </button>
      </div>
    );
  }

  const intervalLabel = periodLabel(interval);

  return (
    <section data-testid="google-subscribe-section">
      <h2 className="font-body text-cream text-[56px] leading-tight mb-3">
        Subscribe
      </h2>
      <p className="font-body text-cream/80 text-[16px] leading-relaxed mb-6">
        Choose how many athletes you want to cover, then pick monthly or yearly.
      </p>

      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
        Athletes
      </p>
      <div className="flex gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => setAthleteCount(count)}
            className={[
              "w-11 h-11 rounded-full border text-[16px] font-heading",
              athleteCount === count
                ? "bg-gold text-onyx border-gold"
                : "bg-transparent text-cream border-hairline",
            ].join(" ")}
          >
            {count}
          </button>
        ))}
      </div>
      <p className="font-body text-cream text-[16px] mb-6">
        {athleteCount} athlete{athleteCount === 1 ? "" : "s"}
      </p>

      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
        Billing
      </p>
      <div className="flex bg-charcoal border border-hairline rounded-pill p-1 mb-6">
        <button
          type="button"
          onClick={() => setInterval("month")}
          className={[
            "flex-1 min-h-[44px] rounded-pill font-heading text-[16px]",
            interval === "month" ? "bg-gold text-onyx" : "text-cream/80",
          ].join(" ")}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setInterval("year")}
          className={[
            "flex-1 min-h-[44px] rounded-pill font-heading text-[16px]",
            interval === "year" ? "bg-gold text-onyx" : "text-cream/80",
          ].join(" ")}
        >
          Yearly
        </button>
      </div>

      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
        Price
      </p>
      <div className="rounded-xl border border-gold/60 px-4 py-3 mb-5">
        <p className="font-body text-[16px] text-cream">
          <span className="text-gold">{selectedPrice}</span> {intervalLabel}
        </p>
      </div>

      {useTrial ? (
        <div className="bg-charcoal border border-hairline rounded-xl px-4 py-4 mb-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
            7-day free trial
          </p>
          <p className="font-body text-[16px] text-cream/85 leading-relaxed">
            {"You won't be charged today. After 7 days, you will be charged "}
            {selectedPrice} {intervalLabel}, unless you cancel first.
          </p>
        </div>
      ) : (
        <div className="bg-charcoal border border-hairline rounded-xl px-4 py-4 mb-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
            Starts today
          </p>
          <p className="font-body text-[16px] text-cream/85 leading-relaxed">
            You will be charged {selectedPrice} {intervalLabel}, starting today.
          </p>
        </div>
      )}

      <p className="font-body text-cream/70 text-[15px] leading-relaxed mb-6">
        This subscription renews automatically until you cancel. Cancel anytime in Google Play.
      </p>

      <button
        type="button"
        data-testid="google-subscribe-submit"
        onClick={handlePrimaryPurchase}
        disabled={pending || !selected || !pricesLoaded}
        className="w-full bg-gold text-onyx border border-gold rounded-pill min-h-[56px] font-heading font-semibold text-[18px] disabled:opacity-60"
      >
        {pending
          ? "Opening Google Play…"
          : useTrial
            ? "Start 7-day free trial"
            : "Subscribe with Google Play"}
      </button>

      {message ? (
        <p role="status" className="mt-3 text-cream/70 text-[13px]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
