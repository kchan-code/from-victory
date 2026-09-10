/**
 * @vitest-environment jsdom
 */
// FV-253 — PregameClientShell reads the saved quiz answers for the pregame
// pre-selection and threads them into PregameFlow.
//
// Pins:
//   1. The answers come from the get_own_personalization RPC (FV-361 grant
//      hardening) — and the direct `profiles` select NEVER asks for
//      position / focus_area (those columns have no SELECT grant for
//      `authenticated`; adding them would 4xx the whole profile read and
//      bounce every athlete to /signin).
//   2. An RPC error or a thrown RPC is non-fatal: the flow still renders with
//      personalization = null.
//   3. The offline (cache) path renders with personalization = null — the
//      quiz answers are deliberately not part of fv_athlete_cache.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";

import { ATHLETE_CACHE_KEY } from "@/lib/pregame/athlete-cache";

// ── Mocks ────────────────────────────────────────────────────────────────────

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
}));

// Capture PregameFlow props instead of rendering the real flow.
vi.mock("@/components/pregame/PregameFlow", () => ({
  PregameFlow: (props: { sport: string; personalization: unknown }) => (
    <div
      data-testid="pregame-flow"
      data-sport={props.sport}
      data-personalization={JSON.stringify(props.personalization ?? null)}
    />
  ),
}));

const stub = {
  getUser: vi.fn<() => Promise<unknown>>(),
  selectSpy: vi.fn<(cols: string) => void>(),
  single: vi.fn<() => Promise<unknown>>(),
  rpc: vi.fn<(name: string) => void>(),
  maybeSingle: vi.fn<() => Promise<unknown>>(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: stub.getUser },
    from: () => ({
      select: (cols: string) => {
        stub.selectSpy(cols);
        return { eq: () => ({ single: stub.single }) };
      },
    }),
    rpc: (name: string) => {
      stub.rpc(name);
      return { maybeSingle: stub.maybeSingle };
    },
  }),
}));

import { PregameClientShell } from "@/components/pregame/PregameClientShell";

// ── Helpers ──────────────────────────────────────────────────────────────────

function onlineAthlete() {
  stub.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  stub.single.mockResolvedValue({
    data: {
      role: "athlete",
      first_name: "Sam",
      sport: "basketball",
      sport_selected_at: "2026-06-01T00:00:00Z",
    },
    error: null,
  });
}

async function renderedPersonalization() {
  const flow = await screen.findByTestId("pregame-flow");
  return JSON.parse(flow.getAttribute("data-personalization") ?? "null");
}

// localStorage stub — same pattern as install-prompt.test.tsx: Node's own
// experimental localStorage global shadows jsdom's under vitest, so install a
// minimal in-memory Storage on window explicitly.
const localStorageStub: Record<string, string> = {};
beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    writable: true,
    configurable: true,
    value: {
      getItem: (key: string) => localStorageStub[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageStub[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageStub[key];
      },
      clear: () => {
        Object.keys(localStorageStub).forEach((k) => delete localStorageStub[k]);
      },
    },
  });
  window.localStorage.clear();
  stub.getUser.mockReset();
  stub.selectSpy.mockReset();
  stub.single.mockReset();
  stub.rpc.mockReset();
  stub.maybeSingle.mockReset();
  replace.mockReset();
});

afterEach(() => {
  cleanup();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("PregameClientShell personalization read (FV-253)", () => {
  it("reads position + focus_area via get_own_personalization and passes them to PregameFlow", async () => {
    onlineAthlete();
    stub.maybeSingle.mockResolvedValue({
      data: { position: "Guard", focus_area: "confidence" },
      error: null,
    });

    render(<PregameClientShell />);

    expect(await renderedPersonalization()).toEqual({
      position: "Guard",
      focusArea: "confidence",
    });
    expect(stub.rpc).toHaveBeenCalledWith("get_own_personalization");
    expect(replace).not.toHaveBeenCalled();
  });

  it("never selects position / focus_area directly from profiles (FV-361 grant hardening)", async () => {
    onlineAthlete();
    stub.maybeSingle.mockResolvedValue({ data: null, error: null });

    render(<PregameClientShell />);
    await screen.findByTestId("pregame-flow");

    expect(stub.selectSpy).toHaveBeenCalled();
    for (const cols of stub.selectSpy.mock.calls.map((c) => String(c[0]))) {
      expect(cols).not.toMatch(/\bposition\b/);
      expect(cols).not.toMatch(/\bfocus_area\b/);
    }
  });

  it("an RPC error is non-fatal: flow renders with personalization = null", async () => {
    onlineAthlete();
    stub.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "permission denied" },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<PregameClientShell />);

    expect(await renderedPersonalization()).toBeNull();
    expect(replace).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("a thrown RPC is non-fatal and is NOT mistaken for the offline path", async () => {
    onlineAthlete();
    stub.maybeSingle.mockRejectedValue(new Error("Failed to fetch"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<PregameClientShell />);

    const flow = await screen.findByTestId("pregame-flow");
    expect(flow).toHaveAttribute("data-sport", "basketball");
    expect(await renderedPersonalization()).toBeNull();
    warn.mockRestore();
  });

  it("offline cache path renders with personalization = null", async () => {
    window.localStorage.setItem(
      ATHLETE_CACHE_KEY,
      JSON.stringify({ sport: "hockey", firstName: "Sam" }),
    );
    stub.getUser.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<PregameClientShell />);

    const flow = await screen.findByTestId("pregame-flow");
    expect(flow).toHaveAttribute("data-sport", "hockey");
    expect(await renderedPersonalization()).toBeNull();
    expect(stub.rpc).not.toHaveBeenCalled();
    await waitFor(() => expect(replace).not.toHaveBeenCalled());
  });
});
