"use client";

/**
 * SendResetLinkButton
 *
 * Sends a password-reset email to the signed-in parent's own account email
 * via the dedicated `sendOwnPasswordReset` server action. The email address
 * is derived server-side from the authenticated session — nothing is passed
 * from this component, so the form body carries no tamperable target.
 *
 * On success, renders a confirmation message. On error, renders the returned
 * error string. Rate limiting of reset sends is tracked in FV-185 and is NOT
 * built here.
 */

import { useFormState, useFormStatus } from "react-dom";

import { sendOwnPasswordReset } from "@/lib/actions/account-settings";
import type { AuthActionState } from "@/lib/actions/auth";

const INITIAL_STATE: AuthActionState = null;

function SubmitButton({ succeeded }: { succeeded: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || succeeded}
      data-testid="send-reset-link-btn"
      className="inline-flex items-center justify-center font-heading font-semibold text-[13px] text-cream/80 hover:text-cream bg-onyx border border-hairline hover:border-cream/30 rounded-pill px-4 py-2 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Sending…" : succeeded ? "Link sent" : "Send reset link"}
    </button>
  );
}

export function SendResetLinkButton() {
  const [state, formAction] = useFormState(sendOwnPasswordReset, INITIAL_STATE);

  const succeeded = state?.ok === true;
  const errorMessage =
    state?.ok === false ? (state.error ?? "Something went wrong.") : null;

  return (
    <div className="flex-shrink-0">
      <form action={formAction}>
        <SubmitButton succeeded={succeeded} />
      </form>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-2 font-body text-[12px] text-cream/60 leading-relaxed text-right"
          data-testid="send-reset-link-error"
        >
          {errorMessage}
        </p>
      ) : null}

      {succeeded ? (
        <p
          role="status"
          className="mt-2 font-body text-[12px] text-cream/60 leading-relaxed text-right"
          data-testid="send-reset-link-success"
        >
          Check your email for a reset link.
        </p>
      ) : null}
    </div>
  );
}
