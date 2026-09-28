"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";

import { Field } from "@/components/auth/Field";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { BillingPortalButton } from "@/components/dashboard/BillingPortalButton";
import {
  createAthlete,
  type CreateAthleteState,
} from "@/lib/actions/athletes";

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
}

export function AthleteForm({
  trialConversion,
  appleCapacity = null,
}: AthleteFormProps) {
  const [state, formAction] = useFormState(createAthlete, initialState);
  const [confirmed, setConfirmed] = useState(false);

  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;

  const code = state && !state.ok ? state.code : undefined;

  // Generic (non-field, non-code) error — byte-for-byte the same branch this
  // component has always had.
  const formError =
    state && !state.ok && !state.field && !code ? state.error : undefined;

  const requiresConfirmation = trialConversion !== undefined;
  const submitDisabled = requiresConfirmation && !confirmed;

  return (
    <form action={formAction} noValidate>
      <Field
        id="first_name"
        name="first_name"
        label="First name"
        type="text"
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
