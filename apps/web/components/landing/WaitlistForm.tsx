// client: waitlist form. Visual-only stub for now — validates name/email
// locally then renders the success state. Persistence wiring (server
// action + supabase) is deferred to a follow-up PR.
"use client";

import { useState, type FormEvent } from "react";
import { FlameMark } from "@/components/ui";
import { SvgIcon } from "./SvgIcon";

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
  const [submitted, setSubmitted] = useState(false);
  const [role, setRole] = useState<(typeof ROLES)[number]>("Athlete");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitted(true);
  }

  if (submitted) {
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
          You&apos;re on the list.
        </h4>
        <p className="text-cream/70 m-0">
          We&apos;ll keep you updated as From Victory gets ready to launch. Glad
          you&apos;re here.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
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
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Jordan T."
            required
            className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18]"
          />
        </Field>
        <Field id="w-email" label="Email">
          <input
            id="w-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@email.com"
            required
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
          className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18] resize-y min-h-20"
        />
      </Field>

      <button
        type="submit"
        className="w-full mt-1.5 inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
      >
        Join the waitlist
        <SvgIcon name="arrow" size={16} />
      </button>

      <div className="flex justify-center mt-4">
        <a
          href="#audiences"
          className="fv-eyebrow text-cream/50 no-underline hover:text-cream"
        >
          I&apos;m a coach or parent →
        </a>
      </div>
    </form>
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
