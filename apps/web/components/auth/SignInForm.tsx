"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { signIn, type AuthActionState } from "@/lib/actions/auth";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthActionState = null;

export function SignInForm() {
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
      {formError ? (
        <p
          className="mb-5 font-body text-[14px] text-red-400"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      <p className="mt-6 font-body text-[14px] text-cream/60 text-center">
        New here?{" "}
        <Link
          href="/signup"
          className="text-gold hover:text-gold-bright no-underline"
        >
          Create a parent account
        </Link>
      </p>
    </form>
  );
}
