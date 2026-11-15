"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";

import { Field } from "@/components/auth/Field";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { BillingPortalButton } from "@/components/dashboard/BillingPortalButton";
import {
  createAthlete,
  type CreateAthleteState,
} from "@/lib/actions/athletes";
import {
  beginGooglePlayPurchase,
  submitGooglePurchase,
} from "@/lib/actions/google-play-subscription";
import {
  getProducts,
  purchase,
  restore,
  type PlayBillingError,
  type PlayRestoredPurchase,
} from "@/lib/native/play-billing";

const initialState: CreateAthleteState = null;

/**
 * FV-586 (KC decision D3, 2026-09-17): the trial-to-family confirmation
 * numbers, computed server-side in app/dashboard/athletes/new/page.tsx from
 * lib/subscriptions/trial-conversion.ts. Present ONLY when adding this
 * athlete would silently convert the parent's active Stripe trial to the
 * paid family plan — i.e. exactly when `createAthlete` would otherwise
 * refuse with `trial_conversion_required`. `nextQuantity` is always known
 * (it comes from `getTrialConversionState`'s athlete count, not the quote),
 * even when the priced quote itself is unavailable (tiered/graduated
 * pricing — see trial-conversion.ts's module doc).
 */
export type TrialConversionInfo =
  | {
      quoteUnavailable: true;
      nextQuantity: number;
    }
  | {
      quoteUnavailable: false;
      nextQuantity: number;
      interval: "month" | "year";
      /** Plain-language renewal cadence ("every month" / "every year"),
       * straight from the quote — reused verbatim rather than
       * re-derived so this component never drifts from the quote's own
       * wording. */
      nextRenewalLabel: string;
      /** Pre-formatted total ("$15.00") — the page owns currency
       * formatting so this component never guesses a locale/currency
       * format. */
      totalDueTodayLabel: string;
      taxMayApply: boolean;
    };

interface AthleteFormProps {
  /** Present only when adding this athlete would convert an active Stripe
   * trial to the paid family plan (FV-586, KC decision D3). Absent → the
   * form renders exactly as it did before this feature. */
  trialConversion?: TrialConversionInfo;
  /** The payer's Apple-tier athlete-count ceiling, when known (FV-570/586).
   * Used only to word a `capacity_reached` refusal specifically; `null`
   * (unknown product, or not an Apple payer) falls back to generic phrasing. */
  appleCapacity?: number | null;
  googleUpgrade?: GoogleUpgradeInfo;
}

export type GoogleUpgradeInfo = {
  currentCapacity: number;
  nextCapacity: number | null;
  currentProductId: string;
  currentBasePlanId: string;
  nextProductId: string | null;
  nextBasePlanId: string | null;
  trialEndingToday: boolean;
  pricePeriodLabel: "per month" | "per year";
};

type UpgradeState =
  | "idle"
  | "pending"
  | "already_owned_restore"
  | "already_owned_other_account"
  | "play_unavailable"
  | "offline"
  | "error";

function pluralAthletes(count: number): string {
  return `${count} athlete${count === 1 ? "" : "s"}`;
}

function stateActionLabel(state: Exclude<UpgradeState, "idle">): string {
  if (state === "pending") return "OK";
  if (state === "offline" || state === "error") return "Try again";
  return "OK";
}

function mapPlayErrorToUpgradeState(error: PlayBillingError): UpgradeState {
  if (error === "already_owned") return "already_owned_restore";
  if (error === "unavailable" || error === "bridge_unavailable") return "play_unavailable";
  if (error === "network") return navigator.onLine ? "error" : "offline";
  if (!navigator.onLine) return "offline";
  return "error";
}

function resolveRecurringPrice(
  products: Array<{ productId: string; offers: Array<{ basePlanId: string; pricingPhases: Array<{ formattedPrice: string }> }> }>,
  productId: string,
  basePlanId: string,
): string | null {
  const product = products.find((row) => row.productId === productId);
  if (!product) return null;
  const offer = product.offers.find((row) => row.basePlanId === basePlanId);
  if (!offer || offer.pricingPhases.length === 0) return null;
  const phase = offer.pricingPhases[offer.pricingPhases.length - 1];
  return phase?.formattedPrice ?? null;
}

function findReplacementPurchaseToken(
  restoredPurchases: PlayRestoredPurchase[],
  currentProductId: string,
): { token: string | null; pending: boolean } {
  for (const purchaseRow of restoredPurchases) {
    if (!purchaseRow.productIds.includes(currentProductId)) continue;
    if (purchaseRow.purchaseState === "pending") return { token: null, pending: true };
    if (purchaseRow.purchaseState === "purchased") {
      return { token: purchaseRow.purchaseToken, pending: false };
    }
  }
  return { token: null, pending: false };
}

export function AthleteForm({
  trialConversion,
  appleCapacity = null,
  googleUpgrade,
}: AthleteFormProps) {
  const [state, formAction] = useFormState(createAthlete, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [upgradePending, startUpgradeTransition] = useTransition();
  const [upgradeState, setUpgradeState] = useState<UpgradeState>("idle");
  const [upgradePriceLabel, setUpgradePriceLabel] = useState<string | null>(null);

  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;

  const code = state && !state.ok ? state.code : undefined;

  // Generic (non-field, non-code) error — byte-for-byte the same branch this
  // component has always had.
  const formError =
    state && !state.ok && !state.field && !code ? state.error : undefined;

  const requiresConfirmation = trialConversion !== undefined;
  const submitDisabled = requiresConfirmation && !confirmed;

  useEffect(() => {
    if (!googleUpgrade?.nextProductId || !googleUpgrade.nextBasePlanId) {
      setUpgradePriceLabel(null);
      return;
    }
    let active = true;
    void getProducts([googleUpgrade.nextProductId]).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setUpgradeState("play_unavailable");
        setUpgradePriceLabel(null);
        return;
      }
      const recurringPrice = resolveRecurringPrice(
        result.products,
        googleUpgrade.nextProductId!,
        googleUpgrade.nextBasePlanId!,
      );
      if (!recurringPrice) {
        setUpgradeState("error");
        setUpgradePriceLabel(null);
        return;
      }
      setUpgradePriceLabel(recurringPrice);
    });
    return () => {
      active = false;
    };
  }, [googleUpgrade?.nextBasePlanId, googleUpgrade?.nextProductId]);

  function handleGoogleUpgrade() {
    if (
      !googleUpgrade ||
      !googleUpgrade.nextProductId ||
      !googleUpgrade.nextBasePlanId
    ) {
      return;
    }
    setUpgradeState("idle");
    const { nextProductId, nextBasePlanId } = googleUpgrade;
    startUpgradeTransition(async () => {
      const restored = await restore();
      if (!restored.ok) {
        setUpgradeState(mapPlayErrorToUpgradeState(restored.error));
        return;
      }
      const replacement = findReplacementPurchaseToken(
        restored.purchases,
        googleUpgrade.currentProductId,
      );
      if (replacement.pending) {
        setUpgradeState("pending");
        return;
      }
      if (!replacement.token) {
        setUpgradeState("error");
        return;
      }
      const begin = await beginGooglePlayPurchase();
      if (!begin.ok) {
        setUpgradeState("error");
        return;
      }
      const upgraded = await purchase({
        productId: nextProductId,
        basePlanId: nextBasePlanId,
        obfuscatedAccountId: begin.obfuscatedAccountId,
        replace: {
          oldPurchaseToken: replacement.token,
          mode: "CHARGE_PRORATED_PRICE",
        },
      });
      if (upgraded.status === "cancelled") return;
      if (upgraded.status === "pending") {
        setUpgradeState("pending");
        return;
      }
      if (upgraded.status === "error") {
        setUpgradeState(mapPlayErrorToUpgradeState(upgraded.error));
        return;
      }
      if (upgraded.status !== "purchased") {
        setUpgradeState("error");
        return;
      }
      const submitted = await submitGooglePurchase({
        purchaseToken: upgraded.purchaseToken,
      });
      if (!submitted.ok) {
        if (
          submitted.error === "account_mismatch" ||
          submitted.error === "ownership_conflict"
        ) {
          setUpgradeState("already_owned_other_account");
          return;
        }
        if (submitted.error === "verification_unavailable") {
          setUpgradeState("play_unavailable");
          return;
        }
        if (!navigator.onLine) {
          setUpgradeState("offline");
          return;
        }
        setUpgradeState("error");
        return;
      }
      if (!submitted.entitled) {
        setUpgradeState("pending");
        return;
      }
      formRef.current?.requestSubmit();
    });
  }

  function handleGoogleUpgradeRestore() {
    if (!googleUpgrade) return;
    startUpgradeTransition(async () => {
      const restored = await restore();
      if (!restored.ok) {
        setUpgradeState(mapPlayErrorToUpgradeState(restored.error));
        return;
      }
      const replacement = findReplacementPurchaseToken(
        restored.purchases,
        googleUpgrade.currentProductId,
      );
      if (replacement.pending) {
        setUpgradeState("pending");
        return;
      }
      if (!replacement.token) {
        setUpgradeState("error");
        return;
      }
      const submitted = await submitGooglePurchase({
        purchaseToken: replacement.token,
      });
      if (!submitted.ok) {
        if (
          submitted.error === "account_mismatch" ||
          submitted.error === "ownership_conflict"
        ) {
          setUpgradeState("already_owned_other_account");
          return;
        }
        if (submitted.error === "verification_unavailable") {
          setUpgradeState("play_unavailable");
          return;
        }
        if (!navigator.onLine) {
          setUpgradeState("offline");
          return;
        }
        setUpgradeState("error");
        return;
      }
      if (!submitted.entitled) {
        setUpgradeState("pending");
        return;
      }
      formRef.current?.requestSubmit();
    });
  }

  return (
    <form ref={formRef} action={formAction} noValidate>
      <Field
        id="first_name"
        name="first_name"
        label="First name"
        type="text"
        onChange={(event) => setFirstName(event.currentTarget.value)}
        autoComplete="off"
        required
        maxLength={50}
        error={fieldError("first_name")}
      />
      <Field
        id="birthdate"
        name="birthdate"
        label="Birthdate"
        type="date"
        autoComplete="off"
        required
        hint="Athletes must be 13 or older."
        error={fieldError("birthdate")}
      />

      {trialConversion ? (
        <div
          data-testid="trial-conversion-confirm"
          className="mb-6 bg-onyx border border-hairline rounded-xl px-5 py-5"
        >
          <p className="font-body text-cream text-[14px] leading-relaxed mb-3">
            Your free trial ends today.
          </p>

          {trialConversion.quoteUnavailable ? (
            <p className="font-body text-cream/70 text-[14px] leading-relaxed mb-4">
              {`You’ll be charged the family rate for ${trialConversion.nextQuantity} athletes today. Review the rate before you confirm on the `}
              <Link
                href="/subscribe"
                className="text-gold underline underline-offset-2"
              >
                Subscribe
              </Link>
              {` page.`}
            </p>
          ) : (
            <>
              <p className="font-body text-cream/70 text-[14px] leading-relaxed mb-1">
                {`Plan: Family plan for ${trialConversion.nextQuantity} athletes (${trialConversion.interval}ly)`}
              </p>
              <p className="font-body text-cream/70 text-[14px] leading-relaxed mb-1">
                {`You’ll be charged ${trialConversion.totalDueTodayLabel} today${
                  trialConversion.taxMayApply ? " plus applicable tax" : ""
                }.`}
              </p>
              <p className="font-body text-cream/70 text-[14px] leading-relaxed mb-4">
                {`Your plan renews ${trialConversion.nextRenewalLabel} at that rate.`}
              </p>
            </>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="trialConversionConfirmedCheckbox"
              data-testid="trial-conversion-checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              required
              className="mt-1 w-5 h-5 shrink-0 accent-gold"
            />
            <span className="font-body text-cream text-[14px] leading-snug">
              End my free trial and start the paid family plan today.
            </span>
          </label>

          {confirmed ? (
            <input type="hidden" name="trialConversionConfirmed" value="true" />
          ) : null}
        </div>
      ) : null}

      <div aria-live="polite">
        {code === "trial_conversion_required" ? (
          <p
            role="alert"
            data-testid="athlete-form-error"
            className="mb-5 font-body text-[14px] text-danger leading-snug"
          >
            Check the box to confirm before adding an athlete.
          </p>
        ) : code === "trial_conversion_payment_failed" ? (
          <div data-testid="athlete-form-error" className="mb-5">
            <p
              role="alert"
              className="font-body text-[14px] text-danger leading-snug mb-3"
            >
              Your card was declined or needs extra verification. Update your
              card in Billing, then try again.
            </p>
            <BillingPortalButton />
          </div>
        ) : code === "capacity_reached" ? (
          googleUpgrade ? (
            googleUpgrade.nextProductId && googleUpgrade.nextBasePlanId ? (
              (() => {
                const nextCapacity = googleUpgrade.nextCapacity ?? (googleUpgrade.currentCapacity + 1);
                return (
              <div
                role="alert"
                data-testid="athlete-form-error"
                className="mb-5 bg-onyx border border-hairline rounded-xl px-5 py-5"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
                  Add athlete
                </p>
                <p className="font-body text-cream text-[32px] leading-tight mb-3">
                  Confirm this change
                </p>
                <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-4">
                  {`You're adding ${firstName.trim()}. That takes you from ${pluralAthletes(googleUpgrade.currentCapacity)} to ${pluralAthletes(nextCapacity)}.`}
                </p>
                <div className="bg-charcoal border border-hairline rounded-xl px-4 py-4 mb-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
                    {googleUpgrade.trialEndingToday
                      ? "Your trial ends today"
                      : "Starts now"}
                  </p>
                  <p className="font-body text-[15px] text-cream/85 leading-relaxed">
                    {googleUpgrade.trialEndingToday
                      ? `Your 7-day free trial ends today, and the ${nextCapacity}-athlete plan starts now.`
                      : `The ${nextCapacity}-athlete plan starts now. Google Play will charge the difference for the time left in this period.`}
                  </p>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
                  New price
                </p>
                <div className="rounded-xl border border-gold/60 px-4 py-3 mb-4">
                  <p className="font-body text-[16px] text-cream">
                    {upgradePriceLabel ? (
                      <>
                        <span className="text-gold">{upgradePriceLabel}</span>{" "}
                        {googleUpgrade.pricePeriodLabel}
                      </>
                    ) : null}
                  </p>
                </div>
                <p className="font-body text-cream/70 text-[14px] leading-relaxed mb-4">
                  {googleUpgrade.trialEndingToday
                    ? "This starts now. Google Play will charge you today. The plan renews automatically until you cancel in Google Play."
                    : "This starts now. The plan renews automatically until you cancel in Google Play."}
                </p>
                {upgradeState !== "idle" ? (
                  <div
                    data-testid={`google-upgrade-state-${upgradeState}`}
                    className="mb-3 rounded-xl border border-hairline px-4 py-4 bg-charcoal"
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
                      {upgradeState === "pending"
                        ? "Purchase pending"
                        : upgradeState === "already_owned_restore" ||
                            upgradeState === "already_owned_other_account"
                          ? "Already subscribed"
                          : upgradeState === "play_unavailable"
                            ? "Google Play unavailable"
                            : upgradeState === "offline"
                              ? "You're offline"
                              : "Something went wrong"}
                    </p>
                    <p className="font-body text-cream/80 text-[14px] leading-relaxed">
                      {upgradeState === "pending"
                        ? "Your purchase is waiting on Google Play. Training unlocks when Google Play confirms it. This can take a little while."
                        : upgradeState === "already_owned_restore"
                          ? "This Google account already has a From Victory subscription. If that's your purchase, restore it here."
                          : upgradeState === "already_owned_other_account"
                            ? "This Google Play subscription belongs to another From Victory account. Sign in to that account to use it."
                            : upgradeState === "play_unavailable"
                              ? "Google Play isn't available on this device right now, so you can't subscribe or restore a purchase here."
                              : upgradeState === "offline"
                                ? "Connect to the internet to subscribe or restore a purchase."
                                : "Google Play couldn't complete this. Please try again."}
                    </p>
                    {upgradeState === "already_owned_restore" ? (
                      <button
                        type="button"
                        className="mt-3 w-full bg-gold text-onyx border border-gold rounded-pill min-h-[44px] font-heading font-semibold text-[14px] disabled:opacity-60"
                        onClick={handleGoogleUpgradeRestore}
                        disabled={upgradePending}
                      >
                        Restore purchases
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="mt-3 w-full bg-transparent text-cream border border-hairline rounded-pill min-h-[44px] font-heading font-semibold text-[14px]"
                      onClick={() => setUpgradeState("idle")}
                    >
                      {stateActionLabel(upgradeState)}
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  data-testid="google-upgrade-submit"
                  onClick={handleGoogleUpgrade}
                  disabled={upgradePending || !upgradePriceLabel}
                  className="w-full bg-gold text-onyx border border-gold rounded-pill min-h-[50px] font-heading font-semibold text-[16px] mb-3 disabled:opacity-60"
                >
                  Continue to Google Play
                </button>
                <a
                  href="/dashboard"
                  className="block w-full border border-hairline rounded-pill min-h-[50px] text-center leading-[50px] font-heading font-semibold text-cream no-underline"
                >
                  Not now
                </a>
              </div>
                );
              })()
            ) : (
              <div
                role="alert"
                data-testid="athlete-form-error"
                className="mb-5 bg-onyx border border-hairline rounded-xl px-5 py-5"
              >
                <p className="font-body text-cream text-[32px] leading-tight mb-3">
                  Plan limit reached
                </p>
                <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-4">
                  Your plan covers up to 5 athletes, the most available in the app. To change who is covered, remove an athlete on the dashboard, under Your athletes.
                </p>
                <a
                  href="/dashboard"
                  className="block w-full bg-gold text-onyx border border-gold rounded-pill min-h-[50px] text-center leading-[50px] font-heading font-semibold text-[16px] no-underline"
                >
                  Go to dashboard
                </a>
              </div>
            )
          ) : (
            <p
              role="alert"
              data-testid="athlete-form-error"
              className="mb-5 font-body text-[14px] text-danger leading-snug"
            >
              {appleCapacity
                ? `Your plan covers ${appleCapacity} athlete${
                    appleCapacity === 1 ? "" : "s"
                  }. `
                : "You’ve reached your plan’s athlete limit. "}
              <Link
                href="/subscribe"
                className="text-gold underline underline-offset-2"
              >
                Add a spot to keep going
              </Link>
              {`.`}
            </p>
          )
        ) : formError ? (
          <p
            className="mb-5 font-body text-[14px] text-red-400"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
      </div>

      <SubmitButton
        pendingLabel={
          requiresConfirmation ? "Ending trial…" : "Creating athlete…"
        }
        disabled={submitDisabled}
      >
        {requiresConfirmation ? "End trial and add athlete" : "Add athlete"}
      </SubmitButton>
      <p className="mt-6 font-body text-[14px] text-cream/60 text-center">
        <Link
          href="/dashboard"
          className="text-cream/70 hover:text-cream no-underline"
        >
          Back to dashboard
        </Link>
      </p>
    </form>
  );
}
