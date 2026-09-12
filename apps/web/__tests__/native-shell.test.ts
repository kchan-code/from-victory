/**
 * Unit tests for lib/native-shell.ts — the Google Play "no in-app purchase"
 * compliance detector.
 *
 * Mocking strategy mirrors __tests__/rate-limit/actions.test.ts: server-only
 * is a no-op, and next/headers is stubbed with a mutable in-memory header
 * map so each test controls the inbound User-Agent.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

let headerMap: Record<string, string | null> = {};
vi.mock("next/headers", () => ({
  headers: () => ({
    get: (key: string) => headerMap[key] ?? null,
  }),
}));

import {
  getShellCapability,
  isNativeShell,
  isNativeShellUserAgent,
} from "@/lib/native-shell";

describe("isNativeShell", () => {
  afterEach(() => {
    headerMap = {};
  });

  it("returns true when the User-Agent carries the native shell token", () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 FVNativeShell/1";
    expect(isNativeShell()).toBe(true);
  });

  it("returns false for an ordinary mobile browser User-Agent", () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    expect(isNativeShell()).toBe(false);
  });

  it("returns false when the User-Agent header is missing entirely", () => {
    // headerMap has no "user-agent" key at all.
    expect(isNativeShell()).toBe(false);
  });

  it("returns false for an empty User-Agent header", () => {
    headerMap["user-agent"] = "";
    expect(isNativeShell()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isNativeShellUserAgent — the pure, header()-free equivalent used by
// Edge Middleware (see native-shell-router.ts / middleware.ts), which reads
// the User-Agent header directly off NextRequest instead of next/headers().
// ---------------------------------------------------------------------------

describe("isNativeShellUserAgent", () => {
  it("returns true when the User-Agent string carries the native shell token", () => {
    expect(
      isNativeShellUserAgent(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 FVNativeShell/1",
      ),
    ).toBe(true);
  });

  it("returns false for an ordinary browser User-Agent string", () => {
    expect(
      isNativeShellUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
      ),
    ).toBe(false);
  });

  it("returns false for null, undefined, and empty string", () => {
    expect(isNativeShellUserAgent(null)).toBe(false);
    expect(isNativeShellUserAgent(undefined)).toBe(false);
    expect(isNativeShellUserAgent("")).toBe(false);
  });

  it("stays in lockstep with isNativeShell() for the same header value", () => {
    headerMap["user-agent"] = "some-browser FVNativeShell/1 extra-token";
    expect(isNativeShellUserAgent(headerMap["user-agent"])).toBe(
      isNativeShell(),
    );
  });
});

// ---------------------------------------------------------------------------
// getShellCapability — FV-572 legacy-safe iOS/Android classification
// (FV-210 decision record §4.8). See lib/native-shell.ts for the full
// contract: the "(ios)" marker is checked BEFORE the bare token, the bare
// token alone classifies as `legacy-native` on BOTH platforms (never read as
// "Android"), and this signal is presentation-only, never authorization.
// ---------------------------------------------------------------------------

describe("getShellCapability", () => {
  it("classifies a UA carrying the iOS capability marker as ios-iap", () => {
    expect(
      getShellCapability(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 FVNativeShell/1 (ios)",
      ),
    ).toBe("ios-iap");
  });

  it("classifies a bare-token Android UA as legacy-native", () => {
    expect(
      getShellCapability(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 FVNativeShell/1",
      ),
    ).toBe("legacy-native");
  });

  it("classifies a bare-token legacy (pre-IAP) iOS UA as legacy-native — never 'Android'", () => {
    expect(
      getShellCapability(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 FVNativeShell/1",
      ),
    ).toBe("legacy-native");
  });

  it("classifies an ordinary Safari UA (no token) as null", () => {
    expect(
      getShellCapability(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(null);
  });

  it("classifies an ordinary Chrome UA (no token) as null", () => {
    expect(
      getShellCapability(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe(null);
  });

  it("classifies null, undefined, and empty string as null", () => {
    expect(getShellCapability(null)).toBe(null);
    expect(getShellCapability(undefined)).toBe(null);
    expect(getShellCapability("")).toBe(null);
  });

  it("is an exact, case-sensitive substring match — does not invent case-insensitivity", () => {
    // Matches how the bare-token detector has always compared (String.includes,
    // exact-case) — a differently-cased token must NOT match either branch.
    expect(getShellCapability("fvnativeshell/1")).toBe(null);
    expect(getShellCapability("FVNATIVESHELL/1 (IOS)")).toBe(null);
  });

  it("checks the (ios) marker BEFORE the bare token, so an ios-iap UA is never misclassified as legacy-native", () => {
    // The marker string contains the bare token as a substring, so a
    // bare-token-first implementation would wrongly return legacy-native here.
    expect(getShellCapability("FVNativeShell/1 (ios)")).toBe("ios-iap");
  });
});

describe("getShellCapability — byte-identity pin (FV-572)", () => {
  /**
   * Pins the ANDROID-EFFECTIVE UA token — the global, un-overridden
   * `appendUserAgent` in apps/native/capacitor.config.ts — to the exact
   * literal string classified as `legacy-native` here. Android's shell token
   * must stay byte-identical forever (FV-478/489/492/493); this test fails
   * loudly if a future edit ever drifts it, in either file.
   */
  it("the global (Android-effective) shell token is the exact string 'FVNativeShell/1' and classifies as legacy-native", () => {
    const configSource = readFileSync(
      resolve(__dirname, "../../native/capacitor.config.ts"),
      "utf8",
    );
    const globalTokenMatch = configSource.match(
      /^\s*appendUserAgent\s*:\s*"([^"]*)"/m,
    );
    expect(
      globalTokenMatch,
      "capacitor.config.ts should declare a top-level appendUserAgent key",
    ).not.toBeNull();
    const globalToken = globalTokenMatch?.[1];
    expect(globalToken).toBe("FVNativeShell/1");
    expect(
      getShellCapability(`Mozilla/5.0 (Linux; Android 14) ${globalToken}`),
    ).toBe("legacy-native");
  });
});
