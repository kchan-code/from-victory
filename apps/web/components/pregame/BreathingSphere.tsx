"use client";

import { useEffect, useRef, useState } from "react";

// 4-in / 6-out box-breathing variant. Cobalt-glowing orb that resolves to a
// gold "Ready" state on completion. PETTLEP-friendly: visual + numeric cue.
//
// Two modes:
//   1. Standalone (default) — sphere owns the timer. User taps to start;
//      sphere cycles rounds via rAF; calls onComplete on natural finish.
//   2. Controlled — parent supplies phase + t + round (and isPlaying for
//      hint state). Used when audio drives the rhythm: BreathScreen reads
//      audio.currentTime, maps it to phase/t via the timeline JSON, and
//      passes it down. Internal timer is disabled.

type Phase = "idle" | "inhale" | "exhale" | "done";

export type ControlledBreath = {
  phase: Phase;
  // 0..1 within the current phase.
  t: number;
  // Current/last round index (0-based).
  round: number;
  // True while audio is playing; affects pip + label hints.
  isPlaying: boolean;
};

export function BreathingSphere({
  rounds = 4,
  inhale = 4,
  exhale = 6,
  size = 280,
  autoStart = false,
  onComplete,
  compact = false,
  controlled,
  onTap,
}: {
  rounds?: number;
  inhale?: number;
  exhale?: number;
  size?: number;
  autoStart?: boolean;
  onComplete?: () => void;
  compact?: boolean;
  controlled?: ControlledBreath;
  // Optional click handler. When set, sphere becomes tappable in
  // controlled mode (parent decides what to do — typically start audio).
  // Standalone mode ignores this; it owns its own click → start path.
  onTap?: () => void;
}) {
  const isControlled = !!controlled;

  // ── Internal state (standalone mode) ─────────────────────────────────
  const [running, setRunning] = useState(autoStart);
  const [phaseInternal, setPhaseInternal] = useState<Phase>("idle");
  const [roundInternal, setRoundInternal] = useState(0);
  const [tInternal, setTInternal] = useState(0);
  const rafRef = useRef<number | null>(null);
  // Holds the setTimeout id for the ~600ms "done" state hold before calling
  // onComplete. Cancelled on cleanup so it never fires after unmount.
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isControlled) return;
    if (!running) return;
    if (phaseInternal === "idle") {
      setPhaseInternal("inhale");
      setRoundInternal(0);
      return;
    }
    if (phaseInternal === "done") return;

    const dur = (phaseInternal === "inhale" ? inhale : exhale) * 1000;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const p = Math.min(1, elapsed / dur);
      setTInternal(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (phaseInternal === "inhale") {
        setPhaseInternal("exhale");
      } else {
        const next = roundInternal + 1;
        if (next >= rounds) {
          setPhaseInternal("done");
          setRunning(false);
          // ~600ms hold on the gold "Ready." state before calling onComplete.
          // Lets the athlete see the completion before auto-advance. The
          // holdTimeoutRef is cancelled in the cleanup return below on unmount.
          holdTimeoutRef.current = setTimeout(() => {
            onCompleteRef.current?.();
          }, 600);
        } else {
          setRoundInternal(next);
          setPhaseInternal("inhale");
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
    };
  }, [phaseInternal, running, roundInternal, inhale, exhale, rounds, isControlled]);

  // ── Resolve display state from whichever source is active ──────────────
  const phase: Phase = isControlled ? controlled.phase : phaseInternal;
  const round = isControlled ? controlled.round : roundInternal;
  const t = isControlled ? controlled.t : tInternal;
  const isPlaying = isControlled ? controlled.isPlaying : running;

  const ease = (x: number) =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  let scale = 0.55;
  if (phase === "inhale") scale = 0.55 + 0.45 * ease(t);
  else if (phase === "exhale") scale = 1.0 - 0.45 * ease(t);
  else if (phase === "done") scale = 0.78;

  const phaseDur = phase === "inhale" ? inhale : phase === "exhale" ? exhale : 0;
  const countdown = phaseDur > 0 ? Math.max(1, Math.ceil(phaseDur - phaseDur * t)) : 0;

  // In controlled mode, the "idle" phase means the audio file is loaded
  // but hasn't started yet OR it's in the intro segment before the first
  // breath cue. Different copy in each case.
  const idleLabel = isControlled
    ? isPlaying
      ? "" // intro narration playing; let voice carry the moment
      : "Begin"
    : "Begin";
  const idleSub = isControlled
    ? isPlaying
      ? "Settling"
      : "Tap to begin"
    : "Tap to begin";
  const label =
    phase === "idle"
      ? idleLabel
      : phase === "inhale"
        ? "Inhale"
        : phase === "exhale"
          ? "Exhale"
          : "Ready";
  const sub =
    phase === "idle"
      ? idleSub
      : phase === "inhale"
        ? "Receive"
        : phase === "exhale"
          ? "Release"
          : "Settled";

  const isDone = phase === "done";

  const ringColor = isDone ? "rgba(223,175,55,0.32)" : "rgba(36,91,255,0.22)";
  const ringColor2 = isDone ? "rgba(223,175,55,0.18)" : "rgba(36,91,255,0.12)";
  const glow = isDone
    ? "radial-gradient(circle at 50% 38%, rgba(244,194,79,0.55), rgba(223,175,55,0.10) 60%, transparent 75%)"
    : "radial-gradient(circle at 50% 38%, rgba(61,114,255,0.70), rgba(36,91,255,0.18) 55%, transparent 78%)";
  const orbBorder = isDone ? "rgba(223,175,55,0.55)" : "rgba(61,114,255,0.55)";

  const handleClick = () => {
    if (isControlled) {
      // Controlled mode: only respond to taps when idle + not yet
      // playing. Parent (onTap) starts the audio. After play begins,
      // the sphere is non-interactive — the audio runs to completion or
      // the user backs out via the header.
      if (!isPlaying && phase === "idle" && onTap) onTap();
      return;
    }
    if (phase === "done") return;
    if (!running) {
      setRunning(true);
      if (phase === "idle") setPhaseInternal("inhale");
    }
  };

  const interactive = isControlled
    ? !isPlaying && phase === "idle" && !!onTap
    : !isDone;

  return (
    <div
      {...(interactive
        ? {
            role: "button" as const,
            tabIndex: 0,
            "aria-label":
              phase === "idle"
                ? "Start guided breathing"
                : `${label}: ${countdown} seconds`,
            onClick: handleClick,
            onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            },
          }
        : {
            "aria-label":
              phase === "done"
                ? "Breathing complete"
                : `${label}${countdown > 0 ? `: ${countdown} seconds` : ""}`,
          })}
      className="relative flex flex-none items-center justify-center"
      style={{ width: size, height: size, cursor: interactive ? "pointer" : "default" }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full transition-colors duration-slow"
        style={{
          border: `1px solid ${ringColor2}`,
          transform: `scale(${0.92 + scale * 0.08})`,
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full transition-colors duration-slow"
        style={{
          inset: size * 0.08,
          border: `1px solid ${ringColor}`,
          transform: `scale(${0.85 + scale * 0.15})`,
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: size * 0.94,
          height: size * 0.94,
          background: glow,
          filter: "blur(20px)",
          opacity: isDone ? 0.85 : 0.4 + scale * 0.6,
          transform: `scale(${0.6 + scale * 0.6})`,
        }}
      />
      <div
        className="pointer-events-none absolute flex flex-col items-center justify-center rounded-full transition-[background,border-color,box-shadow] duration-slow"
        style={{
          width: size * 0.74,
          height: size * 0.74,
          background: `${glow}, radial-gradient(circle at 30% 25%, rgba(247,247,247,0.10), rgba(247,247,247,0) 50%), #0a1228`,
          border: `1px solid ${orbBorder}`,
          boxShadow: isDone
            ? "inset 0 0 60px rgba(223,175,55,0.20), 0 0 60px rgba(223,175,55,0.18)"
            : "inset 0 0 60px rgba(36,91,255,0.30), 0 0 80px rgba(36,91,255,0.20)",
          transform: `scale(${scale})`,
        }}
      >
        <span
          className={`font-display font-extrabold uppercase leading-none tracking-[0.06em] transition-colors duration-slow ${
            isDone ? "text-gold" : "text-cream"
          }`}
          style={{ fontSize: compact ? 30 : 40 }}
        >
          {label}
        </span>
        <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cream/50">
          {sub}
        </span>
        {!isDone && isPlaying && countdown > 0 && (
          <span className="mt-2.5 font-mono text-[11px] tracking-[0.16em] text-cream/40">
            {countdown}
          </span>
        )}
      </div>

      {!compact && (
        <div className="pointer-events-none absolute -bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: rounds }).map((_, i) => (
            <div
              key={i}
              className="h-[3px] w-[18px] rounded-sm transition-colors duration-base"
              style={{
                background:
                  i < round || isDone
                    ? "var(--fv-gold)"
                    : i === round && isPlaying
                      ? "rgba(61,114,255,0.65)"
                      : "rgba(247,247,247,0.10)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
