"use client";
// client: useFormState for the claim action, controlled fields so input
// survives a failed submit, tappable username suggestions (FV-634).

import { useEffect, useRef, useState } from "react";
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
 *
 * FV-634: on a real username collision (and only then) the server returns 3
 * neutral suggestions. Tapping one fills the username field only. It never
 * submits and never touches the password fields. All fields are controlled
 * so nothing typed is lost when a submit comes back with an error; the
 * invite itself is untouched (the claim rolled back).
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

  // Controlled so a failed submit never clears what the athlete typed.
  const [chosenUsername, setChosenUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const suggestions =
    !recovery && state && !state.ok && state.field === "username"
      ? (state.suggestions ?? [])
      : [];

  // Each response is a new object: remount the username field so its
  // role="alert" error is announced again on a repeated collision, and move
  // focus there so keyboard and screen-reader users land on the problem.
  const attempt = useRef(0);
  const lastState = useRef(state);
  if (lastState.current !== state) {
    lastState.current = state;
    attempt.current += 1;
  }
  useEffect(() => {
    if (state && !state.ok && state.field === "username") {
      document.getElementById("username")?.focus();
    }
  }, [state]);

  function pickSuggestion(value: string) {
    setChosenUsername(value);
    setAnnouncement(`Username set to ${value}.`);
    document.getElementById("username")?.focus();
  }

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
          <div className="mb-5">
            <Field
              key={`username-${attempt.current}`}
              id="username"
              name="username"
              label="Choose a unique username"
              type="text"
              autoComplete="username"
              required
              value={chosenUsername}
              onChange={(e) => setChosenUsername(e.target.value)}
              error={fieldError("username")}
              aria-describedby={
                fieldError("username")
                  ? "username-error username-rules"
                  : "username-rules"
              }
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            <p
              id="username-rules"
              className="-mt-3 font-body text-[13px] text-cream/50 leading-relaxed"
            >
              3–20 letters, numbers, or underscores. Not case-sensitive. Use a
              nickname, not your full name or birthday.
            </p>
            {suggestions.length > 0 ? (
              <div
                role="group"
                aria-labelledby="username-suggestions-label"
                data-testid="username-suggestions"
                className="mt-4"
              >
                <p
                  id="username-suggestions-label"
                  className="font-body text-[13px] text-cream/70 mb-2"
                >
                  Try one of these:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => pickSuggestion(s)}
                      aria-pressed={chosenUsername === s}
                      className="inline-flex items-center min-h-[44px] max-w-full px-4 rounded-pill bg-charcoal border border-hairline hover:border-cream/30 aria-pressed:border-gold font-mono text-[14px] text-cream break-all transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="sr-only" role="status" aria-live="polite">
              {announcement}
            </p>
          </div>
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError("password")}
        />
        <Field
          id="password_confirm"
          name="password_confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
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
