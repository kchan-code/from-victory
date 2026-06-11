"use client";

/**
 * BillingPortalButton
 *
 * Submits the `openBillingPortal` server action via a form. On success the
 * action redirects (NEXT_REDIRECT) to the Stripe Billing Portal; on error it
 * returns a typed state and this component renders a calm, non-crashing message.
 *
 * The Stripe customer ID never reaches this component — it is read and used
 * entirely server-side inside the action.
 */

import { useFormState, useFormStatus } from "react-dom";

import { openBillingPortal } from "@/lib/actions/billing-portal";
import type { BillingPortalActionState } from "@/lib/actions/billing-portal";

const INITIAL_STATE: BillingPortalActionState = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="billing-portal-btn"
      className="inline-flex items-center justify-center font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 min-h-[44px] transition-colors duration-base ease-out hover:bg-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Opening…" : "Manage subscription"}
    </button>
  );
}

export function BillingPortalButton() {
  const [state, formAction] = useFormState(openBillingPortal, INITIAL_STATE);

  const errorMessage =
    state?.ok === false
      ? state.code === "portal_unavailable"
        ? "Billing management is temporarily unavailable — contact support."
        : "No active subscription found. Refresh the page to update your plan details."
      : null;

  return (
    <div>
      <form action={formAction}>
        <SubmitButton />
      </form>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-3 font-body text-[13px] text-cream/60 leading-relaxed"
          data-testid="billing-portal-error"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
