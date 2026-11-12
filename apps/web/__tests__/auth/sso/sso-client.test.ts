import { describe, expect, it } from "vitest";

import {
  androidChallengeFor,
  parseAppCallback,
  randomBase64Url,
  sha256Hex,
} from "@/lib/auth/sso-client";

describe("sso-client helpers", () => {
  it("verifier is 43-char base64url and the challenge is a 43-char S256 base64url", async () => {
    const verifier = randomBase64Url(32);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const challenge = await androidChallengeFor(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).not.toBe(verifier);
  });

  it("challenge matches the RFC 7636 S256 test vector", async () => {
    expect(await androidChallengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  it("apple nonce hash is SHA-256 hex", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("parses only our callback scheme", () => {
    expect(parseAppCallback("com.fromvictoryapp.app://auth/callback?handoff=abc")?.get("handoff")).toBe("abc");
    expect(parseAppCallback("com.fromvictoryapp.app://auth/callback?code=c1")?.get("code")).toBe("c1");
    expect(parseAppCallback("https://evil.example/auth/callback?code=c1")).toBeNull();
    expect(parseAppCallback("com.other.app://auth/callback?code=c1")).toBeNull();
  });
});
