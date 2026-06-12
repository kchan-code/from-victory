/**
 * @vitest-environment jsdom
 *
 * RTL tests for the NextGamePrompt component (FV-240).
 *
 * Cases:
 *   1. Renders four answer buttons with correct labels
 *   2. Tapping an answer calls saveNextGame with the correct value
 *   3. After tap (stored answer), collapses to "Got it — we'll remind you."
 *   4. After tapping "Not sure", shows "All good — ask me again anytime."
 *      (no reminder promised because nothing is stored)
 *   5. If the athlete does NOT tap, the prompt remains visible (skip = no store)
 *   6. Buttons have accessible labels (data-testid present; min-height in CSS)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// vi.mock factory is hoisted — use vi.hoisted to declare the mock fn first
// so the factory closure captures the same reference.
const { saveNextGameMock } = vi.hoisted(() => ({
  saveNextGameMock: vi.fn(),
}));

vi.mock("@/lib/actions/next-game", () => ({
  saveNextGame: saveNextGameMock,
}));

// The component imports NEXT_GAME_ANSWERS and NextGameAnswer from the shared
// module — mock that too so RTL doesn't try to evaluate the plain TS module
// via the jsdom transform pipeline.
vi.mock("@/lib/daily/next-game-shared", () => ({
  NEXT_GAME_ANSWERS: ["tonight", "tomorrow", "this_weekend", "not_sure"],
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { NextGamePrompt } from "@/components/daily/NextGamePrompt";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  saveNextGameMock.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NextGamePrompt", () => {
  it("renders all four answer options", () => {
    render(<NextGamePrompt />);

    expect(
      screen.getByTestId("next-game-option-tonight"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("next-game-option-tomorrow"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("next-game-option-this_weekend"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("next-game-option-not_sure"),
    ).toBeInTheDocument();
  });

  it("displays human-readable labels (not enum values)", () => {
    render(<NextGamePrompt />);

    // Use testid-scoped queries to avoid ambiguity if tests don't clean up
    expect(
      screen.getByTestId("next-game-option-tonight").textContent,
    ).toBe("Tonight");
    expect(
      screen.getByTestId("next-game-option-tomorrow").textContent,
    ).toBe("Tomorrow");
    expect(
      screen.getByTestId("next-game-option-this_weekend").textContent,
    ).toBe("This weekend");
    expect(
      screen.getByTestId("next-game-option-not_sure").textContent,
    ).toBe("Not sure");
  });

  it("calls saveNextGame with 'tonight' and timezone when Tonight is tapped", async () => {
    render(<NextGamePrompt />);

    fireEvent.click(screen.getByTestId("next-game-option-tonight"));

    await waitFor(() => {
      expect(saveNextGameMock).toHaveBeenCalledOnce();
      // First arg is the answer; second is the IANA timezone string from the browser.
      expect(saveNextGameMock).toHaveBeenCalledWith(
        "tonight",
        expect.any(String),
      );
    });
  });

  it("calls saveNextGame with 'not_sure' when Not sure is tapped", async () => {
    render(<NextGamePrompt />);

    fireEvent.click(screen.getByTestId("next-game-option-not_sure"));

    await waitFor(() => {
      expect(saveNextGameMock).toHaveBeenCalledWith(
        "not_sure",
        expect.any(String),
      );
    });
  });

  it("collapses to 'Got it' confirmation after a stored-answer tap", async () => {
    render(<NextGamePrompt />);

    fireEvent.click(screen.getByTestId("next-game-option-tomorrow"));

    // Buttons disappear
    await waitFor(() => {
      expect(
        screen.queryByTestId("next-game-option-tonight"),
      ).not.toBeInTheDocument();
    });

    // Confirmation text is shown for a stored answer (not "not_sure").
    // Use a regex that doesn't depend on straight vs curly apostrophe.
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status.textContent).toMatch(/remind you/i);
    // Must NOT claim a reminder for a not_sure tap
    expect(status.textContent).not.toMatch(/ask me again/i);
  });

  it("collapses to 'ask me again' confirmation after 'Not sure' tap", async () => {
    render(<NextGamePrompt />);

    fireEvent.click(screen.getByTestId("next-game-option-not_sure"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("next-game-option-tonight"),
      ).not.toBeInTheDocument();
    });

    // For not_sure: no reminder is stored, so we must NOT promise one.
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/ask me again/i);
    expect(status.textContent).not.toMatch(/we'll remind you/i);
  });

  it("does not call saveNextGame if the athlete never taps (skip scenario)", () => {
    render(<NextGamePrompt />);
    // No interaction
    expect(saveNextGameMock).not.toHaveBeenCalled();
    // Prompt is still visible
    expect(screen.getByTestId("next-game-prompt")).toBeInTheDocument();
  });

  it("buttons have type=button (no accidental form submission)", () => {
    render(<NextGamePrompt />);
    const btn = screen.getByTestId("next-game-option-tonight");
    expect(btn).toHaveAttribute("type", "button");
  });
});
