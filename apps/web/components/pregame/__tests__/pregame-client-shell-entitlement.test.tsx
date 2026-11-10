/**
 * @vitest-environment jsdom
 *
 * FV-625 — PregameClientShell training-entitlement gate.
 *
 * Pregame was the one training surface a canceled family could still open
 * (FV-619 Android staging row 23b). These tests pin:
 *   - online + entitled  → flow renders, cache written with the server's
 *                          offlineUntil + this device's verifiedAt
 *   - online + blocked   → flow never renders, cache cleared, allowlisted redirect
 *   - offline            → flow only while the verified window is open
 *                          (KC policy: until the last verified period ends)
 *   - anything ambiguous → never renders the flow, never follows the body
 *   - FV-636             → adult_athlete trains here like a minor athlete
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { replaceMock, getUserMock, singleMock, router } = vi.hoisted(() => {
  const replaceMock = vi.fn();
  return {
    replaceMock,
    getUserMock: vi.fn(),
    singleMock: vi.fn(),
    // Stable identity, like Next's real useRouter(): the shell's effect
    // depends on [router], so a fresh object per render would re-run it.
    router: { replace: replaceMock },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
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
import { ATHLETE_CACHE_KEY, clearAthleteCache } from "@/lib/pregame/athlete-cache";
import { PREGAME_SESSION_CACHE_KEY, clearPregameSession } from "@/lib/pregame/session-cache";

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
  // A fresh Response per call (a body can only be read once).
  fetchMock.mockImplementation(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

// A verified, unexpired entry: checked a second ago, valid for 30 days.
const DAY = 86_400_000;
function verified(): { offlineUntil: string; verifiedAt: number } {
  return {
    offlineUntil: new Date(Date.now() + 30 * DAY).toISOString(),
    verifiedAt: Date.now() - 1000,
  };
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
    const until = new Date(Date.now() + 20 * DAY).toISOString();
    accessAnswer({ redirect: null, offlineUntil: until });
    const before = Date.now();

    render(<PregameClientShell />);

    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("basketball:Test");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/athlete/access",
      expect.objectContaining({ cache: "no-store", credentials: "same-origin" }),
    );
    const entry = cacheEntry();
    expect(entry).toEqual({
      sport: "basketball",
      firstName: "Test",
      offlineUntil: until,
      verifiedAt: expect.any(Number),
    });
    expect(entry?.verifiedAt as number).toBeGreaterThanOrEqual(before);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it.each([
    ["null (perpetual comp grant / gating off)", null],
    ["missing", undefined],
    ["unparseable", "next tuesday"],
    ["wrong type", 1767225600000],
  ])("offlineUntil %s → renders online but writes NO offline window", async (_label, value) => {
    online();
    accessAnswer(value === undefined ? { redirect: null } : { redirect: null, offlineUntil: value });
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
    expect(cacheEntry()).toMatchObject({ offlineUntil: null });
  });

  it("a no-end-date entitlement is online-only: the next offline open says Connect first", async () => {
    online();
    accessAnswer({ redirect: null, offlineUntil: null });
    const first = render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
    first.unmount();

    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.getByText(/needs a connection to check your access/)).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it("each online check OVERWRITES the window (renewal extends, latest answer wins)", async () => {
    const old = verified();
    seedCache({ sport: "basketball", firstName: "Test", ...old });
    online();
    const renewed = new Date(Date.now() + 60 * DAY).toISOString();
    accessAnswer({ redirect: null, offlineUntil: renewed });
    render(<PregameClientShell />);
    await screen.findByTestId("pregame-flow");
    expect(cacheEntry()?.offlineUntil).toBe(renewed);
  });
});

describe("online — blocked (canceled / inactive / seat-paused)", () => {
  it.each([
    "/athlete/paused",
    "/athlete/paused?reason=seats",
    "/subscribe",
  ])("redirects to %s, never renders the flow, and revokes the offline cache", async (to) => {
    seedCache({ sport: "basketball", firstName: "Test", ...verified() });
    online();
    accessAnswer({ redirect: to });

    render(<PregameClientShell />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(to));
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
    expect(cacheEntry()).toBeNull();
  });

  it("then an offline reload on the same device cannot reopen pregame", async () => {
    seedCache({ sport: "basketball", firstName: "Test", ...verified() });
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
    const seeded = { sport: "basketball", firstName: "Test", ...verified() };
    seedCache(seeded);
    online();
    accessAnswer({ error: "boom" }, 503);
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("basketball:Test");
    expect(replaceMock).not.toHaveBeenCalled();
    expect(cacheEntry()).toEqual(seeded);
  });

  it("a captive-portal HTML 200 with a verified cache opens pregame", async () => {
    seedCache({ sport: "hockey", firstName: "Test", ...verified() });
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

  it("a 5xx with an EXPIRED verified cache does not open pregame", async () => {
    seedCache({
      sport: "basketball",
      firstName: "Test",
      offlineUntil: new Date(Date.now() - 1).toISOString(),
      verifiedAt: Date.now() - 31 * DAY,
    });
    online();
    accessAnswer({ error: "boom" }, 503);
    render(<PregameClientShell />);
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
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
    seedCache({ sport: "hockey", firstName: "Test", ...verified() });
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
    seedCache({ sport: "hockey", firstName: "Test", ...verified() });
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

  it("no cache → Connect first (first-time copy)", async () => {
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.getByText(/Open the pregame session once while connected/)).toBeInTheDocument();
  });

  it("a legacy boolean-marker entry (entitlementVerified: true, no window) does not unlock offline", async () => {
    seedCache({ sport: "hockey", firstName: "Test", entitlementVerified: true });
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it.each([
    ["garbage offlineUntil", { offlineUntil: "garbage", verifiedAt: Date.now() - 1000 }],
    ["garbage verifiedAt", { offlineUntil: new Date(Date.now() + DAY).toISOString(), verifiedAt: "x" }],
    ["missing verifiedAt", { offlineUntil: new Date(Date.now() + DAY).toISOString() }],
  ])("corrupted cache (%s) → Connect first, never the flow", async (_l, fields) => {
    seedCache({ sport: "hockey", firstName: "Test", ...fields });
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it("unparseable JSON in the cache → Connect first", async () => {
    window.localStorage.setItem(ATHLETE_CACHE_KEY, "{not json");
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
  });

  it("network drops between auth and the access check → verified cache path", async () => {
    seedCache({ sport: "golf", firstName: "Test", ...verified() });
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

describe("offline window — clock / expiry boundary (KC policy: until the last verified period ends)", () => {
  const T0 = Date.parse("2026-11-09T12:00:00.000Z");
  const UNTIL = "2026-12-09T12:00:00.000Z";
  const UNTIL_MS = Date.parse(UNTIL);

  afterEach(() => {
    vi.useRealTimers();
  });

  function at(ms: number) {
    // Fake ONLY Date — testing-library's waitFor keeps real timers.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(ms);
  }

  it("1 ms before the period end → opens offline", async () => {
    seedCache({ sport: "hockey", firstName: "Test", offlineUntil: UNTIL, verifiedAt: T0 });
    at(UNTIL_MS - 1);
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
  });

  it("exactly AT the period end → expired, Connect first (no grace)", async () => {
    seedCache({ sport: "hockey", firstName: "Test", offlineUntil: UNTIL, verifiedAt: T0 });
    at(UNTIL_MS);
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.getByText(/needs a connection to check your access/)).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it("a cancellation the device never saw online still ends offline use at the period end", async () => {
    seedCache({ sport: "hockey", firstName: "Test", offlineUntil: UNTIL, verifiedAt: T0 });
    at(UNTIL_MS + 7 * DAY);
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
  });

  it("device clock set back before the last online check → Connect first", async () => {
    seedCache({ sport: "hockey", firstName: "Test", offlineUntil: UNTIL, verifiedAt: T0 });
    at(T0 - 1);
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
  });

  it("an expired window is renewed by the next online check", async () => {
    seedCache({ sport: "hockey", firstName: "Test", offlineUntil: UNTIL, verifiedAt: T0 });
    at(UNTIL_MS + DAY);
    online();
    const next = new Date(UNTIL_MS + 31 * DAY).toISOString();
    accessAnswer({ redirect: null, offlineUntil: next });
    render(<PregameClientShell />);
    await screen.findByTestId("pregame-flow");
    expect(cacheEntry()).toMatchObject({ offlineUntil: next, verifiedAt: UNTIL_MS + DAY });
  });
});

describe("user switch on one device — no cross-athlete window", () => {
  it("athlete B's online check replaces athlete A's window with B's own (here: none)", async () => {
    seedCache({ sport: "hockey", firstName: "A", ...verified() });
    getUserMock.mockResolvedValue({ data: { user: { id: "b-2" } }, error: null });
    singleMock.mockResolvedValue({
      data: { role: "athlete", first_name: "B", sport: "basketball", sport_selected_at: "2026-11-01T00:00:00Z" },
      error: null,
    });
    accessAnswer({ redirect: null, offlineUntil: null });
    const first = render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("basketball:B");
    expect(cacheEntry()).toMatchObject({ firstName: "B", sport: "basketball", offlineUntil: null });
    first.unmount();

    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.queryByText(/hockey:A/)).not.toBeInTheDocument();
  });

  it("athlete B blocked → A's window is removed, not reused", async () => {
    seedCache({ sport: "hockey", firstName: "A", ...verified() });
    getUserMock.mockResolvedValue({ data: { user: { id: "b-2" } }, error: null });
    singleMock.mockResolvedValue({
      data: { role: "athlete", first_name: "B", sport: "basketball", sport_selected_at: "2026-11-01T00:00:00Z" },
      error: null,
    });
    accessAnswer({ redirect: "/athlete/paused", offlineUntil: null });
    render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/athlete/paused"));
    expect(cacheEntry()).toBeNull();
  });
});

describe("FV-636 — adult_athlete (18+ self-serve) trains here like a minor athlete", () => {
  function adultOnline() {
    getUserMock.mockResolvedValue({ data: { user: { id: "ad-1" } }, error: null });
    singleMock.mockResolvedValue({
      data: { role: "adult_athlete", first_name: "Ade", sport: "soccer", sport_selected_at: "2026-11-01T00:00:00Z" },
      error: null,
    });
  }

  it("an entitled adult opens pregame online (no /dashboard bounce) and gets an offline window", async () => {
    adultOnline();
    const until = new Date(Date.now() + 10 * DAY).toISOString();
    accessAnswer({ redirect: null, offlineUntil: until });
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("soccer:Ade");
    expect(replaceMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/athlete/access", expect.anything());
    expect(cacheEntry()).toMatchObject({ firstName: "Ade", offlineUntil: until });
  });

  it("then opens offline from that window", async () => {
    seedCache({ sport: "soccer", firstName: "Ade", ...verified() });
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toHaveTextContent("soccer:Ade");
  });

  it("an inactive adult goes to /subscribe and the offline window is revoked", async () => {
    seedCache({ sport: "soccer", firstName: "Ade", ...verified() });
    adultOnline();
    accessAnswer({ redirect: "/subscribe", offlineUntil: null });
    render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/subscribe"));
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
    expect(cacheEntry()).toBeNull();
  });

  it("an adult without a sport still goes to sport onboarding first", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "ad-1" } }, error: null });
    singleMock.mockResolvedValue({
      data: { role: "adult_athlete", first_name: "Ade", sport: null, sport_selected_at: null },
      error: null,
    });
    render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/athlete/onboarding/sport"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("offline detection — supabase-js returns errors instead of throwing (FV-625 device finding)", () => {
  it("a THROWN network error with a verified cache also opens pregame", async () => {
    seedCache({ sport: "hockey", firstName: "Test", ...verified() });
    offlineThrown();
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
  });

  it("offline (returned AuthRetryableFetchError) never redirects to /signin", async () => {
    seedCache({ sport: "hockey", firstName: "Test", ...verified() });
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("an auth-server 5xx (returned AuthRetryableFetchError status 503) is offline-like: verified cache opens, never /signin", async () => {
    seedCache({ sport: "hockey", firstName: "Test", ...verified() });
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
    seedCache({ sport: "hockey", firstName: "Test", ...verified() });
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new AuthApiError("invalid JWT", 401, "bad_jwt"),
    });
    render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/signin"));
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
  });

  it("connection drops between getUser and the profile read (postgrest returns a fetch error) → verified cache", async () => {
    seedCache({ sport: "golf", firstName: "Test", ...verified() });
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
    seedCache({ sport: "golf", firstName: "Test", ...verified() });
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

// ---------------------------------------------------------------------------
// FV-638 — the Android shell now warms the Service-Worker audio cache
// ("Set up for later"). Downloaded clips are generic, content-addressed audio:
// they must NEVER act as an entitlement. Offline access is decided only by the
// verified window above, even with a full audio cache in a Capacitor shell.
// ---------------------------------------------------------------------------
describe("FV-638 — a warm audio cache in the native shell is never an entitlement", () => {
  const AUDIO = "http://localhost/audio/pregame/clips/opener-calm.aaaaaaaa.mp3";
  // The gate must decide from the verified window alone: it never opens the
  // audio cache. (Clips are generic, content-addressed audio; they stay on the
  // device after sign-out and grant nothing.)
  const openSpy = vi.fn();

  beforeEach(() => {
    Object.defineProperty(window, "Capacitor", {
      value: { getPlatform: () => "android" },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, "serviceWorker", {
      value: { controller: {}, register: vi.fn() },
      configurable: true,
      writable: true,
    });
    // A fully downloaded fv-audio-<mv> cache: every lookup hits.
    const hit = { match: async () => new Response("mp3"), put: async () => {} };
    openSpy.mockReset();
    openSpy.mockImplementation(async () => hit);
    vi.stubGlobal("caches", { open: openSpy, keys: async () => [AUDIO] });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as Record<string, unknown>).Capacitor;
    delete (navigator as unknown as Record<string, unknown>).serviceWorker;
  });

  it("valid verified window → opens offline (the download is usable)", async () => {
    seedCache({ sport: "hockey", firstName: "Test", ...verified() });
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByTestId("pregame-flow")).toBeInTheDocument();
  });

  it("expired window + full audio cache → Connect first", async () => {
    const T0 = Date.parse("2026-11-09T12:00:00.000Z");
    const UNTIL = "2026-11-24T12:00:00.000Z";
    seedCache({ sport: "hockey", firstName: "Test", offlineUntil: UNTIL, verifiedAt: T0 });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.parse(UNTIL));
    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("revoked online (canceled) → window cleared; the next offline open says Connect first", async () => {
    seedCache({ sport: "hockey", firstName: "Test", ...verified() });
    online();
    accessAnswer({ redirect: "/athlete/paused" });
    const first = render(<PregameClientShell />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/athlete/paused"));
    expect(cacheEntry()).toBeNull();
    first.unmount();

    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.queryByTestId("pregame-flow")).not.toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("account switch (sign-out clears the device entry) → the next athlete cannot open A's download offline", async () => {
    seedCache({ sport: "hockey", firstName: "A", ...verified() });
    window.localStorage.setItem(
      PREGAME_SESSION_CACHE_KEY,
      JSON.stringify({ need: "Calm", role: "Forward", adversity: "nervous" }),
    );
    // What SignOutButton / ClearCacheOnMount run on sign-out.
    clearAthleteCache();
    clearPregameSession();
    expect(window.localStorage.getItem(ATHLETE_CACHE_KEY)).toBeNull();
    expect(window.localStorage.getItem(PREGAME_SESSION_CACHE_KEY)).toBeNull();

    offline();
    render(<PregameClientShell />);
    expect(await screen.findByText("Connect first")).toBeInTheDocument();
    expect(screen.queryByText(/hockey:A/)).not.toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
  });
});
