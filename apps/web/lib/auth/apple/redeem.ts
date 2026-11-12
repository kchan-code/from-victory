import "server-only";

import { APPLE_TOKEN_URL } from "./config";
import { mintAppleClientSecret } from "./client-secret";

export class AppleRedeemError extends Error {
  constructor(public readonly code: string) {
    super(code); // never include Apple's response body (may echo credentials)
    this.name = "AppleRedeemError";
  }
}

export type RedeemedGrant = { idToken: string; refreshToken: string };

/**
 * Redeems an authorization code at /auth/token with the SAME client_id the
 * code was issued for (spec §5.4 rule 2). `redirectUri` is passed on the web /
 * Android flows (it was part of the authorize request); omitted on iOS native.
 */
export async function redeemAppleCode(args: {
  code: string;
  clientId: string;
  redirectUri?: string;
}): Promise<RedeemedGrant> {
  const body = new URLSearchParams({
    client_id: args.clientId,
    client_secret: mintAppleClientSecret(args.clientId),
    code: args.code,
    grant_type: "authorization_code",
  });
  if (args.redirectUri) body.set("redirect_uri", args.redirectUri);

  let res: Response;
  try {
    res = await fetch(APPLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AppleRedeemError("unreachable");
  }
  if (!res.ok) throw new AppleRedeemError("rejected");

  const json = (await res.json().catch(() => null)) as {
    id_token?: unknown;
    refresh_token?: unknown;
  } | null;
  if (
    !json ||
    typeof json.id_token !== "string" ||
    typeof json.refresh_token !== "string" ||
    !json.id_token ||
    !json.refresh_token
  ) {
    throw new AppleRedeemError("malformed");
  }
  return { idToken: json.id_token, refreshToken: json.refresh_token };
}
