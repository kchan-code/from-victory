/**
 * /auth/callback (FV-672, SSO A3; spec FV-569 §5.3): provider error params,
 * code exchange, `next` allow-list, session-state routing, and the recovery
 * path that must keep `?reset=invalid` exactly.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  exchange: vi.fn(),
  state: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { exchangeCodeForSession: h.exchange } }),
}));
vi.mock("@/lib/auth/session-state", async () => {
  const core = await import("@/lib/auth/session-state-core");
  return { getSessionState: () => h.state(), homeForState: core.homeForState };
});

import { GET } from "@/app/auth/callback/route";
import { sanitizeCallbackNext } from "@/lib/auth/callback-next";

const ORIGIN = "https://www.fromvictoryapp.com";

async function hit(qs: string) {
  const res = await GET(new NextRequest(`${ORIGIN}/auth/callback${qs}`));
  const loc = res.headers.get("location")!;
  return new URL(loc).pathname + new URL(loc).search;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.exchange.mockResolvedValue({ error: null });
  h.state.mockResolvedValue({ state: "parent", user: { id: "u1" } });
});

describe("sanitizeCallbackNext", () => {
  it.each([
    ["/welcome", "/welcome"],
    ["/welcome?as=adult", "/welcome?as=adult"],
    ["/dashboard", "/dashboard"],
    ["/athlete", "/athlete"],
    ["/athlete/pregame", "/athlete/pregame"],
    ["/subscribe", "/subscribe"],
    ["/reset-password", "/reset-password"],
  ])("allows %s", (raw, out) => expect(sanitizeCallbackNext(raw)).toBe(out));

  it.each([
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "https://evil.com/welcome",
    "javascript:alert(1)",
    "/admin",
    "/welcome-not",
    "/dashboardx",
    "/%2f%2fevil.com",
    "/welcome\n",
    "",
    "welcome",
  ])("rejects %j", (raw) => expect(sanitizeCallbackNext(raw)).toBeNull());

  it("null/undefined -> null", () => {
    expect(sanitizeCallbackNext(null)).toBeNull();
    expect(sanitizeCallbackNext(undefined)).toBeNull();
  });
});

describe("provider error params come first", () => {
  it.each(["error=access_denied", "error_description=x", "error_code=bad", "code=abc&error=access_denied"])(
    "%s -> /signin?error=oauth without exchanging",
    async (qs) => {
      expect(await hit(`?${qs}`)).toBe("/signin?error=oauth");
      expect(h.exchange).not.toHaveBeenCalled();
    },
  );

  it("a provider error on the recovery path keeps ?reset=invalid", async () => {
    expect(await hit("?error=access_denied&next=/reset-password")).toBe("/signin?reset=invalid");
  });
});

describe("exchange + routing", () => {
  it("no code: reset=invalid (unchanged) when there is no next or it is recovery; oauth otherwise", async () => {
    expect(await hit("")).toBe("/signin?reset=invalid");
    expect(await hit("?next=/reset-password")).toBe("/signin?reset=invalid");
    expect(await hit("?next=/welcome")).toBe("/signin?error=oauth");
    expect(h.exchange).not.toHaveBeenCalled();
  });

  it("exchange failure: oauth, or reset=invalid for recovery", async () => {
    h.exchange.mockResolvedValue({ error: { message: "bad", status: 400, code: "x" } });
    expect(await hit("?code=c&next=/welcome")).toBe("/signin?error=oauth");
    expect(await hit("?code=c&next=/reset-password")).toBe("/signin?reset=invalid");
    expect(await hit("?code=c")).toBe("/signin?error=oauth");
  });

  it("recovery success goes straight to /reset-password with no state lookup", async () => {
    expect(await hit("?code=c&next=/reset-password")).toBe("/reset-password");
    expect(h.state).not.toHaveBeenCalled();
  });

  it("pending -> /welcome whatever next says; only a valid `as` hint is carried", async () => {
    h.state.mockResolvedValue({ state: "pending", user: { id: "u1" } });
    expect(await hit("?code=c")).toBe("/welcome");
    expect(await hit("?code=c&next=/dashboard")).toBe("/welcome");
    expect(await hit("?code=c&next=/welcome%3Fas%3Dadult")).toBe("/welcome?as=adult");
    expect(await hit("?code=c&next=/welcome%3Fas%3Dparent")).toBe("/welcome?as=parent");
    expect(await hit("?code=c&next=/welcome%3Fas%3Devil")).toBe("/welcome");
  });

  it.each([
    ["parent", "/dashboard"],
    ["athlete", "/athlete"],
    ["adult_athlete", "/athlete"],
  ])("%s with no next -> %s; with an allow-listed next -> next; with a bad next -> home", async (state, home) => {
    h.state.mockResolvedValue({ state, user: { id: "u1" } });
    expect(await hit("?code=c")).toBe(home);
    expect(await hit("?code=c&next=/subscribe")).toBe("/subscribe");
    expect(await hit("?code=c&next=//evil.com")).toBe(home);
    expect(await hit("?code=c&next=/admin")).toBe(home);
    expect(await hit("?code=c&next=https://evil.com")).toBe(home);
  });

  it("orphan -> /auth/signout", async () => {
    h.state.mockResolvedValue({ state: "orphan", user: { id: "u1" } });
    expect(await hit("?code=c&next=/welcome")).toBe("/auth/signout");
  });

  it.each(["error", "none"])(
    "%s is NEVER /welcome or /subscribe, even when next asks for them",
    async (state) => {
      h.state.mockResolvedValue({ state, user: null });
      for (const next of ["", "&next=/welcome", "&next=/subscribe", "&next=/dashboard"]) {
        const dest = await hit(`?code=c${next}`);
        expect(dest).toBe("/signin?error=oauth");
      }
    },
  );
});
