"use client";
// client: two-phase change-sport flow (picker → confirm) for /athlete/settings.
// Local useState drives the phase + selection; the confirm step submits to the
// changeSport server action via useFormState (React 18 / Next 14 — NOT
// useActionState, which is undefined at runtime here). Mirrors the shipped
// onboarding SportPicker affordances exactly (radiogroup, gold-accent active,
// sticky bottom CTA) so first-run and settings feel like one system. See
// FV-56 §2.3.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";

import { changeSport } from "@/lib/actions/athlete-sport";
import { SUPPORTED_SPORTS, sportLabel, type Sport } from "@/lib/sports";

const SPORT_SUB: Record<Sport, string> = {
  hockey: "Ice, skates, the full shift.",
  basketball: "The court, your game, your role.",
  golf: "The course, your swing, your score.",
};

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

function BackButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-[44px] w-[44px] -m-[5px] items-center justify-center rounded-pill text-cream/70 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx hover:text-cream"
    >
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
        <ArrowLeftIcon />
      </span>
    </button>
  );
}

// Picker-step CTA — its own component so useFormStatus is NOT used (the picker
// step is a local handler, not a server submit). Plain button.
function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid="sport-continue-btn"
      onClick={onClick}
      className={[
        "inline-flex w-full items-center justify-center gap-2",
        "bg-onyx text-cream border border-gold rounded-[10px]",
        "font-display font-extrabold uppercase tracking-[0.14em] text-[14px]",
        "px-[26px] py-4",
        "transition-transform duration-fast ease-out",
        "active:scale-[0.97]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
      ].join(" ")}
    >
      CONTINUE
    </button>
  );
}

// Confirm-step primary CTA — server submit, so useFormStatus drives pending.
function ConfirmSwitchButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      data-testid="sport-confirm-switch-btn"
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
      {pending ? "SWITCHING…" : "YES, SWITCH"}
    </button>
  );
}

type ChangeSportState = { ok: false; error: string } | null;

export default function ChangeSportFlow({
  currentSport,
}: {
  currentSport: Sport;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"picker" | "confirm">("picker");
  const [selected, setSelected] = useState<Sport>(currentSport);
  const [state, formAction] = useFormState<ChangeSportState, FormData>(
    changeSport,
    null,
  );

  // Picker CONTINUE: if they re-picked their current sport, it's a no-op —
  // return to Settings without a write or a confirm (FV-56 §2.3).
  function handleContinue() {
    if (selected === currentSport) {
      router.push("/athlete/settings");
      return;
    }
    setPhase("confirm");
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-onyx text-cream">
      <div className="flex items-center px-5 pb-3 pt-[58px]">
        {phase === "picker" ? (
          <BackButton
            label="Back to settings"
            onClick={() => router.push("/athlete/settings")}
          />
        ) : (
          <BackButton label="Back" onClick={() => setPhase("picker")} />
        )}
      </div>

      {phase === "picker" ? (
        <>
          <div className="flex-1 overflow-y-auto px-5 pb-[140px] pt-6">
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Change Your Sport
            </p>

            <h1 className="mb-2 font-heading text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] text-cream">
              Switch to a different sport?
            </h1>

            <p className="mb-8 font-body text-[15px] leading-[1.55] text-cream/70">
              Your content trains around your game.
            </p>

            <div
              className="flex flex-col gap-2"
              role="radiogroup"
              aria-label="Select your sport"
            >
              {SUPPORTED_SPORTS.map((value) => {
                const active = selected === value;
                const label = sportLabel(value);
                const sub = SPORT_SUB[value] ?? "";
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
          </div>

          <div className="sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-onyx from-60% to-transparent px-5 pb-8 pt-3.5">
            <ContinueButton onClick={handleContinue} />
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 pb-[140px] pt-6">
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Confirm Change
            </p>

            <h1 className="mb-3 font-heading text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] text-cream">
              Switch to {sportLabel(selected)}?
            </h1>

            <p className="font-body text-[15px] leading-[1.55] text-cream/70">
              Your daily content switches to {selected}. Your rhythm and where
              you are in your training stay the same.
            </p>

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
              <ConfirmSwitchButton />
            </form>
            <button
              type="button"
              data-testid="sport-confirm-keep-btn"
              onClick={() => setPhase("picker")}
              className="mt-3 inline-flex w-full items-center justify-center rounded-[10px] border border-hairline bg-charcoal px-[26px] py-3.5 font-heading text-[14px] font-semibold text-cream/70 transition-colors duration-fast ease-out hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            >
              Keep {sportLabel(currentSport)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
