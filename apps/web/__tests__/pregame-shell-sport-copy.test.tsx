/**
 * @vitest-environment jsdom
 */
// FV-486 / FV-487 — hockey idioms in the pregame SHELL.
//
// FV-175 moved the pregame CONTENT strings into SportConfig and is covered by
// pregame-sport-copy.test.tsx. It did NOT cover the shell — the start screen,
// the Quick Mental Reset, the review screen, and the offline-download control.
// A soccer beta tester was shown "no rink signal needed" after picking Soccer.
//
// These tests are parameterized over SUPPORTED_SPORTS rather than hardcoding a
// second sport, so a NEW sport added to the registry inherits the guard for
// free — the FV-486 acceptance criterion that this is a class fix, not a
// one-string patch.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { PregameStart } from "@/components/pregame/screens-a";
import { QuickReset, QUICK_RESET_TITLE } from "@/components/pregame/QuickReset";
import { ReviewScreen, eyebrowToStageLabel } from "@/components/pregame/screens-b";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";
import {
  getSportConfig,
  HOCKEY_CONFIG,
  DEFAULT_QUICK_RESET,
  SPORT_REGISTRY,
  type Sport as RegistrySport,
} from "@/components/pregame/sport-registry";
import { SUPPORTED_SPORTS } from "@/lib/sports";

// ── Mocks ────────────────────────────────────────────────────────────────────
// ReviewScreen transitively imports audio-precache; keep it off the network.
vi.mock("@/components/pregame/audio-precache", () => ({
  checkPregameAudioCached: vi
    .fn()
    .mockResolvedValue({ cached: 0, total: 0, done: false, error: null }),
  precachePregameAudio: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hockey venue + locker-room idioms. Deliberately broader than the FV-175
 * regex: this guards SHELL copy, which should never carry ANY sport's venue
 * except its own. `\bice\b` is included (the FV-215 item-3 gap).
 */
const HOCKEY_SHELL_IDIOM_RE =
  /\brink\b|\bpuck\b|\bice\b|\bskates?\b|\bstrides?\b|between shifts|first shift|locker.?room/i;

/** Sports other than hockey — the ones that must never see hockey copy. */
const NON_HOCKEY_SPORTS = SUPPORTED_SPORTS.filter((s) => s !== "hockey");

function makeState(overrides: Partial<PregameState> = {}): PregameState {
  return {
    ...INITIAL_STATE,
    need: "Confidence",
    role: null,
    adversity: null,
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

// ─── 1. SportConfig.venue ────────────────────────────────────────────────────

describe("SportConfig.venue (FV-486)", () => {
  it("every registry sport declares a venue — including the dormant ones", () => {
    for (const key of Object.keys(SPORT_REGISTRY) as RegistrySport[]) {
      const { venue } = SPORT_REGISTRY[key];
      expect(venue, `${key} venue`).toBeTruthy();
      // Must carry its own article so it drops into a sentence unchanged, and
      // must not carry trailing punctuation (it's interpolated mid-sentence).
      expect(venue, `${key} venue`).toMatch(/^the /);
      expect(venue, `${key} venue`).not.toMatch(/[.!?]$/);
    }
  });

  it("hockey's venue is unchanged", () => {
    expect(HOCKEY_CONFIG.venue).toBe("the rink");
  });

  it("no non-hockey sport's venue is a hockey venue", () => {
    for (const sport of NON_HOCKEY_SPORTS) {
      expect(getSportConfig(sport).venue, sport).not.toMatch(
        HOCKEY_SHELL_IDIOM_RE,
      );
    }
  });

  it("each live sport's venue agrees with its own audioScript seg-80 eyebrow", () => {
    // The shell must speak the venue the narration speaks. seg-80 is
    // "See the rink" / "See the gym" / "See the field".
    for (const sport of SUPPORTED_SPORTS) {
      const config = getSportConfig(sport);
      const seg80 = config.audioScript.find((s) => s.startSec === 80);
      expect(seg80, `${sport} seg-80`).toBeDefined();
      expect(seg80!.eyebrow.toLowerCase(), sport).toContain(
        config.venue.toLowerCase(),
      );
    }
  });
});

// ─── 2. Quick Mental Reset (FV-487) ──────────────────────────────────────────

describe("QuickReset copy (FV-487)", () => {
  it("is named 'Quick Mental Reset' — never 'Locker Room'", () => {
    expect(QUICK_RESET_TITLE).toBe("Quick Mental Reset");
    expect(QUICK_RESET_TITLE).not.toMatch(/locker/i);
  });

  it("hockey's block is byte-identical to the pre-FV-487 hardcoded copy", () => {
    expect(HOCKEY_CONFIG.quickReset).toEqual({
      stepLabel: "First Shift",
      heading: "Step on.",
      lines: ["Three hard strides.", "Eyes up.", "Simple strong play."],
      cueLine: "Say it between shifts.",
    });
  });

  it("every LIVE sport authors its own block", () => {
    for (const sport of SUPPORTED_SPORTS) {
      expect(getSportConfig(sport).quickReset, sport).toBeDefined();
    }
  });

  it("no non-hockey block carries a hockey idiom", () => {
    for (const sport of NON_HOCKEY_SPORTS) {
      const copy = getSportConfig(sport).quickReset!;
      const all = [copy.stepLabel, copy.heading, ...copy.lines, copy.cueLine].join(" ");
      expect(all, sport).not.toMatch(HOCKEY_SHELL_IDIOM_RE);
    }
  });

  it("the dormant-sport fallback is sport-neutral", () => {
    const all = [
      DEFAULT_QUICK_RESET.stepLabel,
      DEFAULT_QUICK_RESET.heading,
      ...DEFAULT_QUICK_RESET.lines,
      DEFAULT_QUICK_RESET.cueLine,
    ].join(" ");
    expect(all).not.toMatch(HOCKEY_SHELL_IDIOM_RE);
  });

  it.each(NON_HOCKEY_SPORTS)(
    "renders no hockey idiom for %s, on ANY of its 5 steps",
    (sport) => {
      const config = getSportConfig(sport);
      render(
        <QuickReset
          state={makeState()}
          onClose={vi.fn()}
          sportConfig={config}
        />,
      );
      // The sport-shaped beat is step 3 of 5 and the cue line is step 5, so
      // asserting on the mount state alone is vacuous — walk the whole flow.
      const seen: string[] = [];
      for (let step = 0; step < 5; step++) {
        seen.push(document.body.textContent ?? "");
        if (step < 4) fireEvent.click(screen.getByRole("button", { name: "NEXT" }));
      }
      const all = seen.join(" ");
      expect(all, sport).not.toMatch(HOCKEY_SHELL_IDIOM_RE);
      // Prove the walk actually reached the sport-shaped copy.
      expect(all, sport).toContain(config.quickReset!.stepLabel);
      expect(all, sport).toContain(config.quickReset!.lines[0]);
      expect(all, sport).toContain(config.quickReset!.cueLine);
      expect(screen.getByText(QUICK_RESET_TITLE)).toBeInTheDocument();
    },
  );

  it("hockey still renders its own 'First Shift' beat verbatim", () => {
    render(
      <QuickReset
        state={makeState()}
        onClose={vi.fn()}
        sportConfig={HOCKEY_CONFIG}
      />,
    );
    expect(screen.getByText(/1 \/ 5 · Identity/)).toBeInTheDocument();
    expect(screen.getByText(QUICK_RESET_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "NEXT" }));
    fireEvent.click(screen.getByRole("button", { name: "NEXT" }));
    expect(screen.getByText(/3 \/ 5 · First Shift/)).toBeInTheDocument();
    expect(screen.getByText("Three hard strides.")).toBeInTheDocument();
    expect(screen.getByText("Step on.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "NEXT" }));
    fireEvent.click(screen.getByRole("button", { name: "NEXT" }));
    expect(screen.getByText("Say it between shifts.")).toBeInTheDocument();
  });
});

// ─── 3. Pregame start screen ─────────────────────────────────────────────────

describe("PregameStart shell copy (FV-486/FV-487)", () => {
  it("the prepare sub-line and quick-reset entry carry no hockey idiom", () => {
    render(
      <PregameStart
        onBegin={vi.fn()}
        onQuick={vi.fn()}
        onPrepare={vi.fn()}
        onPlaySaved={vi.fn()}
        savedOfflineReady={false}
      />,
    );
    // This screen renders before any sport-specific config is threaded, so it
    // must be sport-neutral for EVERY athlete, hockey included.
    expect(document.body.textContent ?? "").not.toMatch(HOCKEY_SHELL_IDIOM_RE);
    expect(screen.getByText(/no signal needed/i)).toBeInTheDocument();
    expect(screen.getByText(QUICK_RESET_TITLE)).toBeInTheDocument();
  });
});

// ─── 4. Review screen (prepare mode) ─────────────────────────────────────────

describe("ReviewScreen prepare-mode copy (FV-486)", () => {
  it.each(NON_HOCKEY_SPORTS)(
    "renders %s's own venue and no hockey idiom",
    (sport) => {
      const config = getSportConfig(sport);
      render(
        <ReviewScreen
          state={makeState()}
          sportConfig={config}
          sport={sport}
          mode="prepare"
        />,
      );
      expect(document.body.textContent ?? "").not.toMatch(HOCKEY_SHELL_IDIOM_RE);
      expect(
        screen.getByText(
          new RegExp(`ready at ${config.venue}`, "i"),
        ),
      ).toBeInTheDocument();
    },
  );

  it("hockey keeps 'ready at the rink' verbatim", () => {
    render(
      <ReviewScreen
        state={makeState()}
        sportConfig={HOCKEY_CONFIG}
        sport="hockey"
        mode="prepare"
      />,
    );
    expect(screen.getByText(/ready at the rink/i)).toBeInTheDocument();
  });
});

// ─── 5. Text-mode stage labels ───────────────────────────────────────────────

describe("eyebrowToStageLabel (FV-486)", () => {
  it("no sport resolves any of its own eyebrows to a hockey stage label", () => {
    for (const sport of SUPPORTED_SPORTS) {
      if (sport === "hockey") continue;
      const config = getSportConfig(sport);
      for (const seg of config.audioScript) {
        const label = eyebrowToStageLabel(seg.eyebrow, null);
        expect(label, `${sport}: "${seg.eyebrow}"`).not.toMatch(
          HOCKEY_SHELL_IDIOM_RE,
        );
      }
    }
  });

  it("'Play your role' no longer collapses to hockey's 'First shift'", () => {
    // Both hockey and basketball use this seg-165 eyebrow, so mapping it to
    // "First shift" leaked hockey to basketball AND duplicated hockey's own
    // seg-120 label.
    expect(eyebrowToStageLabel("Play your role · Guard", null)).toBe("Your role");
    expect(eyebrowToStageLabel("Your first shift", null)).toBe("First shift");
  });

  it("an unmapped eyebrow falls through to the sport's own wording", () => {
    expect(eyebrowToStageLabel("See the gym", null)).toBe("See the gym");
    expect(eyebrowToStageLabel("See the field", null)).toBe("See the field");
    expect(eyebrowToStageLabel("Your first touch", null)).toBe("Your first touch");
  });

  it("hockey's goalie special case still applies", () => {
    expect(eyebrowToStageLabel("Your first shift", "Goalie")).toBe("First save");
  });
});
