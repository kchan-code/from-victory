"use client";

import { useState } from "react";

import { BreathingSphere } from "./BreathingSphere";
import {
  Button,
  Card,
  CustomInputRow,
  Eyebrow,
  Icon,
  ScreenBody,
  ScriptureCard,
  SectionLabel,
  SelectCard,
  SelectChip,
  StackedHero,
} from "./shared";
import {
  CONFIDENCE_OPTIONS,
  FIRST_SHIFT_SEQUENCE,
  GAME_TYPES,
  IDENTITY_TRUTH,
  NEEDS,
  RINK_CUES,
  SCRIPTURE_REF,
  SCRIPTURE_TEXT,
  type GameType,
  type NeedToday,
  type PregameState,
} from "./types";

type SetFn = <K extends keyof PregameState>(k: K, v: PregameState[K]) => void;

// ─── SCREEN 1 ─── Pregame Start
export function PregameStart({
  onBegin,
  onQuick,
  onClose,
}: {
  onBegin: () => void;
  onQuick: () => void;
  onClose?: () => void;
}) {
  return (
    <div
      className="relative flex flex-1 flex-col"
      style={{
        background:
          "radial-gradient(80% 50% at 50% 10%, rgba(36,91,255,0.16), transparent 65%), radial-gradient(60% 40% at 50% 90%, rgba(223,175,55,0.10), transparent 70%), var(--fv-onyx)",
      }}
    >
      <div className="flex items-center justify-between px-5 pb-3 pt-[58px]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/50">
            From Victory
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline text-cream/70"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col px-6">
        <div className="mt-6">
          <Eyebrow className="!text-[11px] !tracking-[0.26em] !text-gold">
            Pre-Game Reset
          </Eyebrow>
        </div>

        <div className="flex flex-1 items-center">
          <StackedHero lines={["BREATHE.", "FOCUS.", "COMPETE."]} goldIndex={2} />
        </div>

        <p className="mb-7 max-w-[320px] font-body text-[15px] leading-[1.55] text-cream/70">
          You are not the scoreboard. You are not the last game. Three breaths,
          one truth, one cue. Then we step on.
        </p>

        <div className="flex flex-col gap-2.5 pb-8">
          <Button variant="coach" full onClick={onBegin}>
            BEGIN
          </Button>
          <button
            type="button"
            onClick={onQuick}
            className="flex items-center justify-center gap-2 px-0 py-3 font-heading text-[14px] font-medium text-cream/70 transition-colors hover:text-cream"
          >
            <Icon name="bolt" size={14} className="text-gold" />
            <span>Quick Locker Room Reset</span>
            <Icon name="arrowRight" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 2 ─── Game Context
export function GameContextScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  return (
    <ScreenBody>
      <SectionLabel>Step 01</SectionLabel>
      <h1 className="mb-1.5 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        What kind of game is this?
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        Choose one. We&rsquo;ll tune the routine.
      </p>
      <div className="flex flex-wrap gap-2">
        {GAME_TYPES.map((g) => (
          <SelectChip
            key={g}
            label={g}
            selected={state.gameType === g}
            onClick={() => set("gameType", g as GameType)}
          />
        ))}
      </div>

      <div className="h-7" />
      <h2 className="mb-1.5 font-heading text-[22px] font-bold leading-[1.2] text-cream">
        What do you need most today?
      </h2>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        One word. Don&rsquo;t overthink it.
      </p>
      <div className="flex flex-wrap gap-2">
        {NEEDS.map((n) => (
          <SelectChip
            key={n}
            label={n}
            selected={state.need === n}
            onClick={() => set("need", n as NeedToday)}
          />
        ))}
      </div>
    </ScreenBody>
  );
}

// ─── SCREEN 3 ─── Identity Anchor
export function IdentityScreen() {
  return (
    <ScreenBody>
      <SectionLabel>Step 02 · Identity</SectionLabel>
      <h1 className="mb-5 font-heading text-[28px] font-bold leading-[1.15] text-cream">
        Your identity is already secure.
      </h1>

      <ScriptureCard reference={SCRIPTURE_REF.toUpperCase()} verse={SCRIPTURE_TEXT} />

      <div className="h-5" />

      <Card>
        <Eyebrow className="!text-gold">Truth</Eyebrow>
        <p className="mt-2.5 font-heading text-[18px] font-semibold leading-[1.4] text-cream">
          {IDENTITY_TRUTH}
        </p>
      </Card>

      <p className="mt-3.5 px-3 text-center font-body text-[14px] leading-[1.55] text-cream/50">
        Take one breath and receive that before you compete.
      </p>
    </ScreenBody>
  );
}

// ─── SCREEN 4 ─── Regulation Breath
export function BreathScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  return (
    <ScreenBody className="flex flex-col">
      <SectionLabel>Step 03 · Regulation</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Lead your body back to ready.
      </h1>
      <p className="mb-2 font-body text-[14px] text-cream/50">
        Do not force calm. Lead your body back to ready. 4 in. 6 out. Four rounds.
      </p>

      <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center py-3 pb-7">
        <BreathingSphere
          rounds={4}
          inhale={4}
          exhale={6}
          size={280}
          autoStart={false}
          onComplete={() => set("breathDone", true)}
        />
      </div>

      <div className="flex justify-center gap-6 pb-2">
        <div className="text-center">
          <Eyebrow>Inhale</Eyebrow>
          <div className="mt-0.5 font-heading text-[14px] font-semibold text-cream">
            Receive · 4s
          </div>
        </div>
        <div className="w-px bg-hairline" />
        <div className="text-center">
          <Eyebrow>Exhale</Eyebrow>
          <div className="mt-0.5 font-heading text-[14px] font-semibold text-cream">
            Release · 6s
          </div>
        </div>
      </div>
      {state.breathDone && (
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
          Rounds complete
        </p>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 5 ─── What I Already Do Well
export function ConfidenceScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  const isCustom = !!state.confidence && !CONFIDENCE_OPTIONS.includes(state.confidence);
  return (
    <ScreenBody>
      <SectionLabel>Step 04 · Evidence</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Remember what you already bring.
      </h1>
      <p className="mb-5 font-body text-[14px] text-cream/50">
        Choose one thing you know you can bring today.
      </p>

      <div className="flex flex-col gap-2">
        {CONFIDENCE_OPTIONS.map((o) => (
          <SelectCard
            key={o}
            label={o}
            selected={state.confidence === o}
            onClick={() => set("confidence", o)}
            compact
          />
        ))}
        <CustomInputRow
          value={isCustom ? state.confidence ?? "" : ""}
          selected={isCustom}
          onChange={(v) => set("confidence", v)}
          placeholder="Write your own"
          ariaLabel="Write your own evidence"
        />
      </div>

      {state.confidence && (
        <div className="mt-4 rounded-[12px] border border-gold/30 bg-gold/[0.05] px-4 py-3.5">
          <Eyebrow className="!text-gold">Good</Eyebrow>
          <p className="mt-1.5 font-heading text-[14px] font-medium leading-[1.4] text-cream">
            Start from what is already true.
          </p>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 6 ─── Enter the Rink
export function RinkScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  const taken = state.rinkCues;
  const toggle = (id: string) => {
    set(
      "rinkCues",
      taken.includes(id) ? taken.filter((x) => x !== id) : [...taken, id],
    );
  };

  return (
    <ScreenBody>
      <SectionLabel>Step 05 · Familiarization</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Enter the rink before you enter the game.
      </h1>
      <p className="mb-5 font-body text-[14px] text-cream/50">
        Bring the rink into your mind. Tap each cue as you feel it.
      </p>

      <div className="flex flex-col gap-2">
        {RINK_CUES.map((c) => {
          const on = taken.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-pressed={on}
              className={`flex w-full items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left transition-colors duration-base ${
                on
                  ? "border-cobalt/45 bg-cobalt/[0.05]"
                  : "border-hairline bg-charcoal"
              }`}
            >
              <div
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-[8px] ${
                  on ? "bg-cobalt/[0.12] text-cobalt-bright" : "bg-cream/[0.04] text-cream/70"
                }`}
              >
                <Icon name={c.icon} size={16} />
              </div>
              <span className="flex-1 font-heading text-[15px] font-medium text-cream">
                {c.label}
              </span>
              <span
                className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] border-[1.5px] transition-colors duration-fast ${
                  on ? "border-cobalt bg-cobalt" : "border-cream/20"
                }`}
              >
                {on && <Icon name="check" size={12} strokeWidth={3} className="text-cream" />}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mx-1 mt-4 text-center font-body text-[12px] text-cream/50">
        If you can, hold your stick or gloves while you do this.
      </p>
    </ScreenBody>
  );
}

// ─── SCREEN 7 ─── First Shift Rehearsal
export function FirstShiftScreen() {
  const [stepIdx, setStepIdx] = useState(0);
  const advance = () =>
    setStepIdx((i) => Math.min(FIRST_SHIFT_SEQUENCE.length, i + 1));

  return (
    <ScreenBody className="flex flex-col">
      <SectionLabel>Step 06 · First Shift</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        First shift: simple, strong, ready.
      </h1>
      <p className="mb-5 font-body text-[14px] text-cream/50">
        Tap to step through. Picture each one.
      </p>

      <div
        className="flex min-h-[360px] flex-1 flex-col gap-3.5 rounded-[18px] border border-hairline p-[22px]"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgba(36,91,255,0.08), transparent 70%), var(--fv-charcoal)",
        }}
      >
        {FIRST_SHIFT_SEQUENCE.map((line, i) => {
          const shown = i < stepIdx;
          const current = i === stepIdx - 1;
          return (
            <div
              key={i}
              className={`flex items-center gap-3.5 transition-opacity duration-base ${
                shown ? "opacity-100" : "opacity-20"
              }`}
            >
              <div
                className={`w-[22px] flex-none font-mono text-[10px] ${
                  current ? "text-gold" : "text-cream/30"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                className={`flex-1 font-heading leading-[1.25] transition-all duration-base ${
                  current
                    ? "text-[20px] font-bold text-cream"
                    : "text-[17px] font-medium text-cream/70"
                }`}
              >
                {line}
              </div>
              {current && <div className="h-1.5 w-1.5 rounded-full bg-gold" />}
            </div>
          );
        })}

        <div className="flex-1" />

        {stepIdx < FIRST_SHIFT_SEQUENCE.length ? (
          <button
            type="button"
            onClick={advance}
            className="mt-1 flex items-center justify-center gap-2 rounded-[12px] border border-hairline bg-cream/[0.05] px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cream"
          >
            {stepIdx === 0 ? "Begin Rehearsal" : "Next"}
            <Icon name="arrowRight" size={14} />
          </button>
        ) : (
          <div className="mt-1 rounded-[12px] border border-gold/40 bg-gold/[0.06] px-5 py-3.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            I&rsquo;m ready for the first shift.
          </div>
        )}
      </div>
    </ScreenBody>
  );
}
