import "server-only";

/**
 * Hook: revoke a user's Sign in with Apple authorization before their
 * UNESTABLISHED account is deleted (spec §5.5 "Revoke before every delete",
 * App Store guideline 5.1.1(v) / TN3194).
 *
 * FV-671 (SSO A1) has NO Apple code, so this is a deliberate no-op: nothing has
 * been stored yet, so there is nothing to revoke. It exists now so every
 * pending-account deletion path (under-18, cancel, reaper) already calls the
 * right seam in the right order — revoke, THEN finalize_pending_deletion — and
 * FV-673 only has to fill in the body.
 *
 * Contract FV-673 must keep:
 *   - `ok: false` means "revoke did not succeed": the caller KEEPS the tombstone
 *     (no finalize) so the reaper retries, and shows the manual-revoke
 *     instruction.
 *   - Never log the token or the user's email.
 *
 * TODO(FV-673): read private.apple_signin_tokens (service-side), call Apple's
 * revoke endpoint per row's client_id with the stored refresh token, delete the
 * row on success, and return { ok: false } on any failure.
 */
export async function revokeAppleTokensForPendingDeletion(
  _userId: string,
): Promise<{ ok: boolean; revoked: number }> {
  return { ok: true, revoked: 0 };
}
