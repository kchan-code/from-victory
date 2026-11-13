/**
 * @vitest-environment jsdom
 *
 * FV-621 (Android Path A, KC 2026-11-03): Android is consumption-only. New
 * customers subscribe on the website, then sign in on Android. Inside the
 * legacy-native shell (every Android build) the sign-in parent tab must show
 * plain, non-tappable website guidance instead of the /signup link; ios-iap
 * (live iOS) and ordinary web/PWA keep the link unchanged.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { shellCapabilityMock } = vi.hoisted(() => ({
  shellCapabilityMock: vi.fn(() => null as "legacy-native" | "ios-iap" | "android-play" | null),
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
vi.mock("@/lib/auth/device", () => ({ getDeviceAthleteId: () => null }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/actions/auth", () => ({
  signIn: vi.fn(),
  forgetDevice: vi.fn(),
}));
vi.mock("@/lib/actions/pairings", () => ({
  athleteUsernameSignIn: vi.fn(),
}));
vi.mock("@/components/auth/ClearCacheOnMount", () => ({
  ClearCacheOnMount: () => null,
}));

import SignInPage from "@/app/signin/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  shellCapabilityMock.mockReturnValue(null);
});

async function renderPage() {
  render(await SignInPage({ searchParams: {} }));
}

function openCredentialForm() {
  fireEvent.click(screen.getByTestId("signin-show-form"));
}

function signupLinks() {
  return screen
    .queryAllByRole("link")
    .filter((a) => a.getAttribute("href")?.startsWith("/signup"));
}

describe("/signin new-customer guidance by shell capability (FV-621)", () => {
  it("legacy-native (Android): credential form keeps plain website guidance and no signup link", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    await renderPage();
    openCredentialForm();

    const note = screen.getByTestId("signin-native-shell-new-customer");
    expect(note).toHaveTextContent(
      "New to From Victory? Subscribe from a web browser at fromvictoryapp.com, then sign in here.",
    );
    expect(note.querySelector("a")).toBeNull();
    expect(signupLinks()).toHaveLength(0);
    expect(screen.queryByText("Create a parent account")).toBeNull();
  });

  it("ios-iap (live iOS): keeps the Create a parent account link on the credential form", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    await renderPage();
    openCredentialForm();

    expect(
      screen.getByRole("link", { name: "Create a parent account" }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.queryByTestId("signin-native-shell-new-customer")).toBeNull();
  });

  it("web/PWA: keeps the Create a parent account link on the credential form", async () => {
    await renderPage();
    openCredentialForm();

    expect(
      screen.getByRole("link", { name: "Create a parent account" }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.queryByTestId("signin-native-shell-new-customer")).toBeNull();
  });
});

describe("/signin Athlete tab copy (FV-657)", () => {
  it.each([null, "legacy-native", "ios-iap"] as const)(
    "shell %s: 'Username or email' field, under-18 and 18+ guidance, adult reset link",
    async (capability) => {
      shellCapabilityMock.mockReturnValue(capability);
      await renderPage();
      openCredentialForm();

      // The Athlete tab's form is rendered (hidden) alongside the Parent tab's.
      expect(screen.getByLabelText("Username or email", { selector: "input" })).toHaveAttribute(
        "name",
        "username",
      );
      expect(
        screen.getByText(/Under 18\? Use the username from your parent’s invite\./),
      ).toBeInTheDocument();
      expect(screen.getByText(/18 or older\? Sign in with your email\./)).toBeInTheDocument();
      expect(screen.getByTestId("athlete-tab-adult-reset-link")).toHaveAttribute(
        "href",
        "/forgot-password",
      );
    },
  );
});

describe("/signin — android-play behaves like legacy-native (FV-659)", () => {
  it("android-play: credential form keeps plain website guidance, no signup link", async () => {
    shellCapabilityMock.mockReturnValue("android-play");
    await renderPage();
    openCredentialForm();

    const note = screen.getByTestId("signin-native-shell-new-customer");
    expect(note).toHaveTextContent(
      "New to From Victory? Subscribe from a web browser at fromvictoryapp.com, then sign in here.",
    );
    expect(note.querySelector("a")).toBeNull();
    expect(signupLinks()).toHaveLength(0);
    expect(screen.queryByText("Create a parent account")).toBeNull();
  });

  it("android-play: Athlete tab copy matches the other shells (FV-657)", async () => {
    shellCapabilityMock.mockReturnValue("android-play");
    await renderPage();
    openCredentialForm();

    expect(screen.getByLabelText("Username or email", { selector: "input" })).toHaveAttribute(
      "name",
      "username",
    );
    expect(screen.getByTestId("athlete-tab-adult-reset-link")).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});
