"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { signUpAdultAthlete } from "@/lib/actions/auth-adult";
import type { AuthActionState } from "@/lib/actions/auth";
import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthActionState = null;

export function AdultSignUpForm() {
  const [state, formAction] = useFormState(signUpAdultAthlete, initialState);
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
      <Field
        id="birthdate"
        name="birthdate"
        label="Date of birth"
        type="date"
        autoComplete="bday"
        required
        hint="You must be 18 or older to create your own account."
        error={fieldError("birthdate")}
      />

      {/* Sport picker — Field is input-only, so the select mirrors its styling. */}
      <div className="mb-5">
        <label
          htmlFor="sport"
          className="block font-display font-semibold uppercase tracking-[0.10em] text-[12px] text-cream/80 mb-2"
        >
          Your sport
        </label>
        <select
          id="sport"
          name="sport"
          required
          defaultValue=""
          aria-invalid={fieldError("sport") ? true : undefined}
          aria-describedby={fieldError("sport") ? "sport-error" : undefined}
          className="w-full bg-onyx border border-hairline focus:border-gold rounded-md px-4 py-3 font-body text-[15px] text-cream outline-none transition-colors duration-fast ease-out focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          <option value="" disabled>
            Choose your sport
          </option>
          {SUPPORTED_SPORTS.map((sport) => (
            <option key={sport} value={sport}>
              {sportLabel(sport)}
            </option>
          ))}
        </select>
        {fieldError("sport") ? (
          <p
            id="sport-error"
            className="mt-2 font-body text-[13px] text-red-400"
            role="alert"
          >
            {fieldError("sport")}
          </p>
        ) : null}
      </div>

      {/* 18+ attestation — the explicit affirmation surface (separate from the
          computed birthdate check). */}
      <label className="flex items-start gap-2.5 mt-1 mb-2 text-cream/70 text-[13px] leading-snug">
        <input
          type="checkbox"
          name="age_attestation"
          required
          className="mt-1 accent-cobalt cursor-pointer"
          aria-invalid={fieldError("age_attestation") !== undefined}
        />
        <span>I confirm I am 18 years of age or older.</span>
      </label>
      {fieldError("age_attestation") ? (
        <p className="mb-3 font-body text-[14px] text-red-400" role="alert">
          {fieldError("age_attestation")}
        </p>
      ) : null}

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
        <p className="-mt-3 mb-5 font-body text-[14px] text-red-400" role="alert">
          {fieldError("consent")}
        </p>
      ) : null}
      {formError ? (
        <p className="mb-5 font-body text-[14px] text-red-400" role="alert">
          {formError}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Creating account…">
        Create athlete account
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
