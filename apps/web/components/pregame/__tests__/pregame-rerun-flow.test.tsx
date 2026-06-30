/**
 * @vitest-environment jsdom
 */
// FV-223 — restore navigation regression (PR #194 review finding 1a):
// "Run it like last time" must SKIP the setup screens, not just pre-fill
// them. The original implementation jumped to breath but then walked every
// setup step sequentially. These tests pin the fixed behaviour at the
// component level:
//
//   1. saved session → button shown → breath → "Already settled" + CTA →
//      lands on the AUDIO step (Step 11), never on Today's Focus
//   2. a saved session whose `need` no longer exists in NEED_VERSE (stale
//      rename / poisoned storage) shows NO restore button — silent fallback
//      to full setup (review finding 1b: NEED_VERSE[need] is dereferenced
//      unguarded on the audio + card screens)
//   3. full-setup path is unaffected: BEGIN still goes breath → Today's Focus
//   4. re-run plays silence — the removed "Sound" preference (FV-306) is never read

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";

import { PregameFlow } from "@/components/pregame/PregameFlow";
import { PREGAME_SESSION_CACHE_KEY } from "@/lib/pregame/session-cache";
import { BED_PREF_KEY } from "@/components/pregame/audio/bed-preference";
import { useClipPlayer } from "@/components/pregame/useClipPlayer";

// Mock the client-facing telemetry action so the test never imports its
// server-only write chain (lib/activity/record.ts → `server-only`), which
// throws when loaded outside a Server Component. Behaviour under test is
// unchanged — the pregame event call is fire-and-forget.
vi.mock("@/lib/actions/activity", () => ({
  logActivityEvent: vi.fn(() => Promise.resolve()),
}));
import { logActivityEvent } from "@/lib/actions/activity";

// ── Mock useClipPlayer so the audio step never touches Web Audio / fetch ──
// The factory uses vi.fn() so tests can capture call arguments via
// vi.mocked(useClipPlayer) after importing the module.
vi.mock("@/components/pregame/useClipPlayer", () => ({
  useClipPlayer: vi.fn(() => ({
    ready: false,
    playing: false,
    completed: false,
    elapsedSec: 0,
    totalSec: 0,
    error: "no template", // text-mode fallback — no network
    timeline: null,
    play: vi.fn(),
    pause: vi.fn(),
  })),
}));

// ── Mock audio-precache so transitively imported screens never fetch ──
vi.mock("@/components/pregame/audio-precache", () => ({
  checkPregameAudioCached: vi
    .fn()
    .mockResolvedValue({ cached: 0, total: 0, done: false, error: null }),
  precachePregameAudio: vi.fn(),
}));

// localStorage stub (jsdom's built-in lacks clear() under this vitest setup —
// same stub pattern as session-cache.test.ts / athlete-cache.test.ts).
const store: Record<string, string> = {};
const localStorageStub = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => {
    store[key] = value;
  },
  removeItem: (key: string): void => {
    delete store[key];
  },
};

function seedSavedSession(overrides: Record<string, unknown> = {}) {
  localStorageStub.setItem(
    PREGAME_SESSION_CACHE_KEY,
    JSON.stringify({
      sport: "hockey",
      need: "Confidence",
      role: "Forward",
      positivePlays: ["viz-forward-breakaway"],
      adversity: "benched",
      anchor: "I am already loved.",
      selfTalk: "Next shift.",
      cueWord: "Faithful",
      prayerStyle: "guided",
      ...overrides,
    }),
  );
}

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  Object.defineProperty(window, "localStorage", {
    value: localStorageStub,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
});

describe("PregameFlow saved-session restore (FV-223)", () => {
  it("run-it-like-last-time skips setup: breath → audio step, never Today's Focus", () => {
    seedSavedSession();
    render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);

    // The restore entry is offered.
    const btn = screen.getByTestId("run-last-time-btn");
    fireEvent.click(btn);

    // Breath threshold renders (its skip affordance is unique to that screen).
    const skip = screen.getByRole("button", { name: /already settled/i });
    fireEvent.click(skip);

    // The breath CTA advances the flow.
    fireEvent.click(screen.getByRole("button", { name: /set my focus/i }));

    // FIXED BEHAVIOUR: we land on the audio session step…
    expect(screen.getByText(/Step 11 · Guided Session/i)).toBeInTheDocument();
    // …and never on the Today's Focus setup screen.
    expect(screen.queryByText(/Step 02/i)).not.toBeInTheDocument();
  });

  it("a saved session with an unknown need shows NO restore button (silent fallback)", () => {
    seedSavedSession({ need: "Renamed Need That No Longer Exists" });
    render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);

    expect(screen.queryByTestId("run-last-time-btn")).not.toBeInTheDocument();
  });

  it("a saved session for another sport shows NO restore button", () => {
    seedSavedSession({ sport: "basketball" });
    render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);

    expect(screen.queryByTestId("run-last-time-btn")).not.toBeInTheDocument();
  });

  it("full setup is unaffected: BEGIN goes breath → Today's Focus, not audio", () => {
    seedSavedSession();
    render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);

    // Take the primary path even though a saved session exists.
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));
    fireEvent.click(screen.getByRole("button", { name: /already settled/i }));
    fireEvent.click(screen.getByRole("button", { name: /set my focus/i }));

    // Sequential flow: next is the Today's Focus setup screen, NOT audio.
    expect(screen.queryByText(/Step 11 · Guided Session/i)).not.toBeInTheDocument();
  });

  it("re-run plays silence even if a stale bed preference is stored (FV-306)", async () => {
    // FV-306 removed the "Sound" picker. The device bed preference is no longer
    // read, so even a leftover fv_pregame_bed value from before the removal must
    // NOT resurrect a music bed — every session, rerun included, is voice-only.
    const mockedHook = vi.mocked(useClipPlayer);
    mockedHook.mockClear();

    // Simulate a stale preference written by the old picker.
    localStorageStub.setItem(BED_PREF_KEY, "pulse");

    seedSavedSession();
    await act(async () => {
      render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    });

    // Trigger the re-run path.
    fireEvent.click(screen.getByTestId("run-last-time-btn"));
    fireEvent.click(screen.getByRole("button", { name: /already settled/i }));
    fireEvent.click(screen.getByRole("button", { name: /set my focus/i }));

    // The audio step must have rendered.
    expect(screen.getByText(/Step 11 · Guided Session/i)).toBeInTheDocument();

    // useClipPlayer must have been called with bedId null — the stale "pulse"
    // preference is ignored now that the picker is gone.
    const lastCall = mockedHook.mock.calls.at(-1)?.[0];
    expect(lastCall?.bedId).toBeNull();
  });
});

describe("PregameFlow pregame telemetry (activity_events)", () => {
  it("fires pregame_start (src=full) when BEGIN is tapped", () => {
    vi.mocked(logActivityEvent).mockClear();
    render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);

    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));

    expect(vi.mocked(logActivityEvent)).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "pregame_start",
        surface: "pregame",
        meta: expect.objectContaining({ src: "full" }),
      }),
    );
  });

  it("fires pregame_start (src=saved) on 'Run it like last time'", () => {
    vi.mocked(logActivityEvent).mockClear();
    seedSavedSession();
    render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);

    fireEvent.click(screen.getByTestId("run-last-time-btn"));

    expect(vi.mocked(logActivityEvent)).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "pregame_start",
        meta: expect.objectContaining({ src: "saved" }),
      }),
    );
  });
});
