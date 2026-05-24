"use client";

import { useEffect, useRef, useState } from "react";

// Stable callback ref pattern: the parent passes a fresh `onComplete` closure
// on every render (sets `breathDone` in state, which re-renders the parent).
// If we put `onComplete` in the rAF effect's dep array, every parent render
// tears down the in-flight breathing animation and re-arms it — visible glitch
// at the end of a phase. We mirror the latest closure into a ref instead so
// the effect depends only on actual breathing state.

// 4-in / 6-out box-breathing variant. Cobalt-glowing orb that resolves to a
// gold "Ready" state on completion. PETTLEP-friendly: visual + numeric cue.

type Phase = "idle" | "inhale" | "exhale" | "done";

export function BreathingSphere({
  rounds = 4,
  inhale = 4,
  exhale = 6,
  size = 280,
  autoStart = false,
  onComplete,
  compact = false,
}: {
  rounds?: number;
  inhale?: number;
  exhale?: number;
  size?: number;
  autoStart?: boolean;
  onComplete?: () => void;
  compact?: boolean;
}) {
  const [running, setRunning] = useState(autoStart);
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!running) return;
    if (phase === "idle") {
      setPhase("inhale");
      setRound(0);
      return;
    }
    if (phase === "done") return;

    const dur = (phase === "inhale" ? inhale : exhale) * 1000;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const p = Math.min(1, elapsed / dur);
      setT(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (phase === "inhale") {
        setPhase("exhale");
      } else {
        const next = round + 1;
        if (next >= rounds) {
          setPhase("done");
          setRunning(false);
          onCompleteRef.current?.();
        } else {
          setRound(next);
          setPhase("inhale");
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, running, round, inhale, exhale, rounds]);

  const ease = (x: number) =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  let scale = 0.55;
  if (phase === "inhale") scale = 0.55 + 0.45 * ease(t);
  else if (phase === "exhale") scale = 1.0 - 0.45 * ease(t);
  else if (phase === "done") scale = 0.78;

  const phaseDur = phase === "inhale" ? inhale : phase === "exhale" ? exhale : 0;
  const countdown = phaseDur > 0 ? Math.max(1, Math.ceil(phaseDur - phaseDur * t)) : 0;

  const label =
    phase === "idle" ? "Begin" : phase === "inhale" ? "Inhale" : phase === "exhale" ? "Exhale" : "Ready";
  const sub =
    phase === "idle"
      ? "Tap to begin"
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
    if (phase === "done") return;
    if (!running) {
      setRunning(true);
      if (phase === "idle") setPhase("inhale");
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={
        phase === "idle"
          ? "Start guided breathing"
          : phase === "done"
            ? "Breathing complete"
            : `${label}: ${countdown} seconds`
      }
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="relative flex flex-none items-center justify-center"
      style={{ width: size, height: size, cursor: isDone ? "default" : "pointer" }}
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
        {!isDone && running && countdown > 0 && (
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
                    : i === round && running
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
