"use client";

import { useFormState } from "react-dom";

import {
  athleteSignIn,
  forgetDevice,
  type AthleteSignInState,
} from "@/lib/actions/pairings";
import { clearAthleteCache } from "@/lib/pregame/athlete-cache";
import { clearPregameSession } from "@/lib/pregame/session-cache";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: AthleteSignInState = null;

type Props = {
  firstName: string;
  /**
   * The athlete's synthetic Supabase auth email. Present in the DOM as a
   * readonly autocomplete="username" field so password managers (iCloud
   * Keychain, Chrome, 1Password, Bitwarden) can autofill the credential
   * saved on /pair. When undefined the field is omitted gracefully.
   */
  accountEmail?: string;
};

export function AthleteSignInForm({ firstName, accountEmail }: Props) {
  const [state, formAction] = useFormState(athleteSignIn, initialState);
  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  return (
    <>
      <p className="font-body text-cream/80 text-[15px] leading-relaxed -mt-3 mb-7">
        Signing in as{" "}
        <span className="text-cream font-semibold">{firstName}</span>.
      </p>
      <form action={formAction} noValidate className="relative">
        {/*
         * Visually-hidden username field for password managers.
         *
         * Same technique as AthleteClaimForm — 1×1px absolute, opacity 0,
         * not submitted (no `name`), readonly, tabIndex -1. Must match the
         * field on /pair so the manager associates "saved there" → "autofill
         * here". The email value is the athlete's synthetic Supabase auth
         * email (never shown to the athlete in readable UI elsewhere).
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
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          error={fieldError("password")}
        />
        {formError ? (
          <p className="mb-5 font-body text-[14px] text-red-400" role="alert">
            {formError}
          </p>
        ) : null}
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>
      <p className="mt-6 font-body text-[13px] text-cream/55 leading-relaxed text-center">
        Forgot your password? Ask your parent to send you a new pairing
        link from their dashboard.
      </p>
      <form
        action={forgetDevice}
        onSubmit={() => {
          // Synchronous belt-and-braces alongside the post-redirect
          // ClearCacheOnMount clear — same treatment for both caches.
          clearAthleteCache();
          clearPregameSession();
        }}
        className="mt-4 font-body text-[14px] text-cream/60 text-center"
      >
        <button
          type="submit"
          data-testid="forget-device-btn"
          className="text-cream/60 hover:text-cream underline decoration-cream/30 hover:decoration-cream bg-transparent border-0 p-0 cursor-pointer"
        >
          Not {firstName}? Sign in as someone else
        </button>
      </form>
    </>
  );
}
