/**
 * @vitest-environment jsdom
 *
 * FV-625 — no cross-athlete offline pregame.
 *
 * The offline-pregame entry (`fv_athlete_cache`, offlineUntil window) is not
 * keyed by user, so every path that can put a DIFFERENT athlete on a device
 * must drop it before that athlete can reach pregame offline:
 *   - /signin (ClearCacheOnMount, FV-154 — pre-existing)
 *   - sign-out / forget-device (FV-154 — pre-existing)
 *   - /invite and /pair (FV-630 claim flows sign a new athlete in WITHOUT
 *     /signin — this file pins that they now clear it too)
 *   - /athlete/paused (revocation — pinned in athlete-paused-page.test.tsx)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("server-only", () => ({}));

// ---- localStorage stub (jsdom/Node 25 localStorage is unreliable here) ----
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
    configurable: true,
    writable: true,
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---- page dependencies ----
const { getUserMock, pairingMock, athleteMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(async () => ({ data: { user: { id: "previous-athlete" } } })),
  pairingMock: vi.fn(),
  athleteMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: getUserMock } }),
}));
vi.mock("@/lib/native-shell", () => ({ isNativeShell: () => false }));
vi.mock("next/headers", () => ({
  headers: () => ({
    get: (name: string) =>
      name.toLowerCase() === "user-agent"
        ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        : null,
  }),
}));
vi.mock("@/components/auth/InviteFlow", () => ({ InviteFlow: () => <div /> }));
vi.mock("@/components/auth/InviteSetupForm", () => ({ InviteSetupForm: () => <div /> }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === "device_pairings"
            ? { maybeSingle: pairingMock }
            : { single: athleteMock },
      }),
    }),
  }),
}));

import { ClearOfflinePregameOnMount } from "@/components/pregame/ClearOfflinePregameOnMount";
import InvitePage from "@/app/invite/page";
import PairClaimPage from "@/app/pair/page";
import { ATHLETE_CACHE_KEY } from "@/lib/pregame/athlete-cache";
import { PREGAME_SESSION_CACHE_KEY } from "@/lib/pregame/session-cache";

function seedPreviousAthlete() {
  store.set(
    ATHLETE_CACHE_KEY,
    JSON.stringify({ sport: "hockey", firstName: "Previous", offlineUntil: new Date(Date.now() + 86_400_000).toISOString(), verifiedAt: Date.now() }),
  );
}

describe("ClearOfflinePregameOnMount", () => {
  it("drops the offline-pregame entry and leaves the setup-preferences cache alone", () => {
    seedPreviousAthlete();
    store.set(PREGAME_SESSION_CACHE_KEY, "{}");
    render(<ClearOfflinePregameOnMount />);
    expect(store.has(ATHLETE_CACHE_KEY)).toBe(false);
    expect(store.has(PREGAME_SESSION_CACHE_KEY)).toBe(true);
  });
});

describe("identity-switch entry points clear the previous athlete's offline entry", () => {
  it("/invite (another athlete may be signed in on this device)", async () => {
    seedPreviousAthlete();
    render(await InvitePage());
    expect(store.has(ATHLETE_CACHE_KEY)).toBe(false);
  });

  it("/pair with a valid legacy pairing code", async () => {
    seedPreviousAthlete();
    pairingMock.mockResolvedValue({
      data: {
        athlete_id: "new-athlete",
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
        consumed_at: null,
      },
    });
    athleteMock.mockResolvedValue({ data: { first_name: "New", username: null } });
    render(
      await PairClaimPage({
        searchParams: Promise.resolve({ code: "legacy-raw-code-value" }),
      }),
    );
    expect(store.has(ATHLETE_CACHE_KEY)).toBe(false);
  });
});
