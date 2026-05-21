"use client";

import { useFormState } from "react-dom";

import { claimPairing, type ClaimState } from "@/lib/actions/pairings";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: ClaimState = null;

type Props = {
  code: string;
};

export function AthleteClaimForm({ code }: Props) {
  const [state, formAction] = useFormState(claimPairing, initialState);
  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="code" value={code} />
      <Field
        id="password"
        name="password"
        label="Set your password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters. You'll use this every time you sign in."
        error={fieldError("password")}
      />
      <Field
        id="password_confirm"
        name="password_confirm"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        error={fieldError("password_confirm")}
      />
      {formError ? (
        <p
          className="mb-5 font-body text-[14px] text-red-400"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Setting up…">Start training</SubmitButton>
    </form>
  );
}
