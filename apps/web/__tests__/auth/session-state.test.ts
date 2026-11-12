/**
 * Session-state resolver (FV-672, spec FV-569 §5.1): every state, the
 * pending/orphan split, and "a failed read is `error`, never pending".
 */

import { describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

import {
  classifyProfilelessUser,
  homeForState,
  resolveSessionState,
} from "@/lib/auth/session-state-core";

function client(result: { data: unknown; error: unknown } | Error) {
  const maybeSingle = vi.fn(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  return {
    maybeSingle,
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle }) }) })),
  };
}
const u = (over: Record<string, unknown>) => ({ id: "u1", ...over }) as unknown as User;

describe("resolveSessionState", () => {
  it("none: no user, no query", async () => {
    const c = client({ data: null, error: null });
    expect(await resolveSessionState(c as never, null)).toEqual({ state: "none", user: null });
    expect(c.from).not.toHaveBeenCalled();
  });

  it.each(["parent", "athlete", "adult_athlete"])("%s", async (role) => {
    const c = client({ data: { role }, error: null });
    expect((await resolveSessionState(c as never, u({}))).state).toBe(role);
  });

  it("a query error is `error`, even for a user who looks pending", async () => {
    const c = client({ data: null, error: { message: "x" } });
    const r = await resolveSessionState(
      c as never,
      u({ app_metadata: { providers: ["google"] } }),
    );
    expect(r.state).toBe("error");
  });

  it("a thrown read is `error`", async () => {
    const c = client(new Error("network"));
    expect((await resolveSessionState(c as never, u({}))).state).toBe("error");
  });

  it("no profile + apple / google provider -> pending", async () => {
    for (const p of ["apple", "google"]) {
      const c = client({ data: null, error: null });
      expect(
        (await resolveSessionState(c as never, u({ app_metadata: { provider: p, providers: [p] } }))).state,
      ).toBe("pending");
    }
  });

  it("no profile + identities-only google -> pending", async () => {
    const c = client({ data: null, error: null });
    expect(
      (await resolveSessionState(c as never, u({ identities: [{ provider: "google" }] }))).state,
    ).toBe("pending");
  });

  it("no profile + confirmed email -> pending; unconfirmed email-only -> orphan", async () => {
    const c = client({ data: null, error: null });
    expect(
      (await resolveSessionState(c as never, u({ email_confirmed_at: "2026-11-11", app_metadata: { providers: ["email"] } }))).state,
    ).toBe("pending");
    expect(
      (await resolveSessionState(c as never, u({ email_confirmed_at: null, app_metadata: { providers: ["email"] } }))).state,
    ).toBe("orphan");
  });

  it("an unrecognised role is orphan (sign out, nothing deleted)", async () => {
    const c = client({ data: { role: "x" }, error: null });
    expect((await resolveSessionState(c as never, u({}))).state).toBe("orphan");
  });

  it("uses maybeSingle (a missing profile is not an error)", async () => {
    const c = client({ data: null, error: null });
    await resolveSessionState(c as never, u({}));
    expect(c.maybeSingle).toHaveBeenCalledOnce();
  });
});

describe("classifyProfilelessUser / homeForState", () => {
  it("never reports pending for an unverified email-only user", () => {
    expect(classifyProfilelessUser(u({ app_metadata: { providers: ["email"] } }))).toBe("orphan");
  });
  it("homes", () => {
    expect(homeForState("parent")).toBe("/dashboard");
    expect(homeForState("athlete")).toBe("/athlete");
    expect(homeForState("adult_athlete")).toBe("/athlete");
    for (const s of ["none", "orphan", "pending", "error"] as const) {
      expect(homeForState(s)).toBeNull();
    }
  });
});
