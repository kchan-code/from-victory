/**
 * @vitest-environment jsdom
 */
// FV-229 — RTL test for the cue-word verse row on PregameCardScreen.
// Verifies the hidden → tap → revealed state machine, exact copy, and
// confirms zero tracking side-effects (a localStorage.setItem spy asserts
// nothing persists, and unmount/remount proves the reveal is stateless).

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { PregameCardScreen } from "@/components/pregame/screens-b";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";
import { HOCKEY_CONFIG } from "@/components/pregame/sport-registry";

// Minimal complete state so the card renders without errors.
function makeState(overrides: Partial<PregameState> = {}): PregameState {
  return {
    ...INITIAL_STATE,
    breathDone: true,
    need: "Confidence",
    role: "Forward",
    positivePlays: ["viz-forward-win-the-wall"],
    adversity: "I take a bad penalty",
    anchor: "Long exhale",
    selfTalk: "You are secure. Take the next faithful action.",
    cueWord: "Faithful",
    prayerStyle: "guided",
    audioCompleted: true,
    ...overrides,
  };
}

const noop = vi.fn();

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CueWordVerseRow — initial hidden state", () => {
  it("renders the row label", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.getByText("Your word, and the verse under it.")).toBeInTheDocument();
  });

  it("shows the before-reveal training prompt", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(
      screen.getByText(/Walking out now\? Read it and go/i),
    ).toBeInTheDocument();
  });

  it("shows a tap-to-reveal affordance before reveal", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.getByText(/Tap to reveal/i)).toBeInTheDocument();
  });

  it("does NOT show the verse text before reveal", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    // The verbatim verse text must not be visible before the tap.
    expect(
      screen.queryByText(/The one who calls you is faithful/i),
    ).not.toBeInTheDocument();
  });
});

describe("CueWordVerseRow — after tap reveal", () => {
  it("reveals the reference and verbatim verse text on tap", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);

    fireEvent.click(screen.getByTestId("verse-reveal-btn"));

    expect(screen.getByTestId("verse-revealed")).toBeInTheDocument();
    expect(screen.getByText("1 Thessalonians 5:24")).toBeInTheDocument();
    expect(
      screen.getByText("The one who calls you is faithful, and he will do it."),
    ).toBeInTheDocument();
  });

  it("shows the after-reveal coaching line", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);

    fireEvent.click(screen.getByTestId("verse-reveal-btn"));

    // Function matcher keeps the assertion robust to inline markup splits.
    expect(
      screen.getByText((text) =>
        text.includes("you ran the rep") && text.includes("tomorrow"),
      ),
    ).toBeInTheDocument();
  });

  it("writes nothing to localStorage during the full reveal sequence", () => {
    // This jsdom setup ships no window.localStorage — install a spy stub so
    // any persistence attempt during the reveal is observable.
    const setItem = vi.fn();
    Object.defineProperty(window, "localStorage", {
      value: { getItem: () => null, setItem, removeItem: vi.fn() },
      writable: true,
      configurable: true,
    });

    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);

    fireEvent.click(screen.getByTestId("verse-reveal-btn"));
    expect(screen.getByTestId("verse-revealed")).toBeInTheDocument();

    // The reveal must be a pure UI state change — no persistence of any kind.
    expect(setItem).not.toHaveBeenCalled();
  });

  it("hides the before-reveal button after tap", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);

    fireEvent.click(screen.getByTestId("verse-reveal-btn"));

    expect(screen.queryByTestId("verse-reveal-btn")).not.toBeInTheDocument();
  });
});

describe("CueWordVerseRow — custom cue word falls back to Hebrews 12:2", () => {
  it("shows the Hebrews 12:2 verse for a custom (non-canonical) cue word", () => {
    render(
      <PregameCardScreen
        state={makeState({ cueWord: "Grind" })}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
      />,
    );

    fireEvent.click(screen.getByTestId("verse-reveal-btn"));

    // The revealed container holds the reference; scope to it so we don't
    // collide with the session-verse block above the cue word row.
    const revealed = screen.getByTestId("verse-revealed");
    expect(revealed).toHaveTextContent("Hebrews 12:2");
    // Ellipsis-prefixed verbatim text from cue-word-verses.ts.
    expect(revealed).toHaveTextContent(
      "…fixing our eyes on Jesus, the pioneer and perfecter of faith.",
    );
  });
});

describe("CueWordVerseRow — no tracking side-effects", () => {
  it("reveal state does not persist across unmount/remount (purely local React state)", () => {
    // First render: tap to reveal.
    const { unmount } = render(
      <PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />,
    );
    fireEvent.click(screen.getByTestId("verse-reveal-btn"));
    expect(screen.getByTestId("verse-revealed")).toBeInTheDocument();

    // Unmount (simulates navigation away).
    unmount();
    cleanup();

    // Second render: the before-reveal state is back — no external state was written.
    render(
      <PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />,
    );
    expect(screen.getByTestId("verse-reveal-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("verse-revealed")).not.toBeInTheDocument();
  });

  it("does not call onQuick or onDone when the verse row is tapped", () => {
    const onQuick = vi.fn();
    const onDone = vi.fn();
    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={onQuick}
        onDone={onDone}
        sportConfig={HOCKEY_CONFIG}
      />,
    );
    fireEvent.click(screen.getByTestId("verse-reveal-btn"));
    expect(onQuick).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
});
