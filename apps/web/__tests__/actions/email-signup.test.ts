/**
 * Unit tests for the verified two-step email signup (FV-671, SSO A1; spec §4,
 * §5.2, §13 "Email signup" + "Destructive paths").
 *
 * Covers startEmailSignup / completeEmailSignup / verifyEmailOnly /
 * resendSignupCode, the signIn `email_not_confirmed` branch, cancelOnboarding,
 * and the shared closePendingAccount sequence. Supabase is mocked; the real
 * database-side behavior (the lock functions) is covered by
 * supabase/tests/rls/assertions/23_pending_accounts.sql and
 * supabase/tests/concurrency/run.sh.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  signUp: vi.fn(),
  verifyOtp: vi.fn(),
  resend: vi.fn(),
  signOut: vi.fn(),
  signInWithPassword: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  svcRpc: vi.fn(),
  deleteUser: vi.fn(),
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
    auth: {
      signUp: h.signUp,
      verifyOtp: h.verifyOtp,
      resend: h.resend,
      signOut: h.signOut,
      signInWithPassword: h.signInWithPassword,
      getUser: h.getUser,
    },
    rpc: h.rpc,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: h.maybeSingle, single: h.maybeSingle }),
      }),
      insert: h.insert,
    }),
  }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    rpc: h.svcRpc,
    auth: { admin: { deleteUser: h.deleteUser } },
  }),
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

import { signIn } from "@/lib/actions/auth";
import {
  completeEmailSignup,
  resendSignupCode,
  startEmailSignup,
  verifyEmailOnly,
} from "@/lib/actions/email-signup";
import { cancelOnboarding } from "@/lib/actions/onboarding";
import { closePendingAccount } from "@/lib/auth/pending-account";

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.set(k, v);
  return f;
}

const PARENT_START = {
  role: "parent",
  email: "Parent@Example.com ",
  password: "password123",
  first_name: "Pat",
  guardian_attestation: "on",
  consent: "on",
};
const ADULT_START = {
  role: "adult_athlete",
  email: "adult@example.com",
  password: "password123",
  first_name: "Sam",
  birthdate: "2000-01-01",
  sport: "hockey",
  age_attestation: "on",
  consent: "on",
};
const PARENT_COMPLETE = {
  role: "parent",
  email: "parent@example.com",
  token: "123456",
  first_name: "Pat",
  guardian_attestation: "on",
  consent: "on",
};
const ADULT_COMPLETE = {
  role: "adult_athlete",
  email: "adult@example.com",
  token: "123456",
  first_name: "Sam",
  birthdate: "2000-01-01",
  sport: "hockey",
  age_attestation: "on",
  consent: "on",
};

const without = (o: Record<string, string>, k: string) => {
  const c = { ...o };
  delete c[k];
  return c;
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

let logged: string[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  h.order.length = 0;
  h.gate.mockResolvedValue({ limited: false });
  h.ip.mockResolvedValue("1.2.3.4");
  h.capability.mockReturnValue(null);
  h.signUp.mockResolvedValue({
    data: { user: { id: "u1" }, session: null },
    error: null,
  });
  h.verifyOtp.mockResolvedValue({
    data: { user: { id: "u1" }, session: {} },
    error: null,
  });
  h.resend.mockResolvedValue({ error: null });
  h.signOut.mockImplementation(async () => {
    h.order.push("signOut");
    return { error: null };
  });
  h.rpc.mockResolvedValue({ data: "created", error: null });
  h.maybeSingle.mockResolvedValue({ data: { role: "parent" }, error: null });
  h.svcRpc.mockImplementation(async () => {
    h.order.push("finalize");
    return { data: "deleted", error: null };
  });
  h.revoke.mockImplementation(async () => {
    h.order.push("revoke");
    return { ok: true, revoked: 0 };
  });
  logged = [];
  for (const m of ["log", "info", "warn", "error"] as const) {
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
      logged.push(a.map(String).join(" "));
    });
  }
});

afterEach(() => {
  delete process.env.ENABLE_ADULT_SIGNUP;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
describe("startEmailSignup — validate everything BEFORE auth.signUp", () => {
  it("rejects a missing/unknown role without any side effect", async () => {
    const res = await startEmailSignup(null, fd(without(PARENT_START, "role")));
    expect(res).toMatchObject({ ok: false, field: "role" });
    expect(h.signUp).not.toHaveBeenCalled();
    expect(h.gate).not.toHaveBeenCalled();
  });

  it.each([
    ["guardian_attestation"],
    ["consent"],
    ["first_name"],
    ["email"],
    ["password"],
  ])("parent: missing %s -> field error, no rate-limit hit, no auth row, no email", async (key) => {
    const res = await startEmailSignup(null, fd(without(PARENT_START, key)));
    expect(res).toMatchObject({ ok: false, field: key });
    expect(h.signUp).not.toHaveBeenCalled();
    expect(h.gate).not.toHaveBeenCalled();
  });

  it("parent: rejects a bad email and a short password", async () => {
    expect(
      await startEmailSignup(null, fd({ ...PARENT_START, email: "nope" })),
    ).toMatchObject({ ok: false, field: "email" });
    expect(
      await startEmailSignup(null, fd({ ...PARENT_START, password: "short" })),
    ).toMatchObject({ ok: false, field: "password" });
    expect(h.signUp).not.toHaveBeenCalled();
  });

  it("adult: refuses when ENABLE_ADULT_SIGNUP is off, before anything else", async () => {
    const res = await startEmailSignup(null, fd(ADULT_START));
    expect(res).toMatchObject({ ok: false });
    expect(h.signUp).not.toHaveBeenCalled();
    expect(h.gate).not.toHaveBeenCalled();
  });

  describe("adult (flag on)", () => {
    beforeEach(() => {
      process.env.ENABLE_ADULT_SIGNUP = "true";
    });

    it("under 18 -> birthdate error; NO auth row and NO email", async () => {
      const res = await startEmailSignup(
        null,
        fd({ ...ADULT_START, birthdate: "2015-01-01" }),
      );
      expect(res).toMatchObject({ ok: false, field: "birthdate" });
      expect(h.signUp).not.toHaveBeenCalled();
      expect(h.gate).not.toHaveBeenCalled();
    });

    it.each([["age_attestation"], ["sport"], ["consent"], ["birthdate"]])(
      "missing %s -> field error, no auth row",
      async (key) => {
        const res = await startEmailSignup(null, fd(without(ADULT_START, key)));
        expect(res).toMatchObject({ ok: false, field: key });
        expect(h.signUp).not.toHaveBeenCalled();
      },
    );

    it("valid adult -> signUp, verify_code step with the role", async () => {
      const res = await startEmailSignup(null, fd(ADULT_START));
      expect(res).toEqual({
        ok: true,
        step: "verify_code",
        email: "adult@example.com",
        purpose: "signup",
        role: "adult_athlete",
      });
      expect(h.signUp).toHaveBeenCalledOnce();
    });
  });
});

describe("startEmailSignup — rate limit and the signUp call", () => {
  it("keys the sign_up gate on the request IP and does NOT call signUp when limited", async () => {
    h.ip.mockResolvedValue("10.0.0.1");
    h.gate.mockResolvedValue({ limited: true });
    const res = await startEmailSignup(null, fd(PARENT_START));
    expect(h.gate).toHaveBeenCalledWith("sign_up", "10.0.0.1");
    expect(res).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many attempts/i),
    });
    expect(h.signUp).not.toHaveBeenCalled();
  });

  it("calls auth.signUp with ONLY email + password (no options.data / user_metadata) and returns the code step", async () => {
    const res = await startEmailSignup(null, fd(PARENT_START));
    expect(h.signUp).toHaveBeenCalledOnce();
    expect(h.signUp).toHaveBeenCalledWith({
      email: "parent@example.com", // trimmed + lowercased
      password: "password123",
    });
    expect(res).toEqual({
      ok: true,
      step: "verify_code",
      email: "parent@example.com",
      purpose: "signup",
      role: "parent",
    });
    // No profile write, no session work, no deletion.
    expect(h.rpc).not.toHaveBeenCalled();
    expect(h.insert).not.toHaveBeenCalled();
    expect(h.deleteUser).not.toHaveBeenCalled();
  });

  it("returns a generic message on a signUp error (no enumeration) and never deletes", async () => {
    h.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered", status: 422, code: "user_already_exists" },
    });
    const res = await startEmailSignup(null, fd(PARENT_START));
    expect(res).toMatchObject({ ok: false });
    expect(JSON.stringify(res)).not.toMatch(/already registered/i);
    expect(h.deleteUser).not.toHaveBeenCalled();
  });

  it("refuses to continue (and ends the session) if signUp returns a session — Confirm email is OFF", async () => {
    h.signUp.mockResolvedValue({
      data: { user: { id: "u1" }, session: { access_token: "x" } },
      error: null,
    });
    const res = await startEmailSignup(null, fd(PARENT_START));
    expect(res).toMatchObject({ ok: false });
    expect(h.signOut).toHaveBeenCalledOnce();
    expect(h.deleteUser).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe("completeEmailSignup", () => {
  it("re-validates before verifying: malformed code, missing attestation, under-18 adult", async () => {
    process.env.ENABLE_ADULT_SIGNUP = "true";
    expect(
      await completeEmailSignup(null, fd({ ...PARENT_COMPLETE, token: "12345" })),
    ).toMatchObject({ ok: false, field: "token" });
    expect(
      await completeEmailSignup(null, fd(without(PARENT_COMPLETE, "guardian_attestation"))),
    ).toMatchObject({ ok: false, field: "guardian_attestation" });
    expect(
      await completeEmailSignup(
        null,
        fd({ ...ADULT_COMPLETE, birthdate: "2015-05-05" }),
      ),
    ).toMatchObject({ ok: false, field: "birthdate" });
    expect(h.verifyOtp).not.toHaveBeenCalled();
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("is blocked by the per-email signup_verify limit BEFORE verifyOtp", async () => {
    h.gate.mockImplementation(async (action: string) => ({
      limited: action === "signup_verify",
    }));
    const res = await completeEmailSignup(null, fd(PARENT_COMPLETE));
    expect(h.gate).toHaveBeenCalledWith("signup_verify", "parent@example.com");
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/too many/i) });
    expect(h.verifyOtp).not.toHaveBeenCalled();
  });

  it("verifies with { email, token, type: 'email' }", async () => {
    await redirectedTo(completeEmailSignup(null, fd(PARENT_COMPLETE)));
    expect(h.verifyOtp).toHaveBeenCalledWith({
      email: "parent@example.com",
      token: "123456",
      type: "email",
    });
  });

  it("wrong / expired / superseded code -> generic token error; no profile call, no deletion", async () => {
    h.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Token has expired or is invalid", status: 403, code: "otp_expired" },
    });
    const res = await completeEmailSignup(null, fd(PARENT_COMPLETE));
    expect(res).toMatchObject({ ok: false, field: "token" });
    expect(h.rpc).not.toHaveBeenCalled();
    expect(h.svcRpc).not.toHaveBeenCalled();
    expect(h.deleteUser).not.toHaveBeenCalled();
  });

  it("created (parent) -> complete_pending_profile with parent args -> /dashboard", async () => {
    h.rpc.mockResolvedValue({ data: "created", error: null });
    expect(await redirectedTo(completeEmailSignup(null, fd(PARENT_COMPLETE)))).toBe(
      "/dashboard",
    );
    expect(h.rpc).toHaveBeenCalledWith("complete_pending_profile", {
      p_role: "parent",
      p_first_name: "Pat",
      p_birthdate: null,
      p_sport: null,
    });
  });

  describe("created (adult)", () => {
    beforeEach(() => {
      process.env.ENABLE_ADULT_SIGNUP = "true";
    });

    it("web -> /subscribe, args carry birthdate + sport", async () => {
      expect(await redirectedTo(completeEmailSignup(null, fd(ADULT_COMPLETE)))).toBe(
        "/subscribe",
      );
      expect(h.rpc).toHaveBeenCalledWith("complete_pending_profile", {
        p_role: "adult_athlete",
        p_first_name: "Sam",
        p_birthdate: "2000-01-01",
        p_sport: "hockey",
      });
    });

    it("legacy-native shell -> /athlete (FV-482)", async () => {
      h.capability.mockReturnValue("legacy-native");
      expect(await redirectedTo(completeEmailSignup(null, fd(ADULT_COMPLETE)))).toBe(
        "/athlete",
      );
    });

    it("ios-iap shell -> /subscribe (FV-577)", async () => {
      h.capability.mockReturnValue("ios-iap");
      expect(await redirectedTo(completeEmailSignup(null, fd(ADULT_COMPLETE)))).toBe(
        "/subscribe",
      );
    });
  });

  it("already_complete (two tabs) routes by the REAL profile role, creates and deletes nothing", async () => {
    h.rpc.mockResolvedValue({ data: "already_complete", error: null });
    h.maybeSingle.mockResolvedValue({ data: { role: "adult_athlete" }, error: null });
    expect(await redirectedTo(completeEmailSignup(null, fd(PARENT_COMPLETE)))).toBe(
      "/athlete",
    );
    expect(h.svcRpc).not.toHaveBeenCalled();
    expect(h.deleteUser).not.toHaveBeenCalled();
  });

  it("reject_underage -> revoke hook, THEN finalize, THEN sign out, -> /signup?error=age; the birthdate is never logged", async () => {
    process.env.ENABLE_ADULT_SIGNUP = "true";
    h.rpc.mockResolvedValue({ data: "reject_underage", error: null });
    // A birthdate that passes the app-layer 18+ check but that the DB (clock
    // skew / race) rejects: the app must still do the full closing sequence.
    const to = await redirectedTo(
      completeEmailSignup(null, fd({ ...ADULT_COMPLETE, birthdate: "1999-12-31" })),
    );
    expect(to).toBe("/signup?error=age");
    expect(h.order).toEqual(["revoke", "finalize", "signOut"]);
    expect(h.svcRpc).toHaveBeenCalledWith("finalize_pending_deletion", {
      p_user_id: "u1",
    });
    expect(h.deleteUser).not.toHaveBeenCalled(); // SQL delete only
    const all = logged.join("\n");
    expect(all).not.toMatch(/1999/);
    expect(all).not.toMatch(/adult@example\.com/);
  });

  it("account_closing from the database -> signed out, no further writes", async () => {
    h.rpc.mockResolvedValue({
      data: null,
      error: { message: "account_closing", code: "P0001" },
    });
    const res = await completeEmailSignup(null, fd(PARENT_COMPLETE));
    expect(res).toMatchObject({ ok: false });
    expect(h.signOut).toHaveBeenCalledOnce();
    expect(h.svcRpc).not.toHaveBeenCalled();
    expect(h.deleteUser).not.toHaveBeenCalled();
  });

  it("NEVER deletes the user when the profile insert fails (legacy rollback removed)", async () => {
    h.rpc.mockResolvedValue({
      data: null,
      error: { message: "new row violates check constraint", code: "23514" },
    });
    const res = await completeEmailSignup(null, fd(PARENT_COMPLETE));
    expect(res).toMatchObject({
      ok: false,
      error: expect.stringMatching(/could not create your profile/i),
    });
    expect(h.deleteUser).not.toHaveBeenCalled();
    expect(h.svcRpc).not.toHaveBeenCalled(); // not even finalize: the user stays pending, retryable
  });

  it("an IP rate limit after verification stops the profile call", async () => {
    h.gate.mockImplementation(async (action: string) => ({ limited: action === "sign_up" }));
    const res = await completeEmailSignup(null, fd(PARENT_COMPLETE));
    expect(res).toMatchObject({ ok: false });
    expect(h.rpc).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe("verifyEmailOnly (legacy / unconfirmed account sign-in)", () => {
  it("verifies, never inserts a profile, and routes by role", async () => {
    h.maybeSingle.mockResolvedValue({ data: { role: "parent" }, error: null });
    expect(
      await redirectedTo(
        verifyEmailOnly(null, fd({ email: "a@example.com", token: "654321" })),
      ),
    ).toBe("/dashboard");
    expect(h.verifyOtp).toHaveBeenCalledWith({
      email: "a@example.com",
      token: "654321",
      type: "email",
    });
    expect(h.rpc).not.toHaveBeenCalled();
    expect(h.insert).not.toHaveBeenCalled();
  });

  it("an 18+ athlete account lands on /athlete", async () => {
    h.maybeSingle.mockResolvedValue({ data: { role: "adult_athlete" }, error: null });
    expect(
      await redirectedTo(
        verifyEmailOnly(null, fd({ email: "a@example.com", token: "654321" })),
      ),
    ).toBe("/athlete");
  });

  it("a verified account with no profile goes to /welcome (A3), without deleting anything", async () => {
    h.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(
      await redirectedTo(
        verifyEmailOnly(null, fd({ email: "a@example.com", token: "654321" })),
      ),
    ).toBe("/welcome");
    expect(h.deleteUser).not.toHaveBeenCalled();
    expect(h.svcRpc).not.toHaveBeenCalled();
  });

  it("wrong code -> generic token error", async () => {
    h.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Token has expired or is invalid", code: "otp_expired" },
    });
    expect(
      await verifyEmailOnly(null, fd({ email: "a@example.com", token: "000000" })),
    ).toMatchObject({ ok: false, field: "token" });
  });

  it("rate limited per email before verifyOtp", async () => {
    h.gate.mockResolvedValue({ limited: true });
    const res = await verifyEmailOnly(null, fd({ email: "a@example.com", token: "654321" }));
    expect(h.gate).toHaveBeenCalledWith("signup_verify", "a@example.com");
    expect(res).toMatchObject({ ok: false });
    expect(h.verifyOtp).not.toHaveBeenCalled();
  });

  it("rejects a malformed code before any network call", async () => {
    expect(
      await verifyEmailOnly(null, fd({ email: "a@example.com", token: "12ab56" })),
    ).toMatchObject({ ok: false, field: "token" });
    expect(h.verifyOtp).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe("resendSignupCode", () => {
  it("resends a signup code, rate-limited per email, and answers generically", async () => {
    const res = await resendSignupCode(null, fd({ email: "A@Example.com", purpose: "signin" }));
    expect(h.gate).toHaveBeenCalledWith("signup_resend", "a@example.com");
    expect(h.resend).toHaveBeenCalledWith({ type: "signup", email: "a@example.com" });
    expect(res).toEqual({
      ok: true,
      step: "verify_code",
      email: "a@example.com",
      purpose: "signin",
    });
  });

  it("is generic even if the resend fails (cooldown / unknown address)", async () => {
    h.resend.mockResolvedValue({
      error: { message: "For security purposes, you can only request this after 60 seconds.", code: "over_email_send_rate_limit" },
    });
    const res = await resendSignupCode(
      null,
      fd({ email: "a@example.com", purpose: "signup", role: "parent" }),
    );
    expect(res).toMatchObject({ ok: true, step: "verify_code", purpose: "signup", role: "parent" });
  });

  it("stops at the rate limit without calling Supabase", async () => {
    h.gate.mockResolvedValue({ limited: true });
    const res = await resendSignupCode(null, fd({ email: "a@example.com" }));
    expect(res).toMatchObject({ ok: false });
    expect(h.resend).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe("signIn — email_not_confirmed code branch", () => {
  const form = () => fd({ email: "legacy@example.com", password: "password123" });

  it("after a CORRECT password, an unconfirmed account gets a fresh code and the code step", async () => {
    h.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email not confirmed", status: 400, code: "email_not_confirmed" },
    });
    const res = await signIn(null, form());
    expect(res).toEqual({
      ok: true,
      step: "verify_code",
      email: "legacy@example.com",
      purpose: "signin",
    });
    expect(h.resend).toHaveBeenCalledWith({ type: "signup", email: "legacy@example.com" });
    expect(h.gate).toHaveBeenCalledWith("signup_resend", "legacy@example.com");
  });

  it("does not resend (but still shows the code step) when the resend bucket is full", async () => {
    h.gate.mockImplementation(async (action: string) => ({ limited: action === "signup_resend" }));
    h.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email not confirmed", code: "email_not_confirmed" },
    });
    const res = await signIn(null, form());
    expect(res).toMatchObject({ ok: true, step: "verify_code", purpose: "signin" });
    expect(h.resend).not.toHaveBeenCalled();
  });

  it("a WRONG password never reveals the code step (anti-enumeration): generic message, no resend", async () => {
    h.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials", status: 400, code: "invalid_credentials" },
    });
    const res = await signIn(null, form());
    expect(res).toEqual({ ok: false, error: "Email or password is incorrect." });
    expect(h.resend).not.toHaveBeenCalled();
  });

  it("the branch is only reachable through signInWithPassword's own result (no pre-check by email)", async () => {
    h.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials", code: "invalid_credentials" },
    });
    await signIn(null, form());
    expect(h.signInWithPassword).toHaveBeenCalledOnce();
    expect(h.signInWithPassword).toHaveBeenCalledWith({
      email: "legacy@example.com",
      password: "password123",
    });
  });
});

// ---------------------------------------------------------------------------
describe("cancelOnboarding", () => {
  it("derives the user from the session and sends them to /signin when there is none", async () => {
    h.getUser.mockResolvedValue({ data: { user: null } });
    expect(await redirectedTo(cancelOnboarding())).toBe("/signin");
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("marked -> revoke hook -> finalize -> sign out -> /signin; the RPC takes no parameters", async () => {
    h.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    h.rpc.mockResolvedValue({ data: "marked", error: null });
    expect(await redirectedTo(cancelOnboarding())).toBe("/signin");
    expect(h.rpc).toHaveBeenCalledWith("cancel_my_pending_account");
    expect(h.order).toEqual(["revoke", "finalize", "signOut"]);
  });

  it("not_pending (an established account) deletes NOTHING and reports it", async () => {
    h.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    h.rpc.mockResolvedValue({ data: "not_pending", error: null });
    const res = await cancelOnboarding();
    expect(res).toMatchObject({ ok: false });
    expect(h.svcRpc).not.toHaveBeenCalled();
    expect(h.deleteUser).not.toHaveBeenCalled();
    expect(h.signOut).not.toHaveBeenCalled();
  });

  it("an RPC error deletes nothing", async () => {
    h.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    h.rpc.mockResolvedValue({ data: null, error: { message: "boom", code: "XX000" } });
    expect(await cancelOnboarding()).toMatchObject({ ok: false });
    expect(h.svcRpc).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe("closePendingAccount", () => {
  it("when the Apple revoke fails: tombstone kept (NO finalize), still signs out", async () => {
    h.revoke.mockResolvedValue({ ok: false, revoked: 0 });
    const out = await closePendingAccount("u1");
    expect(out).toEqual({ finalize: "skipped", revoked: false });
    expect(h.svcRpc).not.toHaveBeenCalled();
    expect(h.signOut).toHaveBeenCalledOnce();
  });

  it("when the revoke hook throws: treated as failed", async () => {
    h.revoke.mockRejectedValue(new Error("apple down"));
    const out = await closePendingAccount("u1");
    expect(out.finalize).toBe("skipped");
    expect(h.svcRpc).not.toHaveBeenCalled();
  });

  it("when finalize errors: no throw, tombstone stays for the reaper, signs out", async () => {
    h.svcRpc.mockResolvedValue({ data: null, error: { message: "x", code: "XX000" } });
    const out = await closePendingAccount("u1");
    expect(out.finalize).toBe("error");
    expect(h.signOut).toHaveBeenCalledOnce();
  });

  it("finalize not_pending (the account became established) is surfaced, nothing else deleted", async () => {
    h.svcRpc.mockResolvedValue({ data: "not_pending", error: null });
    const out = await closePendingAccount("u1");
    expect(out.finalize).toBe("not_pending");
    expect(h.deleteUser).not.toHaveBeenCalled();
  });
});
