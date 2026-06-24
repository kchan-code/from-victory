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
        label="Username"
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
      <p className="mt-6 font-body text-[13px] text-cream/55 leading-relaxed text-center">
        Forgot your password? Ask your parent to send you a new pairing link
        from their dashboard.
      </p>
    </form>
  );
}
