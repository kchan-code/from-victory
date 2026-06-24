"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { Field } from "@/components/auth/Field";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  createAthleteDirect,
  type CreateAthleteDirectState,
} from "@/lib/actions/admin";

const initialState: CreateAthleteDirectState = null;

export function CreateAthleteDirectForm() {
  const [state, formAction] = useFormState(createAthleteDirect, initialState);

  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError = state && !state.ok && !state.field ? state.error : undefined;

  if (state?.ok) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[14px] border border-[rgba(223,175,55,0.4)] bg-[rgba(223,175,55,0.06)] p-5"
      >
        <p className="font-display font-bold uppercase tracking-[0.04em] text-gold text-[14px] mb-3">
          Athlete created
        </p>
        <p className="font-body text-cream/85 text-[14px] leading-relaxed mb-4">
          {state.first_name} is linked to your parent account. Hand the athlete
          these credentials — they can sign in at{" "}
          <span className="font-mono text-cream">/signin</span> using the
          Athlete tab with their username + password.
        </p>
        <div className="rounded-[10px] bg-onyx border border-hairline px-3.5 py-3 mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/50 mb-1">
            Username
          </p>
          <p className="font-mono text-cream text-[14px]">
            {state.username}
          </p>
        </div>
        <p className="font-body text-[13px] text-cream/55 leading-relaxed mb-5">
          The password is what you entered above — share it with the athlete
          directly.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center font-heading font-semibold text-[14px] text-cream bg-charcoal border border-hairline-strong hover:border-cream/50 rounded-pill px-5 py-2.5 no-underline transition-colors duration-base ease-out"
          >
            Back to dashboard
          </Link>
          <Link
            href="/dashboard/admin/create-athlete"
            className="inline-flex items-center font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 py-2.5 no-underline transition-colors duration-base ease-out hover:bg-gold-bright"
          >
            Create another
          </Link>
        </div>
      </div>
    );
  }

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
        id="birthdate"
        name="birthdate"
        label="Birthdate (YYYY-MM-DD)"
        type="date"
        autoComplete="bday"
        required
        error={fieldError("birthdate")}
      />
      <Field
        id="username"
        name="username"
        label="Username"
        type="text"
        autoComplete="off"
        required
        hint="3–20 chars: letters, numbers, underscores."
        error={fieldError("username")}
      />
      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters. You'll share this with the athlete."
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

      <SubmitButton pendingLabel="Creating…">
        Create athlete account
      </SubmitButton>

      <p className="mt-6 font-body text-[13px] text-cream/55 leading-relaxed text-center">
        Hidden admin route. The created athlete is linked to your parent
        account and can be deleted from the dashboard like any other.
      </p>
    </form>
  );
}
