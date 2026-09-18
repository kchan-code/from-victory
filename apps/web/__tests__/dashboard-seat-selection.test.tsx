/**
 * @vitest-environment jsdom
 *
 * RTL tests for the FV-585 (KC decision D2) seat-selection surface on
 * /dashboard: the "choose who stays active" banner + panel, and the
 * per-athlete Active/Paused pills.
 *
 * Scoped narrowly to the seat-selection branch — athlete cards, rhythm, and
 * the existing billing banner are covered by dashboard-page.test.tsx and are
 * out of scope here except to prove they're untouched.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));

// Test-env shim — DeleteAccountSection (always rendered) calls useFormState /
// useFormStatus; these tests never submit it.
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  const React = await import("react");
  return {
    ...actual,
    useFormState: (_action: unknown, initialState: unknown) =>
      React.useState(initialState),
    useFormStatus: () => ({ pending: false }),
  };
});

const {
  requireParentMock,
  isNativeShellMock,
  accessLevelMock,
  seatStateMock,
} = vi.hoisted(() => ({
  requireParentMock: vi.fn(),
  isNativeShellMock: vi.fn(() => false),
  accessLevelMock: vi.fn(async () => "full"),
  seatStateMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: requireParentMock,
}));

vi.mock("@/lib/native-shell", () => ({
  isNativeShell: isNativeShellMock,
  // Forward-compatible with the FV-577 dashboard (3-way shell capability):
  // null = plain web, so these tests exercise the web branch regardless of
  // which shell-detection API the page under test calls.
  getRequestShellCapability: () => null,
}));

vi.mock("@/lib/subscriptions/access", () => ({
  getParentAccessLevel: accessLevelMock,
}));

vi.mock("@/lib/subscriptions/seat-state", () => ({
  getPayerSeatStateForCurrentParent: seatStateMock,
}));

vi.mock("@/lib/actions/seat-selection", () => ({
  setActiveSeats: vi.fn(),
}));

const ATHLETE_A = "aaaaaaaa-0000-4000-8000-000000000001";
const ATHLETE_B = "aaaaaaaa-0000-4000-8000-000000000002";
const ATHLETE_C = "aaaaaaaa-0000-4000-8000-000000000003";

let athleteRows: Array<{ id: string; first_name: string; birthdate: string }>;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: athleteRows, error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/dashboard/rhythm", () => ({
  getAthleteMetadataMap: vi.fn(async () => new Map()),
  ZERO_RHYTHM: {
    sessionsCompleted: 0,
    sessionsStarted: 0,
    progressPct: 0,
    ringLabel: "rhythm starts today",
    lastCompletedAt: null,
  },
}));

vi.mock("@/lib/actions/account", () => ({
  deleteAccount: vi.fn(),
  deleteAthlete: vi.fn(),
}));

import DashboardPage from "@/app/dashboard/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  isNativeShellMock.mockReturnValue(false);
  accessLevelMock.mockResolvedValue("full");
});

async function renderPage() {
  requireParentMock.mockResolvedValue({
    userId: "parent-1",
    profile: { id: "parent-1", role: "parent", first_name: "Kim" },
  });
  const jsx = await DashboardPage();
  return render(jsx);
}

describe("/dashboard — seat-selection banner (FV-585)", () => {
  it("shows the banner + panel + correct pills when over capacity (selection_required)", async () => {
    athleteRows = [
      { id: ATHLETE_A, first_name: "Alex", birthdate: "2010-01-01" },
      { id: ATHLETE_B, first_name: "Sam", birthdate: "2011-01-01" },
      { id: ATHLETE_C, first_name: "Jordan", birthdate: "2012-01-01" },
    ];
    seatStateMock.mockResolvedValue({
      status: "selection_required",
      capacity: 2,
      athleteCount: 3,
      activeAthleteIds: [],
      pausedAthleteIds: [ATHLETE_A, ATHLETE_B, ATHLETE_C],
    });

    await renderPage();

    expect(screen.getByTestId("seat-selection-banner")).toBeInTheDocument();
    expect(screen.getByText("Choose who stays active.")).toBeInTheDocument();
    expect(
      screen.getByText(/Your plan covers 2 athletes.*This account has 3/),
    ).toBeInTheDocument();

    // Every athlete shows a Paused pill; no Active pill anywhere.
    expect(screen.getByTestId(`seat-pill-paused-${ATHLETE_A}`)).toBeInTheDocument();
    expect(screen.getByTestId(`seat-pill-paused-${ATHLETE_B}`)).toBeInTheDocument();
    expect(screen.getByTestId(`seat-pill-paused-${ATHLETE_C}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`seat-pill-active-${ATHLETE_A}`)).not.toBeInTheDocument();
  });

  it("shows correct Active/Paused split when status is 'selected'", async () => {
    athleteRows = [
      { id: ATHLETE_A, first_name: "Alex", birthdate: "2010-01-01" },
      { id: ATHLETE_B, first_name: "Sam", birthdate: "2011-01-01" },
      { id: ATHLETE_C, first_name: "Jordan", birthdate: "2012-01-01" },
    ];
    seatStateMock.mockResolvedValue({
      status: "selected",
      capacity: 2,
      athleteCount: 3,
      activeAthleteIds: [ATHLETE_A, ATHLETE_B],
      pausedAthleteIds: [ATHLETE_C],
    });

    await renderPage();

    expect(screen.getByTestId("seat-selection-banner")).toBeInTheDocument();
    expect(screen.getByTestId(`seat-pill-active-${ATHLETE_A}`)).toBeInTheDocument();
    expect(screen.getByTestId(`seat-pill-active-${ATHLETE_B}`)).toBeInTheDocument();
    expect(screen.getByTestId(`seat-pill-paused-${ATHLETE_C}`)).toBeInTheDocument();
  });

  it("renders nothing new when uncapped", async () => {
    athleteRows = [
      { id: ATHLETE_A, first_name: "Alex", birthdate: "2010-01-01" },
    ];
    seatStateMock.mockResolvedValue({
      status: "uncapped",
      capacity: null,
      athleteCount: 1,
      activeAthleteIds: [ATHLETE_A],
      pausedAthleteIds: [],
    });

    await renderPage();

    expect(screen.queryByTestId("seat-selection-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId(`seat-pill-active-${ATHLETE_A}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`seat-pill-paused-${ATHLETE_A}`)).not.toBeInTheDocument();
    expect(screen.queryByText("Couldn’t check plan spots right now.")).not.toBeInTheDocument();
  });

  it("renders nothing new when within capacity", async () => {
    athleteRows = [
      { id: ATHLETE_A, first_name: "Alex", birthdate: "2010-01-01" },
    ];
    seatStateMock.mockResolvedValue({
      status: "within_capacity",
      capacity: 5,
      athleteCount: 1,
      activeAthleteIds: [ATHLETE_A],
      pausedAthleteIds: [],
    });

    await renderPage();

    expect(screen.queryByTestId("seat-selection-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId(`seat-pill-active-${ATHLETE_A}`)).not.toBeInTheDocument();
  });

  it("shows a neutral read-error notice and no panel when the seat-state read fails", async () => {
    athleteRows = [
      { id: ATHLETE_A, first_name: "Alex", birthdate: "2010-01-01" },
    ];
    seatStateMock.mockResolvedValue({
      status: "uncapped",
      capacity: null,
      athleteCount: 1,
      activeAthleteIds: [ATHLETE_A],
      pausedAthleteIds: [],
      readError: true,
    });

    await renderPage();

    expect(
      screen.getByText("Couldn’t check plan spots right now."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("seat-selection-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("seat-selection-save")).not.toBeInTheDocument();
  });
});
