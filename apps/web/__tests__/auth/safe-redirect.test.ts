/**
 * FV-725 — safeRedirectPath.
 *
 * The reported payload `/\evil.com` passes `startsWith("/") && !startsWith("//")`
 * and the URL parser resolves it off-site. These cases pin the strict
 * relative-path contract: one leading "/", no backslash, no encoded
 * backslash or double-slash, no control character, no absolute URL, and the
 * resolved origin must be the request origin.
 */

import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/auth/safe-redirect";

const ORIGIN = "https://www.fromvictoryapp.com";

function staysOnOrigin(path: string): void {
  expect(new URL(path, ORIGIN).origin).toBe(ORIGIN);
}

describe("safeRedirectPath", () => {
  it.each([
    ["root", "/", "/"],
    ["reset password", "/reset-password", "/reset-password"],
    ["nested settings", "/athlete/settings", "/athlete/settings"],
    ["query", "/reset-password?from=email", "/reset-password?from=email"],
    ["hash", "/dashboard/settings#account", "/dashboard/settings#account"],
    ["same-origin lookalike path", "/evil.com", "/evil.com"],
  ])("allows %s", (_name, input, expected) => {
    const safe = safeRedirectPath(input, ORIGIN);
    expect(safe).toBe(expected);
    staysOnOrigin(safe);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
  ])("falls back to / for %s", (_name, input) => {
    const safe = safeRedirectPath(input, ORIGIN);
    expect(safe).toBe("/");
    staysOnOrigin(safe);
  });

  it.each([
    ["reported backslash host", "/\\evil.com"],
    ["double backslash host", "/\\\\evil.com"],
    ["protocol-relative", "//evil.com"],
    ["triple slash", "///evil.com"],
    ["encoded backslash", "/%5Cevil.com"],
    ["encoded backslash lower", "/%5cevil.com"],
    ["double-encoded backslash", "/%255Cevil.com"],
    ["encoded protocol-relative", "/%2F%2Fevil.com"],
    ["encoded protocol-relative lower", "/%2f%2fevil.com"],
    ["double-encoded protocol-relative", "/%252F%252Fevil.com"],
    ["encoded slash that decodes to a double slash", "/%2Fevil.com"],
    ["backslash inside the path", "/reset\\password"],
    ["leading slash-backslash", "/\\/evil.com"],
    ["absolute https", "https://evil.com"],
    ["absolute https with path", "https://evil.com/reset-password"],
    ["absolute http", "http://evil.com"],
    ["javascript scheme", "javascript:alert(1)"],
    ["userinfo absolute", "https://www.fromvictoryapp.com@evil.com"],
    ["no leading slash", "reset-password"],
    ["leading space then backslash", " /\\evil.com"],
    ["tab then protocol-relative", "\t//evil.com"],
    ["tab in the path", "/reset\tpassword"],
    ["newline in the path", "/reset\npassword"],
    ["crlf", "/reset\r\nLocation: https://evil.com"],
    ["encoded newline", "/%0A/evil.com"],
    ["encoded tab", "/%09/evil.com"],
    ["encoded null", "/%00reset"],
    ["bare percent", "/%"],
    ["query containing an absolute URL", "/login?next=https://evil.com"],
    ["deeply encoded backslash", "/%252525255Cevil.com"],
  ])("rejects %s", (_name, input) => {
    const safe = safeRedirectPath(input, ORIGIN);
    expect(safe).toBe("/");
    staysOnOrigin(safe);
    // The raw payload must not be what we redirect to.
    expect(safe).not.toBe(input);
  });

  it("the reported payload still resolves off-site in the URL parser", () => {
    // Documents the bug the helper exists to close. If a future parser
    // stops treating "\\" as "/", this assertion should be revisited —
    // the helper must keep rejecting the payload either way.
    expect(new URL("/\\evil.com", ORIGIN).href).toBe("https://evil.com/");
    expect(safeRedirectPath("/\\evil.com", ORIGIN)).toBe("/");
  });

  it("rejects a candidate that resolves off the request origin", () => {
    const safe = safeRedirectPath("//evil.com", ORIGIN);
    expect(new URL(safe, ORIGIN).origin).toBe(ORIGIN);
    expect(new URL("//evil.com", ORIGIN).origin).not.toBe(ORIGIN);
  });
});
