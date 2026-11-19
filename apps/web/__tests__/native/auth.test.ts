/**
 * @vitest-environment jsdom
 *
 * Unit tests for lib/native/auth.ts (FV-675) — the TS bridge wrapper around
 * the injected `window.Capacitor.Plugins.FVAuth` native plugin. jsdom has no
 * Capacitor runtime, so each test injects (or omits) a fake global.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isNativeAuthBridgeAvailable,
  signInWithApple,
  startSession,
} from "@/lib/native/auth";

type FakeWindow = typeof window & {
  Capacitor?: { Plugins?: { FVAuth?: Record<string, unknown> } };
};

function installBridge(plugin: Record<string, unknown>): void {
  (window as FakeWindow).Capacitor = { Plugins: { FVAuth: plugin } };
}

const START_URL =
  "https://xmznvajmljhfmexjthlz.supabase.co/auth/v1/authorize?provider=google&redirect_to=com.fromvictoryapp.app%3A%2F%2Fauth%2Fcallback";
const CALLBACK = "com.fromvictoryapp.app://auth/callback?code=test-code-123";
const NONCE_HASH = "a".repeat(64);

afterEach(() => {
  delete (window as FakeWindow).Capacitor;
  vi.restoreAllMocks();
});

describe("isNativeAuthBridgeAvailable", () => {
  it("is false without window.Capacitor", () => {
    expect(isNativeAuthBridgeAvailable()).toBe(false);
  });

  it("is false when Capacitor is present but FVAuth is not (older build)", () => {
    (window as FakeWindow).Capacitor = { Plugins: {} };
    expect(isNativeAuthBridgeAvailable()).toBe(false);
  });

  it("is true when the plugin is present", () => {
    installBridge({});
    expect(isNativeAuthBridgeAvailable()).toBe(true);
  });
});

describe("startSession", () => {
  it("returns bridge_unavailable without the plugin", async () => {
    expect(await startSession(START_URL)).toEqual({ ok: false, error: "bridge_unavailable" });
  });

  it("passes only the url to native and returns the callback URL", async () => {
    const native = vi.fn(async () => ({ ok: true, url: CALLBACK }));
    installBridge({ startSession: native });
    expect(await startSession(START_URL)).toEqual({ ok: true, url: CALLBACK });
    expect(native).toHaveBeenCalledWith({ url: START_URL });
  });

  it("accepts a bare callback and one with a fragment", async () => {
    installBridge({ startSession: vi.fn(async () => ({ ok: true, url: "com.fromvictoryapp.app://auth/callback" })) });
    expect(await startSession(START_URL)).toMatchObject({ ok: true });
    installBridge({ startSession: vi.fn(async () => ({ ok: true, url: "com.fromvictoryapp.app://auth/callback#x" })) });
    expect(await startSession(START_URL)).toMatchObject({ ok: true });
  });

  it.each([
    ["a different scheme", "evil.app://auth/callback?code=x"],
    ["a different path", "com.fromvictoryapp.app://auth/callbackx?code=x"],
    ["an https URL", "https://www.fromvictoryapp.com/auth/callback?code=x"],
    ["a non-string", 42],
    ["a missing url", undefined],
  ])("rejects %s from native as invalid_response", async (_label, url) => {
    installBridge({ startSession: vi.fn(async () => ({ ok: true, url })) });
    expect(await startSession(START_URL)).toEqual({
      ok: false,
      error: "error",
      reason: "invalid_response",
    });
  });

  it("maps a native cancel to a typed cancelled result, not an exception", async () => {
    installBridge({ startSession: vi.fn(async () => ({ ok: false, error: "cancelled" })) });
    expect(await startSession(START_URL)).toEqual({ ok: false, error: "cancelled" });
  });

  it.each(["busy", "rejected_url"] as const)("maps native %s to error with that reason", async (code) => {
    installBridge({ startSession: vi.fn(async () => ({ ok: false, error: code })) });
    expect(await startSession(START_URL)).toEqual({ ok: false, error: "error", reason: code });
  });

  it("fails closed on an unknown native error string", async () => {
    installBridge({ startSession: vi.fn(async () => ({ ok: false, error: "weird" })) });
    expect(await startSession(START_URL)).toEqual({ ok: false, error: "error", reason: "failed" });
  });

  it("never throws when the native call rejects, and never logs the error message", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    installBridge({
      startSession: vi.fn(async () => {
        throw new Error(`leaked ${CALLBACK}`);
      }),
    });
    await expect(startSession(START_URL)).resolves.toEqual({
      ok: false,
      error: "error",
      reason: "failed",
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).not.toContain("code=");
  });

  it("maps Capacitor UNIMPLEMENTED to unsupported", async () => {
    installBridge({
      startSession: vi.fn(async () => {
        throw Object.assign(new Error("not implemented"), { code: "UNIMPLEMENTED" });
      }),
    });
    expect(await startSession(START_URL)).toEqual({ ok: false, error: "unsupported" });
  });

  it("returns unsupported when the plugin lacks the method", async () => {
    installBridge({});
    expect(await startSession(START_URL)).toEqual({ ok: false, error: "unsupported" });
  });
});

describe("signInWithApple", () => {
  it("returns bridge_unavailable without the plugin", async () => {
    expect(await signInWithApple(NONCE_HASH)).toEqual({ ok: false, error: "bridge_unavailable" });
  });

  it("passes only the nonce hash to native and returns token + code", async () => {
    const native = vi.fn(async () => ({
      ok: true,
      identityToken: "header.payload.sig",
      authorizationCode: "c123",
    }));
    installBridge({ signInWithApple: native });
    expect(await signInWithApple(NONCE_HASH)).toEqual({
      ok: true,
      identityToken: "header.payload.sig",
      authorizationCode: "c123",
    });
    expect(native).toHaveBeenCalledWith({ nonceHash: NONCE_HASH });
  });

  it.each([
    ["empty", ""],
    ["too short", "a".repeat(63)],
    ["too long", "a".repeat(65)],
    ["not hex", "g".repeat(64)],
    ["a raw nonce", "raw-nonce-that-should-never-cross-the-bridge"],
  ])("refuses a %s nonce hash without calling native", async (_label, value) => {
    const native = vi.fn();
    installBridge({ signInWithApple: native });
    expect(await signInWithApple(value)).toEqual({
      ok: false,
      error: "error",
      reason: "invalid_nonce",
    });
    expect(native).not.toHaveBeenCalled();
  });

  it("maps Android's unsupported result", async () => {
    installBridge({ signInWithApple: vi.fn(async () => ({ ok: false, error: "unsupported" })) });
    expect(await signInWithApple(NONCE_HASH)).toEqual({ ok: false, error: "unsupported" });
  });

  it("maps a native cancel to cancelled", async () => {
    installBridge({ signInWithApple: vi.fn(async () => ({ ok: false, error: "cancelled" })) });
    expect(await signInWithApple(NONCE_HASH)).toEqual({ ok: false, error: "cancelled" });
  });

  it("maps busy to error with that reason", async () => {
    installBridge({ signInWithApple: vi.fn(async () => ({ ok: false, error: "busy" })) });
    expect(await signInWithApple(NONCE_HASH)).toEqual({ ok: false, error: "error", reason: "busy" });
  });

  it("treats a success missing the code or token as invalid_response", async () => {
    installBridge({ signInWithApple: vi.fn(async () => ({ ok: true, identityToken: "t" })) });
    expect(await signInWithApple(NONCE_HASH)).toEqual({
      ok: false,
      error: "error",
      reason: "invalid_response",
    });
    installBridge({
      signInWithApple: vi.fn(async () => ({ ok: true, identityToken: "", authorizationCode: "c" })),
    });
    expect(await signInWithApple(NONCE_HASH)).toMatchObject({ reason: "invalid_response" });
  });

  it("never throws when the native call rejects", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installBridge({
      signInWithApple: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    await expect(signInWithApple(NONCE_HASH)).resolves.toEqual({
      ok: false,
      error: "error",
      reason: "failed",
    });
  });

  it("returns unsupported when an older plugin lacks the method", async () => {
    installBridge({ startSession: vi.fn() });
    expect(await signInWithApple(NONCE_HASH)).toEqual({ ok: false, error: "unsupported" });
  });
});
