"use client";

import { useState } from "react";

import { BreathingSphere } from "./BreathingSphere";
import { Button, Eyebrow, Icon } from "./shared";
import { DEFAULTS, type PregameState } from "./types";

// 5-step compressed flow: Identity → Breath → First Shift → Mistake Reset →
// Cue Word. Reuses the BreathingSphere with rounds=2 so it stays under ~3
// minutes total. Pulls the user's cueWord from state if set, otherwise
// "Faithful".

const TOTAL = 5;
const STEP_LABELS = ["Identity", "Breath", "First Shift", "Mistake Reset", "Cue Word"];
const MISTAKE_STEPS = [
  { n: "01", t: "Breathe." },
  { n: "02", t: "Truth." },
  { n: "03", t: "Next faithful action." },
];

export function QuickReset({
  state,
  onClose,
}: {
  state: PregameState;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const cueWord = state.cueWord || DEFAULTS.cueWord;

  const next = () => {
    if (step >= TOTAL - 1) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div
      className="relative flex flex-1 flex-col"
      style={{
        background:
          "radial-gradient(80% 50% at 50% 10%, rgba(36,91,255,0.10), transparent 65%), var(--fv-onyx)",
      }}
    >
      <div className="flex items-center gap-3 px-[18px] pb-3 pt-[58px]">
        <button
          type="button"
          onClick={step === 0 ? undefined : back}
          disabled={step === 0}
          aria-label="Back"
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-pill border border-hairline text-cream disabled:text-cream/30"
        >
          <Icon name="arrowLeft" size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-gold">
            Quick Locker Room Reset
          </div>
          <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            {step + 1} / {TOTAL} · {STEP_LABELS[step]}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-pill border border-hairline text-cream/70"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="flex gap-1.5 px-[22px] pb-1.5 pt-1">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-sm transition-colors duration-base ${
              i <= step ? "bg-gold" : "bg-cream/[0.08]"
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-1 flex-col justify-center px-6 text-center">
          <Eyebrow className="!tracking-[0.26em] !text-gold">Identity</Eyebrow>
          <h1 className="m-0 mt-3.5 font-display text-[44px] font-extrabold uppercase leading-none tracking-[0.02em] text-cream">
            MY WORTH IS
            <br />
            <span className="text-gold">SECURE IN CHRIST.</span>
          </h1>
          <p className="mt-5 font-body text-[14px] text-cream/50">
            One breath. Receive it.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <Eyebrow className="mb-2 !tracking-[0.26em] !text-gold">
            Breath · 2 Rounds
          </Eyebrow>
          <h2 className="m-0 mb-6 text-center font-heading text-[22px] font-bold text-cream">
            Two breaths. Back to ready.
          </h2>
          <BreathingSphere rounds={2} inhale={4} exhale={6} size={240} autoStart={false} />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col justify-center px-6">
          <Eyebrow className="!tracking-[0.26em] !text-gold">First Shift</Eyebrow>
          <h2 className="m-0 mb-6 mt-3 font-heading text-[24px] font-bold leading-[1.2] text-cream">
            Step on.
          </h2>
          <div className="flex flex-col gap-3.5">
            {["Three hard strides.", "Eyes up.", "Simple strong play."].map((l, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                <span className="font-display text-[26px] font-extrabold uppercase tracking-[0.02em] text-cream">
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col justify-center px-6">
          <Eyebrow className="!tracking-[0.26em] !text-gold">If You Make a Mistake</Eyebrow>
          <div className="mt-[18px] flex flex-col gap-2.5">
            {MISTAKE_STEPS.map((s, i) => {
              const last = i === MISTAKE_STEPS.length - 1;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3.5 rounded-[12px] border px-[18px] py-4 ${
                    last
                      ? "border-gold/40 bg-gold/[0.06]"
                      : "border-hairline bg-charcoal"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] tracking-[0.18em] ${
                      last ? "text-gold" : "text-cream/50"
                    }`}
                  >
                    {s.n}
                  </span>
                  <span
                    className={`font-heading text-[20px] text-cream ${
                      last ? "font-bold" : "font-semibold"
                    }`}
                  >
                    {s.t}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-center font-scripture text-[15px] italic text-cream/50">
            Your mistake is real. It is not your identity.
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <Eyebrow className="!tracking-[0.26em] !text-gold">Your Cue Word</Eyebrow>
          <div className="mt-5 font-display text-[88px] font-extrabold uppercase leading-[0.95] tracking-[0.04em] text-gold">
            {cueWord}
          </div>
          <p className="mt-7 font-heading text-[16px] font-medium text-cream">
            Say it between shifts.
          </p>
          <p className="mt-2 font-body text-[14px] text-cream/50">Play from victory.</p>
        </div>
      )}

      <div className="px-5 pb-8 pt-3.5">
        <Button variant="coach" full onClick={next}>
          {step >= TOTAL - 1 ? "STEP ON" : "NEXT"}
        </Button>
      </div>
    </div>
  );
}
