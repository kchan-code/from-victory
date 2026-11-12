import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// =============================================================================
// AES-256-GCM for Apple refresh tokens and handoff fields (spec §5.5).
//
// Key: APPLE_TOKEN_KEY = 32 random bytes, base64. Current key_version is
// APPLE_TOKEN_KEY_VERSION (default 1). Older versions stay decryptable through
// APPLE_TOKEN_KEY_V<n>. AAD binds each ciphertext to its row:
//   tokens   "token|<user_id>|<client_id>"
//   handoffs "handoff|<id>"
// so a ciphertext copied to another row fails authentication.
// =============================================================================

export type EncryptedValue = {
  ciphertext: string; // base64url
  iv: string; // base64url
  tag: string; // base64url
  keyVersion: number;
};

export class AppleCryptoError extends Error {
  constructor(code: string) {
    super(code); // static code only; never include key/plaintext material
    this.name = "AppleCryptoError";
  }
}

export function currentKeyVersion(): number {
  const raw = Number.parseInt(process.env.APPLE_TOKEN_KEY_VERSION ?? "1", 10);
  return Number.isInteger(raw) && raw >= 1 ? raw : 1;
}

function keyFor(version: number): Buffer {
  const current = currentKeyVersion();
  const b64 =
    version === current
      ? process.env.APPLE_TOKEN_KEY
      : process.env[`APPLE_TOKEN_KEY_V${version}`];
  if (!b64) throw new AppleCryptoError("key_missing");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new AppleCryptoError("key_invalid");
  return key;
}

export function tokenAad(userId: string, clientId: string): string {
  return `token|${userId}|${clientId}`;
}

export function handoffAad(handoffId: string): string {
  return `handoff|${handoffId}`;
}

export function encryptValue(plaintext: string, aad: string): EncryptedValue {
  const keyVersion = currentKeyVersion();
  const key = keyFor(keyVersion);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ct.toString("base64url"),
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    keyVersion,
  };
}

export function decryptValue(value: EncryptedValue, aad: string): string {
  const key = keyFor(value.keyVersion);
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(value.iv, "base64url"),
    );
    decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(Buffer.from(value.tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(value.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new AppleCryptoError("decrypt_failed");
  }
}

/** Packed form for handoff columns: "<iv>.<tag>.<ciphertext>" (base64url). */
export function packEncrypted(v: EncryptedValue): string {
  return `${v.iv}.${v.tag}.${v.ciphertext}`;
}

export function unpackEncrypted(packed: string, keyVersion: number): EncryptedValue {
  const parts = packed.split(".");
  if (parts.length !== 3) throw new AppleCryptoError("decrypt_failed");
  const [iv, tag, ciphertext] = parts as [string, string, string];
  return { iv, tag, ciphertext, keyVersion };
}
