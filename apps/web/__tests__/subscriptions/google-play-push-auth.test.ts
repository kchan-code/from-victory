/**
 * Unit tests for `verifyPubSubPush` (lib/subscriptions/google-play-auth.ts,
 * FV-662). The real `google-auth-library` is never loaded: the verifier is
 * injected, and the default (lazy) verifier is exercised against a fake
 * library.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const verifyCalls: Array<{ idToken: string; audience: string }> = [];
let libraryThrows = false;
let libraryPayload: Record<string, unknown> | undefined;
let certsThrow = false;
let certCalls = 0;
let constructorThrows = false;

vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    constructor() {
      if (constructorThrows) throw new Error("JWT_LEAK_SENTINEL constructor");
    }
    async getFederatedSignonCertsAsync() {
      certCalls += 1;
      if (certsThrow) throw new Error("JWT_LEAK_SENTINEL certs");
      return {};
    }
    async verifyIdToken(opts: { idToken: string; audience: string }) {
      verifyCalls.push(opts);
      if (libraryThrows) throw new Error("JWT_LEAK_SENTINEL in library error");
      return { getPayload: () => libraryPayload };
    }
  },
}));

import {
  PushVerifierUnavailableError,
  resetPlayAuthCacheForTests,
  verifyPubSubPush as verifyPubSubPushRaw,
  type PushAuthDeps,
  type VerifyGoogleIdToken,
} from "@/lib/subscriptions/google-play-auth";

const AUD = "https://fromvictoryapp.example/api/webhooks/google-play";
const SA = "push@project.iam.gserviceaccount.example";

// Every returned result is collected and leak-checked in afterEach.
const outputs: string[] = [];
async function verifyPubSubPush(authorization: string | null, d: PushAuthDeps = {}) {
  const r = await verifyPubSubPushRaw(authorization, d);
  outputs.push(JSON.stringify(r));
  return r;
}
const GOOD_CLAIMS = { iss: "https://accounts.google.com", email: SA, email_verified: true };

const deps = (verifyIdToken: VerifyGoogleIdToken) => ({ verifyIdToken, audience: AUD, serviceAccount: SA });

beforeEach(() => {
  resetPlayAuthCacheForTests();
  verifyCalls.length = 0;
  libraryThrows = false;
  libraryPayload = { ...GOOD_CLAIMS };
  certsThrow = false;
  certCalls = 0;
  constructorThrows = false;
  outputs.length = 0;
});
afterEach(() => {
  const haystack = outputs.join("\n");
  for (const secret of [SA, "JWT_LEAK_SENTINEL", "JWT_OK", "J_ENV"]) {
    expect(haystack, `leaked ${secret}`).not.toContain(secret);
  }
  delete process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE;
  delete process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT;
});

describe("verifyPubSubPush", () => {
  it("accepts a valid Google token for the configured audience and service account", async () => {
    const seen: Array<[string, string]> = [];
    const result = await verifyPubSubPush(
      "Bearer JWT_OK",
      deps(async (t, a) => {
        seen.push([t, a]);
        return { ...GOOD_CLAIMS };
      }),
    );
    expect(result).toEqual({ ok: true });
    expect(seen).toEqual([["JWT_OK", AUD]]);
  });

  it("accepts the bare-host issuer form and a case-different email", async () => {
    const r = await verifyPubSubPush(
      "bearer JWT_OK",
      deps(async () => ({ iss: "accounts.google.com", email: SA.toUpperCase(), email_verified: true })),
    );
    expect(r).toEqual({ ok: true });
  });

  for (const header of [null, "", "Bearer", "Bearer ", "Basic abc", "Bearer a b", "JWT_OK"]) {
    it(`rejects a missing or malformed Authorization header (${JSON.stringify(header)}) without verifying`, async () => {
      const verify = vi.fn();
      expect(await verifyPubSubPush(header, deps(verify))).toEqual({
        ok: false,
        status: 401,
        reason: "missing_token",
      });
      expect(verify).not.toHaveBeenCalled();
    });
  }

  it("rejects an oversize token without verifying", async () => {
    const verify = vi.fn();
    const r = await verifyPubSubPush(`Bearer ${"a".repeat(9000)}`, deps(verify));
    expect(r).toMatchObject({ ok: false, status: 401 });
    expect(verify).not.toHaveBeenCalled();
  });

  it("rejects a bad signature / wrong audience / expired token (verifier throws): 401", async () => {
    const r = await verifyPubSubPush(
      "Bearer JWT_BAD",
      deps(async () => {
        throw new Error("JWT_LEAK_SENTINEL");
      }),
    );
    expect(r).toEqual({ ok: false, status: 401, reason: "invalid_token" });
    expect(JSON.stringify(r)).not.toContain("JWT_LEAK_SENTINEL");
  });

  it("rejects an empty claim set", async () => {
    expect(await verifyPubSubPush("Bearer J", deps(async () => undefined))).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects a token not issued by Google", async () => {
    const r = await verifyPubSubPush("Bearer J", deps(async () => ({ ...GOOD_CLAIMS, iss: "https://evil.example" })));
    expect(r).toEqual({ ok: false, status: 401, reason: "wrong_issuer" });
    const none = await verifyPubSubPush("Bearer J", deps(async () => ({ email: SA, email_verified: true })));
    expect(none).toMatchObject({ ok: false, reason: "wrong_issuer" });
  });

  it("rejects a valid Google token for a different service account: 403", async () => {
    const r = await verifyPubSubPush(
      "Bearer J",
      deps(async () => ({ ...GOOD_CLAIMS, email: "someone-else@project.iam.gserviceaccount.example" })),
    );
    expect(r).toEqual({ ok: false, status: 403, reason: "wrong_identity" });
    expect(await verifyPubSubPush("Bearer J", deps(async () => ({ iss: GOOD_CLAIMS.iss, email_verified: true })))).toMatchObject({
      reason: "wrong_identity",
    });
  });

  it("rejects an unverified email, including the string form: 403", async () => {
    for (const v of [false, undefined, "true", 1]) {
      const r = await verifyPubSubPush("Bearer J", deps(async () => ({ ...GOOD_CLAIMS, email_verified: v })));
      expect(r).toEqual({ ok: false, status: 403, reason: "email_unverified" });
    }
  });

  it("fails closed when config is missing: no verification attempted", async () => {
    const verify = vi.fn(async () => ({ ...GOOD_CLAIMS }));
    for (const partial of [
      { verifyIdToken: verify },
      { verifyIdToken: verify, audience: AUD },
      { verifyIdToken: verify, serviceAccount: SA },
      { verifyIdToken: verify, audience: "", serviceAccount: SA },
    ]) {
      expect(await verifyPubSubPush("Bearer J", partial)).toEqual({
        ok: false,
        status: 403,
        reason: "not_configured",
      });
    }
    expect(verify).not.toHaveBeenCalled();
  });

  it("reads config from the environment by default", async () => {
    process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE = AUD;
    process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT = SA;
    expect(await verifyPubSubPush("Bearer J_ENV")).toEqual({ ok: true });
    expect(verifyCalls).toEqual([{ idToken: "J_ENV", audience: AUD }]);
  });

  it("the default verifier maps a library failure to a static 401 (no library message)", async () => {
    process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE = AUD;
    process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT = SA;
    libraryThrows = true;
    const r = await verifyPubSubPush("Bearer J_ENV");
    expect(r).toEqual({ ok: false, status: 401, reason: "invalid_token" });
    expect(JSON.stringify(r)).not.toContain("JWT_LEAK_SENTINEL");
  });

  it("an injected verifier that throws the tagged error maps to 503 verifier_unavailable", async () => {
    const r = await verifyPubSubPush(
      "Bearer J",
      deps(async () => {
        throw new PushVerifierUnavailableError();
      }),
    );
    expect(r).toEqual({ ok: false, status: 503, reason: "verifier_unavailable" });
  });

  it("an untagged throw is still an invalid token (401), not an outage", async () => {
    const r = await verifyPubSubPush("Bearer J", deps(async () => Promise.reject(new Error("nope"))));
    expect(r).toMatchObject({ status: 401, reason: "invalid_token" });
  });

  it("the default verifier maps a signing-certificate fetch failure to 503 and never verifies", async () => {
    process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE = AUD;
    process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT = SA;
    certsThrow = true;
    const r = await verifyPubSubPush("Bearer J_ENV");
    expect(r).toEqual({ ok: false, status: 503, reason: "verifier_unavailable" });
    expect(verifyCalls).toEqual([]);
  });

  it("the default verifier maps a client construction failure to 503", async () => {
    process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE = AUD;
    process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT = SA;
    constructorThrows = true;
    expect(await verifyPubSubPush("Bearer J_ENV")).toMatchObject({ status: 503, reason: "verifier_unavailable" });
  });

  it("the default verifier recovers once certificates are available again", async () => {
    process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE = AUD;
    process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT = SA;
    certsThrow = true;
    await verifyPubSubPush("Bearer J_ENV");
    certsThrow = false;
    expect(await verifyPubSubPush("Bearer J_ENV")).toEqual({ ok: true });
    expect(certCalls).toBe(2);
  });

  for (const [name, d] of [
    ["audience", { audience: "   ", serviceAccount: SA }],
    ["service account", { audience: AUD, serviceAccount: "\t " }],
  ] as const) {
    it(`a whitespace-only ${name} is treated as unset (403, no verification)`, async () => {
      const verify = vi.fn(async () => ({ ...GOOD_CLAIMS }));
      expect(await verifyPubSubPush("Bearer J", { ...d, verifyIdToken: verify })).toEqual({
        ok: false,
        status: 403,
        reason: "not_configured",
      });
      expect(verify).not.toHaveBeenCalled();
    });
  }

  it("config values are trimmed before use", async () => {
    const seen: string[] = [];
    const r = await verifyPubSubPush("Bearer J", {
      audience: `  ${AUD} `,
      serviceAccount: ` ${SA} `,
      verifyIdToken: async (_t, a) => {
        seen.push(a);
        return { ...GOOD_CLAIMS };
      },
    });
    expect(r).toEqual({ ok: true });
    expect(seen).toEqual([AUD]);
  });
});
