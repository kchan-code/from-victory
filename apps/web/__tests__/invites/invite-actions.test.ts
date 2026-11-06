/**
 * FV-630 — invite / recovery server actions.
 *
 * Pins the app-layer guarantees (the DB-layer guarantees — atomic replace,
 * single-use, rollback on username collision, recovery preserves username,
 * one live code per athlete — are pinned in SQL by
 * supabase/tests/rls/assertions/22_athlete_invitations.sql):
 *
 *   createAthleteInvite
 *     - parent-only (requireParent) and rate-limited on the parent id
 *     - stores ONLY sha256(code): the raw code never reaches the RPC payload
 *     - replacement/revocation is delegated to the atomic issue RPC
 *     - unlinked athlete → refusal, no code returned
 *   checkInvite
 *     - rate-limited BEFORE any lookup (limited → zero DB calls)
 *     - malformed code → no lookup
 *     - lookup is by hash of the canonical code; invite vs recovery mode
 *     - recovery returns the athlete's own username; invite returns none
 *   claimAthleteInvite
 *     - rate-limited BEFORE the claim (limited → no RPC, code not burned)
 *     - readable codes hash canonical; legacy 32-char codes hash raw
 *     - taken / missing username → field errors from the RPC error code
 *     - unusable code → one generic message (no enumeration)
 *     - password write failure → release_athlete_invite with the EXACT
 *       consumed_at string, then a password field error
 *     - success → device cookie bound, signed in, redirect /athlete (no
 *       second sign-in); session failure → /signin
 *   Logging: no raw code or code hash is ever written to the console.
 */

import { createHash } from "crypto";

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("server-only", () => ({}));

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((to: string) => {
    throw new Error(`__REDIRECT__:${to}`);
  }),
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined, set: vi.fn(), delete: vi.fn() }),
  headers: () => ({ get: () => null }),
}));

const rateLimitGateMock: Mock = vi.fn(async () => ({ limited: false }));
vi.mock("@/lib/actions/rate-limit-store", () => ({
  rateLimitGate: (...args: unknown[]) => rateLimitGateMock(...args),
  getRequestIp: async () => "203.0.113.7",
}));

const setDeviceAthleteIdMock = vi.fn();
vi.mock("@/lib/auth/device", () => ({
  setDeviceAthleteId: (id: string) => setDeviceAthleteIdMock(id),
  getDeviceAthleteId: () => null,
  clearDeviceAthleteId: vi.fn(),
}));

const requireParentMock: Mock = vi.fn(async () => ({ userId: PARENT_ID }));
vi.mock("@/lib/auth/guards", () => ({
  requireParent: () => requireParentMock(),
}));

// ---- service client stub ---------------------------------------------------

type RpcResult = { data: unknown; error: { message: string; code?: string } | null };
interface ServiceState {
  rpc: Record<string, RpcResult>;
  rpcCalls: { fn: string; args: Record<string, unknown> }[];
  lookup: { data: unknown; error: { message: string } | null };
  lookupFilters: [string, unknown][];
  profile: { data: unknown; error: { message: string } | null };
  fromCalls: string[];
  getUserById: { data: { user: { email?: string } | null }; error: unknown };
  updateUserById: { error: { message: string; status?: number; code?: string } | null };
  updateUserByIdCalls: unknown[];
}
let svc: ServiceState;

function makeService() {
  return {
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
      svc.rpcCalls.push({ fn, args });
      return svc.rpc[fn] ?? { data: null, error: null };
    }),
    from: vi.fn((table: string) => {
      svc.fromCalls.push(table);
      const chain = {
        select: () => chain,
        eq: (col: string, val: unknown) => {
          svc.lookupFilters.push([col, val]);
          return chain;
        },
        is: () => chain,
        gt: () => chain,
        maybeSingle: async () =>
          table === "device_pairings" ? svc.lookup : svc.profile,
      };
      return chain;
    }),
    auth: {
      admin: {
        getUserById: vi.fn(async () => svc.getUserById),
        updateUserById: vi.fn(async (...args: unknown[]) => {
          svc.updateUserByIdCalls.push(args);
          return svc.updateUserById;
        }),
      },
    },
  };
}
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => makeService() }));

const signInMock: Mock = vi.fn(async () => ({ error: null }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { signInWithPassword: signInMock } }),
}));

import {
  checkInvite,
  claimAthleteInvite,
  createAthleteInvite,
} from "@/lib/actions/invites";
import { normalizeInviteCode } from "@/lib/invites/code";

const PARENT_ID = "10000000-0000-4000-8000-000000000001";
const ATHLETE_ID = "20000000-0000-4000-8000-00000000000a";
const CODE = "7KQ2M9XD4HTRPW3B";
const CODE_DISPLAY = "7kq2-m9xd-4htr-pw3b"; // typed by an athlete, lower-case
const LEGACY_CODE = "Q2xhdWRlIGlzIGhlbHBmdWwgYW5kIGtp";
const CONSUMED_AT = "2026-11-06T21:30:00.123456+00:00";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

function fd(fields: Record<string, string | undefined>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) f.set(k, v);
  return f;
}

let logs: string[];
beforeEach(() => {
  svc = {
    rpc: {},
    rpcCalls: [],
    lookup: { data: { athlete_id: ATHLETE_ID }, error: null },
    lookupFilters: [],
    profile: { data: { first_name: "Ava", username: null, role: "athlete" }, error: null },
    fromCalls: [],
    getUserById: { data: { user: { email: "a@internal.fromvictoryapp.com" } }, error: null },
    updateUserById: { error: null },
    updateUserByIdCalls: [],
  };
  rateLimitGateMock.mockReset();
  rateLimitGateMock.mockResolvedValue({ limited: false });
  requireParentMock.mockReset();
  requireParentMock.mockResolvedValue({ userId: PARENT_ID });
  signInMock.mockReset();
  signInMock.mockResolvedValue({ error: null });
  setDeviceAthleteIdMock.mockReset();
  redirectMock.mockClear();
  logs = [];
  for (const m of ["log", "warn", "error", "info"] as const) {
    vi.spyOn(console, m).mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
  }
});
afterEach(() => {
  vi.restoreAllMocks();
  // No log line may ever carry a raw code or a code hash.
  const secrets = [CODE, sha(CODE), LEGACY_CODE, sha(LEGACY_CODE)];
  for (const line of logs) {
    for (const s of secrets) expect(line).not.toContain(s);
    expect(line).not.toMatch(/[0-9a-f]{64}/);
  }
});

// ===========================================================================
describe("createAthleteInvite", () => {
  const issueOk = (purpose: "invite" | "recovery" = "invite") => ({
    data: [{ purpose, expires_at: "2026-11-13T21:00:00+00:00" }],
    error: null,
  });

  it("requires a parent session and rate-limits on the parent id", async () => {
    svc.rpc.issue_athlete_invite = issueOk();
    await createAthleteInvite(null, fd({ athlete_id: ATHLETE_ID }));
    expect(requireParentMock).toHaveBeenCalledOnce();
    expect(rateLimitGateMock).toHaveBeenCalledWith("generate_pairing_code", PARENT_ID);
  });

  it("stores only the sha256 of the code; the raw code never reaches the DB", async () => {
    svc.rpc.issue_athlete_invite = issueOk();
    const res = await createAthleteInvite(null, fd({ athlete_id: ATHLETE_ID }));
    expect(res && res.ok).toBe(true);
    if (!res || !res.ok) return;
    expect(normalizeInviteCode(res.code)).toBe(res.code);

    expect(svc.rpcCalls).toHaveLength(1);
    const { fn, args } = svc.rpcCalls[0]!;
    expect(fn).toBe("issue_athlete_invite");
    expect(args).toMatchObject({
      p_parent_id: PARENT_ID,
      p_athlete_id: ATHLETE_ID,
      p_code_sha256: sha(res.code),
    });
    expect(JSON.stringify(args)).not.toContain(res.code);
    // Invite expiry (7d) > recovery expiry (24h); the DB picks by purpose.
    const inv = Date.parse(String(args.p_invite_expires_at));
    const rec = Date.parse(String(args.p_recovery_expires_at));
    expect(inv - Date.now()).toBeGreaterThan(6.9 * 24 * 3600 * 1000);
    expect(rec - Date.now()).toBeLessThan(24.1 * 3600 * 1000);
    // Revocation of prior codes is the RPC's job — no direct table writes.
    expect(svc.fromCalls).toEqual([]);
  });

  it("each create issues a fresh code (replacement)", async () => {
    svc.rpc.issue_athlete_invite = issueOk();
    const a = await createAthleteInvite(null, fd({ athlete_id: ATHLETE_ID }));
    const b = await createAthleteInvite(null, fd({ athlete_id: ATHLETE_ID }));
    expect(a && a.ok && b && b.ok && a.code !== b.code).toBe(true);
    expect(svc.rpcCalls.map((c) => c.fn)).toEqual([
      "issue_athlete_invite",
      "issue_athlete_invite",
    ]);
  });

  it("returns purpose=recovery for a set-up account", async () => {
    svc.rpc.issue_athlete_invite = issueOk("recovery");
    const res = await createAthleteInvite(null, fd({ athlete_id: ATHLETE_ID }));
    expect(res).toMatchObject({ ok: true, purpose: "recovery" });
  });

  it("unlinked athlete → refusal, no code", async () => {
    svc.rpc.issue_athlete_invite = { data: null, error: { message: "not linked", code: "42501" } };
    const res = await createAthleteInvite(null, fd({ athlete_id: ATHLETE_ID }));
    expect(res).toEqual({ ok: false, error: "You can't invite this athlete." });
  });

  it("rate-limited → no RPC", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });
    const res = await createAthleteInvite(null, fd({ athlete_id: ATHLETE_ID }));
    expect(res && !res.ok).toBe(true);
    expect(svc.rpcCalls).toEqual([]);
  });

  it("non-uuid athlete id → rejected before auth or DB", async () => {
    const res = await createAthleteInvite(null, fd({ athlete_id: "../../x" }));
    expect(res && !res.ok).toBe(true);
    expect(requireParentMock).not.toHaveBeenCalled();
    expect(svc.rpcCalls).toEqual([]);
  });
});

// ===========================================================================
describe("checkInvite", () => {
  it("rate-limits BEFORE any lookup", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });
    const res = await checkInvite(null, fd({ code: CODE_DISPLAY }));
    expect(res && !res.ok).toBe(true);
    expect(rateLimitGateMock).toHaveBeenCalledWith("preview_invite", "203.0.113.7");
    expect(svc.fromCalls).toEqual([]);
  });

  it("malformed code → no lookup", async () => {
    const res = await checkInvite(null, fd({ code: "nope" }));
    expect(res && !res.ok).toBe(true);
    expect(svc.fromCalls).toEqual([]);
  });

  it("looks up by sha256 of the canonical code; invite mode has no username", async () => {
    const res = await checkInvite(null, fd({ code: CODE_DISPLAY }));
    expect(svc.lookupFilters).toContainEqual(["code_sha256", sha(CODE)]);
    expect(res).toEqual({ ok: true, code: CODE, firstName: "Ava", mode: "invite", username: null });
  });

  it("recovery mode returns the athlete's own unchanged username", async () => {
    svc.profile = { data: { first_name: "Ava", username: "ava_10", role: "athlete" }, error: null };
    const res = await checkInvite(null, fd({ code: CODE }));
    expect(res).toMatchObject({ ok: true, mode: "recovery", username: "ava_10" });
  });

  it("unknown / used / expired / replaced → one generic message", async () => {
    svc.lookup = { data: null, error: null };
    const res = await checkInvite(null, fd({ code: CODE }));
    expect(res).toEqual({ ok: false, error: expect.stringContaining("can't be used") });
  });
});

// ===========================================================================
describe("claimAthleteInvite", () => {
  const claimOk = (purpose: "invite" | "recovery" = "invite", username = "ava_10") => ({
    data: [{ athlete_id: ATHLETE_ID, purpose, username, consumed_at: CONSUMED_AT }],
    error: null,
  });
  const form = (over: Record<string, string | undefined> = {}) =>
    fd({ code: CODE_DISPLAY, username: "Ava_10", password: "password123", password_confirm: "password123", ...over });

  it("rate-limits BEFORE the claim; a throttled request never burns the code", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });
    const res = await claimAthleteInvite(null, form());
    expect(res && !res.ok).toBe(true);
    expect(rateLimitGateMock).toHaveBeenCalledWith("claim_pairing", "203.0.113.7");
    expect(svc.rpcCalls).toEqual([]);
  });

  it("invite: claims by canonical hash with the normalized username, sets password, signs in, lands on /athlete", async () => {
    svc.rpc.claim_athlete_invite = claimOk();
    await expect(claimAthleteInvite(null, form())).rejects.toThrow("__REDIRECT__:/athlete");
    expect(svc.rpcCalls[0]).toEqual({
      fn: "claim_athlete_invite",
      args: { p_code_sha256: sha(CODE), p_username: "ava_10" },
    });
    expect(svc.updateUserByIdCalls).toEqual([[ATHLETE_ID, { password: "password123" }]]);
    expect(setDeviceAthleteIdMock).toHaveBeenCalledWith(ATHLETE_ID);
    expect(signInMock).toHaveBeenCalledWith({
      email: "a@internal.fromvictoryapp.com",
      password: "password123",
    });
  });

  it("recovery: no username sent → p_username null; username untouched", async () => {
    svc.rpc.claim_athlete_invite = claimOk("recovery");
    await expect(
      claimAthleteInvite(null, form({ username: undefined })),
    ).rejects.toThrow("__REDIRECT__:/athlete");
    expect(svc.rpcCalls[0]!.args.p_username).toBeNull();
  });

  it("legacy 32-char /pair code is hashed raw (legacy links keep working)", async () => {
    svc.rpc.claim_athlete_invite = claimOk();
    await expect(claimAthleteInvite(null, form({ code: LEGACY_CODE }))).rejects.toThrow(
      "__REDIRECT__:/athlete",
    );
    expect(svc.rpcCalls[0]!.args.p_code_sha256).toBe(sha(LEGACY_CODE));
  });

  it("garbage code → generic message, no RPC", async () => {
    const res = await claimAthleteInvite(null, form({ code: "not-a-code" }));
    expect(res).toEqual({ ok: false, error: expect.stringContaining("can't be used") });
    expect(svc.rpcCalls).toEqual([]);
  });

  it("taken username (23505) → username field error; code not burned (DB rolled back)", async () => {
    svc.rpc.claim_athlete_invite = { data: null, error: { message: "dup", code: "23505" } };
    const res = await claimAthleteInvite(null, form());
    expect(res).toMatchObject({ ok: false, field: "username" });
    expect(svc.updateUserByIdCalls).toEqual([]);
    expect(svc.rpcCalls.map((c) => c.fn)).toEqual(["claim_athlete_invite"]);
  });

  it("first setup without a username (22023) → username field error", async () => {
    svc.rpc.claim_athlete_invite = { data: null, error: { message: "username required", code: "22023" } };
    const res = await claimAthleteInvite(null, form({ username: "" }));
    expect(res).toMatchObject({ ok: false, field: "username" });
  });

  it("invalid username format → field error before any RPC", async () => {
    const res = await claimAthleteInvite(null, form({ username: "no spaces!" }));
    expect(res).toMatchObject({ ok: false, field: "username" });
    expect(svc.rpcCalls).toEqual([]);
  });

  it("password mismatch → field error before any RPC", async () => {
    const res = await claimAthleteInvite(null, form({ password_confirm: "different1" }));
    expect(res).toMatchObject({ ok: false, field: "password_confirm" });
    expect(svc.rpcCalls).toEqual([]);
  });

  it("used / expired / replaced / unknown code (zero rows) → one generic message, no password write", async () => {
    svc.rpc.claim_athlete_invite = { data: [], error: null };
    const res = await claimAthleteInvite(null, form());
    expect(res).toEqual({ ok: false, error: expect.stringContaining("can't be used") });
    expect(svc.updateUserByIdCalls).toEqual([]);
    expect(setDeviceAthleteIdMock).not.toHaveBeenCalled();
  });

  it("password write fails → releases EXACTLY this claim (consumed_at string untouched) and asks for another password", async () => {
    svc.rpc.claim_athlete_invite = claimOk();
    svc.rpc.release_athlete_invite = { data: true, error: null };
    svc.updateUserById = { error: { message: "weak password", status: 422, code: "weak_password" } };
    const res = await claimAthleteInvite(null, form());
    expect(res).toMatchObject({ ok: false, field: "password" });
    expect(svc.rpcCalls[1]).toEqual({
      fn: "release_athlete_invite",
      // purpose 'invite' = this claim set the username → undo it too, so the
      // athlete isn't left "account ready" with no password (QA 1.1).
      args: { p_code_sha256: sha(CODE), p_consumed_at: CONSUMED_AT, p_clear_username: true },
    });
    expect(setDeviceAthleteIdMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("recovery claim whose password write fails → release keeps the username", async () => {
    svc.rpc.claim_athlete_invite = claimOk("recovery");
    svc.rpc.release_athlete_invite = { data: true, error: null };
    svc.updateUserById = { error: { message: "weak password", status: 422 } };
    await claimAthleteInvite(null, form({ username: undefined }));
    expect(svc.rpcCalls[1]!.args).toMatchObject({ p_clear_username: false });
  });

  it("auth user lookup fails → release + generic error", async () => {
    svc.rpc.claim_athlete_invite = claimOk();
    svc.rpc.release_athlete_invite = { data: true, error: null };
    svc.getUserById = { data: { user: null }, error: { message: "gone" } };
    const res = await claimAthleteInvite(null, form());
    expect(res && !res.ok).toBe(true);
    expect(svc.rpcCalls.map((c) => c.fn)).toEqual(["claim_athlete_invite", "release_athlete_invite"]);
  });

  it("session write fails after setup → /signin (device cookie already bound)", async () => {
    svc.rpc.claim_athlete_invite = claimOk();
    signInMock.mockResolvedValue({ error: { message: "boom", status: 500 } });
    await expect(claimAthleteInvite(null, form())).rejects.toThrow("__REDIRECT__:/signin");
    expect(setDeviceAthleteIdMock).toHaveBeenCalledWith(ATHLETE_ID);
  });
});
