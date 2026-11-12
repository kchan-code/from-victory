import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const notify = vi.hoisted(() => vi.fn(async (..._a: unknown[]) => {}));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: notify }));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: (p: Promise<unknown>) => void p.catch(() => {}) }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({}) }));

// ---------------------------------------------------------------------------
// In-memory model of the SQL functions in 20261112110000_fv673_apple_signin.sql
// (the real SQL is exercised by supabase/tests/rls/assertions/25_*.sql). The
// semantics mirrored here: fenced claim, stale-claim (>2 min) reclaim with a
// new claim_id, mismatch counting/burn at 5, fenced release, one-step finalize.
// ---------------------------------------------------------------------------
type Row = {
  id: string; state: "pending" | "claimed" | "burned"; challenge: string; clientId: string; sub: string;
  idTokenEnc: string; nonceEnc: string; refreshEnc: string; keyVersion: number; attempts: number;
  claimId: string | null; claimedAt: number | null; expiresAt: number; revokeAttempts: number;
};
const fake = vi.hoisted(() => ({
  rows: new Map<string, Row>(),
  tokens: [] as { userId: string; clientId: string; sub: string; ciphertext: string; iv: string; tag: string; keyVersion: number }[],
  now: 1_000_000_000_000,
  finalizeThrows: false,
}));

vi.mock("@/lib/auth/apple/store", async (orig) => {
  const actual = await orig<typeof import("@/lib/auth/apple/store")>();
  const crypto = await import("@/lib/auth/apple/token-crypto");
  return {
    ...actual,
    createHandoff: async (a: { id: string; challenge: string; clientId: string; sub: string; idToken: string; rawNonce: string; refreshToken: string; expiresAt: Date }) => {
      const aad = crypto.handoffAad(a.id);
      const [x, y, z] = [a.idToken, a.rawNonce, a.refreshToken].map((v) => crypto.encryptValue(v, aad));
      fake.rows.set(a.id, {
        id: a.id, state: "pending", challenge: a.challenge, clientId: a.clientId, sub: a.sub,
        idTokenEnc: crypto.packEncrypted(x!), nonceEnc: crypto.packEncrypted(y!), refreshEnc: crypto.packEncrypted(z!),
        keyVersion: x!.keyVersion, attempts: 0, claimId: null, claimedAt: null,
        expiresAt: a.expiresAt.getTime() - Date.now() + fake.now, revokeAttempts: 0,
      });
    },
    claimHandoffRow: async (id: string) => {
      const r = fake.rows.get(id);
      if (!r || r.expiresAt <= fake.now) return null;
      const stale = r.state === "claimed" && r.claimedAt! < fake.now - 120_000;
      if (r.state !== "pending" && !stale) return null;
      r.state = "claimed"; r.claimId = randomUUID(); r.claimedAt = fake.now;
      return { claimId: r.claimId, challenge: r.challenge, clientId: r.clientId, sub: r.sub, keyVersion: r.keyVersion, idTokenEnc: r.idTokenEnc, nonceEnc: r.nonceEnc, refreshEnc: r.refreshEnc };
    },
    recordVerifierMismatch: async (id: string, claimId: string) => {
      const r = fake.rows.get(id);
      if (!r || r.claimId !== claimId || r.state !== "claimed") return null;
      r.attempts += 1; r.state = r.attempts >= 5 ? "burned" : "pending"; r.claimId = null; r.claimedAt = null;
      return r.state;
    },
    releaseHandoff: async (id: string, claimId: string) => {
      const r = fake.rows.get(id);
      if (!r || r.claimId !== claimId || r.state !== "claimed") return false;
      r.state = "pending"; r.claimId = null; r.claimedAt = null;
      return true;
    },
    finalizeHandoff: async (a: { handoffId: string; claimId: string; userId: string; clientId: string; refreshToken: string }) => {
      if (fake.finalizeThrows) throw new Error("db down");
      const r = fake.rows.get(a.handoffId);
      if (!r || r.claimId !== a.claimId || r.state !== "claimed") return false;
      fake.rows.delete(a.handoffId);
      const enc = crypto.encryptValue(a.refreshToken, crypto.tokenAad(a.userId, r.clientId));
      fake.tokens = fake.tokens.filter((t) => !(t.userId === a.userId && t.clientId === r.clientId));
      fake.tokens.push({ userId: a.userId, clientId: r.clientId, sub: r.sub, ...enc });
      return true;
    },
    listPurgeCandidates: async () =>
      [...fake.rows.values()].filter((r) => r.expiresAt <= fake.now || r.state === "burned").map((r) => ({
        id: r.id, clientId: r.clientId, refreshEnc: r.refreshEnc, keyVersion: r.keyVersion, revokeAttempts: r.revokeAttempts,
      })),
    recordPurgeRevokeAttempt: async (id: string) => {
      const r = fake.rows.get(id);
      if (!r) return 0;
      return ++r.revokeAttempts;
    },
    deletePurgedHandoff: async (id: string) => {
      const r = fake.rows.get(id);
      if (!r || !(r.expiresAt <= fake.now || r.state === "burned")) return false;
      fake.rows.delete(id);
      return true;
    },
  };
});

import { challengeForVerifier, completeAppleHandoff, purgeAppleHandoffs, writeAppleHandoff } from "@/lib/auth/apple/handoff";
import { decryptValue, tokenAad } from "@/lib/auth/apple/token-crypto";

import { installAppleFetch, setAppleEnv, SERVICES_ID } from "./helpers";

const VERIFIER = "v".repeat(43);
const SUB = "001.sub.apple";
const USER = "11111111-1111-4111-8111-111111111111";
const REFRESH = "refresh-token-plaintext";

type AuthOpts = { signInError?: boolean; identitySub?: string; gate?: Promise<void> };
function makeSupabase(o: AuthOpts = {}) {
  const calls: string[] = [];
  return {
    calls,
    auth: {
      signInWithIdToken: vi.fn(async (_a: unknown) => {
        calls.push("signIn");
        if (o.gate) await o.gate;
        return o.signInError ? { data: {}, error: { message: "x" } } : { data: {}, error: null };
      }),
      getUser: vi.fn(async () => ({
        data: { user: { id: USER, identities: [{ provider: "apple", id: o.identitySub ?? SUB }] } },
        error: null,
      })),
      signOut: vi.fn(async () => {
        calls.push("signOut");
        return { error: null };
      }),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: "parent" }, error: null }) }) }) }),
  };
}

async function seed(over: Partial<Parameters<typeof writeAppleHandoff>[0]> = {}) {
  return writeAppleHandoff({
    challenge: challengeForVerifier(VERIFIER),
    oauthState: "state-1",
    clientId: SERVICES_ID,
    sub: SUB,
    idToken: "id.token.value",
    rawNonce: "raw-nonce",
    refreshToken: REFRESH,
    ...over,
  });
}

beforeEach(() => {
  setAppleEnv();
  fake.rows.clear();
  fake.tokens = [];
  fake.now = 1_000_000_000_000;
  fake.finalizeThrows = false;
  notify.mockClear();
  vi.unstubAllGlobals();
});

describe("write + complete (happy path)", () => {
  it("stores ciphertext only, then transfers the token with the token AAD", async () => {
    const id = await seed();
    const row = fake.rows.get(id)!;
    expect(`${row.idTokenEnc}${row.nonceEnc}${row.refreshEnc}`).not.toContain(REFRESH);
    expect(id.length).toBeGreaterThanOrEqual(43); // 256 bits base64url

    const sb = makeSupabase();
    const r = await completeAppleHandoff(sb as never, { handoff: id, verifier: VERIFIER });
    expect(r).toEqual({ ok: true, path: "/dashboard" });
    expect(fake.rows.has(id)).toBe(false);
    expect(fake.tokens).toHaveLength(1);
    expect(decryptValue(fake.tokens[0]!, tokenAad(USER, SERVICES_ID))).toBe(REFRESH);
    expect(sb.calls).toEqual(["signIn"]);
  });

  it("replay after finalize is rejected without a second sign-in", async () => {
    const id = await seed();
    await completeAppleHandoff(makeSupabase() as never, { handoff: id, verifier: VERIFIER });
    const sb2 = makeSupabase();
    expect(await completeAppleHandoff(sb2 as never, { handoff: id, verifier: VERIFIER })).toEqual({ ok: false, error: "invalid" });
    expect(sb2.auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it("an expired handoff is rejected", async () => {
    const id = await seed();
    fake.now += 3 * 60 * 1000 + 1;
    expect(await completeAppleHandoff(makeSupabase() as never, { handoff: id, verifier: VERIFIER })).toEqual({ ok: false, error: "invalid" });
  });

  it("an unknown handoff id is rejected", async () => {
    expect(await completeAppleHandoff(makeSupabase() as never, { handoff: "nope".repeat(8), verifier: VERIFIER })).toEqual({ ok: false, error: "invalid" });
  });
});

describe("verifier mismatch", () => {
  it("increments attempts, keeps credentials, burns at 5, and a correct verifier then fails", async () => {
    const id = await seed();
    for (let i = 1; i <= 4; i++) {
      const sb = makeSupabase();
      expect(await completeAppleHandoff(sb as never, { handoff: id, verifier: "w".repeat(43) })).toEqual({ ok: false, error: "invalid" });
      const row = fake.rows.get(id)!;
      expect(row.attempts).toBe(i);
      expect(row.state).toBe("pending");
      expect(row.refreshEnc).toBeTruthy();
      expect(sb.auth.signInWithIdToken).not.toHaveBeenCalled(); // never signs in on a bad verifier
    }
    await completeAppleHandoff(makeSupabase() as never, { handoff: id, verifier: "w".repeat(43) });
    expect(fake.rows.get(id)!.state).toBe("burned");
    expect(await completeAppleHandoff(makeSupabase() as never, { handoff: id, verifier: VERIFIER })).toEqual({ ok: false, error: "invalid" });
    expect(fake.tokens).toHaveLength(0);
  });

  it("transient failures do NOT count toward attempts", async () => {
    const id = await seed();
    for (let i = 0; i < 6; i++) {
      const r = await completeAppleHandoff(makeSupabase({ signInError: true }) as never, { handoff: id, verifier: VERIFIER });
      expect(r).toEqual({ ok: false, error: "unavailable" });
    }
    const row = fake.rows.get(id)!;
    expect(row.attempts).toBe(0);
    expect(row.state).toBe("pending");
    // and the same verifier still works afterwards
    expect((await completeAppleHandoff(makeSupabase() as never, { handoff: id, verifier: VERIFIER })).ok).toBe(true);
  });
});

describe("failure handling", () => {
  it("signInWithIdToken failure: signed out, row reset to pending, credentials kept", async () => {
    const id = await seed();
    const sb = makeSupabase({ signInError: true });
    expect(await completeAppleHandoff(sb as never, { handoff: id, verifier: VERIFIER })).toEqual({ ok: false, error: "unavailable" });
    expect(sb.calls).toContain("signOut");
    expect(fake.rows.get(id)).toMatchObject({ state: "pending", claimId: null });
    expect(fake.tokens).toHaveLength(0);
  });

  it("identity provider_id != sub: signed out and reset", async () => {
    const id = await seed();
    const sb = makeSupabase({ identitySub: "another-sub" });
    expect(await completeAppleHandoff(sb as never, { handoff: id, verifier: VERIFIER })).toEqual({ ok: false, error: "unavailable" });
    expect(sb.calls).toContain("signOut");
    expect(fake.tokens).toHaveLength(0);
    expect(fake.rows.get(id)!.state).toBe("pending");
  });

  it("finalize storage error: signed out, token not lost (row reset to pending)", async () => {
    const id = await seed();
    fake.finalizeThrows = true;
    const sb = makeSupabase();
    expect(await completeAppleHandoff(sb as never, { handoff: id, verifier: VERIFIER })).toEqual({ ok: false, error: "unavailable" });
    expect(sb.calls).toEqual(["signIn", "signOut"]);
    expect(fake.rows.get(id)).toMatchObject({ state: "pending", claimId: null });
    expect(fake.tokens).toHaveLength(0);
    // retry with the same verifier succeeds
    fake.finalizeThrows = false;
    expect((await completeAppleHandoff(makeSupabase() as never, { handoff: id, verifier: VERIFIER })).ok).toBe(true);
    expect(fake.tokens).toHaveLength(1);
  });

  it("stale-claim fence: the slow original request signs out; the second claim wins; exactly one token row", async () => {
    const id = await seed();
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));

    const slow = makeSupabase({ gate });
    const slowP = completeAppleHandoff(slow as never, { handoff: id, verifier: VERIFIER });
    await vi.waitFor(() => expect(slow.auth.signInWithIdToken).toHaveBeenCalled());

    fake.now += 121_000; // original claim is now "interrupted"
    const second = makeSupabase();
    expect((await completeAppleHandoff(second as never, { handoff: id, verifier: VERIFIER })).ok).toBe(true);

    release();
    expect(await slowP).toEqual({ ok: false, error: "unavailable" });
    expect(slow.calls).toContain("signOut"); // fence failed -> no session without a stored credential
    expect(fake.tokens).toHaveLength(1);
  });

  it("purge during an in-flight request: finalize aborts and the session is signed out", async () => {
    installAppleFetch();
    const id = await seed();
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));
    const sb = makeSupabase({ gate });
    const p = completeAppleHandoff(sb as never, { handoff: id, verifier: VERIFIER });
    await vi.waitFor(() => expect(sb.auth.signInWithIdToken).toHaveBeenCalled());

    fake.now += 3 * 60 * 1000 + 1; // expires mid-flight
    const summary = await purgeAppleHandoffs();
    expect(summary.purged).toBe(1); // revoked first, then deleted

    release();
    expect(await p).toEqual({ ok: false, error: "unavailable" });
    expect(sb.calls).toContain("signOut");
    expect(fake.tokens).toHaveLength(0);
  });
});

describe("purge", () => {
  it("revokes (with the row's own client_id) BEFORE deleting expired and burned rows", async () => {
    const mock = installAppleFetch();
    const expired = await seed();
    const burnedId = await seed({ clientId: "com.fromvictoryapp.app" });
    fake.rows.get(burnedId)!.state = "burned";
    const live = await seed();
    fake.rows.get(expired)!.expiresAt = fake.now - 1;

    const s = await purgeAppleHandoffs();
    expect(s.purged).toBe(2);
    expect(fake.rows.has(expired)).toBe(false);
    expect(fake.rows.has(burnedId)).toBe(false);
    expect(fake.rows.has(live)).toBe(true);
    expect(mock.revokeBodies.map((b) => b.get("client_id")).sort()).toEqual([SERVICES_ID, "com.fromvictoryapp.app"].sort());
    expect(mock.revokeBodies.every((b) => b.get("token") === REFRESH)).toBe(true);
  });

  it("keeps the row when revoke fails; after 5 failed runs deletes it and alerts (row id prefix only)", async () => {
    installAppleFetch({ revoke: () => new Response("", { status: 500 }) });
    const id = await seed();
    fake.rows.get(id)!.expiresAt = fake.now - 1;

    for (let i = 1; i <= 4; i++) {
      expect((await purgeAppleHandoffs()).kept).toBe(1);
      expect(fake.rows.has(id)).toBe(true);
    }
    expect((await purgeAppleHandoffs()).forced).toBe(1);
    expect(fake.rows.has(id)).toBe(false);
    await vi.waitFor(() => expect(notify).toHaveBeenCalledTimes(1));
    const ctx = JSON.stringify(notify.mock.calls[0]);
    expect(ctx).not.toContain(REFRESH);
    expect(ctx).not.toContain(SUB);
    expect(ctx).not.toContain(id); // only an 8-char prefix
  });
});
