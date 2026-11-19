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
vi.mock("@/lib/actions/email-signup", () => ({
  startEmailSignup: vi.fn(),
  completeEmailSignup: vi.fn(),
  verifyEmailOnly: vi.fn(),
  resendSignupCode: vi.fn(),
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
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  shellCapabilityMock.mockReturnValue(null);
});

async function renderPage() {
  render(await SignInPage({ searchParams: Promise.resolve({}) }));
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

// C7 (FV-665): android-play + GOOGLE_PLAY_CATALOG_ACTIVE=1 is the only case
// that lifts the website guidance and swaps the delete notice.
const FAILURE_COPY =
  "Your account is deleted. Your Google Play subscription could not be cancelled automatically. Please cancel it in Google Play.";
const UNKNOWN_COPY =
  "Your account is deleted. If you subscribed through Google Play, please check your subscriptions in Google Play and cancel it there.";

async function renderPageWith(searchParams: Record<string, string>) {
  render(await SignInPage({ searchParams: Promise.resolve(searchParams) }));
}

describe("/signin — android-play with the Play catalog active (FV-665 C7)", () => {
  it("android-play + flag on: shows the normal sign-up link, no website guidance", async () => {
    vi.stubEnv("GOOGLE_PLAY_CATALOG_ACTIVE", "1");
    shellCapabilityMock.mockReturnValue("android-play");
    await renderPage();
    openCredentialForm();

    expect(
      screen.getByRole("link", { name: "Create a parent account" }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.queryByTestId("signin-native-shell-new-customer")).toBeNull();
  });

  it.each([
    ["android-play, flag unset", "android-play", undefined],
    ["android-play, flag not exactly 1", "android-play", "true"],
    ["legacy-native, flag on", "legacy-native", "1"],
    ["ios-iap, flag on", "ios-iap", "1"],
  ] as const)(
    "%s: website guidance is unchanged for restricted shells, link kept elsewhere",
    async (_label, capability, flag) => {
      if (flag !== undefined) vi.stubEnv("GOOGLE_PLAY_CATALOG_ACTIVE", flag);
      shellCapabilityMock.mockReturnValue(capability);
      await renderPage();
      openCredentialForm();

      if (capability === "ios-iap") {
        expect(screen.getByRole("link", { name: "Create a parent account" })).toBeInTheDocument();
        expect(screen.queryByTestId("signin-native-shell-new-customer")).toBeNull();
      } else {
        expect(screen.getByTestId("signin-native-shell-new-customer")).toBeInTheDocument();
        expect(signupLinks()).toHaveLength(0);
      }
    },
  );

  it.each([
    ["google_play_cancel", FAILURE_COPY],
    ["google_play_cancel_unknown", UNKNOWN_COPY],
  ] as const)(
    "android-play + flag on, %s: renders GooglePlayDeleteNotice with the static sentence",
    async (param, copy) => {
      vi.stubEnv("GOOGLE_PLAY_CATALOG_ACTIVE", "1");
      shellCapabilityMock.mockReturnValue("android-play");
      await renderPageWith({ account_deleted: "1", [param]: "1" });

      expect(screen.getByText(copy)).toBeInTheDocument();
      expect(screen.getByText("Account deleted")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Open Google Play" })).toBeInTheDocument();
    },
  );

  it.each([
    ["android-play, flag unset", "android-play", undefined],
    ["legacy-native, flag on", "legacy-native", "1"],
    ["ios-iap, flag on", "ios-iap", "1"],
    ["web, flag on", null, "1"],
  ] as const)(
    "%s: delete notice stays the plain text notice (no button)",
    async (_label, capability, flag) => {
      if (flag !== undefined) vi.stubEnv("GOOGLE_PLAY_CATALOG_ACTIVE", flag);
      shellCapabilityMock.mockReturnValue(capability);
      await renderPageWith({ account_deleted: "1", google_play_cancel: "1" });

      const notice = screen.getByTestId("signin-account-deleted-google-cancel-notice");
      expect(notice).toHaveTextContent(FAILURE_COPY);
      expect(screen.queryByRole("button", { name: "Open Google Play" })).toBeNull();
      expect(screen.queryByText("Account deleted")).toBeNull();
    },
  );
});
