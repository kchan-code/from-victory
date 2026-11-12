import "server-only";

import { APPLE_RESPONSE_NONCE_ALWAYS_REQUIRED } from "./config";
import { redeemAppleCode, type RedeemedGrant } from "./redeem";
import { revokeAppleRefreshToken } from "./revoke";
import {
  hashNonce,
  verifyAppleIdToken,
  type AppleIdTokenClaims,
} from "./verify";

// =============================================================================
// bindAppleGrant (spec §5.4 "Binding rule" 1-3; rule 5 is the caller's
// same-transaction check; rule 4, the session identity check, runs after
// signInWithIdToken in flow.ts).
//
// Fail-closed: when anything after redemption fails to bind, the redeemed
// refresh token is revoked before returning, so no Apple authorization is
// left dangling.
// =============================================================================

export type BindFailureReason =
  | "supplied_token_invalid" // rule 1 (sig / iss / aud / exp / nonce)
  | "redeem_failed" // rule 2
  | "response_token_invalid" // rule 3 (sig / iss / aud / exp)
  | "sub_mismatch"
  | "aud_mismatch"
  | "nonce_mismatch"
  | "auth_time_mismatch";

export type BindResult =
  | {
      ok: true;
      sub: string;
      clientId: string;
      suppliedIdToken: string;
      refreshToken: string;
    }
  | {
      ok: false;
      reason: BindFailureReason;
      /** true when a redeemed token existed and its revoke was confirmed. */
      revoked: boolean;
      /** true when a token was redeemed (so a failed revoke needs follow-up). */
      hadRefreshToken: boolean;
    };

export async function bindAppleGrant(args: {
  suppliedIdToken: string;
  code: string;
  rawNonce: string;
  /** The client expected for this flow (Services ID web/Android, bundle ID iOS). */
  clientId: string;
  redirectUri?: string;
  /** Test seam; defaults to the real Apple redemption. */
  redeem?: typeof redeemAppleCode;
}): Promise<BindResult> {
  const { suppliedIdToken, code, rawNonce, clientId } = args;
  const redeem = args.redeem ?? redeemAppleCode;

  // Rule 1: supplied token.
  let supplied: AppleIdTokenClaims;
  try {
    supplied = await verifyAppleIdToken(suppliedIdToken, { audience: clientId, rawNonce });
  } catch {
    return { ok: false, reason: "supplied_token_invalid", revoked: false, hadRefreshToken: false };
  }

  // Rule 2: redeem with the SAME client_id.
  let grant: RedeemedGrant;
  try {
    grant = await redeem({ code, clientId, redirectUri: args.redirectUri });
  } catch {
    return { ok: false, reason: "redeem_failed", revoked: false, hadRefreshToken: false };
  }

  const reject = async (reason: BindFailureReason): Promise<BindResult> => ({
    ok: false,
    reason,
    revoked: await revokeAppleRefreshToken(grant.refreshToken, clientId),
    hadRefreshToken: true,
  });

  // Rule 3: response id_token, same verification (aud = redemption client_id).
  let response: AppleIdTokenClaims;
  try {
    response = await verifyAppleIdToken(grant.idToken, { audience: clientId });
  } catch {
    return reject("response_token_invalid");
  }

  if (response.sub !== supplied.sub) return reject("sub_mismatch");
  if (response.aud !== clientId || response.aud !== supplied.aud) {
    return reject("aud_mismatch");
  }

  // nonce: must match whenever the response carries one; strict-ready.
  if (response.nonce !== undefined) {
    if (response.nonce.toLowerCase() !== hashNonce(rawNonce)) {
      return reject("nonce_mismatch");
    }
  } else if (APPLE_RESPONSE_NONCE_ALWAYS_REQUIRED) {
    return reject("nonce_mismatch");
  }

  // auth_time must match when present on both.
  if (
    response.auth_time !== undefined &&
    supplied.auth_time !== undefined &&
    response.auth_time !== supplied.auth_time
  ) {
    return reject("auth_time_mismatch");
  }

  return {
    ok: true,
    sub: supplied.sub,
    clientId,
    suppliedIdToken,
    refreshToken: grant.refreshToken,
  };
}
