"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import {
  requestPasswordReset,
  type AuthActionState,
} from "@/lib/actions/auth";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthActionState = null;

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);
  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  if (state?.ok) {
    return (
      <div role="status" aria-live="polite">
        <p className="font-body text-cream/85 text-[15px] leading-relaxed mb-4">
          If an account exists for that email, we&rsquo;ve sent reset
          instructions. Check your inbox — and your spam folder, just in case.
        </p>
        <p className="font-body text-cream/60 text-[14px] leading-relaxed mb-6">
          The reset link works for one hour.
        </p>
        <Link
          href="/signin"
          className="text-gold hover:text-gold-bright no-underline font-heading font-semibold text-[14px]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

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
      {formError ? (
        <p
          className="mb-5 font-body text-[14px] text-red-400"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
      <p className="mt-6 font-body text-[14px] text-cream/60 text-center">
        Remembered it?{" "}
        <Link
          href="/signin"
          className="text-gold hover:text-gold-bright no-underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
