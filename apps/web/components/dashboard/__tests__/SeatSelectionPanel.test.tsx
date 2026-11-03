/**
 * @vitest-environment jsdom
 *
 * RTL tests for SeatSelectionPanel (FV-585, KC decision D2).
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const setActiveSeatsMock = vi.fn();
vi.mock("@/lib/actions/seat-selection", () => ({
  setActiveSeats: (...args: unknown[]) => setActiveSeatsMock(...args),
}));

import { SeatSelectionPanel } from "@/components/dashboard/SeatSelectionPanel";

const ATHLETE_A = { id: "aaaaaaaa-0000-4000-8000-000000000001", firstName: "Alex" };
const ATHLETE_B = { id: "aaaaaaaa-0000-4000-8000-000000000002", firstName: "Sam" };
const ATHLETE_C = { id: "aaaaaaaa-0000-4000-8000-000000000003", firstName: "Jordan" };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SeatSelectionPanel", () => {
  it("pre-checks the boxes from initialActiveIds", () => {
    render(
      <SeatSelectionPanel
        athletes={[ATHLETE_A, ATHLETE_B, ATHLETE_C]}
        capacity={2}
        initialActiveIds={[ATHLETE_A.id, ATHLETE_B.id]}
      />,
    );

    expect(screen.getByTestId(`seat-checkbox-${ATHLETE_A.id}`)).toBeChecked();
    expect(screen.getByTestId(`seat-checkbox-${ATHLETE_B.id}`)).toBeChecked();
    expect(screen.getByTestId(`seat-checkbox-${ATHLETE_C.id}`)).not.toBeChecked();
    expect(
      screen.getByText("Active athletes (2/2)", { exact: false }),
    ).toBeInTheDocument();
  });

  it("disables the remaining checkbox and announces 'Limit reached.' once capacity is hit", () => {
    render(
      <SeatSelectionPanel
        athletes={[ATHLETE_A, ATHLETE_B, ATHLETE_C]}
        capacity={2}
        initialActiveIds={[ATHLETE_A.id, ATHLETE_B.id]}
      />,
    );

    expect(screen.getByTestId(`seat-checkbox-${ATHLETE_C.id}`)).toBeDisabled();
    expect(screen.getByTestId("seat-selection-status")).toHaveTextContent(
      "Limit reached.",
    );
  });

  it("re-enables a box and clears the limit message after unchecking one", () => {
    render(
      <SeatSelectionPanel
        athletes={[ATHLETE_A, ATHLETE_B, ATHLETE_C]}
        capacity={2}
        initialActiveIds={[ATHLETE_A.id, ATHLETE_B.id]}
      />,
    );

    fireEvent.click(screen.getByTestId(`seat-checkbox-${ATHLETE_A.id}`));

    expect(screen.getByTestId(`seat-checkbox-${ATHLETE_C.id}`)).not.toBeDisabled();
    expect(screen.getByTestId("seat-selection-status")).not.toHaveTextContent(
      "Limit reached.",
    );
  });

  it("shows a gentle hint, not a block, when zero athletes are selected", () => {
    render(
      <SeatSelectionPanel
        athletes={[ATHLETE_A, ATHLETE_B]}
        capacity={2}
        initialActiveIds={[ATHLETE_A.id]}
      />,
    );

    fireEvent.click(screen.getByTestId(`seat-checkbox-${ATHLETE_A.id}`));

    expect(screen.getByTestId("seat-selection-status")).toHaveTextContent(
      "No one will be active until you pick someone.",
    );
    // Not blocked — save stays enabled.
    expect(screen.getByTestId("seat-selection-save")).not.toBeDisabled();
  });

  it("save happy path shows 'Saved.'", async () => {
    setActiveSeatsMock.mockResolvedValue({
      ok: true,
      state: {
        status: "selected",
        capacity: 2,
        athleteCount: 3,
        activeAthleteIds: [ATHLETE_A.id, ATHLETE_B.id],
        pausedAthleteIds: [ATHLETE_C.id],
      },
    });

    render(
      <SeatSelectionPanel
        athletes={[ATHLETE_A, ATHLETE_B, ATHLETE_C]}
        capacity={2}
        initialActiveIds={[ATHLETE_A.id, ATHLETE_B.id]}
      />,
    );

    fireEvent.click(screen.getByTestId("seat-selection-save"));

    await waitFor(() =>
      expect(screen.getByTestId("seat-selection-status")).toHaveTextContent(
        "Saved.",
      ),
    );
    expect(setActiveSeatsMock).toHaveBeenCalledWith([ATHLETE_A.id, ATHLETE_B.id]);
  });

  it.each([
    ["over_capacity", "Pick up to 2."],
    ["write_failed", "Couldn't save. Try again."],
    [
      "selection_not_needed",
      "Your plan already covers everyone here — refresh to see the update.",
    ],
    ["invalid_input", "Something went wrong. Try again."],
    ["not_parent", "Something went wrong. Try again."],
    ["unlinked_athlete", "Something went wrong. Try again."],
  ])("maps error code %s to its message", async (code, expected) => {
    setActiveSeatsMock.mockResolvedValue({ ok: false, code });

    render(
      <SeatSelectionPanel
        athletes={[ATHLETE_A, ATHLETE_B]}
        capacity={2}
        initialActiveIds={[ATHLETE_A.id]}
      />,
    );

    fireEvent.click(screen.getByTestId("seat-selection-save"));

    await waitFor(() =>
      expect(screen.getByTestId("seat-selection-status")).toHaveTextContent(
        expected,
      ),
    );
  });
});
