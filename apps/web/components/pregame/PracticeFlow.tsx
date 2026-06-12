"use client"; // client: Web Audio API (useClipPlayer), useState, user-event handlers

// Pre-practice "Lock In" flow — lean three-screen state machine.
//
// Screen 1 – StatePickerScreen (NEW — FRO-22):
//   "How are you showing up today?" — single tap between two options:
//   "Dialed in" (pre-selected default) or "Not feeling it". CONTINUE
//   advances to Screen 2.
//
// Screen 2 – FocusPickerScreen (updated — FRO-22):
//   "Pick one thing to own today." — single tap from 7 PRACTICE_FOCUS_OPTIONS.
//   Custom free-text entry REMOVED (the focus is now VOICED, so it must be
//   one of the 7 mapped clips). START SESSION advances to Screen 3.
//   Back arrow returns to Screen 1.
//
// Screen 3 – PracticeSessionScreen:
//   Plays the state-aware practice playlist via useClipPlayer
//   (practice: true, practiceState, practiceFocus). The athlete's chosen
//   focus is shown prominently AND is voiced in the audio. Progress bar +
//   remaining time + play/pause chrome. On completion: send-off + done button.
//
// State model: practiceState + practiceFocus are EPHEMERAL client state only
// (useState). They are NEVER written to Supabase, localStorage, analytics,
// logs, or any network call. They drive clip selection and die on unmount.
//
// No journal, no scripture reflection, no rhythm surface.

import { useEffect, useRef, useState } from "react";

import { type PracticeState, type PrayerStyle, PRAYER_STYLE_OPTIONS } from "./types";
import { getSportConfig, type Sport } from "./sport-registry";
import { useClipPlayer } from "./useClipPlayer";
import {
  BottomBar,
  Icon,
  PregameShell,
  SectionLabel,
  ScreenBody,
  SelectCard,
} from "./shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PracticeView = "state-picker" | "focus-picker" | "prayer-picker" | "session";

// ---------------------------------------------------------------------------
// StatePickerScreen — NEW (FRO-22)
// Athlete self-reports pre-practice state. Two options; "dialed-in" is
// pre-selected (the safe, non-patronising default — never "you seem fine").
// ---------------------------------------------------------------------------

function StatePickerScreen({
  initialState,
  onContinue,
}: {
  initialState: PracticeState;
  onContinue: (state: PracticeState) => void;
}) {
  const [selected, setSelected] = useState<PracticeState>(initialState);

  const OPTIONS: Array<{
    value: PracticeState;
    label: string;
    sub: string;
    testId: string;
  }> = [
    {
      value: "dialed-in",
      label: "Dialed in",
      sub: "Ready to work. Lock in and go.",
      testId: "state-option-dialed-in",
    },
    {
      value: "not-feeling-it",
      label: "Not feeling it",
      sub: "Off, flat, dragging. You showed up anyway.",
      testId: "state-option-not-feeling-it",
    },
  ];

  return (
    <>
      <ScreenBody>
        <SectionLabel>Practice day</SectionLabel>
        <h1 className="mb-1 font-heading text-[28px] font-bold leading-[1.12] text-cream">
          How are you showing up today?
        </h1>
        <p className="mb-5 font-body text-[14px] leading-relaxed text-cream/50">
          Your answer sets the first two minutes.
        </p>

        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label="Pre-practice state"
        >
          {OPTIONS.map(({ value, label, sub, testId }) => {
            const active = selected === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(value)}
                data-testid={testId}
                className={`flex min-h-[64px] w-full items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left transition-colors duration-fast active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx ${
                  active
                    ? "border-gold/55 bg-gold/[0.06]"
                    : "border-hairline bg-charcoal"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="block font-heading text-[17px] font-semibold leading-tight text-cream">
                    {label}
                  </span>
                  <span className="mt-0.5 block font-body text-[13px] leading-snug text-cream/50">
                    {sub}
                  </span>
                </div>
                <span
                  className={`flex h-[20px] w-[20px] flex-none items-center justify-center rounded-full border-[1.5px] transition-colors duration-fast ${
                    active
                      ? "border-gold bg-gold"
                      : "border-cream/20 bg-transparent"
                  }`}
                >
                  {active && (
                    <Icon
                      name="check"
                      size={11}
                      strokeWidth={3}
                      className="text-onyx"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </ScreenBody>

      <BottomBar>
        <button
          type="button"
          onClick={() => onContinue(selected)}
          data-testid="state-next-btn"
          className="inline-flex w-full items-center justify-center gap-2 bg-onyx text-cream border border-gold rounded-[10px] font-display font-extrabold uppercase tracking-[0.14em] text-[14px] px-[26px] py-4 transition-transform duration-fast ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          <span>CONTINUE</span>
        </button>
      </BottomBar>
    </>
  );
}

// ---------------------------------------------------------------------------
// FocusPickerScreen (updated — FRO-22)
// Custom free-text entry removed: the chosen focus is now VOICED in the
// audio, so it must map to one of the 7 pp-focus-* clips. 7 presets only.
// Back affordance added (returns to state picker).
// ---------------------------------------------------------------------------

function FocusPickerScreen({
  initialFocus,
  onStart,
  onBack,
  focusOptions,
}: {
  initialFocus: string;
  onStart: (focus: string) => void;
  onBack: () => void;
  /** Sport-specific focus option strings from sportConfig.practiceFocusOptions. */
  focusOptions: readonly string[];
}) {
  const [selected, setSelected] = useState<string>(initialFocus);

  const readyToGo = selected.trim().length > 0;

  return (
    <>
      <ScreenBody>
        <SectionLabel>Practice day · Focus</SectionLabel>
        <h1 className="mb-1 font-heading text-[28px] font-bold leading-[1.12] text-cream">
          Pick one thing to own today.
        </h1>
        <p className="mb-5 font-body text-[14px] leading-relaxed text-cream/50">
          The audio names it. One focus, held the whole practice.
        </p>

        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label="Today's focus"
        >
          {focusOptions.map((option) => {
            const active = selected === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(option)}
                data-testid={`focus-option-${option}`}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left transition-colors duration-fast active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx ${
                  active
                    ? "border-gold/55 bg-gold/[0.06]"
                    : "border-hairline bg-charcoal"
                }`}
              >
                <span className="flex-1 font-heading text-[15px] font-semibold leading-tight text-cream">
                  {option}
                </span>
                <span
                  className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-[1.5px] transition-colors duration-fast ${
                    active
                      ? "border-gold bg-gold"
                      : "border-cream/20 bg-transparent"
                  }`}
                >
                  {active && (
                    <Icon
                      name="check"
                      size={11}
                      strokeWidth={3}
                      className="text-onyx"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </ScreenBody>

      <BottomBar
        secondary={
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-full items-center justify-center gap-1.5 font-heading text-[13px] font-medium text-cream/50 py-2 transition-colors duration-fast hover:text-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            aria-label="Back to state picker"
          >
            <Icon name="arrowLeft" size={14} />
            <span>Back</span>
          </button>
        }
      >
        {/* Coach-style CTA — native button so data-testid reaches the DOM. */}
        <button
          type="button"
          disabled={!readyToGo}
          onClick={() => {
            if (readyToGo) onStart(selected.trim());
          }}
          data-testid="start-practice-btn"
          className={`inline-flex w-full items-center justify-center gap-2 bg-onyx text-cream border border-gold rounded-[10px] font-display font-extrabold uppercase tracking-[0.14em] text-[14px] px-[26px] py-4 transition-transform duration-fast ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx disabled:cursor-not-allowed ${readyToGo ? "" : "opacity-45"}`}
        >
          <span>CONTINUE</span>
        </button>
      </BottomBar>
    </>
  );
}

// ---------------------------------------------------------------------------
// PrayerPickerScreen — prayer-style selector for pre-practice close
// Reuses PRAYER_STYLE_OPTIONS from types.ts; same two-card pattern as the
// pregame PrayerStyleScreen. "guided" is pre-selected so it's one tap to continue.
// ---------------------------------------------------------------------------

function PrayerPickerScreen({
  initialStyle,
  onContinue,
  onBack,
}: {
  initialStyle: PrayerStyle;
  onContinue: (style: PrayerStyle) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<PrayerStyle>(initialStyle);

  return (
    <>
      <ScreenBody>
        <SectionLabel>Practice day · Close</SectionLabel>
        <h1 className="mb-1 font-heading text-[28px] font-bold leading-[1.12] text-cream">
          How do you want to close?
        </h1>
        <p className="mb-5 font-body text-[14px] leading-relaxed text-cream/50">
          Both end in prayer. You choose how.
        </p>

        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label="Closing prayer style"
        >
          {PRAYER_STYLE_OPTIONS.map(({ value, label, sub }) => (
            <SelectCard
              key={value}
              label={label}
              sub={sub}
              selected={selected === value}
              onClick={() => setSelected(value)}
            />
          ))}
        </div>
      </ScreenBody>

      <BottomBar
        secondary={
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-full items-center justify-center gap-1.5 font-heading text-[13px] font-medium text-cream/50 py-2 transition-colors duration-fast hover:text-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            aria-label="Back to focus picker"
          >
            <Icon name="arrowLeft" size={14} />
            <span>Back</span>
          </button>
        }
      >
        <button
          type="button"
          onClick={() => onContinue(selected)}
          data-testid="prayer-picker-next-btn"
          className="inline-flex w-full items-center justify-center gap-2 bg-onyx text-cream border border-gold rounded-[10px] font-display font-extrabold uppercase tracking-[0.14em] text-[14px] px-[26px] py-4 transition-transform duration-fast ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          <span>START SESSION</span>
        </button>
      </BottomBar>
    </>
  );
}

// ---------------------------------------------------------------------------
// PracticeSessionScreen
// ---------------------------------------------------------------------------

// Fallback session duration (seconds) for the text-mode timer when the clip
// player is unavailable. Estimate for the FRO-22 state-aware session: opener +
// shared Beats 2–6 (incl. pp-be-vocal) + injected focus clip ≈ 2:45. When clips
// load normally the player uses the real total from clipPlayer.totalSec; this
// floor only governs the degraded text-only mode. Reconcile against the rendered
// manifest/sidecar totals after MP3 generation (AUDIO_CACHE_BUST=10).
const PRACTICE_SESSION_DURATION_S = 165;

function PracticeSessionScreen({
  focus,
  practiceState,
  prayerStyle,
  onBack,
  onDone,
  sport = "hockey",
}: {
  focus: string;
  practiceState: PracticeState;
  prayerStyle: PrayerStyle;
  /** Return to the focus picker (unmounts this component, triggering full
   *  AudioContext / wake-lock / rAF / interval cleanup automatically). */
  onBack: () => void;
  onDone: () => void;
  sport?: Sport;
}) {
  // Reduced-motion: read the media query once on mount. CSS transition is
  // stripped from the progress bar if the user prefers reduced motion.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Text-mode timer — fallback when clip player errors out.
  // intervalRef holds the active setInterval id so pause and unmount can
  // clear it. Without this, tapping pause stops the UI flag but NOT the
  // interval; resume then creates a second concurrent interval (2× elapsed).
  // Typed as number because window.setInterval returns a number in browser DOM.
  const intervalRef = useRef<number | null>(null);
  const [textElapsed, setTextElapsed] = useState(0);
  const [textPlaying, setTextPlaying] = useState(false);
  const [textCompleted, setTextCompleted] = useState(false);

  // Cleanup: clear text-mode interval on unmount so it never outlives the component.
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Wire practiceState + practiceFocus + prayerStyle into the clip player (FRO-22).
  // These are ephemeral — never persisted anywhere; they pass through
  // to resolvePracticePlaylist inside useClipPlayer.
  const clipPlayer = useClipPlayer({
    need: null,
    position: null,
    adversity: null,
    practice: true,
    practiceState,
    practiceFocus: focus,
    prayerStyle,
    sport,
    onCompleted: () => {
      /* completed state is read from clipPlayer.completed */
    },
  });

  // Text-mode wiring: 1-second interval, advances until PRACTICE_SESSION_DURATION_S.
  // Only active when the clip player errors.
  const isClipActive = !clipPlayer.error;

  // Start text-mode timer on play when clip player is unavailable.
  // Always clears any in-flight interval before creating a new one so that
  // rapid pause → play taps cannot accumulate concurrent intervals.
  const handleTextPlay = () => {
    if (textCompleted) return;
    // Clear any existing interval before starting a fresh one.
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTextPlaying(true);
    const id = window.setInterval(() => {
      setTextElapsed((e) => {
        const next = e + 1;
        if (next >= PRACTICE_SESSION_DURATION_S) {
          window.clearInterval(id);
          intervalRef.current = null;
          setTextPlaying(false);
          setTextCompleted(true);
          return PRACTICE_SESSION_DURATION_S;
        }
        return next;
      });
    }, 1000);
    intervalRef.current = id;
  };

  const togglePlay = () => {
    if (isClipActive) {
      if (clipPlayer.playing) {
        clipPlayer.pause();
      } else {
        clipPlayer.play();
      }
    } else {
      // Text-mode fallback: simple toggle.
      if (textPlaying) {
        // Pause: stop the interval so it doesn't keep advancing elapsed time
        // while the UI shows the paused state.
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTextPlaying(false);
      } else {
        handleTextPlay();
      }
    }
  };

  // Unified render values — prefer clip player values when active.
  const renderElapsed = isClipActive ? clipPlayer.elapsedSec : textElapsed;
  const renderTotal = isClipActive
    ? clipPlayer.totalSec > 0
      ? clipPlayer.totalSec
      : PRACTICE_SESSION_DURATION_S
    : PRACTICE_SESSION_DURATION_S;
  const renderPlaying = isClipActive ? clipPlayer.playing : textPlaying;
  const renderCompleted = isClipActive ? clipPlayer.completed : textCompleted;

  const clipLoading =
    isClipActive && !clipPlayer.ready && !renderCompleted;

  const remaining = Math.max(0, renderTotal - renderElapsed);
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);
  const remainingLabel = `${mm}:${String(ss).padStart(2, "0")}`;
  const pct =
    renderTotal > 0
      ? Math.min(100, (renderElapsed / renderTotal) * 100)
      : 0;

  return (
    <div
      className="relative flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-5"
      aria-busy={clipLoading}
      style={{
        background:
          "radial-gradient(80% 50% at 50% 20%, rgba(36,91,255,0.10), transparent 65%), radial-gradient(60% 40% at 50% 100%, rgba(223,175,55,0.06), transparent 70%), var(--fv-onyx)",
      }}
    >
      {/* Escape affordance — returns to the closing-prayer picker.
          Sits in the safe-area top-left, visually matches the picker's back
          arrow idiom. Absolutely positioned so it never shifts content layout.
          Teardown is implicit: unmounting this component closes the AudioContext,
          releases the wake lock, cancels the rAF loop, and clears the text-mode
          interval — all via their respective useEffect cleanup returns. */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to closing prayer"
        data-testid="practice-back-btn"
        className="absolute left-[13px] top-[14px] flex h-[44px] w-[44px] -m-[5px] items-center justify-center rounded-pill text-cream/60 transition-colors duration-fast hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx motion-safe:transition-transform active:scale-95"
      >
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
          <Icon name="arrowLeft" size={16} />
        </span>
      </button>

      <SectionLabel>Pre-practice · Guided Session</SectionLabel>

      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="font-heading text-[24px] font-bold leading-[1.15] text-cream">
          Two minutes. Lock in.
        </h1>
        <span className="font-mono text-[12px] tracking-[0.14em] text-cream/70">
          {remainingLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1 overflow-hidden rounded-full bg-cream/[0.08]">
        <div
          className="h-full bg-gold"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Session progress"
          style={{
            width: `${pct}%`,
            // Honour reduced-motion: skip the transition if the user prefers it.
            transition: prefersReducedMotion ? "none" : "width 500ms ease-out",
          }}
        />
      </div>

      {/* Focus card — the one focal element during the session.
          The focus is ALSO voiced in the audio (FRO-22), so the card
          and the narration agree. */}
      <div
        className="mb-6 flex-1 rounded-[18px] border border-hairline px-6 py-8"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 0%, rgba(223,175,55,0.07), transparent 60%), var(--fv-charcoal)",
        }}
      >
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-cream/40">
          Today&rsquo;s Focus
        </p>
        <p
          className="font-display text-[40px] font-extrabold uppercase leading-[1.0] tracking-[0.03em] text-gold"
          data-testid="practice-focus-display"
          style={{
            // Scale the text down gracefully for longer focus strings.
            fontSize: focus.length > 18 ? "clamp(22px, 5.5vw, 36px)" : undefined,
          }}
        >
          {focus}
        </p>
        <p className="mt-5 font-body text-[13px] leading-[1.55] text-cream/45">
          Eyes closed. The audio carries you. Come back to this when it lands.
        </p>
      </div>

      {/* Polite live region for screen readers — announces when decoding resolves. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {clipLoading ? "Preparing your session…" : ""}
      </div>

      <div className="flex flex-col gap-2.5">
        {!renderCompleted && (
          <button
            type="button"
            onClick={togglePlay}
            disabled={renderCompleted || clipLoading}
            aria-label={
              clipLoading
                ? "Preparing your session"
                : renderPlaying
                  ? "Pause session"
                  : "Play session"
            }
            data-testid="practice-play-pause-btn"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-gold text-onyx transition-transform duration-fast active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            <Icon name={renderPlaying ? "pause" : "play"} size={26} />
          </button>
        )}

        {renderCompleted && (
          <>
            <div className="mb-4 text-center">
              {prayerStyle === "self-guided" ? (
                <>
                  <p className="font-heading text-[20px] font-semibold leading-[1.2] text-cream">
                    Take your time.
                  </p>
                  <p className="mt-1.5 font-body text-[13px] text-cream/50">
                    Pray as long as you need. Tap done when you&rsquo;re ready.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-[22px] font-extrabold uppercase tracking-[0.04em] text-cream">
                    Go practice.
                  </p>
                  <p className="mt-1.5 font-body text-[13px] text-cream/50">
                    How you practice is how you play.
                  </p>
                </>
              )}
            </div>
            {/* Coach-style CTA — native button so data-testid reaches the DOM. */}
            <button
              type="button"
              onClick={onDone}
              data-testid="practice-done-btn"
              className="inline-flex w-full items-center justify-center gap-2 bg-onyx text-cream border border-gold rounded-[10px] font-display font-extrabold uppercase tracking-[0.14em] text-[14px] px-[26px] py-4 transition-transform duration-fast ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            >
              <span>DONE</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PracticeFlow — top-level component, exported for the /athlete/practice page
// ---------------------------------------------------------------------------

export function PracticeFlow({
  sport = "hockey",
}: {
  /**
   * The athlete's sport. Drives focus-option list and clip slug resolution.
   * Defaults to "hockey" so existing callers are unaffected until FV-27
   * wires athlete.sport from the DB.
   */
  sport?: Sport;
} = {}) {
  const sportConfig = getSportConfig(sport);

  const [view, setView] = useState<PracticeView>("state-picker");
  // practiceState + practiceFocus + prayerStyle are EPHEMERAL: useState only.
  // They are NEVER written to Supabase, localStorage, analytics, or any
  // network call. They pass through to useClipPlayer and die on unmount.
  const [practiceState, setPracticeState] = useState<PracticeState>("dialed-in");
  const [focus, setFocus] = useState<string>("");
  const [prayerStyle, setPrayerStyle] = useState<PrayerStyle>("guided");

  const handleStateContinue = (state: PracticeState) => {
    setPracticeState(state);
    setView("focus-picker");
  };

  const handleFocusStart = (chosenFocus: string) => {
    setFocus(chosenFocus);
    setView("prayer-picker");
  };

  const handlePrayerContinue = (chosenStyle: PrayerStyle) => {
    setPrayerStyle(chosenStyle);
    setView("session");
  };

  // Returns to the prayer picker from the session (back arrow visible).
  // Unmounting PracticeSessionScreen triggers useClipPlayer's cleanup (closes
  // AudioContext, releases wake lock, cancels rAF, clears text-mode intervalRef)
  // without any explicit teardown here.
  const handleBackToPrayer = () => {
    setView("prayer-picker");
  };

  // Returns to the state picker from the focus picker.
  const handleBackToState = () => {
    setView("state-picker");
  };

  // Returns to the focus picker from the prayer picker.
  const handleBackFromPrayer = () => {
    setView("focus-picker");
  };

  const handleDone = () => {
    // Navigate back to the athlete home. We use window.location for simplicity
    // since this component is already a leaf in a server-rendered route tree
    // and no router state needs to be preserved.
    window.location.href = "/athlete";
  };

  return (
    <PregameShell>
      {/* Minimal header — only shown on picker screens.
          Session screen is intentionally header-free (one focal element). */}
      {(view === "state-picker" || view === "focus-picker" || view === "prayer-picker") && (
        <div className="sticky top-0 z-10 border-b border-hairline bg-onyx/80 backdrop-blur-md">
          <div className="flex items-center gap-3 px-[18px] pb-3 pt-[58px]">
            {view === "state-picker" ? (
              <a
                href="/athlete"
                aria-label="Back to home"
                className="flex h-[44px] w-[44px] flex-none -m-[5px] items-center justify-center rounded-pill text-cream transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              >
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
                  <Icon name="arrowLeft" size={16} />
                </span>
              </a>
            ) : view === "focus-picker" ? (
              <button
                type="button"
                onClick={handleBackToState}
                aria-label="Back to state picker"
                className="flex h-[44px] w-[44px] flex-none -m-[5px] items-center justify-center rounded-pill text-cream transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              >
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
                  <Icon name="arrowLeft" size={16} />
                </span>
              </button>
            ) : (
              /* prayer-picker */
              <button
                type="button"
                onClick={handleBackFromPrayer}
                aria-label="Back to focus picker"
                className="flex h-[44px] w-[44px] flex-none -m-[5px] items-center justify-center rounded-pill text-cream transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              >
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
                  <Icon name="arrowLeft" size={16} />
                </span>
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-gold">
                Pre-Practice
              </div>
              <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Lock In
              </div>
            </div>
          </div>
          {/* Thin rule only — no step progress bar for this lean flow */}
          <div className="h-0.5 bg-cream/[0.06]" />
        </div>
      )}

      {/* key={view} remounts this wrapper on every screen transition so the
          fv-step-in keyframe fires fresh on each new screen. flex-1 + flex-col
          preserve the PregameShell flex layout. CSS-only; respects
          prefers-reduced-motion (see globals.css). */}
      <div key={view} className="animate-step-in flex flex-1 flex-col">
        {view === "state-picker" && (
          <StatePickerScreen
            initialState={practiceState}
            onContinue={handleStateContinue}
          />
        )}
        {view === "focus-picker" && (
          <FocusPickerScreen
            initialFocus={focus}
            onStart={handleFocusStart}
            onBack={handleBackToState}
            focusOptions={sportConfig.practiceFocusOptions}
          />
        )}
        {view === "prayer-picker" && (
          <PrayerPickerScreen
            initialStyle={prayerStyle}
            onContinue={handlePrayerContinue}
            onBack={handleBackFromPrayer}
          />
        )}
        {view === "session" && (
          <PracticeSessionScreen
            focus={focus}
            practiceState={practiceState}
            prayerStyle={prayerStyle}
            onBack={handleBackToPrayer}
            onDone={handleDone}
            sport={sport}
          />
        )}
      </div>
    </PregameShell>
  );
}
