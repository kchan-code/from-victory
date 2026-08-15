/**
 * @vitest-environment jsdom
 */
// FV-488 — visible generating/loading state while the session audio decodes.
//
// A beta tester couldn't tell whether the app was working or stuck. The
// "Preparing your session…" copy existed only in an sr-only live region and the
// play button's aria-label, so the sighted athlete saw nothing but a dimmed
// button. These tests pin the three properties that made it a bug:
//
//   1. the preparing state is VISIBLE (not sr-only) while loading;
//   2. Play stays disabled until ready;
//   3. there is exactly ONE live region, so AT isn't told twice.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PreparingIndicator } from "@/components/pregame/shared";
import { AudioSessionScreen } from "@/components/pregame/screens-b";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";
import { HOCKEY_CONFIG } from "@/components/pregame/sport-registry";

// Clip player mock — `ready: false` with no error is the "still decoding"
// state, which is exactly the window FV-488 is about.
const clipPlayerState = {
  ready: false,
  playing: false,
  completed: false,
  elapsedSec: 0,
  totalSec: 0,
  error: null as string | null,
  timeline: null,
  play: vi.fn(),
  pause: vi.fn(),
};

vi.mock("@/components/pregame/useClipPlayer", () => ({
  useClipPlayer: () => clipPlayerState,
}));

vi.mock("@/components/pregame/audio-precache", () => ({
  checkPregameAudioCached: vi
    .fn()
    .mockResolvedValue({ cached: 0, total: 0, done: false, error: null }),
  precachePregameAudio: vi.fn(),
}));

function makeState(overrides: Partial<PregameState> = {}): PregameState {
  return {
    ...INITIAL_STATE,
    need: "Confidence",
    role: "Forward",
    adversity: "I feel nervous.",
    anchor: "Long exhale",
    selfTalk: "Stay steady. Make the next play.",
    cueWord: "Faithful",
    prayerStyle: "guided",
    audioCompleted: false,
    positivePlays: [],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ─── The component ───────────────────────────────────────────────────────────

describe("PreparingIndicator (FV-488)", () => {
  it("shows the label VISIBLY while loading — not sr-only", () => {
    render(<PreparingIndicator loading />);
    const el = screen.getByTestId("preparing-indicator");
    expect(el).toHaveTextContent(/preparing your session/i);
    // The regression was that this text was reachable ONLY to assistive tech.
    expect(el.className).not.toMatch(/\bsr-only\b/);
    expect(screen.getByText(/preparing your session/i).className).not.toMatch(
      /\bsr-only\b/,
    );
  });

  it("stays mounted but empty when not loading, so the live region is reliable", () => {
    render(<PreparingIndicator loading={false} />);
    const el = screen.getByTestId("preparing-indicator");
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("");
  });

  it("reserves its height in both states so resolving doesn't shift layout", () => {
    const { rerender } = render(<PreparingIndicator loading />);
    const loadingClass = screen.getByTestId("preparing-indicator").className;
    rerender(<PreparingIndicator loading={false} />);
    expect(screen.getByTestId("preparing-indicator").className).toBe(loadingClass);
    expect(loadingClass).toMatch(/h-\[18px\]/);
  });

  it("is a polite live region and suppresses its animation under reduced motion", () => {
    render(<PreparingIndicator loading />);
    const el = screen.getByTestId("preparing-indicator");
    expect(el).toHaveAttribute("role", "status");
    expect(el).toHaveAttribute("aria-live", "polite");
    // The pulse dot opts out of animation for prefers-reduced-motion users.
    const dot = el.querySelector("[aria-hidden='true']");
    expect(dot?.className).toMatch(/motion-reduce:animate-none/);
  });
});

// ─── Wired into the pregame surface ──────────────────────────────────────────

describe("AudioSessionScreen preparing state (FV-488)", () => {
  it("renders the visible preparing state and keeps Play disabled", () => {
    render(
      <AudioSessionScreen
        state={makeState()}
        set={vi.fn()}
        onContinue={vi.fn()}
        sportConfig={HOCKEY_CONFIG}
        sport="hockey"
      />,
    );

    expect(screen.getByTestId("preparing-indicator")).toHaveTextContent(
      /preparing your session/i,
    );

    const playBtn = screen.getByRole("button", { name: /preparing your session/i });
    expect(playBtn).toBeDisabled();
  });

  it("has exactly one live region while preparing — AT is not told twice", () => {
    const { container } = render(
      <AudioSessionScreen
        state={makeState()}
        set={vi.fn()}
        onContinue={vi.fn()}
        sportConfig={HOCKEY_CONFIG}
        sport="hockey"
      />,
    );
    // The old sr-only region was replaced, not supplemented.
    expect(container.querySelectorAll("[aria-live]")).toHaveLength(1);
    expect(container.querySelectorAll(".sr-only[aria-live]")).toHaveLength(0);
  });
});
