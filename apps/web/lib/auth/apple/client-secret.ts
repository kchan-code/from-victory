import "server-only";

import { createPrivateKey, sign } from "node:crypto";

import { APPLE_ISSUER, getAppleSigningConfig } from "./config";

// =============================================================================
// Apple client secret (ES256 JWT), minted per request with a 5-minute expiry
// (spec §5.4 "Secrets": no 6-month rotation, nothing cached or stored).
// =============================================================================

export class AppleConfigError extends Error {
  constructor() {
    super("apple_not_configured"); // never carries a secret value
    this.name = "AppleConfigError";
  }
}

const b64u = (v: Buffer | string) => Buffer.from(v).toString("base64url");

export function mintAppleClientSecret(
  clientId: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): string {
  const cfg = getAppleSigningConfig();
  if (!cfg) throw new AppleConfigError();

  const header = { alg: "ES256", kid: cfg.keyId, typ: "JWT" };
  const payload = {
    iss: cfg.teamId,
    iat: nowSeconds,
    exp: nowSeconds + 5 * 60,
    aud: APPLE_ISSUER,
    sub: clientId,
  };
  const signingInput = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(payload))}`;

  let signature: Buffer;
  try {
    signature = sign("sha256", Buffer.from(signingInput), {
      key: createPrivateKey(cfg.privateKeyPem),
      dsaEncoding: "ieee-p1363", // JWS ES256 = raw r||s, not DER
    });
  } catch {
    throw new AppleConfigError();
  }
  return `${signingInput}.${b64u(signature)}`;
}
