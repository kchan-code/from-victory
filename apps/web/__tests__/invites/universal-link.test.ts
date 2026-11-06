/**
 * FV-630 — strict validation of URLs delivered to the native app, and the
 * shareable invite URL shape (code in the fragment, never the query).
 */
import { describe, expect, it } from "vitest";

import {
  buildInviteUrl,
  inviteAppPath,
  parseInviteUniversalLink,
  readCodeFromHash,
} from "@/lib/invites/universal-link";

const CODE = "7KQ2M9XD4HTRPW3B";
const GOOD = "https://www.fromvictoryapp.com/invite#code=7KQ2-M9XD-4HTR-PW3B";

describe("buildInviteUrl", () => {
  it("puts the formatted code in the fragment", () => {
    expect(buildInviteUrl("https://www.fromvictoryapp.com", CODE)).toBe(GOOD);
    expect(buildInviteUrl("https://www.fromvictoryapp.com/", CODE)).toBe(GOOD);
    const url = new URL(GOOD);
    expect(url.search).toBe("");
    expect(url.hash).toBe("#code=7KQ2-M9XD-4HTR-PW3B");
  });
});

describe("parseInviteUniversalLink", () => {
  it("accepts the exact invite link and returns the in-app path", () => {
    expect(parseInviteUniversalLink(GOOD)).toBe("/invite#code=7KQ2-M9XD-4HTR-PW3B");
    expect(
      parseInviteUniversalLink("https://www.fromvictoryapp.com/invite#code=7kq2m9xd4htrpw3b"),
    ).toBe("/invite#code=7KQ2-M9XD-4HTR-PW3B");
  });

  it("accepts the bare invite path (code entry)", () => {
    expect(parseInviteUniversalLink("https://www.fromvictoryapp.com/invite")).toBe("/invite");
    expect(parseInviteUniversalLink("https://www.fromvictoryapp.com/invite/")).toBe("/invite");
  });

  it.each([
    ["http (not https)", "http://www.fromvictoryapp.com/invite#code=7KQ2-M9XD-4HTR-PW3B"],
    ["apex host", "https://fromvictoryapp.com/invite#code=7KQ2-M9XD-4HTR-PW3B"],
    ["lookalike host", "https://www.fromvictoryapp.com.evil.test/invite#code=7KQ2-M9XD-4HTR-PW3B"],
    ["subdomain", "https://evil.www.fromvictoryapp.com/invite"],
    ["credentials", "https://x:y@www.fromvictoryapp.com/invite"],
    ["port", "https://www.fromvictoryapp.com:8443/invite"],
    ["other path", "https://www.fromvictoryapp.com/athlete"],
    ["path prefix", "https://www.fromvictoryapp.com/invite-x"],
    ["nested path", "https://www.fromvictoryapp.com/invite/../dashboard"],
    ["query string", "https://www.fromvictoryapp.com/invite?code=7KQ2-M9XD-4HTR-PW3B"],
    ["query + fragment", "https://www.fromvictoryapp.com/invite?next=/x#code=7KQ2-M9XD-4HTR-PW3B"],
    ["bad code", "https://www.fromvictoryapp.com/invite#code=NOPE"],
    ["extra fragment params", "https://www.fromvictoryapp.com/invite#code=7KQ2-M9XD-4HTR-PW3B&next=/x"],
    ["other fragment", "https://www.fromvictoryapp.com/invite#token=abc"],
    ["custom scheme", "fromvictory://invite#code=7KQ2-M9XD-4HTR-PW3B"],
    ["javascript url", "javascript:alert(1)"],
    ["garbage", "not a url"],
  ])("rejects %s", (_label, url) => {
    expect(parseInviteUniversalLink(url)).toBeNull();
  });

  it("rejects non-strings and oversized input", () => {
    expect(parseInviteUniversalLink(undefined)).toBeNull();
    expect(parseInviteUniversalLink(42)).toBeNull();
    expect(parseInviteUniversalLink(`${GOOD}${"A".repeat(300)}`)).toBeNull();
  });
});

describe("readCodeFromHash / inviteAppPath", () => {
  it("reads only a well-formed code fragment", () => {
    expect(readCodeFromHash("#code=7KQ2-M9XD-4HTR-PW3B")).toBe(CODE);
    expect(readCodeFromHash("#code=bad")).toBeNull();
    expect(readCodeFromHash("")).toBeNull();
    expect(readCodeFromHash(null)).toBeNull();
  });

  it("builds same-origin paths only", () => {
    expect(inviteAppPath(CODE)).toBe("/invite#code=7KQ2-M9XD-4HTR-PW3B");
    expect(inviteAppPath(null)).toBe("/invite");
  });
});
