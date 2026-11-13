/**
 * @vitest-environment jsdom
 *
 * FV-727 — AnalyticsMount fails closed, then mounts only after auth state
 * confirms a signed-out browser on an allowlisted path. A later sign-in
 * clears the script before the next role lookup finishes.
 */
import { cleanup, render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Session = { user: { id: string } } | null;
type Listener = (event: string, session: Session) => void;

const harness = vi.hoisted(() => {
  const listeners: Listener[] = [];
  return {
    listeners,
    getUser: vi.fn(),
    maybeSingle: vi.fn(),
    session: null as Session,
  };
});

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/privacy" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: (cb: Listener) => {
        harness.listeners.push(cb);
        cb("INITIAL_SESSION", harness.session);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const index = harness.listeners.indexOf(cb);
                if (index >= 0) harness.listeners.splice(index, 1);
              },
            },
          },
        };
      },
      getUser: harness.getUser,
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: harness.maybeSingle }),
      }),
    }),
  }),
}));

import { AnalyticsMount } from "@/app/_components/AnalyticsMount";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_COOKIE = "sb-abcdefghijklmnop-auth-token";

function clearCookies() {
  document.cookie.split(";").forEach((part) => {
    const name = part.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });
}

beforeEach(() => {
  pathname.current = "/privacy";
  harness.listeners.length = 0;
  harness.session = null;
  harness.getUser.mockReset();
  harness.maybeSingle.mockReset();
  harness.getUser.mockResolvedValue({ data: { user: null }, error: null });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  clearCookies();
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
    "Mozilla/5.0 (Macintosh) AppleWebKit/537.36",
  );
});

afterEach(() => {
  cleanup();
  clearCookies();
  vi.restoreAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_KEY;
});

describe("AnalyticsMount on /privacy and /terms", () => {
  it.each(["/privacy", "/terms"] as const)(
    "mounts for a confirmed signed-out browser visitor on %s",
    async (path) => {
      pathname.current = path;
      render(<AnalyticsMount />);
      expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId("vercel-analytics")).toBeInTheDocument();
      });
    },
  );

  it.each(["/privacy", "/terms"] as const)(
    "does not mount for a signed-in minor on %s",
    async (path) => {
      pathname.current = path;
      document.cookie = `${SESSION_COOKIE}=present`;
      harness.session = { user: { id: "user-1" } };
      harness.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      harness.maybeSingle.mockResolvedValue({ data: { role: "athlete" }, error: null });
      render(<AnalyticsMount />);
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    },
  );

  it.each(["/privacy", "/terms"] as const)(
    "does not mount inside a native shell on %s",
    async (path) => {
      pathname.current = path;
      vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
        "Mozilla/5.0 FVNativeShell/1 (ios)",
      );
      render(<AnalyticsMount />);
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
      expect(harness.getUser).not.toHaveBeenCalled();
    },
  );

  it("keeps analytics off when an auth cookie has no verified user", async () => {
    document.cookie = `${SESSION_COOKIE}=present`;
    harness.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "expired" },
    });
    render(<AnalyticsMount />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
  });

  it("unmounts on sign-in before the next role lookup finishes", async () => {
    render(<AnalyticsMount />);
    await waitFor(() => {
      expect(screen.getByTestId("vercel-analytics")).toBeInTheDocument();
    });

    let release: (value: unknown) => void = () => {};
    harness.getUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    harness.maybeSingle.mockResolvedValue({ data: { role: "athlete" }, error: null });
    document.cookie = `${SESSION_COOKIE}=present`;

    act(() => {
      harness.listeners[0]?.("SIGNED_IN", { user: { id: "user-1" } });
    });
    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();

    await act(async () => {
      release({ data: { user: { id: "user-1" } }, error: null });
      await Promise.resolve();
    });
    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
  });
});
