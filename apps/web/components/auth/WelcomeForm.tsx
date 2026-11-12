"use client"; // client: account-type selection toggles the field set; "use a different account" confirm step

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";

import type { AuthActionState } from "@/lib/actions/auth";
import { cancelOnboarding, completeOnboarding } from "@/lib/actions/onboarding";
import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

type Role = "parent" | "adult_athlete";

type Props = {
  email: string | null;
  /** Only an Apple sign-in can carry a hidden (relay) email. */
  showAppleRelayLine?: boolean;
  /** Preselected account type from the `?as=` hint. */
  defaultRole: Role;
  /** False = parent-only (ENABLE_ADULT_SIGNUP off): no account-type cards. */
  adultEnabled: boolean;
};

const initialState: AuthActionState = null;

const cardBase =
  "flex-1 cursor-pointer rounded-xl border px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-gold/60";

function Check({
  name,
  error,
  children,
}: {
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <label className="flex items-start gap-2.5 mt-1 mb-3 py-1 text-cream/70 text-[13px] leading-snug">
        <input
          type="checkbox"
          name={name}
          required
          className="mt-1 accent-cobalt cursor-pointer"
          aria-invalid={error ? true : undefined}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p className="-mt-2 mb-3 font-body text-[14px] text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function WelcomeForm({ email, showAppleRelayLine = false, defaultRole, adultEnabled }: Props) {
  const [role, setRole] = useState<Role>(adultEnabled ? defaultRole : "parent");
  const [state, formAction] = useFormState(completeOnboarding, initialState);
  const [cancelState, cancelAction] = useFormState(cancelOnboarding, initialState);
  const [confirming, setConfirming] = useState(false);

  const fieldError = (name: string) =>
    state && !state.ok && state.field === name ? state.error : undefined;
  const formError =
    state && !state.ok && !state.field ? state.error : undefined;
  const cancelError =
    cancelState && !cancelState.ok ? cancelState.error : undefined;

  return (
    <>
      {email ? (
        <p
          className="mb-6 font-body text-[14px] text-cream/70"
          data-testid="welcome-signed-in-as"
        >
          Signed in as <span className="text-cream">{email}</span>
        </p>
      ) : null}

      <form action={formAction} noValidate>
        <input type="hidden" name="role" value={role} />

        {adultEnabled ? (
          <fieldset className="mb-6 border-0 p-0 m-0">
            <legend className="mb-3 block font-display font-semibold uppercase tracking-[0.10em] text-[12px] text-cream/80">
              Who is this account for?
            </legend>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label
                className={`${cardBase} ${role === "parent" ? "border-gold bg-gold/10" : "border-hairline"}`}
              >
                <input
                  type="radio"
                  name="account_type"
                  value="parent"
                  checked={role === "parent"}
                  onChange={() => setRole("parent")}
                  className="sr-only"
                />
                <span className="block font-heading font-semibold text-[15px] text-cream">
                  I&rsquo;m a parent
                </span>
                <span className="block text-[13px] text-cream/60">
                  I&rsquo;ll set up my athlete.
                </span>
              </label>
              <label
                className={`${cardBase} ${role === "adult_athlete" ? "border-gold bg-gold/10" : "border-hairline"}`}
              >
                <input
                  type="radio"
                  name="account_type"
                  value="adult"
                  checked={role === "adult_athlete"}
                  onChange={() => setRole("adult_athlete")}
                  className="sr-only"
                />
                <span className="block font-heading font-semibold text-[15px] text-cream">
                  I&rsquo;m an athlete, 18 or older
                </span>
                <span className="block text-[13px] text-cream/60">
                  I&rsquo;ll train on my own account.
                </span>
              </label>
            </div>
          </fieldset>
        ) : null}

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

        {role === "adult_athlete" ? (
          <>
            <Field
              id="birthdate"
              name="birthdate"
              label="Birthdate"
              type="date"
              autoComplete="bday"
              required
              hint="You must be 18 or older to create your own account."
              error={fieldError("birthdate")}
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
                required
                defaultValue=""
                aria-invalid={fieldError("sport") ? true : undefined}
                className="w-full bg-onyx border border-hairline focus:border-gold rounded-md px-4 py-3 font-body text-[15px] text-cream outline-none"
              >
                <option value="" disabled>
                  Choose your sport
                </option>
                {SUPPORTED_SPORTS.map((s) => (
                  <option key={s} value={s}>
                    {sportLabel(s)}
                  </option>
                ))}
              </select>
              {fieldError("sport") ? (
                <p className="mt-2 font-body text-[13px] text-red-400" role="alert">
                  {fieldError("sport")}
                </p>
              ) : null}
            </div>
            <Check name="age_attestation" error={fieldError("age_attestation")}>
              I&apos;m 18 or older.
            </Check>
          </>
        ) : (
          <Check
            name="guardian_attestation"
            error={fieldError("guardian_attestation")}
          >
            I&apos;m a parent or guardian, 18 or older.
          </Check>
        )}

        <Check name="consent" error={fieldError("consent")}>
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
        </Check>

        {formError ? (
          <p className="mb-5 font-body text-[14px] text-red-400" role="alert">
            {formError}
          </p>
        ) : null}
        <SubmitButton pendingLabel="Setting up…">Continue</SubmitButton>
      </form>

      <div className="mt-8 border-t border-hairline pt-5">
        {showAppleRelayLine ? (
          <p className="font-body text-[13px] leading-relaxed text-cream/60">
            Signed in with a hidden Apple email and already have an account? Use
            a different account, then sign in your usual way.
          </p>
        ) : null}
        {confirming ? (
          <form action={cancelAction} className="mt-3">
            <p className="mb-3 font-body text-[13px] text-cream/80" role="alert">
              This signs you out and removes this sign-in. Your other accounts
              aren&rsquo;t affected.
            </p>
            <div className="flex gap-4">
              <button
                type="submit"
                className="min-h-[44px] font-heading font-semibold text-[13px] text-gold underline underline-offset-2 hover:text-gold-bright"
              >
                Yes, use a different account
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-[44px] font-heading text-[13px] text-cream/60 underline underline-offset-2 hover:text-cream"
              >
                Stay here
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-2 min-h-[44px] font-heading text-[13px] text-cream/60 underline underline-offset-2 hover:text-cream"
            data-testid="welcome-use-different-account"
          >
            Use a different account
          </button>
        )}
        {cancelError ? (
          <p className="mt-2 font-body text-[13px] text-red-400" role="alert">
            {cancelError}
          </p>
        ) : null}
      </div>
    </>
  );
}
