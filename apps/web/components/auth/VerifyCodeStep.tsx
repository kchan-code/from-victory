"use client"; // client: focus management, resend cooldown timer, controlled code input

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";

import type { AuthActionState } from "@/lib/actions/auth";
import { resendSignupCode } from "@/lib/actions/email-signup";

import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

export const RESEND_COOLDOWN_SECONDS = 60;

type Props = {
  /** The address the code was sent to (as echoed by the server). */
  email: string;
  purpose: "signup" | "signin";
  role?: "parent" | "adult_athlete";
  /** completeEmailSignup (signup) or verifyEmailOnly (signin). */
  action: (
    prev: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  /**
   * Step-1 values re-submitted with the code (signup only). Held in client
   * state by the parent form; rendered as hidden inputs, never persisted.
   */
  retained?: Record<string, string>;
  /** "Use a different email" — returns to step 1. */
  onChangeEmail: () => void;
};

export function VerifyCodeStep({
  email,
  purpose,
  role,
  action,
  retained = {},
  onChangeEmail,
}: Props) {
  const [state, formAction] = useFormState(action, null as AuthActionState);
  const [token, setToken] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendStatus, setResendStatus] = useState("");
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Move focus to the code input when the step appears.
  useEffect(() => {
    wrapRef.current?.querySelector("input")?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const tokenError =
    state && !state.ok && state.field === "token" ? state.error : undefined;
  const formError =
    state && !state.ok && state.field !== "token" ? state.error : undefined;

  function resend() {
    if (cooldown > 0) return;
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setResendStatus("");
    const fd = new FormData();
    fd.set("email", email);
    fd.set("purpose", purpose);
    if (role) fd.set("role", role);
    startTransition(async () => {
      const res = await resendSignupCode(null, fd);
      setResendStatus(
        res && !res.ok
          ? res.error
          : "We sent a new code. It may take a minute.",
      );
    });
  }

  return (
    <form action={formAction} noValidate data-testid="verify-code-step">
      <h2 className="font-heading font-semibold text-[22px] text-cream mb-2">
        Check your email
      </h2>
      <p
        id="verify-code-intro"
        className="font-body text-[15px] text-cream/70 mb-6"
      >
        Enter the 6-digit code we sent to{" "}
        <span className="text-cream break-all">{email}</span>. It expires in 15
        minutes.
      </p>

      <input type="hidden" name="email" value={email} />
      {role ? <input type="hidden" name="role" value={role} /> : null}
      {Object.entries(retained)
        .filter(([k]) => k !== "email" && k !== "role")
        .map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}

      <div ref={wrapRef}>
        <Field
          id="token"
          name="token"
          label="6-digit code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={token}
          onChange={(e) =>
            setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          error={tokenError}
          className="tracking-[0.4em] text-[20px] text-center"
        />
      </div>

      {formError ? (
        <p className="mb-5 font-body text-[14px] text-red-400" role="alert">
          {formError}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Verifying…">
        {purpose === "signup" ? "Verify and continue" : "Verify and sign in"}
      </SubmitButton>

      <div className="mt-5 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="min-h-[44px] px-4 font-body text-[14px] text-gold hover:text-gold-bright disabled:text-cream/50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-md"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
        <p
          aria-live="polite"
          className="min-h-[18px] font-body text-[13px] text-cream/60 text-center"
        >
          {resendStatus}
        </p>
        <button
          type="button"
          onClick={onChangeEmail}
          className="min-h-[44px] px-4 font-body text-[14px] text-cream/70 underline underline-offset-2 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-md"
        >
          Use a different email
        </button>
      </div>
    </form>
  );
}
