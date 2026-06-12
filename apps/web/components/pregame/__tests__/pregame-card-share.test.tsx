/**
 * @vitest-environment jsdom
 */
// FV-239 — RTL tests for the ShareCardRow on PregameCardScreen.
//
// Four areas:
//   A. Share affordance presence + feature-detection fallback.
//   B. First-name toggle — default OFF; opt-in behaviour; never auto-included.
//   C. Privacy boundary — adversity and other private fields are NEVER in the
//      share composition (rendered text or share payload).
//   D. No new storage writes beyond what FV-223 already does.
//
// Run narrowly:
//   npx vitest run components/pregame/__tests__/pregame-card-share.test.tsx

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

import { PregameCardScreen } from "@/components/pregame/screens-b";
import { INITIAL_STATE, DEFAULTS, type PregameState } from "@/components/pregame/types";
import { HOCKEY_CONFIG, BASKETBALL_CONFIG } from "@/components/pregame/sport-registry";
import { verseForCueWord } from "@/components/pregame/cue-word-verses";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<PregameState> = {}): PregameState {
  return {
    ...INITIAL_STATE,
    breathDone: true,
    need: "Confidence",
    role: "Forward",
    positivePlays: ["viz-forward-win-the-wall"],
    adversity: "I take a bad penalty.",
    anchor: "Long exhale",
    selfTalk: "You are secure. Take the next faithful action.",
    cueWord: "Faithful",
    prayerStyle: "guided",
    audioCompleted: true,
    ...overrides,
  };
}

const noop = vi.fn();

// ── navigator.share stub helpers ─────────────────────────────────────────────

function installShare(impl: (data: ShareData) => Promise<void> = () => Promise.resolve()) {
  Object.defineProperty(navigator, "share", {
    value: impl,
    writable: true,
    configurable: true,
  });
}

function removeShare() {
  Object.defineProperty(navigator, "share", {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

// ── localStorage spy ─────────────────────────────────────────────────────────

function installLocalStorageSpy(): { setItem: ReturnType<typeof vi.fn> } {
  const setItem = vi.fn();
  Object.defineProperty(window, "localStorage", {
    value: { getItem: () => null, setItem, removeItem: vi.fn(), clear: vi.fn() },
    writable: true,
    configurable: true,
  });
  return { setItem };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  removeShare();
});

// ─────────────────────────────────────────────────────────────────────────────
// A. Share affordance presence + feature-detection fallback
// ─────────────────────────────────────────────────────────────────────────────

describe("A. Share affordance — navigator.share available", () => {
  beforeEach(() => installShare());

  it("renders the share-card-row container", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.getByTestId("share-card-row")).toBeInTheDocument();
  });

  it("shows the 'Save card' share button when navigator.share is present", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.getByTestId("share-card-btn")).toBeInTheDocument();
    expect(screen.getByTestId("share-card-btn")).toHaveTextContent(/Save card/i);
  });

  it("does NOT show the screenshot hint when navigator.share is present", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.queryByTestId("share-screenshot-hint")).not.toBeInTheDocument();
  });

  it("calls navigator.share with the cue word and verse when tapped", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    installShare(shareSpy);

    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("share-card-btn"));
    });

    expect(shareSpy).toHaveBeenCalledTimes(1);
    const payload = shareSpy.mock.calls[0]?.[0] as ShareData | undefined;
    expect(payload?.text).toContain("FAITHFUL");
    // Verse reference + verbatim text must be present.
    const verse = verseForCueWord("Faithful");
    expect(payload?.text).toContain(verse.reference);
    expect(payload?.text).toContain(verse.text);
  });

  it("includes the brand tagline in the share payload", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    installShare(shareSpy);

    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("share-card-btn"));
    });

    const payload = shareSpy.mock.calls[0]?.[0] as ShareData | undefined;
    expect(payload?.text).toContain("Your Identity Is Secure. Compete From Victory.");
    expect(payload?.text).toContain("fromvictoryapp.com");
  });
});

describe("A. Share affordance — navigator.share absent (fallback)", () => {
  beforeEach(() => removeShare());

  it("shows the screenshot hint when navigator.share is absent", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.getByTestId("share-screenshot-hint")).toBeInTheDocument();
  });

  it("shows the sport-specific hint copy (hockey: 'puck drop')", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    // cardShareHint from HOCKEY_CONFIG: "Screenshot it. Open it before puck drop."
    // It appears in both the subtitle (mt-1.5) AND the share hint — query by testid
    // to confirm the fallback hint specifically.
    const hint = screen.getByTestId("share-screenshot-hint");
    expect(hint.textContent).toContain("puck drop");
  });

  it("shows basketball-specific hint copy when sport is basketball", () => {
    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={noop}
        onDone={noop}
        sportConfig={BASKETBALL_CONFIG}
      />,
    );
    const hint = screen.getByTestId("share-screenshot-hint");
    expect(hint.textContent).toContain("tip-off");
  });

  it("does NOT show a broken share button when navigator.share is absent", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.queryByTestId("share-card-btn")).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B. First-name toggle — default OFF; opt-in; never auto-included
// ─────────────────────────────────────────────────────────────────────────────

describe("B. First-name toggle", () => {
  beforeEach(() => installShare());

  it("toggle is NOT shown when athleteFirstName is not provided", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.queryByTestId("share-name-toggle")).not.toBeInTheDocument();
  });

  it("toggle is shown when athleteFirstName is provided", () => {
    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
        athleteFirstName="Jordan"
      />,
    );
    expect(screen.getByTestId("share-name-toggle")).toBeInTheDocument();
  });

  it("toggle defaults to OFF (aria-pressed=false)", () => {
    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
        athleteFirstName="Jordan"
      />,
    );
    const toggle = screen.getByTestId("share-name-toggle");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("first name is NOT in the share payload when toggle is OFF (default)", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    installShare(shareSpy);

    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
        athleteFirstName="Jordan"
      />,
    );

    // Tap share without touching the toggle.
    await act(async () => {
      fireEvent.click(screen.getByTestId("share-card-btn"));
    });

    const payload = shareSpy.mock.calls[0]?.[0] as ShareData | undefined;
    expect(payload?.text).not.toContain("Jordan");
  });

  it("toggles ON when tapped, updates aria-pressed", () => {
    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
        athleteFirstName="Jordan"
      />,
    );
    const toggle = screen.getByTestId("share-name-toggle");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("first name IS in the share payload when toggle is explicitly turned ON", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    installShare(shareSpy);

    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
        athleteFirstName="Jordan"
      />,
    );

    // Turn the toggle on first.
    fireEvent.click(screen.getByTestId("share-name-toggle"));

    await act(async () => {
      fireEvent.click(screen.getByTestId("share-card-btn"));
    });

    const payload = shareSpy.mock.calls[0]?.[0] as ShareData | undefined;
    expect(payload?.text).toContain("Jordan");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// C. Privacy boundary — adversity and other private fields never in the share
// ─────────────────────────────────────────────────────────────────────────────

describe("C. Privacy boundary — adversity never in the share composition", () => {
  beforeEach(() => installShare());

  it("adversity string is NOT in the share payload", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    installShare(shareSpy);

    render(
      <PregameCardScreen
        state={makeState({ adversity: "I take a bad penalty." })}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
        athleteFirstName="Jordan"
      />,
    );
    // Turn the toggle on to maximise payload surface.
    fireEvent.click(screen.getByTestId("share-name-toggle"));

    await act(async () => {
      fireEvent.click(screen.getByTestId("share-card-btn"));
    });

    const payload = shareSpy.mock.calls[0]?.[0] as ShareData | undefined;
    expect(payload?.text).not.toContain("I take a bad penalty.");
    expect(payload?.text).not.toContain("bad penalty");
  });

  it("anchor (reset anchor) is NOT in the share payload", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    installShare(shareSpy);

    render(
      <PregameCardScreen
        state={makeState({ anchor: "Tap stick twice" })}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("share-card-btn"));
    });

    const payload = shareSpy.mock.calls[0]?.[0] as ShareData | undefined;
    expect(payload?.text).not.toContain("Tap stick twice");
  });

  it("self-talk phrase is NOT in the share payload", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    installShare(shareSpy);

    render(
      <PregameCardScreen
        state={makeState({ selfTalk: "You are secure. Take the next faithful action." })}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("share-card-btn"));
    });

    const payload = shareSpy.mock.calls[0]?.[0] as ShareData | undefined;
    // The self-talk phrase must not appear in the share payload.
    expect(payload?.text).not.toContain("You are secure. Take the next faithful action.");
  });

  it("need/focus selection is NOT in the share payload", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    installShare(shareSpy);

    render(
      <PregameCardScreen
        state={makeState({ need: "Physical courage" })}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("share-card-btn"));
    });

    const payload = shareSpy.mock.calls[0]?.[0] as ShareData | undefined;
    expect(payload?.text).not.toContain("Physical courage");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// D. No new storage writes beyond FV-223
// ─────────────────────────────────────────────────────────────────────────────

describe("D. No new storage writes from the share flow", () => {
  beforeEach(() => installShare());

  it("does not write to localStorage during share (toggle off)", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    installShare(shareSpy);
    const { setItem } = installLocalStorageSpy();

    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
        athleteFirstName="Jordan"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("share-card-btn"));
    });

    expect(setItem).not.toHaveBeenCalled();
  });

  it("does not write to localStorage when the name toggle is flipped", () => {
    const { setItem } = installLocalStorageSpy();

    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={noop}
        onDone={noop}
        sportConfig={HOCKEY_CONFIG}
        athleteFirstName="Jordan"
      />,
    );

    fireEvent.click(screen.getByTestId("share-name-toggle"));
    expect(setItem).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E. Brand watermark rendered
// ─────────────────────────────────────────────────────────────────────────────

describe("E. Brand watermark present on the card", () => {
  it("renders the brand watermark element", () => {
    render(<PregameCardScreen state={makeState()} onQuick={noop} onDone={noop} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.getByTestId("card-brand-watermark")).toBeInTheDocument();
  });
});
