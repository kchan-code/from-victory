"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { signUp, type AuthActionState } from "@/lib/actions/auth";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthActionState = null;

export function SignUpForm() {
  const [state, formAction] = useFormState(signUp, initialState);
  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  return (
    <form action={formAction} noValidate>
      <Field
        id="first_name"
        name="first_name"
        label="First name"
        type="text"
        autoComplete="given-name"
        required
        maxLength={50}
        error={fieldError("first_name")}
      />
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
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters."
        error={fieldError("password")}
      />
      <label className="flex items-start gap-2.5 mt-1 mb-5 text-cream/70 text-[13px] leading-snug">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 accent-cobalt cursor-pointer"
          aria-invalid={fieldError("consent") !== undefined}
        />
        <span>
          I agree to the{" "}
          <Link
            href="/terms"
            className="text-cream underline underline-offset-2 hover:text-gold"
          >
            Terms of Use
          </Link>{" "}
          and acknowledge the{" "}
          <Link
            href="/privacy"
            className="text-cream underline underline-offset-2 hover:text-gold"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {fieldError("consent") ? (
        <p
          className="-mt-3 mb-5 font-body text-[14px] text-red-400"
          role="alert"
        >
          {fieldError("consent")}
        </p>
      ) : null}
      {formError ? (
        <p
          className="mb-5 font-body text-[14px] text-red-400"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Creating account…">
        Create parent account
      </SubmitButton>
      <p className="mt-6 font-body text-[14px] text-cream/60 text-center">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="text-gold hover:text-gold-bright no-underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
