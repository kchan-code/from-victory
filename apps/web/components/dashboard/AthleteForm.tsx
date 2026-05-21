"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { Field } from "@/components/auth/Field";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  createAthlete,
  type CreateAthleteState,
} from "@/lib/actions/athletes";

const initialState: CreateAthleteState = null;

export function AthleteForm() {
  const [state, formAction] = useFormState(createAthlete, initialState);
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
        autoComplete="off"
        required
        maxLength={50}
        error={fieldError("first_name")}
      />
      <Field
        id="birthdate"
        name="birthdate"
        label="Birthdate"
        type="date"
        autoComplete="off"
        required
        hint="Athletes must be 13 or older."
        error={fieldError("birthdate")}
      />
      {formError ? (
        <p
          className="mb-5 font-body text-[14px] text-red-400"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Creating athlete…">
        Add athlete
      </SubmitButton>
      <p className="mt-6 font-body text-[14px] text-cream/60 text-center">
        <Link
          href="/dashboard"
          className="text-cream/70 hover:text-cream no-underline"
        >
          Back to dashboard
        </Link>
      </p>
    </form>
  );
}
