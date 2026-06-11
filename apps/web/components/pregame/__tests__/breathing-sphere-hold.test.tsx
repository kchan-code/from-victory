/**
 * @vitest-environment jsdom
 */
// FV-222 — regression: the ~600ms "Ready." hold before onComplete.
//
// The hold is a setTimeout scheduled inside the rAF tick that also flips
// phase → "done" and running → false. That state change re-runs the rAF
// effect, so clearing the hold timeout in THAT effect's cleanup cancels it
// the moment it is set and onComplete never fires (the breath step never
// auto-advances — qa-reviewer BLOCK on PR #190). The hold timeout must be
// cleared only on unmount. These tests pin the fixed behaviour:
//
//   1. natural finish → onComplete fires exactly once, after the ~600ms hold
//   2. unmount during the hold → onComplete never fires
//   3. controlled mode → the standalone timer path never runs at all

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";

import { BreathingSphere } from "@/components/pregame/BreathingSphere";

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
      "Date",
    ],
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// Advance fake time in small steps, each inside act(), so React flushes the
// state updates + effect re-runs that the rAF ticks trigger between phases
// (inhale → exhale → done each install a fresh effect).
function runMs(total: number, step = 50) {
  for (let elapsed = 0; elapsed < total; elapsed += step) {
    act(() => {
      vi.advanceTimersByTime(step);
    });
  }
}

describe("BreathingSphere standalone hold (FV-222)", () => {
  it("fires onComplete once, ~600ms after the final exhale", () => {
    const onComplete = vi.fn();
    render(
      <BreathingSphere
        autoStart
        rounds={1}
        inhale={1}
        exhale={1}
        onComplete={onComplete}
      />,
    );

    // Full round (1s in + 1s out) with rAF headroom: hold scheduled, not fired.
    runMs(2200);
    expect(onComplete).not.toHaveBeenCalled();

    // The ~600ms hold elapses.
    runMs(700);
    expect(onComplete).toHaveBeenCalledTimes(1);

    // No double-fire later.
    runMs(2000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not fire onComplete when unmounted during the hold", () => {
    const onComplete = vi.fn();
    const { unmount } = render(
      <BreathingSphere
        autoStart
        rounds={1}
        inhale={1}
        exhale={1}
        onComplete={onComplete}
      />,
    );

    runMs(2200); // finish the round; hold scheduled
    unmount();
    runMs(1500);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("never runs the standalone timer in controlled mode", () => {
    const onComplete = vi.fn();
    render(
      <BreathingSphere
        controlled={{ phase: "done", t: 1, round: 3, isPlaying: false }}
        onComplete={onComplete}
      />,
    );
    runMs(5000);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
