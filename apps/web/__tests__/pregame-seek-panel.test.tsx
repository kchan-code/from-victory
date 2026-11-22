/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { AudioSessionScreen } from "@/components/pregame/screens-b";
import { HOCKEY_CONFIG } from "@/components/pregame/sport-registry";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";

const clipPlayerState = {
  ready: true,
  nativeNarrationPlayer: null as unknown,
  playing: false,
  completed: false,
  elapsedSec: 20,
  totalSec: 90,
  error: null as string | null,
  timeline: null,
  seekTo: vi.fn(),
  skipBackward15: vi.fn(),
  skipForward15: vi.fn(),
  hasStepNavigation: false,
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
  clipPlayerState.ready = true;
  clipPlayerState.nativeNarrationPlayer = null;
  clipPlayerState.playing = false;
  clipPlayerState.completed = false;
  clipPlayerState.elapsedSec = 20;
  clipPlayerState.totalSec = 90;
  clipPlayerState.error = null;
  clipPlayerState.timeline = null;
  clipPlayerState.hasStepNavigation = false;
});

describe("AudioSessionScreen seek panel (FV-781)", () => {
  it("shows scrubber + skip controls in clip mode with accessibility labels", () => {
    render(
      <AudioSessionScreen
        state={makeState()}
        set={vi.fn()}
        onContinue={vi.fn()}
        sportConfig={HOCKEY_CONFIG}
        sport="hockey"
      />,
    );

    expect(screen.getByLabelText(/scrub guided session position/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip back 15 seconds/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip forward 15 seconds/i })).toBeInTheDocument();
  });

  it("disables scrubber while audio is still preparing", () => {
    clipPlayerState.ready = false;
    render(
      <AudioSessionScreen
        state={makeState()}
        set={vi.fn()}
        onContinue={vi.fn()}
        sportConfig={HOCKEY_CONFIG}
        sport="hockey"
      />,
    );

    expect(screen.getByLabelText(/scrub guided session position/i)).toBeDisabled();
  });

  it("hides scrubber + skip controls after completion and on native playback", () => {
    clipPlayerState.completed = true;
    const { rerender } = render(
      <AudioSessionScreen
        state={makeState({ audioCompleted: false })}
        set={vi.fn()}
        onContinue={vi.fn()}
        sportConfig={HOCKEY_CONFIG}
        sport="hockey"
      />,
    );
    expect(screen.queryByLabelText(/scrub guided session position/i)).not.toBeInTheDocument();

    clipPlayerState.completed = false;
    // reason: this branch check only needs a truthy native player marker.
    clipPlayerState.nativeNarrationPlayer = new EventTarget();
    rerender(
      <AudioSessionScreen
        state={makeState({ audioCompleted: false })}
        set={vi.fn()}
        onContinue={vi.fn()}
        sportConfig={HOCKEY_CONFIG}
        sport="hockey"
      />,
    );
    expect(screen.queryByLabelText(/scrub guided session position/i)).not.toBeInTheDocument();
  });
});
