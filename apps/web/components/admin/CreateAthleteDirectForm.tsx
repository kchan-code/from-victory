"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { Field } from "@/components/auth/Field";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  createAthleteDirect,
  type CreateAthleteDirectState,
} from "@/lib/actions/admin";
import { SUPPORTED_SPORTS, DEFAULT_SPORT } from "@/lib/sports";

const initialState: CreateAthleteDirectState = null;

const sportLabel = (sport: string) =>
  sport.charAt(0).toUpperCase() + sport.slice(1);

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
          {state.first_name} is linked to your parent account and can sign in
          at <span className="font-mono text-cream">/signin</span> with the
          email below.
        </p>
        <div className="rounded-[10px] bg-onyx border border-hairline px-3.5 py-3 mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/50 mb-1">
            Email
          </p>
          <p className="font-mono text-cream text-[14px] break-all">
            {state.email}
          </p>
        </div>
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
        hint="At least 8 characters. You'll share this with the athlete."
        error={fieldError("password")}
      />

      <div className="mb-5">
        <label
          htmlFor="sport"
          className="block font-display font-semibold uppercase tracking-[0.10em] text-[12px] text-cream/80 mb-2"
        >
          Sport
        </label>
        <select
          id="sport"
          name="sport"
          defaultValue={DEFAULT_SPORT}
          className="w-full bg-onyx border border-hairline focus:border-gold rounded-md px-4 py-3 font-body text-[15px] text-cream outline-none transition-colors duration-fast ease-out focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          {SUPPORTED_SPORTS.map((sport) => (
            <option key={sport} value={sport}>
              {sportLabel(sport)}
            </option>
          ))}
        </select>
        <p className="mt-2 font-body text-[13px] text-cream/50">
          Drives which content and pregame the athlete sees.
        </p>
      </div>

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
