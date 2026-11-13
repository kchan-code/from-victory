/**
 * @vitest-environment jsdom
 *
 * FV-707 / FV-708: welcome doors on /signin, then the existing credential
 * forms. Welcome back only for a returning device-cookie athlete.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { shellCapabilityMock, deviceAthleteId, athleteRow } = vi.hoisted(() => ({
  shellCapabilityMock: vi.fn(
    () => null as "legacy-native" | "ios-iap" | "android-play" | null,
  ),
  deviceAthleteId: { current: null as string | null },
  athleteRow: {
    current: null as { first_name: string; role: string } | null,
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: (_action: unknown, initialState: unknown) => [
      initialState,
      vi.fn(),
    ],
    useFormStatus: () => ({ pending: false }),
  };
});

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
}));
vi.mock("@/lib/auth/guards", () => ({ redirectIfAuthed: vi.fn() }));
vi.mock("@/lib/auth/device", () => ({
  getDeviceAthleteId: () => deviceAthleteId.current,
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: athleteRow.current, error: null }),
        }),
      }),
    }),
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user: { email: "athlete@example.com" } },
        }),
      },
    },
  }),
}));
vi.mock("@/lib/actions/auth", () => ({
  signIn: vi.fn(),
  forgetDevice: vi.fn(),
}));
vi.mock("@/lib/actions/pairings", () => ({
  athleteUsernameSignIn: vi.fn(),
  athleteSignIn: vi.fn(),
  forgetDevice: vi.fn(),
}));
vi.mock("@/lib/pregame/athlete-cache", () => ({ clearAthleteCache: vi.fn() }));
vi.mock("@/lib/pregame/session-cache", () => ({
  clearPregameSession: vi.fn(),
}));
vi.mock("@/components/auth/ClearCacheOnMount", () => ({
  ClearCacheOnMount: () => null,
}));

import { SignInChooser } from "@/components/auth/SignInChooser";
import SignInPage from "@/app/signin/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  shellCapabilityMock.mockReturnValue(null);
  deviceAthleteId.current = null;
  athleteRow.current = null;
});

async function renderPage(
  searchParams: { reset?: string; error?: string } = {},
) {
  render(await SignInPage({ searchParams }));
}

describe("SignInChooser doors (FV-707)", () => {
  it("hides the 18+ door when adult signup is off, and never links a minor to self-serve", () => {
    render(<SignInChooser adultSignupEnabled={false} />);

    expect(screen.getByTestId("signin-door-parent")).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(screen.getByTestId("signin-have-invite")).toHaveAttribute(
      "href",
      "/invite",
    );
    expect(screen.queryByTestId("signin-door-adult")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /18\+/ }),
    ).not.toBeInTheDocument();
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/signup", "/invite"]);
  });

  it("links the 18+ door to the existing adult signup route when the flag is on", () => {
    render(<SignInChooser adultSignupEnabled />);

    expect(screen.getByTestId("signin-door-adult")).toHaveAttribute(
      "href",
      "/signup/athlete",
    );
    expect(screen.getByTestId("signin-door-adult")).toHaveTextContent(
      "I'm 18+ and training myself",
    );
    expect(screen.getByTestId("signin-door-adult")).toHaveTextContent(
      "Create my own account.",
    );
  });

  it("keeps parent email and athlete username sign-in behind Sign in", () => {
    render(<SignInChooser adultSignupEnabled />);

    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("signin-show-form"));
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(document.getElementById("password")).toHaveAttribute(
      "type",
      "password",
    );
    fireEvent.click(screen.getByTestId("signin-tab-athlete"));
    expect(document.getElementById("athlete-username")).toHaveAttribute(
      "name",
      "username",
    );
  });
});

describe("/signin welcome copy (FV-708)", () => {
  it("says Welcome, not Welcome back, when there is no returning signal", async () => {
    vi.stubEnv("ENABLE_ADULT_SIGNUP", "true");
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Welcome back/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("How will you use From Victory?"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("signin-door-adult")).toHaveAttribute(
      "href",
      "/signup/athlete",
    );
  });

  it("hides the 18+ door on the page when ENABLE_ADULT_SIGNUP is off", async () => {
    vi.stubEnv("ENABLE_ADULT_SIGNUP", "false");
    await renderPage();

    expect(screen.queryByTestId("signin-door-adult")).not.toBeInTheDocument();
    expect(screen.getByTestId("signin-door-parent")).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("says Welcome back with the athlete's name when the device cookie matches", async () => {
    deviceAthleteId.current = "athlete-1";
    athleteRow.current = { first_name: "Jordan", role: "athlete" };

    await renderPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Welcome back, Jordan.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("signin-door-parent")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("opens the credential form when the session was invalid", async () => {
    await renderPage({ error: "session_invalid" });

    expect(screen.getByRole("alert")).toHaveTextContent(/session was invalid/i);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
