/**
 * Unit tests for signOut() in lib/actions/auth.ts (FV-489).
 *
 * FV-489 bug: on a real device, signing out inside the native shell landed
 * on "/" — the gated marketing root, which shows real prices and "Start
 * your athlete's 14-day free trial." That's an in-app-purchase-surface
 * violation the moment it renders post-sign-out, and (per a separate fix in
 * middleware.ts + public/sw.js) the bad response could persist across a
 * force-stop + cold start. This file covers the redirect-target half of the
 * fix: signOut() must never target "/" while isNativeShell() is true, and
 * must keep targeting "/" (unchanged) everywhere else.
 *
 * Mocking strategy mirrors __tests__/actions/auth-adult.test.ts: redirect()
 * throws (mirroring real Next.js behavior) so a successful signOut() call
 * always rejects; assertions are on WHERE mockRedirect was called, not on a
 * resolved return value. isNativeShell() is a controllable vi.fn(), matching
 * the isNativeShellMock idiom used across billing-portal.test.ts,
 * auth-adult.test.ts, and the dashboard/subscribe/athlete-settings page tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// vi.mock(...) factories are hoisted above module-level const declarations,
// so any mock fn a factory closes over must be created via vi.hoisted().
const { mockRedirect, mockSignOut, mockIsNativeShell } = vi.hoisted(() => {
  const mockRedirect = vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  });
  const mockSignOut = vi.fn(async () => ({ error: null }));
  const mockIsNativeShell = vi.fn(() => false);
  return { mockRedirect, mockSignOut, mockIsNativeShell };
});

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

vi.mock("@/lib/native-shell", () => ({
  isNativeShell: () => mockIsNativeShell(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { signOut: mockSignOut } }),
}));

// Unrelated module-level imports in lib/actions/auth.ts — stubbed so the
// module resolves cleanly under vitest; none of these are exercised by
// signOut() itself.
vi.mock("@/lib/actions/rate-limit-store", () => ({
  rateLimitGate: vi.fn().mockResolvedValue({ limited: false }),
  getRequestIp: vi.fn().mockResolvedValue("1.2.3.4"),
}));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: vi.fn() }));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ auth: { admin: {} } }),
}));

import { signOut } from "@/lib/actions/auth";

describe("signOut (FV-489)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsNativeShell.mockReturnValue(false);
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("redirects to /signin inside the native shell (never the gated marketing root)", async () => {
    mockIsNativeShell.mockReturnValue(true);

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/signin");

    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(mockRedirect).toHaveBeenCalledWith("/signin");
    expect(mockRedirect).not.toHaveBeenCalledWith("/");
  });

  it("still redirects to / outside the native shell (browser/PWA unchanged)", async () => {
    mockIsNativeShell.mockReturnValue(false);

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/");

    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(mockRedirect).toHaveBeenCalledWith("/");
    expect(mockRedirect).not.toHaveBeenCalledWith("/signin");
  });

  it("always clears the session before redirecting, regardless of shell state", async () => {
    mockIsNativeShell.mockReturnValue(true);

    await expect(signOut()).rejects.toThrow();

    // signOut() must clear the Supabase session before it ever redirects —
    // an in-shell redirect to /signin with a still-live session would just
    // bounce back in via the native-shell entry-point router.
    expect(mockSignOut.mock.invocationCallOrder).toHaveLength(1);
    expect(mockRedirect.mock.invocationCallOrder).toHaveLength(1);
    const signOutOrder: number = mockSignOut.mock.invocationCallOrder[0] ?? -1;
    const redirectOrder: number = mockRedirect.mock.invocationCallOrder[0] ?? -1;
    expect(signOutOrder).toBeGreaterThanOrEqual(0);
    expect(redirectOrder).toBeGreaterThanOrEqual(0);
    expect(signOutOrder).toBeLessThan(redirectOrder);
  });
});
