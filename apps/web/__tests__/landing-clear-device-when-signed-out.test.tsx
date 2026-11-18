/** @vitest-environment jsdom */
// FV-759: the web landing page ("/", also the PWA start_url) clears the device
// only when the browser holds no Supabase session cookie. A signed-in athlete
// launching the installed app, online or offline, keeps everything.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const clearAthleteCache = vi.fn();
const clearPregameSession = vi.fn();
const clearOfflineAudioCaches = vi.fn(async () => undefined);
vi.mock("@/lib/pregame/athlete-cache", () => ({ clearAthleteCache: () => clearAthleteCache() }));
vi.mock("@/lib/pregame/session-cache", () => ({ clearPregameSession: () => clearPregameSession() }));
vi.mock("@/lib/audio/clear-audio-cache", () => ({
  clearOfflineAudioCaches: () => clearOfflineAudioCaches(),
}));

import { ClearDeviceWhenSignedOut } from "@/components/landing/ClearDeviceWhenSignedOut";

function withCookies(value: string) {
  vi.spyOn(document, "cookie", "get").mockReturnValue(value);
}
const cleared = () =>
  [clearAthleteCache, clearPregameSession, clearOfflineAudioCaches].map((f) => f.mock.calls.length);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("ClearDeviceWhenSignedOut (FV-759)", () => {
  it.each([
    ["no cookies at all", ""],
    ["unrelated cookies only", "fv_attr=abc; theme=dark"],
    ["only the PKCE code-verifier cookie", "sb-abcd1234-auth-token-code-verifier=xyz"],
  ])("clears the local entry, the saved session and the audio with %s", (_label, cookies) => {
    withCookies(cookies);
    render(<ClearDeviceWhenSignedOut />);
    expect(cleared()).toEqual([1, 1, 1]);
  });

  it.each([
    ["a session cookie", "theme=dark; sb-abcd1234-auth-token=base64-xyz"],
    ["a chunked session cookie", "sb-abcd1234-auth-token.0=aaa; sb-abcd1234-auth-token.1=bbb"],
  ])("clears nothing when the browser holds %s", (_label, cookies) => {
    withCookies(cookies);
    render(<ClearDeviceWhenSignedOut />);
    expect(cleared()).toEqual([0, 0, 0]);
  });

  it("renders nothing", () => {
    withCookies("");
    const { container } = render(<ClearDeviceWhenSignedOut />);
    expect(container.innerHTML).toBe("");
  });
});
