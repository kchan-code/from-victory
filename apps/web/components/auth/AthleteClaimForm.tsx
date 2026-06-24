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
  /**
   * The athlete's synthetic Supabase auth email. Present in the DOM as a
   * readonly autocomplete="username" field so password managers (iCloud
   * Keychain, Chrome, 1Password) can key and save the credential correctly.
   * When undefined the field is omitted — the form still works, password
   * managers just can't associate the credential.
   */
  accountEmail?: string;
};

export function AthleteClaimForm({ code, firstName, accountEmail }: Props) {
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
        No username needed — just a password for this phone.
      </p>
      <form action={formAction} noValidate className="relative">
        <input type="hidden" name="code" value={code} />

        {/*
         * Visually-hidden username field for password managers.
         *
         * WHY THIS APPROACH: Password managers (iOS Safari Keychain, Chrome,
         * 1Password, Bitwarden) require a field with autocomplete="username"
         * to be present and non-hidden in the DOM to key a saved credential.
         * `display:none` and `visibility:hidden` are explicitly skipped by
         * most managers. `type="hidden"` is skipped by the autocomplete spec.
         * The correct technique is a visually-hidden element that is still in
         * the accessibility/layout tree — 1×1px absolute, opacity 0,
         * pointer-events none, tabIndex -1 so it's skipped in keyboard order.
         * `readonly` prevents the athlete from accidentally editing it.
         * `type="email"` helps managers classify this as an account identifier.
         * The field is NOT named (no `name` attr) so it is NOT submitted with
         * the form — the server action never sees it and no extra field leaks.
         */}
        {accountEmail ? (
          <input
            type="email"
            autoComplete="username"
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            value={accountEmail}
            className="absolute w-px h-px opacity-0 pointer-events-none"
          />
        ) : null}

        <Field
          id="password"
          name="password"
          label="Set your password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters. You'll use this every time you sign in."
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
