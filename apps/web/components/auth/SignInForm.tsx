"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { signIn, type AuthActionState } from "@/lib/actions/auth";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthActionState = null;

type Props = {
  /**
   * True only inside the legacy-native Capacitor shell (every Android build).
   * Android is consumption-only (KC Path A, FV-619/FV-621): new customers
   * subscribe on the website, then sign in here, so the in-shell form shows
   * plain, non-tappable guidance instead of the /signup link. Presentation
   * hint only (see lib/native-shell.ts), never authorization. ios-iap and
   * web/PWA keep the link.
   */
  legacyNative?: boolean;
};

export function SignInForm({ legacyNative = false }: Props) {
  const [state, formAction] = useFormState(signIn, initialState);
  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  return (
    <form action={formAction} noValidate>
      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={fieldError("email")}
      />
      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={fieldError("password")}
      />
      <p className="-mt-3 mb-5 font-body text-[13px]">
        <Link
          href="/forgot-password"
          className="text-cream/60 hover:text-cream underline decoration-cream/30 hover:decoration-cream"
        >
          Forgot password?
        </Link>
      </p>
      {formError ? (
        <p
          className="mb-5 font-body text-[14px] text-red-400"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      {legacyNative ? (
        <p
          data-testid="signin-native-shell-new-customer"
          className="mt-6 font-body text-[14px] text-cream/60 text-center"
        >
          New to From Victory? Subscribe from a web browser at
          fromvictoryapp.com, then sign in here.
        </p>
      ) : (
        <p className="mt-6 font-body text-[14px] text-cream/60 text-center">
          New here?{" "}
          <Link
            href="/signup"
            className="text-gold hover:text-gold-bright no-underline"
          >
            Create a parent account
          </Link>
        </p>
      )}
    </form>
  );
}
