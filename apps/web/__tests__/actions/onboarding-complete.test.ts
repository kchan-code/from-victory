/**
 * Unit tests for completeOnboarding / cancelOnboarding as driven by /welcome
 * (FV-672, SSO A3; spec FV-569 §5.2 + §13). Supabase is mocked; the database
 * side (the lock functions) is covered by the pending-account RLS assertions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  signOut: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
  maybeSingle: vi.fn(),
  svcRpc: vi.fn(),
  gate: vi.fn(),
  ip: vi.fn(),
  capability: vi.fn(),
  revoke: vi.fn(),
  order: [] as string[],
}));

vi.mock("next/navigation", () => ({ redirect: h.redirect }));
vi.mock("@/lib/actions/rate-limit-store", () => ({
  rateLimitGate: (...a: unknown[]) => h.gate(...a),
  getRequestIp: () => h.ip(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { signOut: h.signOut, getUser: h.getUser },
    rpc: h.rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: h.maybeSingle }) }) }),
  }),
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ rpc: h.svcRpc }),
}));
vi.mock("@/lib/auth/apple-revoke", () => ({
  revokeAppleTokensForPendingDeletion: (...a: unknown[]) => h.revoke(...a),
}));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: vi.fn() }));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: vi.fn() }));
vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: () => h.capability(),
  isNativeShell: () => false,
}));

import { cancelOnboarding, completeOnboarding } from "@/lib/actions/onboarding";

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.set(k, v);
  return f;
}

const PARENT = {
  role: "parent",
  first_name: "Pat",
  guardian_attestation: "on",
  consent: "on",
};
const ADULT = {
  role: "adult_athlete",
  first_name: "Sam",
  birthdate: "2000-01-01",
  sport: "hockey",
  age_attestation: "on",
  consent: "on",
};

async function redirectedTo(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    const m = /NEXT_REDIRECT:(.*)$/.exec((e as Error).message);
    if (m?.[1]) return m[1];
    throw e;
  }
  throw new Error("expected a redirect");
}

beforeEach(() => {
  vi.clearAllMocks();
  h.order.length = 0;
  process.env.ENABLE_ADULT_SIGNUP = "true";
  h.gate.mockResolvedValue({ limited: false });
  h.ip.mockResolvedValue("1.2.3.4");
  h.capability.mockReturnValue(null);
  h.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.co" } } });
  h.rpc.mockResolvedValue({ data: "created", error: null });
  h.maybeSingle.mockResolvedValue({ data: { role: "parent" }, error: null });
  h.signOut.mockImplementation(async () => {
    h.order.push("signOut");
    return { error: null };
  });
  h.revoke.mockImplementation(async () => {
    h.order.push("revoke");
    return { ok: true, revoked: 0 };
  });
  h.svcRpc.mockImplementation(async () => {
    h.order.push("finalize");
    return { data: "deleted", error: null };
  });
});

afterEach(() => {
  delete process.env.ENABLE_ADULT_SIGNUP;
});

describe("completeOnboarding", () => {
  it("parent created -> /dashboard; RPC gets role + first name only, no email/id from the form", async () => {
    expect(await redirectedTo(completeOnboarding(null, fd(PARENT)))).toBe("/dashboard");
    expect(h.rpc).toHaveBeenCalledWith("complete_pending_profile", {
      p_role: "parent",
      p_first_name: "Pat",
      p_birthdate: null,
      p_sport: null,
    });
  });

  it("adult created -> /subscribe on web, /athlete in the legacy-native shell", async () => {
    expect(await redirectedTo(completeOnboarding(null, fd(ADULT)))).toBe("/subscribe");
    expect(h.rpc).toHaveBeenCalledWith("complete_pending_profile", {
      p_role: "adult_athlete",
      p_first_name: "Sam",
      p_birthdate: "2000-01-01",
      p_sport: "hockey",
    });
    h.capability.mockReturnValue("legacy-native");
    expect(await redirectedTo(completeOnboarding(null, fd(ADULT)))).toBe("/athlete");
  });

  it("already_complete routes by the REAL role (two-tab case), inserts nothing", async () => {
    h.rpc.mockResolvedValue({ data: "already_complete", error: null });
    h.maybeSingle.mockResolvedValue({ data: { role: "adult_athlete" }, error: null });
    expect(await redirectedTo(completeOnboarding(null, fd(PARENT)))).toBe("/athlete");
    expect(h.svcRpc).not.toHaveBeenCalled();
  });

  it("reject_underage -> revoke -> finalize -> sign out -> /signup?error=age", async () => {
    h.rpc.mockResolvedValue({ data: "reject_underage", error: null });
    expect(await redirectedTo(completeOnboarding(null, fd(ADULT)))).toBe("/signup?error=age");
    expect(h.order).toEqual(["revoke", "finalize", "signOut"]);
  });

  it("account_closing -> signs out, returns an error, deletes nothing", async () => {
    h.rpc.mockResolvedValue({ data: null, error: { message: "account_closing", code: "P0001" } });
    const res = await completeOnboarding(null, fd(PARENT));
    expect(res).toMatchObject({ ok: false });
    expect(h.signOut).toHaveBeenCalledOnce();
    expect(h.svcRpc).not.toHaveBeenCalled();
  });

  it("any other RPC error NEVER deletes or signs out (user stays pending and can retry)", async () => {
    h.rpc.mockResolvedValue({ data: null, error: { message: "account_unverified", code: "P0001" } });
    expect(await completeOnboarding(null, fd(PARENT))).toMatchObject({ ok: false });
    expect(h.svcRpc).not.toHaveBeenCalled();
    expect(h.signOut).not.toHaveBeenCalled();
  });

  it("unexpected RPC result -> error, no routing", async () => {
    h.rpc.mockResolvedValue({ data: "weird", error: null });
    expect(await completeOnboarding(null, fd(PARENT))).toMatchObject({ ok: false });
    expect(h.redirect).not.toHaveBeenCalled();
  });

  it("validates before any I/O: missing attestation, under-18 birthdate, bad sport, missing consent", async () => {
    for (const bad of [
      { ...PARENT, guardian_attestation: "" },
      { ...PARENT, consent: "" },
      { ...ADULT, birthdate: "2015-01-01" },
      { ...ADULT, sport: "curling" },
      { ...ADULT, age_attestation: "" },
    ]) {
      const res = await completeOnboarding(null, fd(bad));
      expect(res).toMatchObject({ ok: false });
    }
    expect(h.getUser).not.toHaveBeenCalled();
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("adult path is refused when ENABLE_ADULT_SIGNUP is off", async () => {
    delete process.env.ENABLE_ADULT_SIGNUP;
    expect(await completeOnboarding(null, fd(ADULT))).toMatchObject({ ok: false });
    expect(h.rpc).not.toHaveBeenCalled();
    // the parent path is unaffected
    expect(await redirectedTo(completeOnboarding(null, fd(PARENT)))).toBe("/dashboard");
  });

  it("no session -> /signin, no RPC", async () => {
    h.getUser.mockResolvedValue({ data: { user: null } });
    expect(await redirectedTo(completeOnboarding(null, fd(PARENT)))).toBe("/signin");
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("uses the sign_up IP bucket and stops when limited", async () => {
    h.gate.mockResolvedValue({ limited: true });
    expect(await completeOnboarding(null, fd(PARENT))).toMatchObject({ ok: false });
    expect(h.gate).toHaveBeenCalledWith("sign_up", "1.2.3.4");
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("ignores a client-supplied email / user id (only session + validated fields are used)", async () => {
    await redirectedTo(
      completeOnboarding(null, fd({ ...PARENT, email: "evil@x.co", user_id: "other", p_user_id: "other" })),
    );
    expect(JSON.stringify(h.rpc.mock.calls)).not.toContain("evil");
    expect(JSON.stringify(h.rpc.mock.calls)).not.toContain("other");
  });
});

describe("cancelOnboarding from /welcome", () => {
  it("marked -> revoke -> finalize -> sign out -> /signin", async () => {
    h.rpc.mockResolvedValue({ data: "marked", error: null });
    expect(await redirectedTo(cancelOnboarding())).toBe("/signin");
    expect(h.order).toEqual(["revoke", "finalize", "signOut"]);
  });

  it("not_pending deletes nothing and stays put", async () => {
    h.rpc.mockResolvedValue({ data: "not_pending", error: null });
    expect(await cancelOnboarding()).toMatchObject({ ok: false });
    expect(h.svcRpc).not.toHaveBeenCalled();
  });
});
