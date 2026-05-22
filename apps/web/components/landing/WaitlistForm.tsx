// client: waitlist form. Submits to a Supabase-backed server action,
// fires an admin notification email, and renders an idempotent success
// state on duplicate submissions.
"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { FlameMark } from "@/components/ui";
import { SvgIcon } from "./SvgIcon";
import { submitWaitlist, type WaitlistActionState } from "@/lib/actions/waitlist";

const ROLES = ["Athlete", "Parent", "Coach", "Other"] as const;
const SPORTS = [
  "Hockey",
  "Soccer",
  "Lacrosse",
  "Football",
  "Baseball",
  "Basketball",
  "Wrestling",
  "Volleyball",
  "Track & field",
  "Tennis",
  "Other",
] as const;

export function WaitlistForm() {
  const [state, formAction] = useFormState<WaitlistActionState, FormData>(
    submitWaitlist,
    null,
  );
  const [role, setRole] = useState<(typeof ROLES)[number]>("Athlete");

  if (state?.ok) {
    return (
      <div
        className="rounded-[18px] p-7 text-center"
        style={{
          background:
            "linear-gradient(180deg,rgba(223,175,55,0.08),rgba(223,175,55,0)),var(--bg-elev-2)",
          border: "1px solid rgba(223,175,55,0.3)",
        }}
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-4 inline-block">
          <FlameMark size={40} />
        </div>
        <h4 className="font-heading font-semibold text-[22px] tracking-[-0.01em] m-0 mb-2 text-cream">
          {state.alreadyOnList
            ? "You're already on the list."
            : "You're on the list."}
        </h4>
        <p className="text-cream/70 m-0">
          {state.alreadyOnList
            ? "Glad you're with us. We'll keep you updated."
            : "We'll keep you updated as From Victory gets ready to launch. Glad you're here."}
        </p>
      </div>
    );
  }

  const errorField = state && !state.ok ? state.field : undefined;
  const errorMessage = state && !state.ok ? state.error : undefined;

  return (
    <form
      action={formAction}
      noValidate
      className="bg-charcoal border border-hairline rounded-[24px] p-8"
    >
      <div className="flex items-center gap-2.5 mb-[22px]">
        <FlameMark size={16} />
        <span className="fv-eyebrow gold">Waitlist · Early access</span>
      </div>
      <h3 className="font-heading font-semibold text-[22px] leading-[1.15] tracking-[-0.01em] m-0 mb-6 text-cream">
        Get on the list.
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Field id="w-name" label="Name">
          <input
            id="w-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jordan T."
            required
            maxLength={120}
            aria-invalid={errorField === "name"}
            className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18]"
          />
        </Field>
        <Field id="w-email" label="Email">
          <input
            id="w-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            required
            maxLength={320}
            aria-invalid={errorField === "email"}
            className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18]"
          />
        </Field>
      </div>

      <fieldset className="mt-3.5">
        <legend className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold mb-2">
          I am a
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {ROLES.map((r) => {
            const checked = role === r;
            return (
              <label
                key={r}
                className={`px-2 py-2.5 rounded-[10px] text-center cursor-pointer select-none font-mono font-semibold text-[11px] tracking-[0.10em] transition-all duration-base ease-out ${
                  checked
                    ? "text-gold"
                    : "border-hairline text-cream/70 hover:text-cream hover:border-hairline-strong"
                }`}
                style={
                  checked
                    ? {
                        background: "rgba(223,175,55,0.08)",
                        border: "1px solid rgba(223,175,55,0.5)",
                      }
                    : { background: "var(--fv-surface-1)", border: "1px solid var(--fv-hairline)" }
                }
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={checked}
                  onChange={() => setRole(r)}
                  className="sr-only"
                />
                {r}
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field id="w-sport" label="Primary sport">
        <select
          id="w-sport"
          name="sport"
          defaultValue="Hockey"
          className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18]"
        >
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field id="w-note" label="Optional note">
        <textarea
          id="w-note"
          name="note"
          placeholder="What are you hoping this helps with?"
          maxLength={1000}
          className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18] resize-y min-h-20"
        />
      </Field>

      {/* Honeypot — hidden from sighted users + assistive tech.
          Real users leave it blank; bots fill it. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
      >
        <label htmlFor="w-website">
          Website (leave blank)
          <input
            id="w-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <label className="flex items-start gap-2.5 mt-4 text-cream/70 text-[13px] leading-snug">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 accent-cobalt cursor-pointer"
          aria-invalid={errorField === "consent"}
        />
        <span>
          I agree to the{" "}
          <Link href="/privacy" className="text-cream underline underline-offset-2 hover:text-gold">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-cream underline underline-offset-2 hover:text-gold">
            Terms
          </Link>
          .
        </span>
      </label>

      {errorMessage && (
        <div
          role="alert"
          className="mt-3 rounded-[10px] border border-[rgba(229,62,76,0.4)] bg-[rgba(229,62,76,0.08)] px-3.5 py-3 text-[13px] text-[#ffb3b9]"
        >
          {errorMessage}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full mt-4 inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Joining…" : "Join the waitlist"}
      {!pending && <SvgIcon name="arrow" size={16} />}
    </button>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 mt-3.5">
      <label
        htmlFor={id}
        className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
