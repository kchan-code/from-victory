"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";

import { claimPairing, type ClaimState } from "@/lib/actions/pairings";
import { clearPregameSession } from "@/lib/pregame/session-cache";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: ClaimState = null;

type Props = {
  code: string;
  /** Athlete's first name — shown as context so the form feels personal. */
  firstName?: string;
};

export function AthleteClaimForm({ code, firstName }: Props) {
  const [state, formAction] = useFormState(claimPairing, initialState);

  // A pairing claim re-assigns this device to a (possibly different)
  // athlete, and the claim redirect goes straight to /athlete — it never
  // passes a ClearCacheOnMount surface. Clear the prior athlete's saved
  // pregame setup here so their choices (adversity, self-talk) can't be
  // shown to or restored by the new athlete (FV-223 privacy parity).
  // fv_athlete_cache needs no equivalent: PregameClientShell overwrites it
  // on the next visit.
  useEffect(() => {
    clearPregameSession();
  }, []);

  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  return (
    <>
      {firstName ? (
        <p className="font-body text-cream/80 text-[15px] leading-relaxed -mt-3 mb-5">
          Setting up as{" "}
          <span className="text-cream font-semibold">{firstName}</span>.
        </p>
      ) : null}
      <p className="font-body text-[13px] text-cream/55 leading-relaxed mb-7">
        Pick a username and password &mdash; you&rsquo;ll use them to sign in on any device.
      </p>
      <form action={formAction} noValidate>
        <input type="hidden" name="code" value={code} />

        <Field
          id="username"
          name="username"
          label="Username"
          type="text"
          autoComplete="username"
          required
          hint="3–20 characters: letters, numbers, or underscores."
          error={fieldError("username")}
          // Prevent autocorrect from mangling the username on mobile
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <Field
          id="password"
          name="password"
          label="Set your password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
          error={fieldError("password")}
        />
        <Field
          id="password_confirm"
          name="password_confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          error={fieldError("password_confirm")}
        />
        {formError ? (
          <p className="mb-5 font-body text-[14px] text-red-400" role="alert">
            {formError}
          </p>
        ) : null}
        <SubmitButton pendingLabel="Setting up…">Start training</SubmitButton>
      </form>
    </>
  );
}
