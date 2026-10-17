/**
 * @vitest-environment jsdom
 */
// FV-253 — "Run it like last time" replays the SAVED session, never the
// profile pre-selection.
//
// A saved `fv_pregame_session` (Joy / Goalie) coexists with a profile that
// would pre-select Calm / Forward. Tapping the saved-session entry must
// restore the saved picks; the profile defaults apply only to a FRESH session
// (BEGIN / "Set up for later"). Observed through the real screens:
//   start → "Run it like last time" → Breathe (skip: "Already settled") →
//   SET MY FOCUS jumps straight to the audio step (saved-run shortcut) →
//   back → Review shows the saved picks.
// Then, from the same mount, "Set up for later" starts fresh and shows the
// profile pre-selection — proving the two entries don't bleed into each other.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { PregameFlow } from "@/components/pregame/PregameFlow";
import { PREGAME_SESSION_CACHE_KEY } from "@/lib/pregame/session-cache";

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/lib/actions/activity", () => ({
  logActivityEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/components/pregame/audio-precache", () => ({
  checkPregameAudioCached: vi
    .fn()
    .mockResolvedValue({ cached: 0, total: 0, done: false, error: null }),
  precachePregameAudio: vi.fn(),
}));
vi.mock("@/components/athlete/CoachmarkTour", () => ({
  default: () => null,
}));
// The audio step is entered (saved-run shortcut) and immediately left via
// back; keep the clip player inert so no Web Audio / fetch is touched.
vi.mock("@/components/pregame/useClipPlayer", () => ({
  useClipPlayer: () => ({
    ready: false,
    playing: false,
    completed: false,
    elapsedSec: 0,
    totalSec: 0,
    error: "no template",
    timeline: null,
    play: vi.fn(),
    pause: vi.fn(),
  }),
}));
// Breath audio: report "missing" so BreathScreen takes the standalone path.
vi.mock("@/components/pregame/audio/useBreathAudio", () => ({
  useBreathAudio: () => ({
    status: "missing",
    controlled: null,
    audioRef: { current: null },
    play: vi.fn(),
  }),
}));

const SAVED_SESSION = {
  sport: "hockey",
  need: "Joy",
  role: "Goalie",
  positivePlays: [],
  adversity: "soft-goal",
  anchor: "Long exhale",
  selfTalk: "Stay steady. Make the next play.",
  cueWord: "Faithful",
  prayerStyle: "guided",
};

// localStorage stub — same pattern as install-prompt.test.tsx (Node's own
// experimental localStorage global shadows jsdom's under vitest).
const localStorageStub: Record<string, string> = {};
beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    writable: true,
    configurable: true,
    value: {
      getItem: (key: string) => localStorageStub[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageStub[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageStub[key];
      },
      clear: () => {
        Object.keys(localStorageStub).forEach((k) => delete localStorageStub[k]);
      },
    },
  });
  window.localStorage.clear();
  window.localStorage.setItem(PREGAME_SESSION_CACHE_KEY, JSON.stringify(SAVED_SESSION));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function reviewValue(label: string): string {
  // ReviewScreen renders rows as <dt>label</dt><dd>value</dd>-style pairs;
  // resolve the value cell by walking from the label text to its sibling.
  const labelEl = screen.getByText(label);
  const row = labelEl.parentElement;
  if (!row) throw new Error(`no row for ${label}`);
  return (row.textContent ?? "").replace(label, "").trim();
}

describe("saved replay wins over profile defaults (FV-253)", () => {
  it("'Run it like last time' restores the saved picks; a fresh session still pre-selects the profile", () => {
    render(
      <PregameFlow
        athleteFirstName="Sam"
        sport="hockey"
        personalization={{ position: "Forward", focusArea: "nerves" }}
      />,
    );

    // Saved-session entry is offered.
    const rerun = screen.getByRole("button", { name: /run it like last time/i });
    fireEvent.click(rerun);

    // Breathe → skip → SET MY FOCUS jumps to the audio step.
    fireEvent.click(screen.getByRole("button", { name: /already settled/i }));
    fireEvent.click(screen.getByRole("button", { name: "SET MY FOCUS" }));

    // Back from audio lands on Review, pre-filled from the SAVED session.
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Today's focus")).toBeInTheDocument();
    expect(reviewValue("Today's focus")).toBe("Joy");
    expect(reviewValue("Position")).toBe("Goalie");

    // Close → start → "Set up for later" = fresh session = profile defaults.
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    fireEvent.click(screen.getByTestId("set-up-for-later-btn"));
    expect(screen.getByRole("button", { name: "Calm" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Joy" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
    expect(screen.getByRole("button", { name: "Forward" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Goalie" })).toHaveAttribute("aria-pressed", "false");
  });
});
