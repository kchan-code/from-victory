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
  getRequestShellCapability,
  getShellCapability,
  hasAuthCapability,
  isNativeShell,
  isNativeShellUserAgent,
} from "@/lib/native-shell";

describe("isNativeShell", () => {
  afterEach(() => {
    headerMap = {};
  });

  it("returns true when the User-Agent carries the native shell token", async () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 FVNativeShell/1";
    expect(await isNativeShell()).toBe(true);
  });

  it("returns false for an ordinary mobile browser User-Agent", async () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    expect(await isNativeShell()).toBe(false);
  });

  it("returns false when the User-Agent header is missing entirely", async () => {
    // headerMap has no "user-agent" key at all.
    expect(await isNativeShell()).toBe(false);
  });

  it("returns false for an empty User-Agent header", async () => {
    headerMap["user-agent"] = "";
    expect(await isNativeShell()).toBe(false);
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

  it("returns true when the User-Agent carries the iOS-marked token (FV-572)", () => {
    // Pins the boolean at the call site Edge Middleware actually uses: an
    // ios-iap classification must still count as "native shell". A future
    // getShellCapability edit that special-cased the (ios) marker out of the
    // boolean would fail here, not just in the classifier's own tests.
    expect(
      isNativeShellUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 FVNativeShell/1 (ios)",
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

  it("stays in lockstep with isNativeShell() for the same header value", async () => {
    headerMap["user-agent"] = "some-browser FVNativeShell/1 extra-token";
    expect(isNativeShellUserAgent(headerMap["user-agent"])).toBe(
      await isNativeShell(),
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

// ---------------------------------------------------------------------------
// getRequestShellCapability — request-scoped equivalent of getShellCapability,
// used by app/subscribe/page.tsx (FV-572) to branch three ways.
// ---------------------------------------------------------------------------

describe("getRequestShellCapability", () => {
  afterEach(() => {
    headerMap = {};
  });

  it("returns ios-iap for a request carrying the iOS capability marker", async () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 FVNativeShell/1 (ios)";
    expect(await getRequestShellCapability()).toBe("ios-iap");
  });

  it("returns legacy-native for a request carrying only the bare token", async () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 FVNativeShell/1";
    expect(await getRequestShellCapability()).toBe("legacy-native");
  });

  it("returns null for an ordinary browser request", async () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    expect(await getRequestShellCapability()).toBe(null);
  });

  it("returns null when the User-Agent header is missing entirely", async () => {
    expect(await getRequestShellCapability()).toBe(null);
  });

  it("stays in lockstep with getShellCapability() for the same header value", async () => {
    headerMap["user-agent"] = "some-browser FVNativeShell/1 (ios) extra-token";
    expect(await getRequestShellCapability()).toBe(
      getShellCapability(headerMap["user-agent"]),
    );
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

// ---------------------------------------------------------------------------
// FV-659 — `android-play` capability (FV-651 §6). A future Android build with
// Play Billing sends `FVNativeShell/1 (play)`; the server classifies it now,
// but it must stay a native shell and render like `legacy-native` today.
// ---------------------------------------------------------------------------

describe("getShellCapability — android-play (FV-659)", () => {
  const ANDROID = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36";
  const IOS =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15";

  it("classifies the full four-way table", () => {
    expect(getShellCapability(`${ANDROID} FVNativeShell/1 (play)`)).toBe(
      "android-play",
    );
    expect(getShellCapability(`${IOS} FVNativeShell/1 (ios)`)).toBe("ios-iap");
    expect(getShellCapability(`${ANDROID} FVNativeShell/1`)).toBe(
      "legacy-native",
    );
    expect(
      getShellCapability(`${ANDROID} Chrome/126.0 Mobile Safari/537.36`),
    ).toBe(null);
  });

  it("matches by substring, so a trailing token (FVAuth/1) does not change the result", () => {
    expect(getShellCapability("FVNativeShell/1 (play) FVAuth/1")).toBe(
      "android-play",
    );
    expect(getShellCapability("FVNativeShell/1 (ios) FVAuth/1")).toBe(
      "ios-iap",
    );
    expect(getShellCapability("FVNativeShell/1 FVAuth/1")).toBe(
      "legacy-native",
    );
  });

  it("checks (play) BEFORE the bare token (the marker contains the bare token)", () => {
    expect("FVNativeShell/1 (play)".includes("FVNativeShell/1")).toBe(true);
    expect(getShellCapability("FVNativeShell/1 (play)")).toBe("android-play");
  });

  it("isNativeShellUserAgent stays true for all three native values and false for a browser", () => {
    expect(isNativeShellUserAgent("FVNativeShell/1 (play)")).toBe(true);
    expect(isNativeShellUserAgent("FVNativeShell/1 (ios)")).toBe(true);
    expect(isNativeShellUserAgent("FVNativeShell/1")).toBe(true);
    expect(isNativeShellUserAgent("Mozilla/5.0 Chrome/126.0")).toBe(false);
  });

  it("isNativeShell() and getRequestShellCapability() read the (play) header", async () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (Linux; Android 14) FVNativeShell/1 (play)";
    expect(await isNativeShell()).toBe(true);
    expect(await getRequestShellCapability()).toBe("android-play");
  });
});

// ---------------------------------------------------------------------------
// hasAuthCapability (FV-675) — orthogonal to getShellCapability. One table
// covers every combination (FV-569 spec §13a): browser, bare, (ios), and the
// future (play) marker, each with and without FVAuth/1.
// ---------------------------------------------------------------------------

describe("hasAuthCapability (FV-675)", () => {
  const ANDROID_WEBVIEW =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36";
  const IOS_WEBVIEW =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
  const SAFARI =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";

  const table: Array<{
    name: string;
    ua: string;
    shell: ReturnType<typeof getShellCapability>;
    auth: boolean;
  }> = [
    { name: "browser", ua: SAFARI, shell: null, auth: false },
    {
      name: "browser + FVAuth/1 (no shell token)",
      ua: `${SAFARI} FVAuth/1`,
      shell: null,
      auth: false,
    },
    {
      name: "bare shell token",
      ua: `${ANDROID_WEBVIEW} FVNativeShell/1`,
      shell: "legacy-native",
      auth: false,
    },
    {
      name: "bare shell token + FVAuth/1 (Android staging)",
      ua: `${ANDROID_WEBVIEW} FVNativeShell/1 FVAuth/1`,
      shell: "legacy-native",
      auth: true,
    },
    {
      name: "(ios)",
      ua: `${IOS_WEBVIEW} FVNativeShell/1 (ios)`,
      shell: "ios-iap",
      auth: false,
    },
    {
      name: "(ios) + FVAuth/1",
      ua: `${IOS_WEBVIEW} FVNativeShell/1 (ios) FVAuth/1`,
      shell: "ios-iap",
      auth: true,
    },
    // `(play)` is the FV-659 Android Play Billing marker (#598). FVAuth/1 must
    // not change its classification; hasAuthCapability must not care.
    {
      name: "(play)",
      ua: `${ANDROID_WEBVIEW} FVNativeShell/1 (play)`,
      shell: "android-play",
      auth: false,
    },
    {
      name: "(play) + FVAuth/1",
      ua: `${ANDROID_WEBVIEW} FVNativeShell/1 (play) FVAuth/1`,
      shell: "android-play",
      auth: true,
    },
  ];

  it.each(table)("$name → auth=$auth, shell capability unchanged", ({ ua, shell, auth }) => {
    expect(hasAuthCapability(ua)).toBe(auth);
    // Orthogonal: FVAuth/1 never changes the ShellCapability classification.
    expect(getShellCapability(ua)).toBe(shell);
    expect(getShellCapability(ua.replace(" FVAuth/1", ""))).toBe(shell);
  });

  it("returns false for null, undefined, and empty string", () => {
    expect(hasAuthCapability(null)).toBe(false);
    expect(hasAuthCapability(undefined)).toBe(false);
    expect(hasAuthCapability("")).toBe(false);
  });

  it("matches FVAuth/1 only as a whole, case-sensitive token", () => {
    expect(hasAuthCapability("x FVNativeShell/1 (ios) FVAuth/10")).toBe(false);
    expect(hasAuthCapability("x FVNativeShell/1 (ios) XFVAuth/1")).toBe(false);
    expect(hasAuthCapability("x FVNativeShell/1 (ios) fvauth/1")).toBe(false);
    expect(hasAuthCapability("x FVNativeShell/1 (ios) FVAuth/1 extra")).toBe(true);
  });
});
