/**
 * @vitest-environment jsdom
 *
 * FV-674 entry-point UI: /signin sections (R5: under-18 never shows SSO),
 * flags-off absence, legacy-native unchanged, flow behaviour.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const h = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  appleNativeSignIn: vi.fn(),
  appleHandoffComplete: vi.fn(),
  startSession: vi.fn(),
  signInWithApple: vi.fn(),
}));
vi.mock("@/lib/native/auth", async (orig) => ({
  ...(await orig<object>()),
  startSession: h.startSession,
  signInWithApple: h.signInWithApple,
}));

vi.mock("server-only", () => ({}));
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return { ...actual, useFormState: () => [null, vi.fn()], useFormStatus: () => ({ pending: false }) };
});
vi.mock("@/lib/actions/auth", () => ({ signIn: vi.fn() }));
vi.mock("@/lib/actions/pairings", () => ({ athleteUsernameSignIn: vi.fn() }));
vi.mock("@/lib/actions/email-signup", () => ({ verifyEmailOnly: vi.fn() }));
vi.mock("@/lib/actions/apple-auth", () => ({
  appleNativeSignIn: h.appleNativeSignIn,
  appleHandoffComplete: h.appleHandoffComplete,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth: h.signInWithOAuth } }),
}));

import { SignInSections } from "@/components/auth/SignInSections";
import { SsoButtons } from "@/components/auth/SsoButtons";
import type { SsoEntry } from "@/lib/auth/sso-visibility";

const WEB: SsoEntry = { show: true, surface: "web", browserHint: false };
const IOS: SsoEntry = { show: true, surface: "ios", browserHint: false };
const ANDROID: SsoEntry = { show: true, surface: "android", browserHint: false };
const OFF: SsoEntry = { show: false, surface: "web", browserHint: false };

const assign = vi.fn();

beforeEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "https://www.fromvictoryapp.com", assign },
  });
  for (const f of Object.values(h)) f.mockReset();
  assign.mockReset();
});
afterEach(cleanup);

describe("/signin sections", () => {
  it("shows Apple then Google then 'or use email' in the primary section", () => {
    render(<SignInSections sso={WEB} />);
    const primary = within(screen.getByTestId("signin-primary"));
    const buttons = primary.getAllByRole("button").filter((b) => b.dataset.testid?.startsWith("sso-"));
    expect(buttons.map((b) => b.textContent)).toEqual(["Continue with Apple", "Continue with Google"]);
    expect(primary.getByText("or use email")).toBeInTheDocument();
    expect(primary.getByLabelText("Email")).toBeInTheDocument();
  });

  it("R5: the under-18 section never renders SSO, even with SSO on in an FVAuth shell", () => {
    for (const entry of [WEB, IOS, ANDROID]) {
      cleanup();
      render(<SignInSections sso={entry} />);
      const under18 = within(screen.getByTestId("signin-under18"));
      expect(under18.queryByText(/Continue with/)).toBeNull();
      expect(under18.queryByTestId("sso-apple")).toBeNull();
      expect(under18.queryByTestId("sso-google")).toBeNull();
      expect(under18.getByLabelText("Username or email")).toBeInTheDocument();
      // exactly one Apple and one Google control on the whole page
      expect(screen.getAllByTestId("sso-apple")).toHaveLength(1);
      expect(screen.getAllByTestId("sso-google")).toHaveLength(1);
    }
  });

  it("flags off: no SSO buttons or divider; both forms present", () => {
    render(<SignInSections sso={OFF} />);
    expect(screen.queryByTestId("sso-apple")).toBeNull();
    expect(screen.queryByTestId("sso-google")).toBeNull();
    expect(screen.queryByText("or use email")).toBeNull();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Username or email")).toBeInTheDocument();
  });

  it("legacy-native without SSO: website guidance replaces the /signup link, as before", () => {
    render(<SignInSections sso={OFF} legacyNative />);
    expect(screen.getByTestId("signin-native-shell-new-customer")).toBeInTheDocument();
    expect(screen.queryByText("Create a parent account")).toBeNull();
  });

  it("denylisted in-app browser gets the hint, not the buttons", () => {
    render(<SignInSections sso={{ show: false, surface: "web", browserHint: true }} />);
    expect(screen.getByTestId("sso-browser-hint")).toHaveTextContent(
      "Open in Safari or Chrome to use Apple or Google.",
    );
    expect(screen.queryByTestId("sso-apple")).toBeNull();
  });
});

describe("flows", () => {
  it("web Apple navigates to /auth/apple/start", async () => {
    render(<SsoButtons entry={WEB} />);
    fireEvent.click(screen.getByTestId("sso-apple"));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/auth/apple/start"));
    expect(screen.getByTestId("sso-google")).toBeDisabled();
  });

  it("web Google calls signInWithOAuth with PKCE scopes and the callback", async () => {
    h.signInWithOAuth.mockResolvedValue({ data: { url: "https://x" }, error: null });
    render(<SsoButtons entry={WEB} />);
    fireEvent.click(screen.getByTestId("sso-google"));
    await waitFor(() => expect(h.signInWithOAuth).toHaveBeenCalled());
    expect(h.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://www.fromvictoryapp.com/auth/callback",
        skipBrowserRedirect: false,
        scopes: "openid email",
      },
    });
  });

  it("app Google: startSession then the WebView navigates to /auth/callback?code", async () => {
    h.signInWithOAuth.mockResolvedValue({ data: { url: "https://auth.example/authorize" }, error: null });
    h.startSession.mockResolvedValue({ ok: true, url: "com.fromvictoryapp.app://auth/callback?code=abc123" });
    render(<SsoButtons entry={IOS} />);
    fireEvent.click(screen.getByTestId("sso-google"));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/auth/callback?code=abc123"));
    expect(h.signInWithOAuth.mock.calls[0]?.[0].options).toMatchObject({
      redirectTo: "com.fromvictoryapp.app://auth/callback",
      skipBrowserRedirect: true,
    });
    expect(h.startSession).toHaveBeenCalledWith("https://auth.example/authorize");
  });

  it("iOS Apple: native sheet with a hex nonce hash, then appleNativeSignIn with the raw nonce", async () => {
    h.signInWithApple.mockResolvedValue({ ok: true, identityToken: "id-token", authorizationCode: "code" });
    h.appleNativeSignIn.mockResolvedValue({ ok: true, path: "/welcome" });
    render(<SsoButtons entry={IOS} />);
    fireEvent.click(screen.getByTestId("sso-apple"));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/welcome"));
    const nonceHash = h.signInWithApple.mock.calls[0]?.[0];
    expect(nonceHash).toMatch(/^[0-9a-f]{64}$/);
    const call = h.appleNativeSignIn.mock.calls[0]?.[0];
    expect(call).toMatchObject({ identityToken: "id-token", authorizationCode: "code" });
    expect(call.rawNonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("Android Apple: 43-char S256 challenge in the start URL, verifier only to the handoff action", async () => {
    h.startSession.mockResolvedValue({ ok: true, url: "com.fromvictoryapp.app://auth/callback?handoff=H".padEnd(80, "x") });
    h.appleHandoffComplete.mockResolvedValue({ ok: true, path: "/dashboard" });
    render(<SsoButtons entry={ANDROID} />);
    fireEvent.click(screen.getByTestId("sso-apple"));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/dashboard"));
    const url = new URL(h.startSession.mock.calls[0]?.[0]);
    expect(url.pathname).toBe("/auth/apple/start");
    expect(url.searchParams.get("app")).toBe("android");
    expect(url.searchParams.get("challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const arg = h.appleHandoffComplete.mock.calls[0]?.[0];
    expect(arg.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(arg.verifier).not.toBe(url.searchParams.get("challenge"));
    expect(url.toString()).not.toContain(arg.verifier);
  });

  it("a failed flow shows one generic alert and re-enables the buttons", async () => {
    h.signInWithApple.mockResolvedValue({ ok: true, identityToken: "t", authorizationCode: "c" });
    h.appleNativeSignIn.mockResolvedValue({ ok: false, error: "x" });
    render(<SsoButtons entry={IOS} />);
    fireEvent.click(screen.getByTestId("sso-apple"));
    expect(await screen.findByRole("alert")).toHaveTextContent("didn’t go through");
    expect(screen.getByTestId("sso-apple")).not.toBeDisabled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("any other native failure shows the generic alert", async () => {
    h.signInWithApple.mockResolvedValue({ ok: false, error: "bridge_unavailable" });
    render(<SsoButtons entry={IOS} />);
    fireEvent.click(screen.getByTestId("sso-apple"));
    expect(await screen.findByRole("alert")).toHaveTextContent("didn\u2019t go through");
    expect(h.appleNativeSignIn).not.toHaveBeenCalled();
  });

  it("Android: a cancelled Auth Tab resets quietly and never calls the handoff", async () => {
    h.startSession.mockResolvedValue({ ok: false, error: "cancelled" });
    render(<SsoButtons entry={ANDROID} />);
    fireEvent.click(screen.getByTestId("sso-apple"));
    await waitFor(() => expect(screen.getByTestId("sso-apple")).not.toBeDisabled());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(h.appleHandoffComplete).not.toHaveBeenCalled();
  });

  it("a user cancel resets quietly (no error)", async () => {
    h.signInWithApple.mockResolvedValue({ ok: false, error: "cancelled" });
    render(<SsoButtons entry={IOS} />);
    fireEvent.click(screen.getByTestId("sso-apple"));
    await waitFor(() => expect(screen.getByTestId("sso-apple")).not.toBeDisabled());
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("SsoButtons back/forward cache (QA #606)", () => {
  it("re-enables the buttons when the page is restored from bfcache", async () => {
    const { SsoButtons } = await import("@/components/auth/SsoButtons");
    const { render, screen, fireEvent, act } = await import("@testing-library/react");
    render(<SsoButtons entry={{ show: true, surface: "web", browserHint: false }} />);
    fireEvent.click(screen.getByTestId("sso-google"));
    await act(async () => {
      const ev = new Event("pageshow") as PageTransitionEvent;
      Object.defineProperty(ev, "persisted", { value: true });
      window.dispatchEvent(ev);
    });
    expect(screen.getByTestId("sso-google")).not.toBeDisabled();
    expect(screen.getByTestId("sso-apple")).not.toBeDisabled();
  });
});
