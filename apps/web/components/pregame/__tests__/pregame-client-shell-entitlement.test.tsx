/**
 * @vitest-environment jsdom
 *
 * FV-625 — PregameClientShell training-entitlement gate.
 *
 * Pregame was the one training surface a canceled family could still open
 * (FV-619 Android staging row 23b). These tests pin:
 *   - online + entitled  → flow renders, offline cache written WITH the marker
 *   - online + blocked   → flow never renders, cache cleared, allowlisted redirect
 *   - offline            → flow only from a marker-carrying cache entry
 *   - anything ambiguous → never renders the flow, never follows the body
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { replaceMock, getUserMock, singleMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getUserMock: vi.fn(),
  singleMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: () => ({ select: () => ({ eq: () => ({ single: singleMock }) }) }),
  }),
}));

vi.mock("@/components/pregame/PregameFlow", () => ({
  PregameFlow: ({ sport, athleteFirstName }: { sport: string; athleteFirstName: string }) => (
    <div data-testid="pregame-flow">
      {sport}:{athleteFirstName}
    </div>
  ),
}));

import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { PregameClientShell } from "@/components/pregame/PregameClientShell";
import { ATHLETE_CACHE_KEY } from "@/lib/pregame/athlete-cache";

const fetchMock = vi.fn();

// localStorage stub (jsdom's built-in lacks clear() under this vitest setup /
// Node 25's experimental global) — same pattern as pregame-rerun-flow.test.tsx.
const store = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};

function online() {
  getUserMock.mockResolvedValue({ data: { user: { id: "a-1" } }, error: null });
  singleMock.mockResolvedValue({
    data: {
      role: "athlete",
      first_name: "Test",
      sport: "basketball",
      sport_selected_at: "2026-11-01T00:00:00Z",
    },
    error: null,
  });
}

// What supabase-js 2.x actually does when the auth server is unreachable:
// it RETURNS { user: null, error: AuthRetryableFetchError } — it does not
// throw. (Proven on an Android device for FV-625: the old shell treated this
// as an auth failure and redirected offline athletes to /signin.)
function offline() {
  getUserMock.mockResolvedValue({
    data: { user: null },
    error: new AuthRetryableFetchError("TypeError: Failed to fetch", 0),
  });
}

// Belt-and-braces: a thrown network error must take the same path.
function offlineThrown() {
  getUserMock.mockRejectedValue(new TypeError("Failed to fetch"));
}

function accessAnswer(body: unknown, status = 200) {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function seedCache(entry: Record<string, unknown>) {
  window.localStorage.setItem(ATHLETE_CACHE_KEY, JSON.stringify(entry));
}

function cacheEntry() {
  const raw = window.localStorage.getItem(ATHLETE_CACHE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

beforeEach(() => {
  store.clear();
  Object.defineProperty(window, "localStorage", {
    value: localStorageStub,
    writable: true,
    configurable: true,
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("online — entitled", () => {
  it("renders the flow and writes the verified cache only after the access check", async () => {
    online();
    accessAnswer({ redirect: null });

    render(<PregameClientShell />);

    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("basketball:Test");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/athlete/access",
      expect.objectContaining({ cache: "no-store", credentials: "same-origin" }),
    );
    expect(cacheEntry()).toEqual({
      sport: "basketball",
      firstName: "Test",
      entitlementVerified: true,
    });
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

describe("online — blocked (canceled / inactive / seat-paused)", () => {
  it.each([
    "/athlete/paused",
    "/athlete/paused?reason=seats",
    "/subscribe",
  ])("redirects to %s, never renders the flow, and revokes the offline cache", async (to) => {
    seedCache({ sport: "basketball", firstName: "Test", entitlementVerified: true });
    online();
    accessAnswer({ redirect: to });

    render(<PregameClientShell />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(to));
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
    expect(cacheEntry()).toBeNull();
  });

  it("then an offline reload on the same device cannot reopen pregame", async () => {
    seedCache({ sport: "basketball", firstName: "Test", entitlementVerified: true });
    online();
    accessAnswer({ redirect: "/athlete/paused" });
    const first = render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalled());
    first.unmount();

    offline();
    render(<PregameClientShell />);

    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });
});

describe("online — unverifiable answers are treated like offline (never follow, revoke nothing)", () => {
  it("does not follow a non-allowlisted redirect (no verified cache → error)", async () => {
    online();
    accessAnswer({ redirect: "https://evil.example/" });
    render(<PregameClientShell />);
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it("a body without a redirect field is not treated as entitled", async () => {
    online();
    accessAnswer({});
    render(<PregameClientShell />);
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(cacheEntry()).toBeNull();
  });

  it("a 5xx with no verified cache shows the error state", async () => {
    online();
    accessAnswer({ error: "boom" }, 500);
    render(<PregameClientShell />);
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it("a 5xx with a verified cache opens pregame (same as offline) and keeps the cache", async () => {
    seedCache({ sport: "basketball", firstName: "Test", entitlementVerified: true });
    online();
    accessAnswer({ error: "boom" }, 503);
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("basketball:Test");
    expect(replaceMock).not.toHaveBeenCalled();
    expect(cacheEntry()).toEqual({
      sport: "basketball",
      firstName: "Test",
      entitlementVerified: true,
    });
  });

  it("a captive-portal HTML 200 with a verified cache opens pregame", async () => {
    seedCache({ sport: "hockey", firstName: "Test", entitlementVerified: true });
    online();
    fetchMock.mockResolvedValue(
      new Response("<html><body>Sign in to rink Wi-Fi</body></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("a captive-portal HTML 200 with only a pre-FV-625 (unverified) cache does NOT open pregame", async () => {
    seedCache({ sport: "hockey", firstName: "Test" });
    online();
    fetchMock.mockResolvedValue(
      new Response("<html>portal</html>", { status: 200, headers: { "Content-Type": "text/html" } }),
    );
    render(<PregameClientShell />);
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it("a non-allowlisted redirect with a verified cache opens from cache but is never followed", async () => {
    seedCache({ sport: "hockey", firstName: "Test", entitlementVerified: true });
    online();
    accessAnswer({ redirect: "/athlete" });
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("a 401 from the access check sends the athlete to /signin", async () => {
    online();
    accessAnswer({ error: "unauthenticated" }, 401);
    render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/signin"));
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });
});

describe("offline", () => {
  it("a valid subscriber's verified cache still opens pregame with no signal", async () => {
    seedCache({ sport: "hockey", firstName: "Test", entitlementVerified: true });
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("hockey:Test");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("a pre-FV-625 cache entry (no marker) does not unlock offline pregame", async () => {
    seedCache({ sport: "hockey", firstName: "Test" });
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it("no cache → Connect first", async () => {
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
  });

  it("network drops between auth and the access check → verified cache path", async () => {
    seedCache({ sport: "golf", firstName: "Test", entitlementVerified: true });
    online();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("golf:Test");
  });

  it("network drops between auth and the access check with an unverified cache → Connect first", async () => {
    seedCache({ sport: "golf", firstName: "Test" });
    online();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
  });
});

describe("offline detection — supabase-js returns errors instead of throwing (FV-625 device finding)", () => {
  it("a THROWN network error with a verified cache also opens pregame", async () => {
    seedCache({ sport: "hockey", firstName: "Test", entitlementVerified: true });
    offlineThrown();
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
  });

  it("offline (returned AuthRetryableFetchError) never redirects to /signin", async () => {
    seedCache({ sport: "hockey", firstName: "Test", entitlementVerified: true });
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("an auth-server 5xx (returned AuthRetryableFetchError status 503) is offline-like: verified cache opens, never /signin", async () => {
    seedCache({ sport: "hockey", firstName: "Test", entitlementVerified: true });
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError("Service Unavailable", 503),
    });
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("an auth-server 5xx with no verified cache → Connect first, never /signin", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError("Service Unavailable", 503),
    });
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("a real auth answer (AuthApiError, e.g. revoked/invalid session) still goes to /signin, not the cache", async () => {
    seedCache({ sport: "hockey", firstName: "Test", entitlementVerified: true });
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new AuthApiError("invalid JWT", 401, "bad_jwt"),
    });
    render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/signin"));
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it("connection drops between getUser and the profile read (postgrest returns a fetch error) → verified cache", async () => {
    seedCache({ sport: "golf", firstName: "Test", entitlementVerified: true });
    getUserMock.mockResolvedValue({ data: { user: { id: "a-1" } }, error: null });
    singleMock.mockResolvedValue({
      data: null,
      error: { message: "TypeError: Failed to fetch", details: "", hint: "", code: "" },
    });
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("golf:Test");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("a non-network profile error still goes to /signin", async () => {
    seedCache({ sport: "golf", firstName: "Test", entitlementVerified: true });
    getUserMock.mockResolvedValue({ data: { user: { id: "a-1" } }, error: null });
    singleMock.mockResolvedValue({
      data: null,
      error: { message: "JSON object requested, multiple (or no) rows returned", details: "", hint: "", code: "PGRST116" },
    });
    render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/signin"));
  });
});

describe("unchanged pre-gate redirects", () => {
  it("a parent is sent to /dashboard before any access check", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "p-1" } }, error: null });
    singleMock.mockResolvedValue({
      data: { role: "parent", first_name: "P", sport: null, sport_selected_at: null },
      error: null,
    });
    render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no session → /signin, no access check", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/signin"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
