/**
 * Unit tests for lib/subscriptions/google-play-auth.ts (FV-661). The real
 * `google-auth-library` is never loaded: it is replaced by a fake.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ctor = vi.fn();
let tokenResult: string | null | undefined = "FAKE_TOKEN";
let tokenThrows = false;

vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    constructor(opts: unknown) {
      ctor(opts);
    }
    async getAccessToken() {
      if (tokenThrows) throw new Error("CRED_LEAK_SENTINEL in library error");
      return tokenResult;
    }
  },
}));

import {
  ANDROID_PUBLISHER_SCOPE,
  PlayAuthError,
  getPlayAccessToken,
  resetPlayAuthCacheForTests,
} from "@/lib/subscriptions/google-play-auth";

const ENV = "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON";
const CREDS = JSON.stringify({ client_email: "svc@example.invalid", private_key: "PRIVATE_KEY_SENTINEL" });

beforeEach(() => {
  resetPlayAuthCacheForTests();
  ctor.mockClear();
  tokenResult = "FAKE_TOKEN";
  tokenThrows = false;
});
afterEach(() => {
  delete process.env[ENV];
});

describe("getPlayAccessToken", () => {
  it("builds GoogleAuth with the androidpublisher scope and the env credentials", async () => {
    process.env[ENV] = CREDS;
    await expect(getPlayAccessToken()).resolves.toBe("FAKE_TOKEN");
    expect(ctor).toHaveBeenCalledWith({
      credentials: JSON.parse(CREDS),
      scopes: [ANDROID_PUBLISHER_SCOPE],
    });
    expect(ANDROID_PUBLISHER_SCOPE).toBe("https://www.googleapis.com/auth/androidpublisher");
  });

  it("reuses the auth client between calls", async () => {
    process.env[ENV] = CREDS;
    await getPlayAccessToken();
    await getPlayAccessToken();
    expect(ctor).toHaveBeenCalledTimes(1);
  });

  it("fails with a static error when credentials are missing", async () => {
    await expect(getPlayAccessToken()).rejects.toBeInstanceOf(PlayAuthError);
    expect(ctor).not.toHaveBeenCalled();
  });

  it("does not echo credential text when the JSON is invalid", async () => {
    process.env[ENV] = "{PRIVATE_KEY_SENTINEL not json";
    const err = await getPlayAccessToken().catch((e: Error) => e);
    expect(err).toBeInstanceOf(PlayAuthError);
    expect((err as Error).message).not.toContain("PRIVATE_KEY_SENTINEL");
  });

  it("drops the library's own error text (static message only)", async () => {
    process.env[ENV] = CREDS;
    tokenThrows = true;
    const err = await getPlayAccessToken().catch((e: Error) => e);
    expect(err).toBeInstanceOf(PlayAuthError);
    expect((err as Error).message).not.toContain("CRED_LEAK_SENTINEL");
  });

  it("rejects an empty token", async () => {
    process.env[ENV] = CREDS;
    tokenResult = null;
    await expect(getPlayAccessToken()).rejects.toBeInstanceOf(PlayAuthError);
  });
});
