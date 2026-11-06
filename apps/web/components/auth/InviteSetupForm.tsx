"use client";
// client: useFormState for the claim action + one-time cache clear on mount.

import { useEffect } from "react";
import { useFormState } from "react-dom";

import {
  claimAthleteInvite,
  type ClaimInviteState,
} from "@/lib/actions/invites";
import { clearPregameSession } from "@/lib/pregame/session-cache";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const initialState: ClaimInviteState = null;

type Props = {
  /** Canonical readable code, or a raw legacy /pair code. */
  code: string;
  firstName: string;
  mode: "invite" | "recovery";
  /** Recovery only: the athlete's existing username, shown read-only. */
  username: string | null;
};

/**
 * Final step of the FV-630 invite / recovery flow.
 *
 *   invite   — choose a username + password. Success signs the athlete in and
 *              lands on /athlete. No second sign-in.
 *   recovery — set a new password. The username is shown and NEVER changed.
 */
export function InviteSetupForm({ code, firstName, mode, username }: Props) {
  const [state, formAction] = useFormState(claimAthleteInvite, initialState);

  // Setup re-assigns this device to this athlete and redirects straight to
  // /athlete without passing a ClearCacheOnMount surface. Clear any prior
  // athlete's saved pregame setup first (FV-223 privacy parity).
  useEffect(() => {
    clearPregameSession();
  }, []);

  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;

  const recovery = mode === "recovery";

  return (
    <>
      <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-2">
        {recovery ? "Resetting the password for " : "Setting up as "}
        <span className="text-cream font-semibold">{firstName}</span>.
      </p>
      <p className="font-body text-[13px] text-cream/55 leading-relaxed mb-7">
        {recovery
          ? "Your username stays the same. Pick a new password."
          : "Pick a username and password. You'll use them to sign in on any device."}
      </p>
      <form action={formAction} noValidate data-testid={`invite-setup-${mode}`}>
        <input type="hidden" name="code" value={code} />

        {recovery ? (
          <Field
            id="username"
            label="Username"
            type="text"
            autoComplete="username"
            value={username ?? ""}
            readOnly
            aria-readonly="true"
            hint="This doesn't change."
          />
        ) : (
          <Field
            id="username"
            name="username"
            label="Username"
            type="text"
            autoComplete="username"
            required
            hint="3–20 characters: letters, numbers, or underscores."
            error={fieldError("username")}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        )}
        <Field
          id="password"
          name="password"
          label={recovery ? "New password" : "Set your password"}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
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
          <p className="mb-5 font-body text-[14px] text-red-400" role="alert">
            {formError}
          </p>
        ) : null}
        <SubmitButton pendingLabel={recovery ? "Saving…" : "Setting up…"}>
          {recovery ? "Save and start training" : "Start training"}
        </SubmitButton>
      </form>
    </>
  );
}
