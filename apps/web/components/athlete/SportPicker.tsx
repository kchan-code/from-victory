"use client";
// client: form interaction (radiogroup state via useState) + useFormState for
// the selectSport server action + useFormStatus for the pending submit button.
// NOTE: this app is on React 18 (Next 14) — use react-dom's useFormState /
// useFormStatus, NOT React 19's useActionState (which is undefined at runtime
// here). Mirrors the established pattern in SubscribeForm / the auth forms.

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { selectSport } from "@/lib/actions/athlete-sport";
import { signOut } from "@/lib/actions/auth";
import { SUPPORTED_SPORTS, type Sport } from "@/lib/sports";

interface SportOption {
  value: Sport;
  label: string;
  sub: string;
}

const SPORT_META: Record<Sport, { label: string; sub: string }> = {
  hockey: {
    label: "Hockey",
    sub: "Ice, skates, the full shift.",
  },
  basketball: {
    label: "Basketball",
    sub: "The court, your game, your role.",
  },
};

const SPORT_OPTIONS: SportOption[] = SUPPORTED_SPORTS.map((sport) => {
  const meta = SPORT_META[sport] ?? {
    label: sport.charAt(0).toUpperCase() + sport.slice(1),
    sub: "",
  };
  return { value: sport, ...meta };
});

function CheckIcon() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </svg>
  );
}

type SelectSportFormState = { ok: false; error: string } | null;

// Submit button — isolated so useFormStatus sees the enclosing <form> and
// drives the pending/loading state (React 18 pattern; useActionState's third
// return value isn't available here).
function ContinueButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      data-testid="sport-continue-btn"
      disabled={pending}
      className={[
        "inline-flex w-full items-center justify-center gap-2",
        "bg-onyx text-cream border border-gold rounded-[10px]",
        "font-display font-extrabold uppercase tracking-[0.14em] text-[14px]",
        "px-[26px] py-4",
        "transition-transform duration-fast ease-out",
        "active:scale-[0.97]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
        "disabled:opacity-70 disabled:cursor-not-allowed",
      ].join(" ")}
    >
      {pending ? "SAVING…" : "CONTINUE"}
    </button>
  );
}

export default function SportPicker({ currentSport }: { currentSport: Sport }) {
  const [selected, setSelected] = useState<Sport>(currentSport);
  const [state, formAction] = useFormState<SelectSportFormState, FormData>(
    selectSport,
    null,
  );

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-onyx text-cream">
      <div className="flex items-center px-5 pb-3 pt-[58px]">
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className="flex h-[44px] w-[44px] -m-[5px] items-center justify-center rounded-pill text-cream/70 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx hover:text-cream"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
              <ArrowLeftIcon />
            </span>
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-[140px] pt-6">
        <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          Your Sport
        </p>

        <h1 className="mb-2 font-heading text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] text-cream">
          What sport do you play?
        </h1>

        <p className="mb-8 font-body text-[15px] leading-[1.55] text-cream/70">
          Your content trains around your game.
        </p>

        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label="Select your sport"
        >
          {SPORT_OPTIONS.map(({ value, label, sub }) => {
            const active = selected === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                data-testid={`sport-option-${value}`}
                onClick={() => setSelected(value)}
                className={[
                  "flex min-h-[64px] w-full items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left transition-colors duration-fast",
                  "active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
                  active
                    ? "border-gold/55 bg-gold/[0.06]"
                    : "border-hairline bg-charcoal",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <span className="block font-heading text-[17px] font-semibold leading-tight text-cream">
                    {label}
                  </span>
                  {sub && (
                    <span className="mt-0.5 block font-body text-[13px] leading-snug text-cream/50">
                      {sub}
                    </span>
                  )}
                </div>
                <span
                  className={[
                    "flex h-[20px] w-[20px] flex-none items-center justify-center rounded-full border-[1.5px] transition-colors duration-fast",
                    active
                      ? "border-gold bg-gold text-onyx"
                      : "border-cream/20 bg-transparent",
                  ].join(" ")}
                >
                  {active && <CheckIcon />}
                </span>
              </button>
            );
          })}
        </div>

        {state?.ok === false && (
          <div
            role="alert"
            className="mt-5 rounded-[10px] border border-gold/40 px-4 py-3 font-body text-[13px] leading-snug text-cream/80"
          >
            {state.error}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-onyx from-60% to-transparent px-5 pb-8 pt-3.5">
        <form action={formAction}>
          <input type="hidden" name="sport" value={selected} />
          <ContinueButton />
        </form>
      </div>
    </div>
  );
}
