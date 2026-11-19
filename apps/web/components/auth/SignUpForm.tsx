"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useFormState } from "react-dom";

import type { AuthActionState } from "@/lib/actions/auth";
import {
  completeEmailSignup,
  startEmailSignup,
} from "@/lib/actions/email-signup";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";
import { useTwoStepSignup } from "./useTwoStepSignup";
import { VerifyCodeStep } from "./VerifyCodeStep";

const RETAINED_KEYS = [
  "role",
  "email",
  "first_name",
  "guardian_attestation",
  "consent",
] as const;

const initialState: AuthActionState = null;

type Props = {
  /** Optional content rendered directly below the submit button (e.g. the
   * trial/billing expectation line) — pure presentation, page decides. */
  afterSubmit?: ReactNode;
  /** FV-674: Apple/Google block + "or use email" divider, rendered above the
   * form when showSSO() is true. Hidden with the form during code entry. */
  sso?: ReactNode;
};

export function SignUpForm({ afterSubmit, sso }: Props = {}) {
  const { wrapped, retained, dismissed, setDismissed } = useTwoStepSignup(
    startEmailSignup,
    RETAINED_KEYS,
  );
  const [state, formAction] = useFormState(wrapped, initialState);
  const showCode =
    state !== null &&
    "step" in state &&
    state.step === "verify_code" &&
    state !== dismissed;
  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  return (
    <>
      {showCode && state && "step" in state ? (
        <VerifyCodeStep
          email={state.email}
          purpose="signup"
          role="parent"
          action={completeEmailSignup}
          retained={retained}
          onChangeEmail={() => {
            setDismissed(state);
            // Return focus to the email field the user is about to change.
            requestAnimationFrame(() => document.getElementById("email")?.focus());
          }}
        />
      ) : null}
      {sso ? <div hidden={showCode}>{sso}</div> : null}
      <form action={formAction} noValidate hidden={showCode}>
        <input type="hidden" name="role" value="parent" />
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
      <label className="flex items-start gap-2.5 mt-1 mb-2 py-2 text-cream/70 text-[13px] leading-snug">
        <input
          type="checkbox"
          name="guardian_attestation"
          required
          className="mt-1 accent-cobalt cursor-pointer"
          aria-invalid={fieldError("guardian_attestation") ? true : undefined}
          aria-describedby={
            fieldError("guardian_attestation")
              ? "guardian-attestation-error"
              : undefined
          }
        />
        <span>I&apos;m a parent or guardian, 18 or older.</span>
      </label>
      {fieldError("guardian_attestation") ? (
        <p
          id="guardian-attestation-error"
          className="mb-3 font-body text-[14px] text-red-400"
          role="alert"
        >
          {fieldError("guardian_attestation")}
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
      {afterSubmit}
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
    </>
  );
}
