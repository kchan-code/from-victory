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

function offline() {
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

describe("online — ambiguous answers fail closed (never render, never follow)", () => {
  it("does not follow a non-allowlisted redirect", async () => {
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

  it("a 5xx shows the error state and leaves an existing verified cache alone", async () => {
    seedCache({ sport: "basketball", firstName: "Test", entitlementVerified: true });
    online();
    accessAnswer({ error: "boom" }, 500);
    render(<PregameClientShell />);
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
    expect(cacheEntry()).toEqual({
      sport: "basketball",
      firstName: "Test",
      entitlementVerified: true,
    });
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
