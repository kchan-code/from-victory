/**
 * @vitest-environment jsdom
 *
 * FV-674: /signin?error=oauth banner, page-level SSO wiring, and the admin
 * preview cookie actions.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const h = vi.hoisted(() => ({
  setCookie: vi.fn(),
  requireAdmin: vi.fn(),
  sso: { show: false, surface: "web", browserHint: false } as {
    show: boolean;
    surface: "web" | "ios" | "android";
    browserHint: boolean;
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return { ...actual, useFormState: () => [null, vi.fn()], useFormStatus: () => ({ pending: false }) };
});
vi.mock("next/image", () => ({
  // reason: test stub for next/image.
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));
vi.mock("next/headers", () => ({ cookies: () => ({ set: h.setCookie, get: vi.fn() }), headers: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("@/lib/actions/auth", () => ({ signIn: vi.fn() }));
vi.mock("@/lib/actions/pairings", () => ({ athleteUsernameSignIn: vi.fn() }));
vi.mock("@/lib/actions/email-signup", () => ({ verifyEmailOnly: vi.fn() }));
vi.mock("@/lib/actions/apple-auth", () => ({ appleNativeSignIn: vi.fn(), appleHandoffComplete: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/auth/device", () => ({ getDeviceAthleteId: () => null }));
vi.mock("@/lib/auth/guards", () => ({ redirectIfAuthed: async () => undefined }));
vi.mock("@/lib/native-shell", () => ({ getRequestShellCapability: () => null }));
vi.mock("@/lib/auth/sso-visibility", () => ({ showSSO: () => h.sso }));
vi.mock("@/lib/auth/admin", () => ({ requireAdminParent: h.requireAdmin }));

import SignInPage from "@/app/signin/page";
import { disableSsoPreview, enableSsoPreview } from "@/lib/actions/sso-preview";

beforeEach(() => {
  h.setCookie.mockReset();
  h.requireAdmin.mockReset();
  h.sso = { show: false, surface: "web", browserHint: false };
});
afterEach(cleanup);

describe("/signin", () => {
  it("?error=oauth shows the generic banner", async () => {
    render(await SignInPage({ searchParams: { error: "oauth" } }));
    expect(screen.getByTestId("signin-oauth-error")).toHaveTextContent("didn’t go through");
  });

  it("no banner without the param", async () => {
    render(await SignInPage({ searchParams: {} }));
    expect(screen.queryByTestId("signin-oauth-error")).toBeNull();
  });

  it("renders SSO only when showSSO() says so", async () => {
    render(await SignInPage({ searchParams: {} }));
    expect(screen.queryByTestId("sso-apple")).toBeNull();
    cleanup();
    h.sso = { show: true, surface: "web", browserHint: false };
    render(await SignInPage({ searchParams: {} }));
    expect(screen.getByTestId("sso-apple")).toBeInTheDocument();
  });
});

describe("SSO preview cookie actions", () => {
  beforeEach(() => {
    process.env.SSO_PREVIEW_TOKEN = "p".repeat(40);
  });
  afterEach(() => {
    delete process.env.SSO_PREVIEW_TOKEN;
  });

  it("enable sets an HttpOnly Secure Lax 30-day cookie to the token", async () => {
    await expect(enableSsoPreview()).rejects.toThrow("REDIRECT:/dashboard/admin/sso-preview?status=on");
    expect(h.requireAdmin).toHaveBeenCalled();
    expect(h.setCookie).toHaveBeenCalledWith("fv_sso_preview", "p".repeat(40), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  });

  it("enable refuses without a configured token", async () => {
    delete process.env.SSO_PREVIEW_TOKEN;
    await expect(enableSsoPreview()).rejects.toThrow("status=no-token");
    expect(h.setCookie).not.toHaveBeenCalled();
  });

  it("a non-admin (requireAdminParent throws) sets nothing", async () => {
    h.requireAdmin.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
    await expect(enableSsoPreview()).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(disableSsoPreview()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(h.setCookie).not.toHaveBeenCalled();
  });

  it("disable clears the cookie", async () => {
    await expect(disableSsoPreview()).rejects.toThrow("status=off");
    expect(h.setCookie).toHaveBeenCalledWith("fv_sso_preview", "", expect.objectContaining({ maxAge: 0 }));
  });
});
