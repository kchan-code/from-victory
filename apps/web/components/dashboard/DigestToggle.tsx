"use client";

/**
 * DigestToggle — interactive toggle for the weekly digest opt-out (FV-226).
 *
 * A client component that wraps a hidden <form> so it works cleanly with
 * React 18's useFormState / useFormStatus from react-dom (NOT useActionState
 * from react — that's React 19 only). Follows the same pattern as
 * DeleteAthleteButton and other interactive islands in /dashboard.
 *
 * Privacy: only sends "optOut=true/false" to the server action. No PII.
 */

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { setDigestOptOut, type DigestPrefState } from "@/lib/actions/digest-preferences";

type Props = {
  /** Current opt-out value from the server (initial render). */
  initialOptOut: boolean;
};

// ---------------------------------------------------------------------------
// The submit button itself — isolated so useFormStatus works
// ---------------------------------------------------------------------------
function ToggleButton({
  isOptedOut,
}: {
  isOptedOut: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="switch"
      aria-checked={!isOptedOut}
      aria-label="Weekly rhythm email"
      disabled={pending}
      className={[
        "relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-base ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        !isOptedOut ? "bg-gold" : "bg-cream/20",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-onyx transition-transform duration-base ease-out",
          !isOptedOut ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
        aria-hidden="true"
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function DigestToggle({ initialOptOut }: Props) {
  const [state, formAction] = useFormState<DigestPrefState | null, FormData>(
    setDigestOptOut,
    null,
  );

  // After the server action settles, prefer its canonical value.
  const isOptedOut = state?.ok === true ? state.optOut : initialOptOut;

  // The toggle flips the current value each submit.
  // We embed the next value as a hidden input so formAction receives it.
  const nextOptOut = !isOptedOut;

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="font-heading font-semibold text-[13px] text-cream uppercase tracking-[0.04em]">
          Weekly rhythm email
        </p>
        <p className="font-body text-cream/50 text-[13px] leading-relaxed mt-0.5">
          A brief summary of your athlete&rsquo;s training rhythm, sent each
          Monday morning.
        </p>
        {state?.ok === false ? (
          <p
            className="font-body text-[12px] text-red-400 mt-1"
            role="alert"
            aria-live="polite"
          >
            {state.error}
          </p>
        ) : null}
      </div>

      <form action={formAction}>
        <input type="hidden" name="optOut" value={String(nextOptOut)} />
        <ToggleButton isOptedOut={isOptedOut} />
      </form>
    </div>
  );
}
