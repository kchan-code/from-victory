/**
 * @vitest-environment jsdom
 */
// FV-175 — sport copy leak regression: verify the three surfaces that previously
// showed hockey idioms to basketball athletes now resolve from SportConfig.
//
// Covered surfaces:
//   1. CueWordScreen — cueWordHelper ("between shifts" vs "at the line")
//   2. PregameCardScreen — cardShareHint ("puck drop" vs "tip-off")
//   3. AudioSessionScreen text-mode — audioScript segments (80/120/165 body copy)
//
// Hockey strings must be byte-identical to current production (zero regression).
// Basketball strings must contain NO hockey idioms (puck/ice/skate/shift/stride/rink/linemate).
//
// The hockey-idiom pattern is intentionally broad: it catches any segment that
// accidentally copies the hockey AUDIO_SCRIPT into the basketball text-mode path.
//
// AudioSessionScreen is rendered with no `need` (→ null openerSrc) and audioMode
// starts as "text" so the AUDIO_SCRIPT path is exercised without any real audio
// or network calls. useClipPlayer is mocked to idle (no error, no ready) so the
// clip-player branch is bypassed and the text-mode timer runs.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { CueWordScreen, PregameCardScreen, AudioSessionScreen } from "@/components/pregame/screens-b";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";
import { HOCKEY_CONFIG, BASKETBALL_CONFIG } from "@/components/pregame/sport-registry";

// ── Mock useClipPlayer so AudioSessionScreen never hits Web Audio / fetch ──
// The clip player is always off in these tests; we want the text-mode path.
vi.mock("@/components/pregame/useClipPlayer", () => ({
  useClipPlayer: () => ({
    ready: false,
    playing: false,
    completed: false,
    elapsedSec: 0,
    totalSec: 0,
    error: "no template", // triggers text-mode fallback in AudioSessionScreen
    timeline: null,
    play: vi.fn(),
    pause: vi.fn(),
  }),
}));

// ── Mock audio-precache so ReviewScreen (transitively imported) never fetches ──
vi.mock("@/components/pregame/audio-precache", () => ({
  checkPregameAudioCached: vi.fn().mockResolvedValue({ cached: 0, total: 0, done: false, error: null }),
  precachePregameAudio: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const HOCKEY_IDIOM_RE = /puck|ice rink|skates?|between shifts|shift|stride|rink|linemate/i;

/** State with enough fields set that the screens render their interesting copy. */
function makeState(overrides: Partial<PregameState> = {}): PregameState {
  return {
    ...INITIAL_STATE,
    // Enough state for the card to show a verse + cue-word sections:
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

// ─── 1. CueWordScreen ────────────────────────────────────────────────────────

describe("CueWordScreen — cueWordHelper (FV-175)", () => {
  it("hockey: renders the verbatim 'between shifts' helper", () => {
    render(
      <CueWordScreen
        state={makeState()}
        set={vi.fn()}
        sportConfig={HOCKEY_CONFIG}
      />,
    );
    expect(screen.getByText(/between shifts/i)).toBeInTheDocument();
    expect(screen.queryByText(/at the line/i)).not.toBeInTheDocument();
  });

  it("basketball: renders 'at the line' and has NO hockey shift idiom", () => {
    render(
      <CueWordScreen
        state={makeState()}
        set={vi.fn()}
        sportConfig={BASKETBALL_CONFIG}
      />,
    );
    expect(screen.getByText(/at the line/i)).toBeInTheDocument();
    // The hockey idiom "between shifts" must not appear for basketball athletes.
    expect(screen.queryByText(/between shifts/i)).not.toBeInTheDocument();
  });
});

// ─── 2. PregameCardScreen ────────────────────────────────────────────────────

describe("PregameCardScreen — cardShareHint (FV-175)", () => {
  it("hockey: renders 'puck drop' hint verbatim", () => {
    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={vi.fn()}
        onDone={vi.fn()}
        sportConfig={HOCKEY_CONFIG}
      />,
    );
    expect(screen.getByText(/open it before puck drop/i)).toBeInTheDocument();
    expect(screen.queryByText(/tip-off/i)).not.toBeInTheDocument();
  });

  it("basketball: renders 'tip-off' hint and has NO 'puck drop' text", () => {
    render(
      <PregameCardScreen
        state={makeState()}
        onQuick={vi.fn()}
        onDone={vi.fn()}
        sportConfig={BASKETBALL_CONFIG}
      />,
    );
    expect(screen.getByText(/open it before tip-off/i)).toBeInTheDocument();
    expect(screen.queryByText(/puck drop/i)).not.toBeInTheDocument();
  });
});

// ─── 3. AudioSessionScreen text-mode — audioScript segments ─────────────────
//
// AudioSessionScreen starts in text mode when openerSrc is null (need=null).
// The clip-player mock returns error="no template" which is the silent sentinel
// that keeps audioMode in its initial state rather than flipping it. With
// need=null, openerSrc=null so the component initialises to text mode directly.
// At elapsed=0 the first segment (startSec:0, eyebrow:"Identity") is shown.
//
// To reach segments 80/120/165 (the sport-specific copy) we test the audioScript
// array directly from the config rather than advancing the timer — the rendered
// text-mode walker reads `sportConfig.audioScript`, so asserting the array
// contents is the authoritative check that the correct data reaches the component.

describe("AudioSessionScreen audioScript — sport-correct segments (FV-175)", () => {
  it("hockey audioScript segment 80: contains 'rink' and 'skates' (hockey idiom)", () => {
    const seg80 = HOCKEY_CONFIG.audioScript.find((s) => s.startSec === 80);
    expect(seg80).toBeDefined();
    expect(seg80!.eyebrow).toBe("See the rink");
    expect(seg80!.body).toMatch(/rink|skate/i);
    // Hockey copy must NOT contain basketball idioms.
    expect(seg80!.body).not.toMatch(/floor|hardwood|squeak/i);
  });

  it("basketball audioScript segment 80: contains 'gym/floor/hardwood', no hockey idioms", () => {
    const seg80 = BASKETBALL_CONFIG.audioScript.find((s) => s.startSec === 80);
    expect(seg80).toBeDefined();
    expect(seg80!.eyebrow).toBe("See the gym");
    expect(seg80!.body).toMatch(/floor|hardwood/i);
    expect(seg80!.body).not.toMatch(HOCKEY_IDIOM_RE);
  });

  it("hockey audioScript segment 120: contains 'shift' (hockey idiom)", () => {
    const seg120 = HOCKEY_CONFIG.audioScript.find((s) => s.startSec === 120);
    expect(seg120).toBeDefined();
    expect(seg120!.eyebrow).toBe("Your first shift");
    expect(seg120!.body).toMatch(/shift|strides?/i);
    expect(seg120!.body).not.toMatch(/possession|scorer.s table/i);
  });

  it("basketball audioScript segment 120: 'first possession', no hockey idioms", () => {
    const seg120 = BASKETBALL_CONFIG.audioScript.find((s) => s.startSec === 120);
    expect(seg120).toBeDefined();
    expect(seg120!.eyebrow).toBe("Your first possession");
    expect(seg120!.body).toMatch(/possession|scorer.s table/i);
    expect(seg120!.body).not.toMatch(HOCKEY_IDIOM_RE);
  });

  it("sport-neutral segments (0/35/210/250/275) are byte-identical across hockey and basketball", () => {
    const neutralStartSecs = [0, 35, 210, 250, 275] as const;
    for (const sec of neutralStartSecs) {
      const hockeySegment = HOCKEY_CONFIG.audioScript.find((s) => s.startSec === sec);
      const bbSegment = BASKETBALL_CONFIG.audioScript.find((s) => s.startSec === sec);
      expect(hockeySegment).toBeDefined();
      expect(bbSegment).toBeDefined();
      expect(bbSegment!.eyebrow).toBe(hockeySegment!.eyebrow);
      expect(bbSegment!.body).toBe(hockeySegment!.body);
    }
  });

  it("basketball audioScript has 8 segments (same count as hockey)", () => {
    expect(BASKETBALL_CONFIG.audioScript.length).toBe(HOCKEY_CONFIG.audioScript.length);
    expect(BASKETBALL_CONFIG.audioScript.length).toBe(8);
  });

  it("AudioSessionScreen text-mode with basketball config: first segment (elapsed=0) has no hockey idioms", () => {
    // Render with null need → openerSrc is null → audioMode starts as "text".
    // At elapsed=0 the Identity segment (startSec:0) is shown — sport-neutral.
    // This smoke-tests that sportConfig.audioScript is actually wired into the component.
    render(
      <AudioSessionScreen
        state={makeState({ need: null })}
        set={vi.fn()}
        onContinue={vi.fn()}
        sportConfig={BASKETBALL_CONFIG}
        sport="basketball"
      />,
    );
    // The component renders text-mode ("Five minutes. Read along.") and the
    // Identity eyebrow from segment 0.
    expect(screen.getByText(/five minutes/i)).toBeInTheDocument();
    // The Identity segment body contains "Hebrews 12:1-2" — sport-neutral,
    // present in both configs — and must NOT contain "puck" or "rink".
    const bodyEl = screen.getByText(/Hebrews 12:1-2/i);
    expect(bodyEl.textContent).not.toMatch(HOCKEY_IDIOM_RE);
  });
});

// ─── 4. Config integrity — cueWordHelper / cardShareHint are set correctly ───

describe("SportConfig FV-175 field values", () => {
  it("hockey cueWordHelper is verbatim production string", () => {
    expect(HOCKEY_CONFIG.cueWordHelper).toBe(
      "The one you’d say to yourself between shifts.",
    );
  });

  it("basketball cueWordHelper contains no hockey idiom", () => {
    expect(BASKETBALL_CONFIG.cueWordHelper).not.toMatch(/shift/i);
    expect(BASKETBALL_CONFIG.cueWordHelper).toMatch(/at the line/i);
  });

  it("hockey cardShareHint is verbatim production string", () => {
    expect(HOCKEY_CONFIG.cardShareHint).toBe(
      "Screenshot it. Open it before puck drop.",
    );
  });

  it("basketball cardShareHint contains no hockey idiom", () => {
    expect(BASKETBALL_CONFIG.cardShareHint).not.toMatch(/puck/i);
    expect(BASKETBALL_CONFIG.cardShareHint).toMatch(/tip-off/i);
  });
});
