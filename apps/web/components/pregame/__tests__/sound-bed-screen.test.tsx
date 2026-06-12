/**
 * @vitest-environment jsdom
 */
// sound-bed-screen.test.tsx — FV-227
//
// Unit tests for the SoundBedScreen component (screens-b.tsx):
//   - renders all 3 bed options plus Silence
//   - default selection is Silence (null bedId in INITIAL_STATE)
//   - tapping a bed calls set("bedId", id) AND writes to localStorage
//   - tapping Silence calls set("bedId", null)
//   - aria-pressed reflects the current selection
//   - on mount, the stored preference is loaded from localStorage and set
//
// Uses the same jsdom/RTL harness as positive-plays-screen.test.tsx.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

import { SoundBedScreen } from "@/components/pregame/screens-b";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";
import { BEDS } from "@/components/pregame/audio/beds";
import { BED_PREF_KEY } from "@/components/pregame/audio/bed-preference";

// ---------------------------------------------------------------------------
// localStorage stub
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => {
      store[k] = v;
    }),
    removeItem: vi.fn((k: string) => {
      delete store[k];
    }),
    clear: () => {
      store = {};
    },
  };
})();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<PregameState> = {}): PregameState {
  return { ...INITIAL_STATE, ...overrides };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
});

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SoundBedScreen (FV-227)", () => {
  it("renders all 3 beds by label", () => {
    render(<SoundBedScreen state={makeState()} set={vi.fn()} />);
    for (const { label } of BEDS) {
      expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeInTheDocument();
    }
  });

  it("renders the Silence option", () => {
    render(<SoundBedScreen state={makeState()} set={vi.fn()} />);
    expect(screen.getByRole("button", { name: /silence/i })).toBeInTheDocument();
  });

  it("Silence is pre-selected when bedId is null (the INITIAL_STATE default)", () => {
    render(<SoundBedScreen state={makeState({ bedId: null })} set={vi.fn()} />);
    const silenceBtn = screen.getByRole("button", { name: /silence/i });
    expect(silenceBtn).toHaveAttribute("aria-pressed", "true");
    // All bed buttons are unselected.
    for (const { label } of BEDS) {
      expect(
        screen.getByRole("button", { name: new RegExp(label, "i") }),
      ).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("the selected bed shows aria-pressed=true, others false", () => {
    render(<SoundBedScreen state={makeState({ bedId: "still" })} set={vi.fn()} />);
    expect(screen.getByRole("button", { name: /still/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /pulse/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /rise/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /silence/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("tapping a bed calls set('bedId', bedId) and writes to localStorage", () => {
    const set = vi.fn();
    render(<SoundBedScreen state={makeState({ bedId: null })} set={set} />);
    fireEvent.click(screen.getByRole("button", { name: /pulse/i }));
    expect(set).toHaveBeenCalledWith("bedId", "pulse");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(BED_PREF_KEY, "pulse");
  });

  it("tapping Silence calls set('bedId', null) and writes 'silence' to localStorage", () => {
    const set = vi.fn();
    render(<SoundBedScreen state={makeState({ bedId: "still" })} set={set} />);
    fireEvent.click(screen.getByRole("button", { name: /silence/i }));
    expect(set).toHaveBeenCalledWith("bedId", null);
    // writeBedPreference(null) stores the token "silence"
    expect(localStorageMock.setItem).toHaveBeenCalledWith(BED_PREF_KEY, "silence");
  });

  it("on mount, loads the stored preference from localStorage and calls set", async () => {
    // Pre-populate localStorage with "rise".
    localStorageMock.getItem.mockReturnValueOnce("rise");

    const set = vi.fn();
    // Render with bedId: null so the mount effect fires.
    await act(async () => {
      render(<SoundBedScreen state={makeState({ bedId: null })} set={set} />);
    });

    expect(set).toHaveBeenCalledWith("bedId", "rise");
  });

  it("on mount, if stored value matches current bedId, set is NOT called (no spurious re-render)", async () => {
    // Pre-populate localStorage with "still".
    localStorageMock.getItem.mockReturnValueOnce("still");

    const set = vi.fn();
    // Render with bedId already matching.
    await act(async () => {
      render(<SoundBedScreen state={makeState({ bedId: "still" })} set={set} />);
    });

    expect(set).not.toHaveBeenCalled();
  });

  it("on mount, if localStorage has no preference (null), set is NOT called when bedId is already null", async () => {
    localStorageMock.getItem.mockReturnValueOnce(null);

    const set = vi.fn();
    await act(async () => {
      render(<SoundBedScreen state={makeState({ bedId: null })} set={set} />);
    });

    expect(set).not.toHaveBeenCalled();
  });

  it("all tap targets are buttons (not divs) — accessibility", () => {
    render(<SoundBedScreen state={makeState()} set={vi.fn()} />);
    // All selectables should be <button> elements.
    const buttons = screen.getAllByRole("button");
    // 3 beds + 1 silence = 4 minimum.
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it("the radiogroup has an accessible label", () => {
    render(<SoundBedScreen state={makeState()} set={vi.fn()} />);
    expect(screen.getByRole("radiogroup", { name: /session sound/i })).toBeInTheDocument();
  });
});
