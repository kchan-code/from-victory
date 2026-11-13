/**
 * FV-717: minimum-supported-build gate (pure logic).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getShellBuild,
  getShellPlatform,
  parseMinimumBuild,
  parseUpdatePlatformParam,
  resolveUpdateRedirect,
  resolveUpdateRequired,
} from "@/lib/native-build-gate";

const ANDROID_WEBVIEW =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0 Mobile Safari/537.36";
const IOS_WEBVIEW =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPAD_DESKTOP_WEBVIEW =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";

// Every UA shape a store app has shipped or will ship.
const ANDROID_LEGACY = `${ANDROID_WEBVIEW} FVNativeShell/1`;
const ANDROID_BUILD_11 = `${ANDROID_WEBVIEW} FVNativeShell/1 FVBuild/11`;
const ANDROID_PLAY_BUILD_12 = `${ANDROID_WEBVIEW} FVNativeShell/1 (play) FVBuild/12`;
const ANDROID_STAGING = `${ANDROID_WEBVIEW} FVNativeShell/1 FVBuild/11 FVAuth/1`;
const IOS_LEGACY = `${IOS_WEBVIEW}  FVNativeShell/1`;
const IOS_IAP_NO_BUILD = `${IOS_WEBVIEW}  FVNativeShell/1 (ios)`;
const IOS_IAP_BUILD_8 = `${IOS_WEBVIEW}  FVNativeShell/1 (ios) FVBuild/8`;
const IPAD_LEGACY = `${IPAD_DESKTOP_WEBVIEW}  FVNativeShell/1`;

describe("getShellBuild", () => {
  it("reads the build number from a shell UA", () => {
    expect(getShellBuild(ANDROID_BUILD_11)).toBe(11);
    expect(getShellBuild(ANDROID_PLAY_BUILD_12)).toBe(12);
    expect(getShellBuild(ANDROID_STAGING)).toBe(11);
    expect(getShellBuild(IOS_IAP_BUILD_8)).toBe(8);
  });

  it("is null for every build shipped before FV-717 (no marker)", () => {
    expect(getShellBuild(ANDROID_LEGACY)).toBeNull();
    expect(getShellBuild(IOS_LEGACY)).toBeNull();
    expect(getShellBuild(IOS_IAP_NO_BUILD)).toBeNull();
  });

  it("is null outside the shell, even if a browser UA carries the marker", () => {
    expect(getShellBuild(`${IOS_WEBVIEW} FVBuild/99`)).toBeNull();
    expect(getShellBuild(null)).toBeNull();
    expect(getShellBuild(undefined)).toBeNull();
  });

  it("matches only a whole FVBuild/<digits> token", () => {
    expect(getShellBuild(`${ANDROID_LEGACY} XFVBuild/11`)).toBeNull();
    expect(getShellBuild(`${ANDROID_LEGACY} FVBuild/11a`)).toBeNull();
    expect(getShellBuild(`${ANDROID_LEGACY} FVBuild/`)).toBeNull();
    expect(getShellBuild(`${ANDROID_LEGACY} FVBuild/-3`)).toBeNull();
  });

  it("does not mistake Android's own 'Build/UQ1A' for the marker", () => {
    expect(getShellBuild(ANDROID_LEGACY)).toBeNull();
  });
});

describe("getShellPlatform", () => {
  it("uses the platform marker when present", () => {
    expect(getShellPlatform(IOS_IAP_BUILD_8)).toBe("ios");
    expect(getShellPlatform(ANDROID_PLAY_BUILD_12)).toBe("android");
  });

  it("tells a bare-token shell's platform from the WebView's own UA", () => {
    expect(getShellPlatform(ANDROID_LEGACY)).toBe("android");
    expect(getShellPlatform(ANDROID_BUILD_11)).toBe("android");
    expect(getShellPlatform(IOS_LEGACY)).toBe("ios");
    expect(getShellPlatform(IPAD_LEGACY)).toBe("ios");
  });

  it("is null outside the shell and when the platform can't be told", () => {
    expect(getShellPlatform(IOS_WEBVIEW)).toBeNull();
    expect(getShellPlatform(ANDROID_WEBVIEW)).toBeNull();
    expect(getShellPlatform("SomethingElse FVNativeShell/1")).toBeNull();
    expect(getShellPlatform(null)).toBeNull();
  });
});

describe("parseMinimumBuild", () => {
  it("accepts a positive whole number", () => {
    expect(parseMinimumBuild("11")).toBe(11);
    expect(parseMinimumBuild(" 8 ")).toBe(8);
  });

  it.each([undefined, "", " ", "0", "-1", "1.5", "abc", "1O", "11 12", "1e3"])(
    "treats %j as no minimum (fail open)",
    (raw) => {
      expect(parseMinimumBuild(raw)).toBeNull();
    },
  );
});

describe("resolveUpdateRequired", () => {
  const BOTH = { NATIVE_MIN_BUILD_IOS: "8", NATIVE_MIN_BUILD_ANDROID: "11" };

  it("gates nothing when no minimum is set (the default)", () => {
    for (const ua of [ANDROID_LEGACY, IOS_LEGACY, IOS_IAP_NO_BUILD, ANDROID_BUILD_11]) {
      expect(resolveUpdateRequired(ua, {})).toBeNull();
    }
  });

  it("a version-less shell counts as the oldest: any minimum gates it", () => {
    expect(resolveUpdateRequired(ANDROID_LEGACY, { NATIVE_MIN_BUILD_ANDROID: "1" })).toBe("android");
    expect(resolveUpdateRequired(IOS_LEGACY, { NATIVE_MIN_BUILD_IOS: "1" })).toBe("ios");
    expect(resolveUpdateRequired(IOS_IAP_NO_BUILD, { NATIVE_MIN_BUILD_IOS: "1" })).toBe("ios");
    expect(resolveUpdateRequired(IPAD_LEGACY, { NATIVE_MIN_BUILD_IOS: "1" })).toBe("ios");
  });

  it("a build at or above the minimum is not gated; one below is", () => {
    expect(resolveUpdateRequired(ANDROID_BUILD_11, BOTH)).toBeNull();
    expect(resolveUpdateRequired(ANDROID_PLAY_BUILD_12, BOTH)).toBeNull();
    expect(resolveUpdateRequired(IOS_IAP_BUILD_8, BOTH)).toBeNull();
    expect(resolveUpdateRequired(ANDROID_BUILD_11, { NATIVE_MIN_BUILD_ANDROID: "12" })).toBe("android");
    expect(resolveUpdateRequired(IOS_IAP_BUILD_8, { NATIVE_MIN_BUILD_IOS: "9" })).toBe("ios");
  });

  it("each platform reads only its own minimum", () => {
    expect(resolveUpdateRequired(ANDROID_LEGACY, { NATIVE_MIN_BUILD_IOS: "8" })).toBeNull();
    expect(resolveUpdateRequired(IOS_LEGACY, { NATIVE_MIN_BUILD_ANDROID: "11" })).toBeNull();
  });

  it("never gates a browser or the PWA", () => {
    expect(resolveUpdateRequired(IOS_WEBVIEW, BOTH)).toBeNull();
    expect(resolveUpdateRequired(ANDROID_WEBVIEW, BOTH)).toBeNull();
    expect(resolveUpdateRequired(`${IOS_WEBVIEW} FVBuild/1`, BOTH)).toBeNull();
  });

  it("an unreadable minimum gates nothing", () => {
    expect(resolveUpdateRequired(ANDROID_LEGACY, { NATIVE_MIN_BUILD_ANDROID: "eleven" })).toBeNull();
    expect(resolveUpdateRequired(ANDROID_LEGACY, { NATIVE_MIN_BUILD_ANDROID: "0" })).toBeNull();
  });

  it("reads process.env by default", () => {
    vi.stubEnv("NATIVE_MIN_BUILD_ANDROID", "11");
    try {
      expect(resolveUpdateRequired(ANDROID_LEGACY)).toBe("android");
      expect(resolveUpdateRequired(ANDROID_BUILD_11)).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("resolveUpdateRedirect", () => {
  const env = { NATIVE_MIN_BUILD_ANDROID: "11", NATIVE_MIN_BUILD_IOS: "8" };
  const target = (pathname: string, method = "GET", userAgent = ANDROID_LEGACY) =>
    resolveUpdateRedirect({ method, pathname, userAgent, env });

  it("sends page navigations from a gated shell to the update screen, naming the platform", () => {
    for (const path of ["/", "/signin", "/dashboard", "/athlete", "/subscribe", "/athlete/pregame"]) {
      expect(target(path)).toBe("/update-required?p=android");
    }
    expect(target("/dashboard", "GET", IOS_LEGACY)).toBe("/update-required?p=ios");
    expect(target("/dashboard", "GET", IOS_IAP_NO_BUILD)).toBe("/update-required?p=ios");
  });

  it("never redirects the update screen itself (no loop), with or without a query", () => {
    expect(target("/update-required")).toBeNull();
  });

  it("lets API routes, auth callbacks and non-GET requests through", () => {
    expect(target("/api/athlete/access")).toBeNull();
    expect(target("/auth/callback")).toBeNull();
    expect(target("/auth/signout")).toBeNull();
    expect(target("/dashboard", "POST")).toBeNull();
  });

  it("does not treat look-alike paths as API or auth", () => {
    expect(target("/apiary")).toBe("/update-required?p=android");
    expect(target("/authors")).toBe("/update-required?p=android");
  });

  it("does nothing for an up-to-date shell or a browser", () => {
    expect(target("/", "GET", ANDROID_BUILD_11)).toBeNull();
    expect(target("/", "GET", ANDROID_WEBVIEW)).toBeNull();
  });
});

describe("parseUpdatePlatformParam", () => {
  it("accepts only the two platform names", () => {
    expect(parseUpdatePlatformParam("ios")).toBe("ios");
    expect(parseUpdatePlatformParam("android")).toBe("android");
    expect(parseUpdatePlatformParam(["android", "ios"])).toBe("android");
  });

  it.each([undefined, "", "IOS", "windows", "https://evil.example", ["nope"]])(
    "rejects %j",
    (value) => {
      expect(parseUpdatePlatformParam(value)).toBeNull();
    },
  );
});
