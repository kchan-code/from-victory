// client: form uses useFormState + useFormStatus (React 18 / Next 14 hooks).
"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { FlameMark } from "@/components/ui";
import { SvgIcon } from "./SvgIcon";
import { submitContact, type ContactActionState } from "@/lib/actions/contact";

export function ContactForm() {
  const [state, formAction] = useFormState<ContactActionState, FormData>(
    submitContact,
    null,
  );

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
        <h2 className="font-heading font-semibold text-[22px] tracking-[-0.01em] m-0 mb-2 text-cream">
          Thanks — we&rsquo;ll be in touch.
        </h2>
        <p className="text-cream/70 m-0">
          We read every message and will get back to you.
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
        <span className="fv-eyebrow gold">Get in touch</span>
      </div>
      <h2 className="font-heading font-semibold text-[22px] leading-[1.15] tracking-[-0.01em] m-0 mb-6 text-cream">
        Send us a message.
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Field id="c-name" label="First name">
          <input
            id="c-name"
            name="name"
            type="text"
            autoComplete="given-name"
            placeholder="Jordan"
            required
            maxLength={120}
            aria-invalid={errorField === "name"}
            className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18]"
          />
        </Field>
        <Field id="c-email" label="Email">
          <input
            id="c-email"
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

      <Field id="c-message" label="Message">
        <textarea
          id="c-message"
          name="message"
          placeholder="Questions about the app, pricing, teams, or anything else."
          required
          maxLength={2000}
          aria-invalid={errorField === "message"}
          className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18] resize-y min-h-[140px]"
        />
      </Field>

      {/* Honeypot — hidden from sighted users + assistive tech.
          Real users leave it blank; bots fill it. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
      >
        <label htmlFor="c-website">
          Website (leave blank)
          <input
            id="c-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-3 rounded-[10px] border border-[rgba(229,62,76,0.4)] bg-[rgba(229,62,76,0.08)] px-3.5 py-3 text-[13px] text-[#ffb3b9]"
        >
          {errorMessage}
        </div>
      )}

      <SubmitButton />

      <p className="mt-4 text-cream/55 text-[12px] leading-relaxed">
        Messages go directly to the From Victory team, who will use your email
        to reply. Please do not include sensitive personal or medical
        information in your message. See our{" "}
        <Link
          href="/privacy"
          className="text-cream/85 underline underline-offset-2 hover:text-gold transition-colors duration-fast ease-out"
        >
          Privacy Policy
        </Link>
        .
      </p>
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
      {pending ? "Sending…" : "Send message"}
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
