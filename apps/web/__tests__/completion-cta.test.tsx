/**
 * @vitest-environment jsdom
 *
 * Completion overlay must name the day that was just finished (FV-610).
 * After completeDailySession succeeds, the server re-renders this component
 * with the next day's props. The open overlay has to keep the snapshot from
 * the tap.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { completeDailySessionMock } = vi.hoisted(() => ({
  completeDailySessionMock: vi.fn(),
}));

vi.mock("@/lib/actions/daily-session", () => ({
  completeDailySession: completeDailySessionMock,
}));

vi.mock("@/components/daily/NextGamePrompt", () => ({
  NextGamePrompt: () => null,
}));

import {
  CompletionCTA,
  DailyCompletionSlot,
} from "@/components/daily/CompletionCTA";

beforeEach(() => {
  completeDailySessionMock.mockReset();
  completeDailySessionMock.mockResolvedValue(undefined);
});

describe("CompletionCTA", () => {
  it("keeps Day 1 on the overlay and ring after props advance to Day 2", () => {
    const { rerender } = render(
      <CompletionCTA dayNumber={1} completedCount={0} />,
    );

    fireEvent.click(screen.getByTestId("complete-session-btn"));

    expect(screen.getByTestId("completion-day-label")).toHaveTextContent(
      "Day 1 done.",
    );
    const ring = screen.getByRole("img", { name: /Day 1 of 30/ });
    expect(ring).toHaveTextContent("1");
    expect(ring).toHaveTextContent("/30");

    rerender(<CompletionCTA dayNumber={2} completedCount={1} />);

    expect(screen.getByTestId("completion-day-label")).toHaveTextContent(
      "Day 1 done.",
    );
    expect(screen.queryByText("Day 2 done.")).not.toBeInTheDocument();
    const ringAfter = screen.getByRole("img", { name: /Day 1 of 30/ });
    expect(ringAfter).toHaveTextContent("1");
    expect(ringAfter).toHaveTextContent("/30");
    expect(
      screen.queryByRole("img", { name: /Day 2 of 30/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("completion-moment"));

    expect(screen.getByTestId("completion-day-label")).toHaveTextContent(
      "Day 1 done.",
    );
    expect(screen.getByRole("img", { name: /Day 1 of 30/ })).toHaveTextContent(
      "/30",
    );
  });

  it("still labels the button with the latest day before a tap", () => {
    const { rerender } = render(
      <CompletionCTA dayNumber={1} completedCount={0} />,
    );
    rerender(<CompletionCTA dayNumber={2} completedCount={1} />);
    expect(screen.getByTestId("complete-session-btn")).toHaveTextContent(
      "Complete Day 2",
    );
  });

  it.each([
    [7, "One week in. You're building something real."],
    [14, "Two weeks strong. Your rhythm is taking shape."],
    [30, "All 30. The work is yours — keep showing up."],
  ])(
    "keeps the day %s milestone after props advance",
    (day, copy) => {
      const { rerender } = render(
        <CompletionCTA dayNumber={day} completedCount={day - 1} />,
      );
      fireEvent.click(screen.getByTestId("complete-session-btn"));
      rerender(
        <CompletionCTA
          dayNumber={day === 30 ? 30 : day + 1}
          completedCount={day}
        />,
      );
      expect(screen.getByTestId("completion-day-label")).toHaveTextContent(
        `Day ${day} done.`,
      );
      expect(screen.getByText(copy)).toBeInTheDocument();
      expect(
        screen.getByRole("img", { name: new RegExp(`Day ${day} of 30`) }),
      ).toBeInTheDocument();
    },
  );

  it("rolls the overlay back when the save fails so the athlete can retry", async () => {
    completeDailySessionMock.mockRejectedValueOnce(new Error("save failed"));
    render(<CompletionCTA dayNumber={1} completedCount={0} />);

    fireEvent.click(screen.getByTestId("complete-session-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("complete-session-btn")).toHaveTextContent(
        "Retry Day 1",
      );
    });
    expect(screen.queryByTestId("completion-moment")).not.toBeInTheDocument();
  });
});

describe("DailyCompletionSlot", () => {
  it("shows the closure banner when all 30 days were already finished", () => {
    render(
      <DailyCompletionSlot dayNumber={30} completedCount={30} allComplete />,
    );
    expect(screen.getByText("Your rhythm is built.")).toBeInTheDocument();
    expect(screen.queryByTestId("complete-session-btn")).not.toBeInTheDocument();
  });

  it("keeps the day 30 overlay mounted when the refresh marks the plan complete", () => {
    const { rerender } = render(
      <DailyCompletionSlot
        dayNumber={30}
        completedCount={29}
        allComplete={false}
      />,
    );

    fireEvent.click(screen.getByTestId("complete-session-btn"));
    expect(screen.getByTestId("completion-day-label")).toHaveTextContent(
      "Day 30 done.",
    );

    rerender(
      <DailyCompletionSlot dayNumber={30} completedCount={30} allComplete />,
    );

    expect(screen.getByTestId("completion-day-label")).toHaveTextContent(
      "Day 30 done.",
    );
    expect(screen.queryByText("Your rhythm is built.")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Day 30 of 30/ }),
    ).toBeInTheDocument();
  });
});
