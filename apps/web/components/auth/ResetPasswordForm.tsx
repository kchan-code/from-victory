"use client";

import { useFormState } from "react-dom";

import { updatePassword, type AuthActionState } from "@/lib/actions/auth";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthActionState = null;

export function ResetPasswordForm() {
  const [state, formAction] = useFormState(updatePassword, initialState);
  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  return (
    <form action={formAction} noValidate>
      <Field
        id="password"
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters."
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
      <SubmitButton pendingLabel="Saving…">Save new password</SubmitButton>
    </form>
  );
}
