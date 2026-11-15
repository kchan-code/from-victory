"use client";

import { useState, useTransition } from "react";
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
import { purchase } from "@/lib/native/play-billing";

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
  currentPurchaseToken: string;
  nextProductId: string | null;
  nextBasePlanId: string | null;
  trialEndingToday: boolean;
  pricePeriodLabel: "per month" | "per year";
};

export function AthleteForm({
  trialConversion,
  appleCapacity = null,
  googleUpgrade,
}: AthleteFormProps) {
  const [state, formAction] = useFormState(createAthlete, initialState);
  const [confirmed, setConfirmed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [upgradePending, startUpgradeTransition] = useTransition();
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradePendingNotice, setUpgradePendingNotice] = useState(false);

  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;

  const code = state && !state.ok ? state.code : undefined;

  // Generic (non-field, non-code) error — byte-for-byte the same branch this
  // component has always had.
  const formError =
    state && !state.ok && !state.field && !code ? state.error : undefined;

  const requiresConfirmation = trialConversion !== undefined;
  const submitDisabled = requiresConfirmation && !confirmed;

  function handleGoogleUpgrade() {
    if (
      !googleUpgrade ||
      !googleUpgrade.nextProductId ||
      !googleUpgrade.nextBasePlanId
    ) {
      return;
    }
    setUpgradeError(null);
    setUpgradePendingNotice(false);
    const { nextProductId, nextBasePlanId } = googleUpgrade;
    startUpgradeTransition(async () => {
      const begin = await beginGooglePlayPurchase();
      if (!begin.ok) {
        setUpgradeError("Google Play couldn't complete this. Please try again.");
        return;
      }
      const upgraded = await purchase({
        productId: nextProductId,
        basePlanId: nextBasePlanId,
        obfuscatedAccountId: begin.obfuscatedAccountId,
        replace: {
          oldPurchaseToken: googleUpgrade.currentPurchaseToken,
          mode: "CHARGE_PRORATED_PRICE",
        },
      });
      if (upgraded.status === "cancelled") return;
      if (upgraded.status === "pending") {
        setUpgradePendingNotice(true);
        return;
      }
      if (upgraded.status !== "purchased") {
        setUpgradeError("Google Play couldn't complete this. Please try again.");
        return;
      }
      const submitted = await submitGooglePurchase({
        purchaseToken: upgraded.purchaseToken,
      });
      if (!submitted.ok || !submitted.entitled) {
        setUpgradeError("Google Play couldn't complete this. Please try again.");
        return;
      }
      window.location.href = "/dashboard";
    });
  }

  return (
    <form action={formAction} noValidate>
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
                  {"You're adding "}
                  {firstName.trim().length > 0 ? firstName.trim() : "this athlete"}
                  {`. That takes you from ${googleUpgrade.currentCapacity} athlete to ${googleUpgrade.nextCapacity}.`}
                </p>
                <div className="bg-charcoal border border-hairline rounded-xl px-4 py-4 mb-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
                    {googleUpgrade.trialEndingToday
                      ? "Your trial ends today"
                      : "Starts now"}
                  </p>
                  <p className="font-body text-[15px] text-cream/85 leading-relaxed">
                    {googleUpgrade.trialEndingToday
                      ? "Your 7-day free trial ends today, and the 2-athlete plan starts now."
                      : "The 2-athlete plan starts now. Google Play will charge the difference for the time left in this period."}
                  </p>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-2">
                  New price
                </p>
                <div className="rounded-xl border border-gold/60 px-4 py-3 mb-4">
                  <p className="font-body text-[16px] text-cream">
                    <span className="text-gold">{`{price from Google Play}`}</span>{" "}
                    {googleUpgrade.pricePeriodLabel}
                  </p>
                </div>
                <p className="font-body text-cream/70 text-[14px] leading-relaxed mb-4">
                  This starts now. The plan renews automatically until you cancel in Google Play.
                </p>
                {upgradePendingNotice ? (
                  <p className="font-body text-cream/70 text-[14px] leading-relaxed mb-3">
                    Your purchase is waiting on Google Play. Training unlocks when Google Play confirms it. This can take a little while.
                  </p>
                ) : null}
                {upgradeError ? (
                  <p className="font-body text-danger text-[14px] leading-relaxed mb-3">
                    {upgradeError}
                  </p>
                ) : null}
                <button
                  type="button"
                  data-testid="google-upgrade-submit"
                  onClick={handleGoogleUpgrade}
                  disabled={upgradePending}
                  className="w-full bg-gold text-onyx border border-gold rounded-pill min-h-[50px] font-heading font-semibold text-[16px] mb-3 disabled:opacity-60"
                >
                  {upgradePending ? "Opening Google Play…" : "Continue to Google Play"}
                </button>
                <a
                  href="/dashboard"
                  className="block w-full border border-hairline rounded-pill min-h-[50px] text-center leading-[50px] font-heading font-semibold text-cream no-underline"
                >
                  Not now
                </a>
              </div>
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
