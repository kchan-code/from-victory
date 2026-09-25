/**
 * @vitest-environment jsdom
 */
// FV-253 — PregameFlow pre-selects the athlete's saved quiz answers.
//
// Drives the PREPARE-AHEAD flow ("Set up for later"), whose first two steps
// are Today's Focus → Position with no breath timer in front of them, so the
// pre-selection is observable through the real pickers (aria-pressed) and the
// real CONTINUE gate. The play flow shares the same startState.
//
// Pins:
//   1. focus_area "nerves" → the "Calm" chip starts pressed; a valid position
//      starts pressed on the Position step; CONTINUE is enabled immediately.
//   2. A manual tap overrides the pre-selection (the athlete always wins).
//   3. No personalization (skipped quiz / offline) → nothing pressed and
//      CONTINUE disabled — the pre-FV-253 behaviour, unchanged.
//   4. A cross-sport / invalid position → nothing pressed on Position.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { PregameFlow } from "@/components/pregame/PregameFlow";

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function openPrepareFlow() {
  fireEvent.click(screen.getByTestId("set-up-for-later-btn"));
}

function continueButton() {
  return screen.getByRole("button", { name: "CONTINUE" });
}

function chip(name: string) {
  return screen.getByRole("button", { name });
}

// localStorage stub — same pattern as install-prompt.test.tsx: Node's own
// experimental localStorage global shadows jsdom's under vitest, so install a
// minimal in-memory Storage on window explicitly (PregameFlow reads the saved
// session cache on mount).
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
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ─── 1. Pre-selection applied ────────────────────────────────────────────────

describe("PregameFlow profile pre-selection (FV-253)", () => {
  it("pre-selects the mapped need and the saved position; CONTINUE is enabled", () => {
    render(
      <PregameFlow
        athleteFirstName="Sam"
        sport="hockey"
        personalization={{ position: "Goalie", focusArea: "nerves" }}
      />,
    );
    openPrepareFlow();

    // Today's Focus: nerves → Calm
    expect(chip("Calm")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Confidence")).toHaveAttribute("aria-pressed", "false");
    expect(continueButton()).toBeEnabled();

    // Position: Goalie
    fireEvent.click(continueButton());
    expect(chip("Goalie")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Forward")).toHaveAttribute("aria-pressed", "false");
    expect(continueButton()).toBeEnabled();
  });

  it("a manual tap overrides the pre-selection", () => {
    render(
      <PregameFlow
        athleteFirstName="Sam"
        sport="basketball"
        personalization={{ position: "Big", focusArea: "bouncing-back" }}
      />,
    );
    openPrepareFlow();

    expect(chip("Reset after mistakes")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip("Joy"));
    expect(chip("Joy")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Reset after mistakes")).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(continueButton());
    expect(chip("Big")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip("Guard"));
    expect(chip("Guard")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Big")).toHaveAttribute("aria-pressed", "false");
  });

  // ─── 2. Unchanged behaviour when nothing valid is saved ───────────────────

  it("no personalization → nothing pre-selected, CONTINUE disabled (pre-FV-253 behaviour)", () => {
    render(<PregameFlow athleteFirstName="Sam" sport="hockey" />);
    openPrepareFlow();

    for (const need of ["Confidence", "Calm", "Compete level", "Reset after mistakes", "Hope"]) {
      expect(chip(need)).toHaveAttribute("aria-pressed", "false");
    }
    expect(continueButton()).toBeDisabled();
  });

  it("skipped quiz (nulls) behaves exactly like no personalization", () => {
    render(
      <PregameFlow
        athleteFirstName="Sam"
        sport="hockey"
        personalization={{ position: null, focusArea: null }}
      />,
    );
    openPrepareFlow();
    expect(chip("Calm")).toHaveAttribute("aria-pressed", "false");
    expect(continueButton()).toBeDisabled();
  });

  it("a cross-sport position is not pre-selected (hockey 'Forward' on basketball)", () => {
    render(
      <PregameFlow
        athleteFirstName="Sam"
        sport="basketball"
        personalization={{ position: "Forward", focusArea: "faith" }}
      />,
    );
    openPrepareFlow();

    expect(chip("Hope")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(continueButton());

    for (const role of ["Guard", "Wing", "Big"]) {
      expect(chip(role)).toHaveAttribute("aria-pressed", "false");
    }
    expect(continueButton()).toBeDisabled();
  });
});
