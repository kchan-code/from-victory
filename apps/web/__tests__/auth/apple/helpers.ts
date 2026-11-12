// Shared fixtures for the Apple sign-in tests (FV-673). Everything is local:
// a generated RSA key plays Apple's signing key, a generated EC key plays the
// Services-ID .p8, and global fetch is routed to in-memory "Apple" handlers.
import { createHash, generateKeyPairSync, randomBytes, sign } from "node:crypto";
import { vi } from "vitest";

export const SERVICES_ID = "com.fromvictoryapp.web";
export const BUNDLE_ID = "com.fromvictoryapp.app";

const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const rsaOther = generateKeyPairSync("rsa", { modulusLength: 2048 });
const ec = generateKeyPairSync("ec", { namedCurve: "P-256" });

export const KID = "test-kid-1";
export const jwkPublic = { ...rsa.publicKey.export({ format: "jwk" }), kid: KID, alg: "RS256", use: "sig" };
export const ecPrivatePem = ec.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
export const ecPublicKey = ec.publicKey;

export function setAppleEnv(extra: Record<string, string | undefined> = {}) {
  process.env.APPLE_TEAM_ID = "TEAM123456";
  process.env.APPLE_KEY_ID = "KEY1234567";
  process.env.APPLE_SIGNIN_P8 = ecPrivatePem;
  process.env.APPLE_SERVICES_ID = SERVICES_ID;
  process.env.APPLE_BUNDLE_ID = BUNDLE_ID;
  process.env.APPLE_TOKEN_KEY = randomBytes(32).toString("base64");
  delete process.env.APPLE_TOKEN_KEY_VERSION;
  process.env.SSO_WEB = "on";
  process.env.SSO_IOS = "on";
  process.env.SSO_ANDROID = "on";
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

export const sha256hex = (s: string) => createHash("sha256").update(s).digest("hex");

export type Claims = Record<string, unknown>;

/** Sign an Apple-style RS256 id_token. `signer: "other"` uses an unrelated key. */
export function idToken(
  claims: Claims,
  opts: { kid?: string; signer?: "apple" | "other"; alg?: string } = {},
): string {
  const header = { alg: opts.alg ?? "RS256", kid: opts.kid ?? KID, typ: "JWT" };
  const b = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const input = `${b(header)}.${b(claims)}`;
  const key = opts.signer === "other" ? rsaOther.privateKey : rsa.privateKey;
  return `${input}.${sign("sha256", Buffer.from(input), key).toString("base64url")}`;
}

// Fixed per module load so two tokens minted a second apart share auth_time.
const AUTH_TIME = Math.floor(Date.now() / 1000) - 5;

export function goodClaims(over: Claims = {}): Claims {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: "https://appleid.apple.com",
    aud: SERVICES_ID,
    sub: "001234.abcdef.5678",
    iat: now,
    exp: now + 600,
    auth_time: AUTH_TIME,
    ...over,
  };
}

export type AppleMock = {
  redeemBodies: URLSearchParams[];
  revokeBodies: URLSearchParams[];
  /** Set to change what /auth/token returns. */
  redeem: () => Response | Promise<Response>;
  revoke: () => Response | Promise<Response>;
  jwksCalls: number;
};

/** Routes global fetch to fake Apple endpoints. */
export function installAppleFetch(handlers: Partial<Pick<AppleMock, "redeem" | "revoke">> = {}): AppleMock {
  const mock: AppleMock = {
    redeemBodies: [],
    revokeBodies: [],
    jwksCalls: 0,
    redeem: handlers.redeem ?? (() => new Response("{}", { status: 400 })),
    revoke: handlers.revoke ?? (() => new Response("", { status: 200 })),
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.endsWith("/auth/keys")) {
        mock.jwksCalls++;
        return new Response(JSON.stringify({ keys: [jwkPublic] }), { status: 200 });
      }
      if (u.endsWith("/auth/token")) {
        mock.redeemBodies.push(new URLSearchParams(String(init?.body)));
        return mock.redeem();
      }
      if (u.endsWith("/auth/revoke")) {
        mock.revokeBodies.push(new URLSearchParams(String(init?.body)));
        return mock.revoke();
      }
      throw new Error(`unexpected fetch ${u}`);
    }),
  );
  return mock;
}

export const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
