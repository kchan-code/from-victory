import "server-only";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";

import { mintAppleClientSecret } from "./client-secret";
import { APPLE_REVOKE_URL, REVOKE_INLINE_ATTEMPTS } from "./config";
import { decryptStoredToken, listStoredTokens } from "./store";

// =============================================================================
// Apple token revocation (spec §5.5). NEVER gated by the SSO_* flags: revoke,
// purge and deletion must keep working with sign-in switched off.
// =============================================================================

/**
 * Revokes one refresh token at /auth/revoke using that token's own client_id.
 * Returns true when Apple confirms the grant is gone (200) or reports it was
 * already invalid (`invalid_grant`, e.g. the user revoked it in Settings).
 * Never throws and never logs the token.
 */
export async function revokeAppleRefreshToken(
  refreshToken: string,
  clientId: string,
): Promise<boolean> {
  try {
    const res = await fetch(APPLE_REVOKE_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: mintAppleClientSecret(clientId),
        token: refreshToken,
        token_type_hint: "refresh_token",
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return true;
    if (res.status === 400) {
      const j = (await res.json().catch(() => null)) as { error?: unknown } | null;
      return j?.error === "invalid_grant";
    }
    return false;
  } catch {
    return false;
  }
}

export type RevokeRowResult = { clientId: string; ok: boolean };
export type RevokeResult = { rows: RevokeRowResult[]; allOk: boolean };

/**
 * Revokes every stored token for `userId`, each with its own client_id.
 * Zero rows is success (nothing to revoke). A failure to read or decrypt a
 * row counts as that row failing. Returns per-row success so callers can apply
 * their own retry / alert policy.
 */
export async function revokeAppleTokens(userId: string): Promise<RevokeResult> {
  let stored;
  try {
    stored = await listStoredTokens(userId);
  } catch {
    return { rows: [{ clientId: "unknown", ok: false }], allOk: false };
  }
  const rows: RevokeRowResult[] = [];
  for (const t of stored) {
    let ok = false;
    try {
      ok = await revokeAppleRefreshToken(decryptStoredToken(userId, t), t.clientId);
    } catch {
      ok = false;
    }
    rows.push({ clientId: t.clientId, ok });
  }
  return { rows, allOk: rows.every((r) => r.ok) };
}

/** Up to `attempts` runs; only rows that failed are retried. */
export async function revokeAppleTokensWithRetry(
  userId: string,
  attempts: number = REVOKE_INLINE_ATTEMPTS,
): Promise<RevokeResult> {
  let last = await revokeAppleTokens(userId);
  for (let i = 1; i < attempts && !last.allOk; i++) {
    last = await revokeAppleTokens(userId);
  }
  return last;
}

/** Alert with static text + internal ids only (no token, no email, no sub). */
export function alertAppleRevokeFailure(label: string, context: Record<string, string>) {
  deliverInBackground(
    notifyError(
      `[apple-signin] ${label}`,
      "Apple token revoke did not succeed; manual follow-up may be needed.",
      context,
    ),
  );
}
