import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: (p: Promise<unknown>) => void p.catch(() => {}) }));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: vi.fn(async () => {}) }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({}) }));

const strict = vi.hoisted(() => ({ on: false }));
vi.mock("@/lib/auth/apple/config", async (orig) => {
  const actual = await orig<typeof import("@/lib/auth/apple/config")>();
  return {
    ...actual,
    get APPLE_RESPONSE_NONCE_ALWAYS_REQUIRED() {
      return strict.on;
    },
  };
});

import { bindAppleGrant } from "@/lib/auth/apple/bind";
import { redeemAppleCode } from "@/lib/auth/apple/redeem";
import { __resetAppleJwksCacheForTests, verifyAppleIdToken } from "@/lib/auth/apple/verify";

import { goodClaims, idToken, installAppleFetch, okJson, setAppleEnv, sha256hex, SERVICES_ID, BUNDLE_ID } from "./helpers";

const RAW = "raw-nonce-value-0123456789";
const REFRESH = "r.refresh.token.value";

function setup(opts: {
  supplied?: Record<string, unknown>;
  response?: Record<string, unknown> | "redeem-fail" | "malformed";
  clientId?: string;
  signerOther?: boolean;
}) {
  const clientId = opts.clientId ?? SERVICES_ID;
  const supplied = idToken(goodClaims({ aud: clientId, nonce: sha256hex(RAW), ...opts.supplied }), {
    signer: opts.signerOther ? "other" : "apple",
  });
  const mock = installAppleFetch({
    redeem: () => {
      if (opts.response === "redeem-fail") return new Response("{}", { status: 400 });
      if (opts.response === "malformed") return okJson({ id_token: "x" });
      const claims = goodClaims({ aud: clientId, nonce: sha256hex(RAW), ...(opts.response ?? {}) });
      return okJson({ id_token: idToken(claims), refresh_token: REFRESH, access_token: "a" });
    },
  });
  return { supplied, mock, clientId };
}

beforeEach(() => {
  vi.unstubAllGlobals();
  __resetAppleJwksCacheForTests();
  setAppleEnv();
  strict.on = false;
});

describe("bindAppleGrant", () => {
  it("accepts a consistent supplied token + redeemed grant, redeeming with the same client_id", async () => {
    const { supplied, mock } = setup({});
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "code-1", rawNonce: RAW, clientId: SERVICES_ID, redirectUri: "https://x/auth/apple/callback" });
    expect(r).toMatchObject({ ok: true, sub: "001234.abcdef.5678", clientId: SERVICES_ID, refreshToken: REFRESH });
    expect(mock.redeemBodies[0]!.get("client_id")).toBe(SERVICES_ID);
    expect(mock.redeemBodies[0]!.get("grant_type")).toBe("authorization_code");
    expect(mock.redeemBodies[0]!.get("redirect_uri")).toBe("https://x/auth/apple/callback");
    expect(mock.revokeBodies).toHaveLength(0);
  });

  it("accepts an iOS bundle-id flow (aud = bundle id)", async () => {
    const { supplied } = setup({ clientId: BUNDLE_ID });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: BUNDLE_ID });
    expect(r.ok).toBe(true);
  });

  it("rejects a mismatched sub and revokes the redeemed token", async () => {
    const { supplied, mock } = setup({ response: { sub: "someone-else" } });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    expect(r).toMatchObject({ ok: false, reason: "sub_mismatch", revoked: true, hadRefreshToken: true });
    expect(mock.revokeBodies).toHaveLength(1);
    expect(mock.revokeBodies[0]!.get("token")).toBe(REFRESH);
    expect(mock.revokeBodies[0]!.get("client_id")).toBe(SERVICES_ID);
  });

  it("rejects when the response aud is not the redemption client_id", async () => {
    const { supplied, mock } = setup({ response: { aud: BUNDLE_ID } });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    // The response token is verified against the redemption client_id first.
    expect(r).toMatchObject({ ok: false, revoked: true });
    expect(mock.revokeBodies).toHaveLength(1);
  });

  it("rejects the supplied token when its aud is not the expected client (wrong client_id)", async () => {
    const { supplied, mock } = setup({ supplied: { aud: BUNDLE_ID } });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    expect(r).toMatchObject({ ok: false, reason: "supplied_token_invalid", hadRefreshToken: false });
    expect(mock.redeemBodies).toHaveLength(0); // never redeemed
  });

  it("rejects a supplied token carrying another transaction's nonce", async () => {
    const { supplied, mock } = setup({ supplied: { nonce: sha256hex("other-nonce") } });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    expect(r).toMatchObject({ ok: false, reason: "supplied_token_invalid" });
    expect(mock.redeemBodies).toHaveLength(0);
  });

  it("rejects a supplied token with no nonce at all", async () => {
    const supplied = idToken(goodClaims());
    installAppleFetch();
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    expect(r).toMatchObject({ ok: false, reason: "supplied_token_invalid" });
  });

  it("rejects a response nonce that does not match (and revokes)", async () => {
    const { supplied, mock } = setup({ response: { nonce: sha256hex("different") } });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    expect(r).toMatchObject({ ok: false, reason: "nonce_mismatch", revoked: true });
    expect(mock.revokeBodies).toHaveLength(1);
  });

  it("rejects an auth_time mismatch (both present) and revokes", async () => {
    const { supplied, mock } = setup({ supplied: { auth_time: 1000 }, response: { auth_time: 2000 } });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    expect(r).toMatchObject({ ok: false, reason: "auth_time_mismatch", revoked: true });
    expect(mock.revokeBodies).toHaveLength(1);
  });

  it("an expired supplied token is rejected before redemption", async () => {
    const { supplied, mock } = setup({ supplied: { exp: Math.floor(Date.now() / 1000) - 10 } });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    expect(r).toMatchObject({ ok: false, reason: "supplied_token_invalid" });
    expect(mock.redeemBodies).toHaveLength(0);
  });

  it("an expired response token is rejected and revoked", async () => {
    const { supplied, mock } = setup({ response: { exp: Math.floor(Date.now() / 1000) - 10 } });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    expect(r).toMatchObject({ ok: false, reason: "response_token_invalid", revoked: true });
    expect(mock.revokeBodies).toHaveLength(1);
  });

  it("rejects a token signed by another key / wrong issuer", async () => {
    const forged = setup({ signerOther: true });
    expect(
      await bindAppleGrant({ suppliedIdToken: forged.supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID }),
    ).toMatchObject({ ok: false, reason: "supplied_token_invalid" });

    const badIss = setup({ supplied: { iss: "https://evil.example" } });
    expect(
      await bindAppleGrant({ suppliedIdToken: badIss.supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID }),
    ).toMatchObject({ ok: false, reason: "supplied_token_invalid" });
  });

  it("fails closed on a redemption failure and on a malformed redemption response", async () => {
    const a = setup({ response: "redeem-fail" });
    expect(
      await bindAppleGrant({ suppliedIdToken: a.supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID }),
    ).toMatchObject({ ok: false, reason: "redeem_failed", hadRefreshToken: false });
    const b = setup({ response: "malformed" });
    expect(
      await bindAppleGrant({ suppliedIdToken: b.supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID }),
    ).toMatchObject({ ok: false, reason: "redeem_failed" });
  });

  it("reports revoked:false when the revoke itself fails", async () => {
    const { supplied, mock } = setup({ response: { sub: "other" } });
    mock.revoke = () => new Response("", { status: 500 });
    const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
    expect(r).toMatchObject({ ok: false, revoked: false, hadRefreshToken: true });
  });

  describe("nonce-in-response rule", () => {
    it("tolerates an ABSENT response nonce today (constant false)", async () => {
      const { supplied } = setup({ response: { nonce: undefined } });
      const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
      expect(r.ok).toBe(true);
    });

    it("rejects an absent response nonce once the strict constant is flipped", async () => {
      strict.on = true;
      const { supplied, mock } = setup({ response: { nonce: undefined } });
      const r = await bindAppleGrant({ suppliedIdToken: supplied, code: "c", rawNonce: RAW, clientId: SERVICES_ID });
      expect(r).toMatchObject({ ok: false, reason: "nonce_mismatch", revoked: true });
      expect(mock.revokeBodies).toHaveLength(1);
    });
  });
});

describe("redeemAppleCode", () => {
  it("sends a client_secret JWT for the client and returns the tokens", async () => {
    const mock = installAppleFetch({ redeem: () => okJson({ id_token: "i", refresh_token: "r" }) });
    const g = await redeemAppleCode({ code: "abc", clientId: BUNDLE_ID });
    expect(g).toEqual({ idToken: "i", refreshToken: "r" });
    const secret = mock.redeemBodies[0]!.get("client_secret")!;
    expect(JSON.parse(Buffer.from(secret.split(".")[1]!, "base64url").toString()).sub).toBe(BUNDLE_ID);
  });
});

describe("JWKS handling", () => {
  it("caches keys across verifications", async () => {
    const mock = installAppleFetch();
    const t = idToken(goodClaims());
    await verifyAppleIdToken(t, { audience: SERVICES_ID });
    await verifyAppleIdToken(t, { audience: SERVICES_ID });
    expect(mock.jwksCalls).toBe(1);
  });

  it("rejects non-RS256 algs and unknown kids", async () => {
    installAppleFetch();
    await expect(verifyAppleIdToken(idToken(goodClaims(), { alg: "none" }), { audience: SERVICES_ID })).rejects.toThrow("bad_alg");
    await expect(verifyAppleIdToken(idToken(goodClaims(), { kid: "nope" }), { audience: SERVICES_ID })).rejects.toThrow("unknown_kid");
  });
});
