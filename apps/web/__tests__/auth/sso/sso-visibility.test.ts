/**
 * showSSO matrix (FV-674, spec FV-569 §3): flags x preview cookie x UA x denylist.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

import { resolveSsoEntry } from "@/lib/auth/sso-visibility";

const TOKEN = "t".repeat(40);
const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36";

const DENY: Record<string, string> = {
  instagram: `${SAFARI_IOS} Instagram 300.0`,
  facebook: `${CHROME_ANDROID} [FBAN/FB4A;FBAV/400.0]`,
  tiktok: `${CHROME_ANDROID} musical_ly TikTok 30.0`,
  line: `${CHROME_ANDROID} Line/13.0`,
  snapchat: `${SAFARI_IOS} Snapchat/12.0`,
  twitterAndroid: `${CHROME_ANDROID} TwitterAndroid`,
  linkedin: `${SAFARI_IOS} LinkedInApp`,
  pinterest: `${CHROME_ANDROID} Pinterest/1.0`,
  androidWebview:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120 Mobile Safari/537.36",
  iosWebkitNoSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
};

const IOS_APP = "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 FVNativeShell/1 (ios) FVAuth/1";
const ANDROID_APP = `${CHROME_ANDROID.replace("Mobile Safari", "Mobile")} FVNativeShell/1 (play) FVAuth/1`;
const ANDROID_APP_OLD = `${CHROME_ANDROID} FVNativeShell/1`;
const IOS_APP_OLD = "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 FVNativeShell/1 (ios)";

function flags(web: string, ios: string, android: string) {
  process.env.SSO_WEB = web;
  process.env.SSO_IOS = ios;
  process.env.SSO_ANDROID = android;
}

beforeEach(() => {
  process.env.SSO_PREVIEW_TOKEN = TOKEN;
});
afterEach(() => {
  delete process.env.SSO_WEB;
  delete process.env.SSO_IOS;
  delete process.env.SSO_ANDROID;
  delete process.env.SSO_PREVIEW_TOKEN;
});

describe("web", () => {
  it("off: never shown, no hint (even with a valid cookie)", () => {
    flags("off", "on", "on");
    expect(resolveSsoEntry(SAFARI_IOS, TOKEN)).toEqual({ show: false, surface: "web", browserHint: false });
    expect(resolveSsoEntry(DENY.instagram, TOKEN).browserHint).toBe(false);
  });

  it("on: shown in Safari, Chrome and desktop", () => {
    flags("on", "off", "off");
    for (const ua of [SAFARI_IOS, CHROME_ANDROID, DESKTOP]) {
      expect(resolveSsoEntry(ua, undefined).show).toBe(true);
    }
  });

  it("preview: only with the valid cookie", () => {
    flags("preview", "off", "off");
    expect(resolveSsoEntry(SAFARI_IOS, undefined).show).toBe(false);
    expect(resolveSsoEntry(SAFARI_IOS, "wrong".repeat(10)).show).toBe(false);
    expect(resolveSsoEntry(SAFARI_IOS, TOKEN).show).toBe(true);
  });

  it("preview with no SSO_PREVIEW_TOKEN configured never shows", () => {
    flags("preview", "off", "off");
    delete process.env.SSO_PREVIEW_TOKEN;
    expect(resolveSsoEntry(SAFARI_IOS, "").show).toBe(false);
  });

  it.each(Object.entries(DENY))("denylisted %s: hint instead of buttons", (_n, ua) => {
    flags("on", "off", "off");
    expect(resolveSsoEntry(ua, undefined)).toEqual({ show: false, surface: "web", browserHint: true });
  });

  it("a denylisted browser sees no hint while the flag is off or preview-without-cookie", () => {
    flags("preview", "off", "off");
    expect(resolveSsoEntry(DENY.instagram, undefined).browserHint).toBe(false);
    expect(resolveSsoEntry(DENY.instagram, TOKEN).browserHint).toBe(true);
  });

  it("Chrome iOS (CriOS, has Safari/) is not denylisted", () => {
    flags("on", "off", "off");
    const cri = SAFARI_IOS.replace("Version/17.0", "CriOS/120.0");
    expect(resolveSsoEntry(cri, undefined).show).toBe(true);
  });
});

describe("shell", () => {
  it("iOS app with FVAuth/1: uses the SSO_IOS flag, not the web flag", () => {
    flags("off", "on", "off");
    expect(resolveSsoEntry(IOS_APP, undefined)).toEqual({ show: true, surface: "ios", browserHint: false });
    flags("on", "off", "on");
    expect(resolveSsoEntry(IOS_APP, undefined).show).toBe(false);
  });

  it("Android app with FVAuth/1: uses SSO_ANDROID; the `; wv)` denylist does not apply", () => {
    flags("off", "off", "on");
    const wv = ANDROID_APP.replace("Pixel 8)", "Pixel 8; wv)");
    expect(resolveSsoEntry(wv, undefined)).toEqual({ show: true, surface: "android", browserHint: false });
  });

  it("older shells without FVAuth/1 never show SSO (flags on)", () => {
    flags("on", "on", "on");
    expect(resolveSsoEntry(ANDROID_APP_OLD, TOKEN)).toEqual({ show: false, surface: "android", browserHint: false });
    expect(resolveSsoEntry(IOS_APP_OLD, TOKEN)).toEqual({ show: false, surface: "ios", browserHint: false });
  });

  it("shell preview needs the cookie", () => {
    flags("off", "preview", "preview");
    expect(resolveSsoEntry(IOS_APP, undefined).show).toBe(false);
    expect(resolveSsoEntry(IOS_APP, TOKEN).show).toBe(true);
    expect(resolveSsoEntry(ANDROID_APP, TOKEN).show).toBe(true);
  });

  it("missing UA is plain web", () => {
    flags("on", "off", "off");
    expect(resolveSsoEntry(null, undefined).show).toBe(true);
  });
});
