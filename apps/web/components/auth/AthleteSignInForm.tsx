"use client";

import { useFormState } from "react-dom";

import {
  athleteSignIn,
  forgetDevice,
  type AthleteSignInState,
} from "@/lib/actions/pairings";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: AthleteSignInState = null;

type Props = {
  firstName: string;
};

export function AthleteSignInForm({ firstName }: Props) {
  const [state, formAction] = useFormState(athleteSignIn, initialState);
  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  return (
    <>
      <p className="font-body text-cream/80 text-[15px] leading-relaxed -mt-3 mb-7">
        Signing in as <span className="text-cream font-semibold">{firstName}</span>.
      </p>
      <form action={formAction} noValidate>
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
      </form>
      <p className="mt-6 font-body text-[13px] text-cream/55 leading-relaxed text-center">
        Forgot your password? Ask your parent to send you a new pairing
        link from their dashboard.
      </p>
      <form
        action={forgetDevice}
        className="mt-4 font-body text-[14px] text-cream/60 text-center"
      >
        <button
          type="submit"
          className="text-cream/60 hover:text-cream underline decoration-cream/30 hover:decoration-cream bg-transparent border-0 p-0 cursor-pointer"
        >
          Not {firstName}? Sign in as someone else
        </button>
      </form>
    </>
  );
}
