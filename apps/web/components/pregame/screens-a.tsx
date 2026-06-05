"use client";

import Link from "next/link";
import { useCallback } from "react";

import { BreathingSphere } from "./BreathingSphere";
import { useBreathAudio } from "./audio/useBreathAudio";
import { audioAssetUrl } from "./audio-mapping";
import {
  Button,
  Card,
  CustomInputRow,
  Eyebrow,
  Icon,
  ScreenBody,
  SectionLabel,
  SelectChip,
  StackedHero,
} from "./shared";
import {
  NEEDS,
  type NeedToday,
  type PregameState,
} from "./types";
import { adversityOptionsFor, type SportConfig } from "./sport-registry";

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
        {/* Logo doubles as a back affordance — tapping returns to the
            athlete dashboard, which is the screen that launched this
            flow. Plain <img> instead of next/image since SVGs aren't
            optimized further and it keeps the bundle smaller. */}
        <Link
          href="/athlete"
          aria-label="Back to dashboard"
          className="flex items-center transition-opacity duration-fast hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG, no
              optimization needed; next/image would add wrapper overhead */}
          <img
            src="/logo-stacked.svg"
            alt="From Victory"
            className="h-[72px] w-auto"
          />
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-[44px] w-[44px] -m-[5px] items-center justify-center rounded-pill text-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
              <Icon name="close" size={16} />
            </span>
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

// ─── SCREEN 2 ─── Breathe (threshold step)
// Required before any setup choices. 4-in / 6-out, three rounds, no hold.
// Sphere is the hero; copy stays minimal so the screen feels like a door,
// not a survey.
//
// Two render paths:
//   1. Audio-driven — loads /audio/pregame/breath-threshold.mp3 + timeline
//      JSON. Sphere runs in controlled mode synced to audio.currentTime.
//   2. Standalone fallback — if MP3/JSON 404 or autoplay fails, sphere
//      runs on its internal rAF timer (tap-to-start). This is the path
//      until the generator runs and commits the audio.
export function BreathScreen({
  state,
  set,
  onContinue,
}: {
  state: PregameState;
  set: SetFn;
  onContinue: () => void;
}) {
  const markDone = useCallback(() => set("breathDone", true), [set]);
  const audio = useBreathAudio({
    slug: "breath-threshold",
    expectedRounds: 3,
    onComplete: markDone,
  });

  const audioReady = audio.status === "ready";
  const done = state.breathDone;

  return (
    <ScreenBody className="flex flex-col !pb-6">
      <SectionLabel>Step 01 · Threshold</SectionLabel>
      {done ? (
        <>
          <h1 className="mb-2 font-heading text-[28px] font-bold leading-[1.15] text-cream">
            Body&rsquo;s ready.
          </h1>
          <p className="mb-4 font-body text-[15px] leading-[1.5] text-cream/70">
            Now your mind chooses what to train.
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-2 font-heading text-[28px] font-bold leading-[1.15] text-cream">
            Breathe first.
          </h1>
          <p className="mb-4 font-body text-[15px] leading-[1.5] text-cream/70">
            Before you choose your focus, lead your body back to ready.
          </p>
        </>
      )}

      {/* Persistent audio element so the post-breath visual change
          doesn't tear down the playback that just completed. */}
      {audioReady && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          ref={audio.audioRef}
          src={audioAssetUrl("breath-threshold", "mp3")}
          preload="auto"
        />
      )}

      {done ? (
        // Post-breathing: hide the sphere + Inhale/Exhale legend, put the
        // CTA in the middle (per KC UX feedback 2026-05-28). The global
        // bottom bar is suppressed on this step via hideBottomBar=true.
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 py-8">
          <p className="text-center font-heading text-[17px] font-semibold text-gold">
            Ready. Now set your focus.
          </p>
          <Button variant="coach" onClick={onContinue}>
            SET MY FOCUS
          </Button>
        </div>
      ) : (
        <>
          <div className="relative flex min-h-[360px] flex-1 flex-col items-center justify-center py-3 pb-7">
            {audioReady ? (
              <BreathingSphere
                rounds={3}
                inhale={4}
                exhale={6}
                size={280}
                controlled={audio.controlled}
                onTap={() => void audio.play()}
              />
            ) : (
              <BreathingSphere
                rounds={3}
                inhale={4}
                exhale={6}
                size={280}
                autoStart={false}
                onComplete={markDone}
              />
            )}
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

          {/* Skip — for athletes who've already settled. Jumps straight to
              ready (breathDone) without forcing the full three rounds.
              min-h-[44px] holds the tap target at the 44px floor; visual
              footprint stays slim via the small font size. */}
          <button
            type="button"
            onClick={markDone}
            className="mx-auto mt-1 flex min-h-[44px] items-center rounded-sm px-2 font-body text-[12px] text-cream/50 underline underline-offset-2 transition-colors duration-fast hover:text-cream/70 active:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            Already settled
          </button>
        </>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 3 ─── Today's Focus
export function TodaysFocusScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  return (
    <ScreenBody>
      <SectionLabel>Step 02 · Today&rsquo;s Focus</SectionLabel>
      <h1 className="mb-1.5 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        What do you need most today?
      </h1>
      <p className="mb-5 font-body text-[14px] text-cream/50">
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

// ─── SCREEN 4 ─── Position
// Only rendered when sportConfig.roles is non-empty (role-ask sports like hockey).
// No-ask sports (e.g. tennis) skip this screen entirely — the flow root gates
// this step based on sportConfig.roles presence.
export function PositionScreen({
  state,
  set,
  sportConfig,
}: {
  state: PregameState;
  set: SetFn;
  sportConfig: SportConfig;
}) {
  const role = state.role;
  // roles is guaranteed non-empty here (caller skips this step for no-ask sports).
  const roleNames = sportConfig.roles ?? [];
  const roleContent = sportConfig.roleContent ?? {};

  return (
    <ScreenBody>
      <SectionLabel>Step 03 · {sportConfig.roleLabel ?? "Position"}</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        What position are you playing today?
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        We&rsquo;ll rehearse the job that&rsquo;s actually yours during the
        guided session.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {roleNames.map((r) => {
          const selected = state.role === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => set("role", r)}
              aria-pressed={selected}
              className={`rounded-[12px] border px-2 py-3.5 font-heading text-[14px] font-semibold transition-colors duration-fast ${
                selected
                  ? "border-gold/55 bg-gold/[0.06] text-gold"
                  : "border-hairline bg-charcoal text-cream"
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>

      {role && (() => {
        const content = roleContent[role];
        if (!content) return null;
        return (
          <div className="mt-5">
            <Card accent="verse">
              <Eyebrow className="!text-gold">{role.toUpperCase()}</Eyebrow>
              <h2 className="mb-4 mt-2 font-heading text-[20px] font-bold leading-[1.3] text-cream">
                {content.title}
              </h2>
              <div className="flex flex-col gap-2.5">
                {content.scenes.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-[10px] border border-hairline bg-cream/[0.025] px-3.5 py-3"
                  >
                    <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-gold/45 font-mono text-[10px] text-gold">
                      {i + 1}
                    </div>
                    <span className="font-heading text-[15px] font-medium text-cream">
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      })()}
    </ScreenBody>
  );
}

// ─── SCREEN 5 ─── Hard Moment (selection only)
// Setup screen just captures the adversity; the 5-step response plan
// ("See it. Feel it. Breathe. Speak truth. Take the next faithful action.")
// is delivered inside the Guided Audio Session.
export function HardMomentScreen({
  state,
  set,
  sportConfig,
}: {
  state: PregameState;
  set: SetFn;
  sportConfig: SportConfig;
}) {
  // Position-aware options: a goalie sees goalie-true labels (mapped to the same
  // cells via the canonical key); skaters get the flat list. (FV-101.)
  const options = adversityOptionsFor(sportConfig, state.role);
  const isCustom =
    !!state.adversity && !options.some((o) => o.key === state.adversity);
  return (
    <ScreenBody>
      <SectionLabel>Step 04 · Hard Moment</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Rehearse the hard moment.
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        Choose one thing that could happen today. The guided session will walk
        you through how to respond.
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map(({ key, label }) => (
          <SelectChip
            key={key}
            label={label}
            selected={state.adversity === key}
            onClick={() => set("adversity", key)}
          />
        ))}
      </div>

      <div className="mt-3">
        <CustomInputRow
          value={isCustom ? state.adversity ?? "" : ""}
          selected={isCustom}
          onChange={(v) => set("adversity", v)}
          placeholder="Something else on your mind"
          ariaLabel="Custom hard moment"
        />
      </div>

      {state.adversity && (
        <div className="mt-5 rounded-[12px] border border-gold/30 bg-gold/[0.05] px-4 py-3.5">
          <Eyebrow className="!text-gold">Locked in</Eyebrow>
          <p className="mt-1.5 font-heading text-[14px] font-medium leading-[1.4] text-cream">
            We&rsquo;ll bring this back during your session.
          </p>
        </div>
      )}
    </ScreenBody>
  );
}
