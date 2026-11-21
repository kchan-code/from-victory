/**
 * Keyless (workload identity federation) mode of lib/subscriptions/google-play-auth.ts
 * (FV-779). Neither `google-auth-library` nor `@vercel/oidc` is loaded: both
 * are replaced by fakes, and no network is touched.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const keyCtor = vi.fn();
const fromJSON = vi.fn();
const oidcCall = vi.fn();
let tokenResult: { token?: string | null } = { token: "FAKE_TOKEN" };
let oidcThrows = false;
let fromJSONReturnsNull = false;

vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    constructor(opts: unknown) {
      keyCtor(opts);
    }
    async getAccessToken() {
      return "KEY_TOKEN";
    }
  },
  ExternalAccountClient: {
    fromJSON(opts: { subject_token_supplier: { getSubjectToken: () => Promise<string> } }) {
      fromJSON(opts);
      if (fromJSONReturnsNull) return null;
      return {
        async getAccessToken() {
          // Exercise the supplier like the real client does during an exchange.
          await opts.subject_token_supplier.getSubjectToken();
          return tokenResult;
        },
      };
    },
  },
}));

vi.mock("@vercel/oidc", () => ({
  getVercelOidcToken: async (opts: unknown) => {
    oidcCall(opts);
    if (oidcThrows) throw new Error("OIDC_LEAK_SENTINEL projects/123 token");
    return "VERCEL_OIDC_TOKEN";
  },
}));

import {
  ANDROID_PUBLISHER_SCOPE,
  PlayAuthError,
  getPlayAccessToken,
  resetPlayAuthCacheForTests,
} from "@/lib/subscriptions/google-play-auth";

const PROVIDER = "projects/123456789012/locations/global/workloadIdentityPools/vercel-pool/providers/vercel-provider";
const EMAIL = "play-api@my-project-123.iam.gserviceaccount.com";
const KEYS = ["GOOGLE_PLAY_WIF_PROVIDER", "GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"];

beforeEach(() => {
  resetPlayAuthCacheForTests();
  for (const m of [keyCtor, fromJSON, oidcCall]) m.mockClear();
  tokenResult = { token: "FAKE_TOKEN" };
  oidcThrows = false;
  fromJSONReturnsNull = false;
});
afterEach(() => {
  for (const k of KEYS) delete process.env[k];
});

async function failure(): Promise<Error> {
  const err = await getPlayAccessToken().catch((e: Error) => e);
  expect(err).toBeInstanceOf(PlayAuthError);
  return err as Error;
}

describe("keyless Play auth", () => {
  it("is selected when both vars are set and passes the exact federation config", async () => {
    process.env.GOOGLE_PLAY_WIF_PROVIDER = PROVIDER;
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL = EMAIL;
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = JSON.stringify({ private_key: "PRIVATE_KEY_SENTINEL" });

    await expect(getPlayAccessToken()).resolves.toBe("FAKE_TOKEN");

    expect(keyCtor).not.toHaveBeenCalled();
    expect(fromJSON).toHaveBeenCalledTimes(1);
    expect(fromJSON).toHaveBeenCalledWith({
      type: "external_account",
      audience: `//iam.googleapis.com/${PROVIDER}`,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${EMAIL}:generateAccessToken`,
      subject_token_supplier: { getSubjectToken: expect.any(Function) },
      scopes: [ANDROID_PUBLISHER_SCOPE],
    });
    expect(oidcCall).toHaveBeenCalledWith({ audience: `https://iam.googleapis.com/${PROVIDER}` });
  });

  it("fetches the Vercel token per exchange, not at build time, and reuses the client", async () => {
    process.env.GOOGLE_PLAY_WIF_PROVIDER = PROVIDER;
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL = EMAIL;
    await getPlayAccessToken();
    await getPlayAccessToken();
    expect(fromJSON).toHaveBeenCalledTimes(1);
    expect(oidcCall).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["only the provider", { GOOGLE_PLAY_WIF_PROVIDER: PROVIDER }],
    ["only the email", { GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL: EMAIL }],
    ["an empty provider and a valid email", { GOOGLE_PLAY_WIF_PROVIDER: "", GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL: EMAIL }],
  ])("fails closed when keyless is half-configured (%s), even with the key JSON set", async (_n, env) => {
    Object.assign(process.env, env);
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = JSON.stringify({ private_key: "PRIVATE_KEY_SENTINEL" });
    const err = await failure();
    expect(err.message).not.toContain("PRIVATE_KEY_SENTINEL");
    expect(keyCtor).not.toHaveBeenCalled();
    expect(fromJSON).not.toHaveBeenCalled();
  });

  it.each([
    "projects/abc/locations/global/workloadIdentityPools/p-pool/providers/p-prov",
    "projects/123/locations/us/workloadIdentityPools/p-pool/providers/p-prov",
    `${PROVIDER}/extra`,
    `//iam.googleapis.com/${PROVIDER}`,
    `https://iam.googleapis.com/${PROVIDER}`,
    "not a provider",
  ])("rejects a malformed provider: %s", async (provider) => {
    process.env.GOOGLE_PLAY_WIF_PROVIDER = provider;
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL = EMAIL;
    const err = await failure();
    expect(err.message).not.toContain(provider);
    expect(fromJSON).not.toHaveBeenCalled();
  });

  it.each([
    "play-api@example.com",
    "play-api@my-project-123.iam.gserviceaccount.com.evil.com",
    "@my-project-123.iam.gserviceaccount.com",
    "a b@my-project-123.iam.gserviceaccount.com",
    "play-api@my-project-123.iam.gserviceaccount.com:generateAccessToken",
  ])("rejects a malformed service account email: %s", async (email) => {
    process.env.GOOGLE_PLAY_WIF_PROVIDER = PROVIDER;
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL = email;
    const err = await failure();
    expect(err.message).not.toContain(email);
    expect(fromJSON).not.toHaveBeenCalled();
  });

  it("leaks no token or provider detail when the Vercel token supplier fails", async () => {
    process.env.GOOGLE_PLAY_WIF_PROVIDER = PROVIDER;
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL = EMAIL;
    oidcThrows = true;
    const err = await failure();
    for (const secret of ["OIDC_LEAK_SENTINEL", "projects/123", "VERCEL_OIDC_TOKEN", PROVIDER, EMAIL]) {
      expect(err.message).not.toContain(secret);
    }
  });

  it("fails with a static error when the library returns no client", async () => {
    process.env.GOOGLE_PLAY_WIF_PROVIDER = PROVIDER;
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL = EMAIL;
    fromJSONReturnsNull = true;
    await failure();
  });

  it("rejects an empty access token", async () => {
    process.env.GOOGLE_PLAY_WIF_PROVIDER = PROVIDER;
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL = EMAIL;
    tokenResult = { token: null };
    await failure();
  });

  it("uses the key path when neither keyless var is set", async () => {
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "svc@example.invalid" });
    await expect(getPlayAccessToken()).resolves.toBe("KEY_TOKEN");
    expect(keyCtor).toHaveBeenCalledTimes(1);
    expect(fromJSON).not.toHaveBeenCalled();
  });
});
