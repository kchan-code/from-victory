"use client";
// client: useFormState for form submission state + pending feedback

import { useFormState } from "react-dom";

import {
  athleteUsernameSignIn,
  type AthleteSignInState,
} from "@/lib/actions/pairings";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: AthleteSignInState = null;

/**
 * FV-320: Username + password sign-in for athletes on any device.
 *
 * This form is shown when an athlete arrives at /signin without a device
 * cookie (new device, new browser). It collects username + password and
 * delegates to athleteUsernameSignIn, which resolves the athlete by
 * username and signs them in. On success the action redirects to /athlete.
 *
 * Contrast with AthleteSignInForm, which is the device-cookie path
 * (password-only, shown when the device is already paired).
 */
export function AthleteUsernameSignInForm() {
  const [state, formAction] = useFormState(
    athleteUsernameSignIn,
    initialState,
  );

  // This form returns a single error — the action intentionally avoids
  // field-level errors (wrong username vs wrong password) to prevent
  // username enumeration. A generic role=alert covers both.
  const error = state && !state.ok ? state.error : undefined;

  return (
    <form action={formAction} noValidate>
      <Field
        id="athlete-username"
        name="username"
        label="Username or email"
        type="text"
        autoComplete="username"
        required
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
      />
      <Field
        id="athlete-signin-password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
      />
      {error ? (
        <p className="mb-5 font-body text-[14px] text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      {/* FV-657: two audiences on this tab — an athlete under 18 (username
          from the parent's invite; recovery through the parent) and, since
          FV-654, an 18+ athlete who signs in with their own email (recovery
          through the normal reset email). */}
      <div className="mt-6 space-y-3 font-body text-[13px] text-cream/55 leading-relaxed text-center">
        <p>
          Under 18? Use the username from your parent&rsquo;s invite. New
          here? Use the invite code your parent sent. Forgot your password?
          Ask your parent for a reset code from their dashboard. Your username
          stays the same.
        </p>
        <p>
          18 or older? Sign in with your email. Forgot your password?{" "}
          <a
            href="/forgot-password"
            data-testid="athlete-tab-adult-reset-link"
            className="inline-block py-2 text-cream/85 underline underline-offset-2 hover:text-cream"
          >
            Reset it here
          </a>
          .
        </p>
      </div>
    </form>
  );
}
