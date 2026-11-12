import { randomBytes, verify } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { mintAppleClientSecret } from "@/lib/auth/apple/client-secret";
import {
  decryptValue,
  encryptValue,
  handoffAad,
  packEncrypted,
  tokenAad,
  unpackEncrypted,
} from "@/lib/auth/apple/token-crypto";

import { ecPublicKey, setAppleEnv, SERVICES_ID } from "./helpers";

beforeEach(() => setAppleEnv());

describe("token crypto (AES-256-GCM)", () => {
  it("round-trips with the exact AAD", () => {
    const aad = tokenAad("user-1", SERVICES_ID);
    expect(aad).toBe(`token|user-1|${SERVICES_ID}`);
    const enc = encryptValue("r-refresh-token", aad);
    expect(enc.keyVersion).toBe(1);
    expect(enc.ciphertext).not.toContain("refresh");
    expect(decryptValue(enc, aad)).toBe("r-refresh-token");
  });

  it("uses a fresh IV each time", () => {
    const a = encryptValue("x", "aad");
    const b = encryptValue("x", "aad");
    expect(a.iv).not.toBe(b.iv);
  });

  it("rejects a tampered AAD (different user / client / handoff)", () => {
    const enc = encryptValue("secret", tokenAad("user-1", "client-a"));
    expect(() => decryptValue(enc, tokenAad("user-2", "client-a"))).toThrow();
    expect(() => decryptValue(enc, tokenAad("user-1", "client-b"))).toThrow();
    expect(() => decryptValue(enc, handoffAad("user-1"))).toThrow();
  });

  it("rejects a tampered ciphertext or tag", () => {
    const enc = encryptValue("secret", "aad");
    const flip = (s: string) => (s[0] === "A" ? "B" : "A") + s.slice(1);
    expect(() => decryptValue({ ...enc, ciphertext: flip(enc.ciphertext) }, "aad")).toThrow();
    expect(() => decryptValue({ ...enc, tag: flip(enc.tag) }, "aad")).toThrow();
  });

  it("handoff fields pack/unpack with AAD handoff|<id>", () => {
    const enc = encryptValue("nonce-raw", handoffAad("h-1"));
    const back = unpackEncrypted(packEncrypted(enc), enc.keyVersion);
    expect(decryptValue(back, "handoff|h-1")).toBe("nonce-raw");
  });

  it("respects key_version: old versions decrypt through APPLE_TOKEN_KEY_V<n>", () => {
    const oldKey = process.env.APPLE_TOKEN_KEY!;
    const enc = encryptValue("old-secret", "aad"); // version 1
    process.env.APPLE_TOKEN_KEY_VERSION = "2";
    process.env.APPLE_TOKEN_KEY = randomBytes(32).toString("base64");
    // v1 key is not configured any more -> cannot decrypt
    expect(() => decryptValue(enc, "aad")).toThrow();
    process.env.APPLE_TOKEN_KEY_V1 = oldKey;
    expect(decryptValue(enc, "aad")).toBe("old-secret");
    expect(encryptValue("new", "aad").keyVersion).toBe(2);
    delete process.env.APPLE_TOKEN_KEY_V1;
  });

  it("refuses a key that is not 32 bytes and a missing key", () => {
    process.env.APPLE_TOKEN_KEY = Buffer.from("short").toString("base64");
    expect(() => encryptValue("x", "aad")).toThrow();
    delete process.env.APPLE_TOKEN_KEY;
    expect(() => encryptValue("x", "aad")).toThrow();
  });
});

describe("client secret (ES256)", () => {
  it("mints a verifiable ES256 JWT with a 5-minute expiry and the client as sub", () => {
    const now = 1_800_000_000;
    const jwt = mintAppleClientSecret(SERVICES_ID, now);
    const [h, p, s] = jwt.split(".") as [string, string, string];
    const header = JSON.parse(Buffer.from(h, "base64url").toString());
    const payload = JSON.parse(Buffer.from(p, "base64url").toString());
    expect(header).toMatchObject({ alg: "ES256", kid: "KEY1234567" });
    expect(payload).toMatchObject({
      iss: "TEAM123456",
      aud: "https://appleid.apple.com",
      sub: SERVICES_ID,
      iat: now,
      exp: now + 300,
    });
    expect(
      verify("sha256", Buffer.from(`${h}.${p}`), { key: ecPublicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url")),
    ).toBe(true);
    expect(Buffer.from(s, "base64url").length).toBe(64); // raw r||s, not DER
  });

  it("accepts a PEM stored with literal \\n sequences", () => {
    process.env.APPLE_SIGNIN_P8 = process.env.APPLE_SIGNIN_P8!.replace(/\n/g, "\\n");
    expect(() => mintAppleClientSecret(SERVICES_ID)).not.toThrow();
  });

  it("throws a generic error (no secret) when unconfigured", () => {
    delete process.env.APPLE_SIGNIN_P8;
    expect(() => mintAppleClientSecret(SERVICES_ID)).toThrow("apple_not_configured");
  });
});
