/**
 * @vitest-environment jsdom
 *
 * RTL tests for the NextGamePrompt component (FV-240).
 *
 * Cases:
 *   1. Renders four answer buttons with correct labels
 *   2. Tapping an answer calls saveNextGame with the correct value
 *   3. After tap, collapses to a quiet confirmation — buttons are gone
 *   4. If the athlete does NOT tap, the prompt remains visible (skip = no store)
 *   5. Buttons have accessible labels (data-testid present; min-height in CSS)
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

  it("calls saveNextGame with 'tonight' when Tonight is tapped", async () => {
    render(<NextGamePrompt />);

    fireEvent.click(screen.getByTestId("next-game-option-tonight"));

    await waitFor(() => {
      expect(saveNextGameMock).toHaveBeenCalledOnce();
      expect(saveNextGameMock).toHaveBeenCalledWith("tonight");
    });
  });

  it("calls saveNextGame with 'not_sure' when Not sure is tapped", async () => {
    render(<NextGamePrompt />);

    fireEvent.click(screen.getByTestId("next-game-option-not_sure"));

    await waitFor(() => {
      expect(saveNextGameMock).toHaveBeenCalledWith("not_sure");
    });
  });

  it("collapses to confirmation message after a tap", async () => {
    render(<NextGamePrompt />);

    fireEvent.click(screen.getByTestId("next-game-option-tomorrow"));

    // Buttons disappear
    await waitFor(() => {
      expect(
        screen.queryByTestId("next-game-option-tonight"),
      ).not.toBeInTheDocument();
    });

    // Confirmation text is shown
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("status").textContent).toMatch(/remind you/i);
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
