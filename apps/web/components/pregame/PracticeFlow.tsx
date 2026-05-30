"use client"; // client: Web Audio API (useClipPlayer), useState, user-event handlers

// Pre-practice "Get To" flow — lean two-screen state machine.
//
// Screen 1 – FocusPicker:
//   "Pick one thing to own today." — single tap from PRACTICE_FOCUS_OPTIONS,
//   or type a custom focus. One tap advances to the session.
//
// Screen 2 – PracticeSession:
//   Plays the fixed 5-clip `practice` playlist (~2.5 min) via useClipPlayer
//   (practice: true). The athlete's chosen focus is shown prominently —
//   it is NOT voiced; they read it. Progress bar + remaining time + play/pause
//   chrome reused from AudioSessionScreen idiom. On completion: send-off +
//   back-to-home button.
//
// No journal, no scripture reflection, no rhythm surface. One setup tap, then go.

import { useEffect, useRef, useState } from "react";

import { PRACTICE_FOCUS_OPTIONS } from "./types";
import { useClipPlayer } from "./useClipPlayer";
import {
  BottomBar,
  CustomInputRow,
  Icon,
  PregameShell,
  SectionLabel,
  ScreenBody,
} from "./shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PracticeView = "picker" | "session";

// ---------------------------------------------------------------------------
// FocusPickerScreen
// ---------------------------------------------------------------------------

function FocusPickerScreen({
  initialFocus = "",
  onStart,
}: {
  /** Pre-selects a previously-chosen focus when returning from the session
   *  screen so the athlete can re-start with one tap or quickly swap. */
  initialFocus?: string;
  onStart: (focus: string) => void;
}) {
  const [selected, setSelected] = useState<string>(initialFocus);
  // Custom input value — only active when selected is not in PRACTICE_FOCUS_OPTIONS.
  const [customValue, setCustomValue] = useState(
    initialFocus && !PRACTICE_FOCUS_OPTIONS.includes(initialFocus) ? initialFocus : "",
  );

  const isCustom =
    !!selected && !PRACTICE_FOCUS_OPTIONS.includes(selected);

  const handleOptionTap = (option: string) => {
    setSelected(option);
    // Clear custom text when switching to a preset option.
    setCustomValue("");
  };

  const handleCustomChange = (v: string) => {
    setCustomValue(v);
    setSelected(v);
  };

  const readyToGo = selected.trim().length > 0;

  return (
    <>
      <ScreenBody>
        <SectionLabel>Practice day</SectionLabel>
        <h1 className="mb-1 font-heading text-[28px] font-bold leading-[1.12] text-cream">
          Pick one thing to own today.
        </h1>
        <p className="mb-5 font-body text-[14px] leading-relaxed text-cream/50">
          The audio will cue you to bring it. One focus, held the whole practice.
        </p>

        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Today's focus">
          {PRACTICE_FOCUS_OPTIONS.map((option) => {
            const active = selected === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handleOptionTap(option)}
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

          <CustomInputRow
            value={isCustom ? customValue : ""}
            selected={isCustom}
            onChange={handleCustomChange}
            placeholder="Write your own focus"
            ariaLabel="Write your own practice focus"
          />
        </div>
      </ScreenBody>

      <BottomBar>
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
          <span>START SESSION</span>
        </button>
      </BottomBar>
    </>
  );
}

// ---------------------------------------------------------------------------
// PracticeSessionScreen
// ---------------------------------------------------------------------------

// Fallback session duration used by the text-mode timer when the clip player
// is unavailable. The 5 pp clips sum to ~153 s; 150 is a round safe floor.
const PRACTICE_SESSION_DURATION_S = 150;

function PracticeSessionScreen({
  focus,
  onBack,
  onDone,
}: {
  focus: string;
  /** Return to the focus picker (unmounts this component, triggering full
   *  AudioContext / wake-lock / rAF / interval cleanup automatically). */
  onBack: () => void;
  onDone: () => void;
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

  const clipPlayer = useClipPlayer({
    // Practice mode: need/position/adversity are not used.
    need: null,
    position: null,
    adversity: null,
    practice: true,
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
      {/* Escape affordance — returns to focus picker.
          Sits in the safe-area top-left, visually matches the picker's back
          arrow idiom. Absolutely positioned so it never shifts content layout.
          Teardown is implicit: unmounting this component closes the AudioContext,
          releases the wake lock, cancels the rAF loop, and clears the text-mode
          interval — all via their respective useEffect cleanup returns. */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to focus"
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
          NOT voiced; the athlete reads it while listening. */}
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
              <p className="font-display text-[22px] font-extrabold uppercase tracking-[0.04em] text-cream">
                Go practice.
              </p>
              <p className="mt-1.5 font-body text-[13px] text-cream/50">
                How you practice is how you play.
              </p>
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

export function PracticeFlow() {
  const [view, setView] = useState<PracticeView>("picker");
  const [focus, setFocus] = useState<string>("");

  const handleStart = (chosenFocus: string) => {
    setFocus(chosenFocus);
    setView("session");
  };

  // Returns to the picker with the previously-selected focus still held in
  // state. The picker re-highlights the prior selection so a re-pick (or
  // immediate re-start) is a single tap. No audio/context teardown needed here:
  // switching view to "picker" unmounts PracticeSessionScreen, which triggers
  // useClipPlayer's cleanup effect (closes AudioContext, releases wake lock,
  // cancels rAF) and the text-mode intervalRef cleanup.
  const handleBack = () => {
    setView("picker");
  };

  const handleDone = () => {
    // Navigate back to the athlete home. We use window.location for simplicity
    // since this component is already a leaf in a server-rendered route tree
    // and no router state needs to be preserved.
    window.location.href = "/athlete";
  };

  return (
    <PregameShell>
      {/* Minimal header — just the back/close affordance.
          Practice flow is intentionally header-free during the session
          (one focal element); only the picker screen shows nav context. */}
      {view === "picker" && (
        <div className="sticky top-0 z-10 border-b border-hairline bg-onyx/80 backdrop-blur-md">
          <div className="flex items-center gap-3 px-[18px] pb-3 pt-[58px]">
            <a
              href="/athlete"
              aria-label="Back to home"
              className="flex h-[44px] w-[44px] flex-none -m-[5px] items-center justify-center rounded-pill text-cream transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            >
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
                <Icon name="arrowLeft" size={16} />
              </span>
            </a>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-gold">
                Pre-Practice
              </div>
              <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Get To
              </div>
            </div>
          </div>
          {/* Thin rule only — no step progress bar for this lean flow */}
          <div className="h-0.5 bg-cream/[0.06]" />
        </div>
      )}

      {view === "picker" && <FocusPickerScreen initialFocus={focus} onStart={handleStart} />}
      {view === "session" && (
        <PracticeSessionScreen focus={focus} onBack={handleBack} onDone={handleDone} />
      )}
    </PregameShell>
  );
}
