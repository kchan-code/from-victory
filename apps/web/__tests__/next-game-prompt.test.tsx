/**
 * @vitest-environment jsdom
 *
 * RTL tests for the NextGamePrompt component (FV-240).
 *
 * Cases:
 *   1. Renders four answer buttons with correct labels
 *   2. Tapping an answer calls saveNextGame with the correct value
 *   3. After a successful stored-answer save, collapses to the reminder confirmation.
 *   4. After a successful "Not sure" save, shows the no-reminder confirmation.
 *      (no reminder promised because nothing is stored)
 *   5. If the athlete does NOT tap, the prompt remains visible (skip = no store)
 *   6. Buttons have accessible labels (data-testid present; min-height in CSS)
 *   7. Pending save disables options, shows saving status, and blocks a second tap
 *   8. Returned and thrown failures keep the options and show a retryable error
 *   9. A later successful tap confirms only after that save succeeds
 *  10. An expired session (action resolves undefined, or rejects with a
 *      redirect) does not flash the save error or reject an unhandled promise
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

  it("shows saving status, blocks a second tap, and confirms only after success", async () => {
    let resolveSave: (value: { ok: true }) => void = () => {};
    saveNextGameMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );

    render(<NextGamePrompt />);
    fireEvent.click(screen.getByTestId("next-game-option-tonight"));

    expect(screen.getByTestId("next-game-saving")).toHaveTextContent("Saving…");
    expect(screen.getByTestId("next-game-prompt")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByTestId("next-game-option-tonight")).toBeDisabled();
    expect(screen.queryByText(/remind you/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("next-game-option-tomorrow"));
    expect(saveNextGameMock).toHaveBeenCalledTimes(1);

    resolveSave({ ok: true });

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toMatch(/remind you/i);
    });
    expect(screen.queryByTestId("next-game-prompt")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-game-error")).not.toBeInTheDocument();
  });

  it("keeps the options and shows an inline error when the save returns ok:false", async () => {
    saveNextGameMock.mockResolvedValue({
      ok: false,
      error: "Couldn't save — tap to try again.",
    });

    render(<NextGamePrompt />);
    fireEvent.click(screen.getByTestId("next-game-option-this_weekend"));

    await waitFor(() => {
      expect(screen.getByTestId("next-game-error")).toHaveTextContent(
        "Couldn't save. Tap an answer to try again.",
      );
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("next-game-option-this_weekend")).toBeEnabled();
    expect(screen.queryByText(/remind you/i)).not.toBeInTheDocument();
  });

  it("keeps the options and shows an inline error when the save throws", async () => {
    saveNextGameMock.mockRejectedValue(
      new Error(
        'A "use server" file can only export async functions, found object.',
      ),
    );

    render(<NextGamePrompt />);
    fireEvent.click(screen.getByTestId("next-game-option-tonight"));

    await waitFor(() => {
      expect(screen.getByTestId("next-game-error")).toHaveTextContent(
        "Couldn't save. Tap an answer to try again.",
      );
    });
    expect(screen.getByTestId("next-game-option-tonight")).toBeEnabled();
    expect(screen.queryByText(/remind you/i)).not.toBeInTheDocument();
  });

  it("retries after a failure and confirms only when the next save succeeds", async () => {
    saveNextGameMock
      .mockResolvedValueOnce({ ok: false, error: "nope" })
      .mockResolvedValueOnce({ ok: true });

    render(<NextGamePrompt />);
    fireEvent.click(screen.getByTestId("next-game-option-tonight"));

    await waitFor(() => {
      expect(screen.getByTestId("next-game-error")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("next-game-option-not_sure"));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toMatch(/ask me again/i);
    });
    expect(saveNextGameMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("next-game-error")).not.toBeInTheDocument();
    expect(screen.queryByText(/remind you/i)).not.toBeInTheDocument();
  });

  it("does not flash a save error when an expired session resolves undefined", async () => {
    // Next 14.2 follows redirect("/signin") and resolves the action to undefined.
    saveNextGameMock.mockResolvedValue(undefined);

    render(<NextGamePrompt />);
    fireEvent.click(screen.getByTestId("next-game-option-tonight"));

    await waitFor(() => {
      expect(screen.getByTestId("next-game-option-tonight")).toBeEnabled();
    });
    expect(screen.queryByTestId("next-game-error")).not.toBeInTheDocument();
    expect(screen.queryByText(/remind you/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("next-game-prompt")).toBeInTheDocument();
  });

  it("swallows a rejected redirect without an unhandled rejection or save error", async () => {
    const reasons: unknown[] = [];
    const onProcess = (reason: unknown) => {
      reasons.push(reason);
    };
    const onWindow = (event: PromiseRejectionEvent) => {
      reasons.push(event.reason);
      event.preventDefault();
    };
    process.on("unhandledRejection", onProcess);
    window.addEventListener("unhandledrejection", onWindow);

    const redirectError = new Error("NEXT_REDIRECT");
    (redirectError as Error & { digest: string }).digest =
      "NEXT_REDIRECT;replace;/signin;303;";
    saveNextGameMock.mockRejectedValue(redirectError);

    try {
      render(<NextGamePrompt />);
      fireEvent.click(screen.getByTestId("next-game-option-tomorrow"));

      await waitFor(() => {
        expect(screen.getByTestId("next-game-option-tomorrow")).toBeEnabled();
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(reasons).toEqual([]);
      expect(screen.queryByTestId("next-game-error")).not.toBeInTheDocument();
      expect(screen.queryByText(/remind you/i)).not.toBeInTheDocument();
    } finally {
      process.off("unhandledRejection", onProcess);
      window.removeEventListener("unhandledrejection", onWindow);
    }
  });
});
