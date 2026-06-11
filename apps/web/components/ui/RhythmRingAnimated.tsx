"use client";

import { useEffect, useState } from "react";

import { RhythmRing } from "./RhythmRing";

interface RhythmRingAnimatedProps {
  pct: number;
  /** Starting pct for the animation (default 0 — fires the mount animation). */
  from?: number;
  size?: number;
  stroke?: number;
  label?: string;
  dayNumber?: number;
  totalDays?: number;
}

/**
 * Thin client wrapper around RhythmRing that animates the arc on every mount.
 * Starts at `from` (default 0) and transitions to `pct` via the existing
 * 720ms `duration-prayer` transition baked into RhythmRing.
 *
 * Use `from` in the completion overlay to animate from the previous arc
 * position to the new one (e.g. from=33 pct=40 after completing day 10).
 */
export function RhythmRingAnimated({
  pct,
  from = 0,
  ...rest
}: RhythmRingAnimatedProps) {
  const [displayPct, setDisplayPct] = useState(from);

  useEffect(() => {
    // Double-rAF: the outer frame lets React commit the initial `from` state to
    // the DOM; the inner frame fires after the browser has painted that state,
    // giving the CSS transition a real before/after to animate across.
    // A single rAF can be batched into the same paint on iOS Safari under load.
    let id2: number;
    const id = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setDisplayPct(pct));
    });
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(id2);
    };
  }, [pct]);

  return <RhythmRing pct={displayPct} {...rest} />;
}
