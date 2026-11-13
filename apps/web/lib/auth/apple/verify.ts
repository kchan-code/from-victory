import "server-only";

import { createHash, createPublicKey, verify as cryptoVerify } from "node:crypto";

import { APPLE_ISSUER, APPLE_JWKS_URL } from "./config";

// =============================================================================
// Apple ID-token verification against Apple's JWKS (spec §5.4 rule 1/3).
// Node crypto only (no new dependency). Apple signs with RS256.
//
// Nothing here logs; errors carry a static code, never token contents.
// =============================================================================

export type AppleIdTokenClaims = {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat?: number;
  nonce?: string;
  auth_time?: number;
};

export class AppleVerifyError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AppleVerifyError";
  }
}

type Jwk = { kty: string; kid: string; alg?: string; use?: string; n?: string; e?: string };

const JWKS_TTL_MS = 60 * 60 * 1000;
const JWKS_MIN_REFRESH_MS = 30 * 1000;
let cache: { keys: Jwk[]; fetchedAt: number } | null = null;

export function __resetAppleJwksCacheForTests() {
  cache = null;
}

async function loadJwks(force: boolean): Promise<Jwk[]> {
  const now = Date.now();
  if (
    cache &&
    (!force || now - cache.fetchedAt < JWKS_MIN_REFRESH_MS) &&
    now - cache.fetchedAt < JWKS_TTL_MS
  ) {
    return cache.keys;
  }
  let res: Response;
  try {
    res = await fetch(APPLE_JWKS_URL, { signal: AbortSignal.timeout(8000) });
  } catch {
    if (cache) return cache.keys; // stale keys beat a hard outage; exp still enforced
    throw new AppleVerifyError("jwks_unreachable");
  }
  if (!res.ok) {
    if (cache) return cache.keys;
    throw new AppleVerifyError("jwks_unreachable");
  }
  const body = (await res.json().catch(() => null)) as { keys?: Jwk[] } | null;
  if (!body || !Array.isArray(body.keys)) throw new AppleVerifyError("jwks_invalid");
  cache = { keys: body.keys, fetchedAt: now };
  return cache.keys;
}

function decodePart(part: string): Record<string, unknown> {
  try {
    const v = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  throw new AppleVerifyError("malformed");
}

/** SHA-256 hex of the raw nonce: what is sent to Apple and compared to the claim. */
export function hashNonce(rawNonce: string): string {
  return createHash("sha256").update(rawNonce, "utf8").digest("hex");
}

/**
 * Verifies signature, iss, aud (exact match to `audience`), exp. When
 * `rawNonce` is supplied, the token's `nonce` claim must equal SHA-256(raw).
 */
export async function verifyAppleIdToken(
  token: string,
  opts: { audience: string; rawNonce?: string; nowSeconds?: number },
): Promise<AppleIdTokenClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new AppleVerifyError("malformed");
  const [h, p, s] = parts as [string, string, string];
  const header = decodePart(h);
  const payload = decodePart(p);

  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new AppleVerifyError("bad_alg");
  }

  let keys = await loadJwks(false);
  let jwk = keys.find((k) => k.kid === header.kid && k.kty === "RSA");
  if (!jwk) {
    keys = await loadJwks(true); // Apple rotated; one forced refresh
    jwk = keys.find((k) => k.kid === header.kid && k.kty === "RSA");
  }
  if (!jwk) throw new AppleVerifyError("unknown_kid");

  let ok = false;
  try {
    ok = cryptoVerify(
      "sha256",
      Buffer.from(`${h}.${p}`),
      createPublicKey({ key: jwk, format: "jwk" } as unknown as Parameters<typeof createPublicKey>[0]),
      Buffer.from(s, "base64url"),
    );
  } catch {
    ok = false;
  }
  if (!ok) throw new AppleVerifyError("bad_signature");

  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.iss !== APPLE_ISSUER) throw new AppleVerifyError("bad_iss");
  if (payload.aud !== opts.audience) throw new AppleVerifyError("bad_aud");
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    throw new AppleVerifyError("expired");
  }
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new AppleVerifyError("bad_sub");
  }
  if (opts.rawNonce !== undefined) {
    const expected = hashNonce(opts.rawNonce);
    if (typeof payload.nonce !== "string" || payload.nonce.toLowerCase() !== expected) {
      throw new AppleVerifyError("bad_nonce");
    }
  }

  return {
    iss: payload.iss as string,
    aud: payload.aud as string,
    sub: payload.sub,
    exp: payload.exp,
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
    nonce: typeof payload.nonce === "string" ? payload.nonce : undefined,
    auth_time: typeof payload.auth_time === "number" ? payload.auth_time : undefined,
  };
}
