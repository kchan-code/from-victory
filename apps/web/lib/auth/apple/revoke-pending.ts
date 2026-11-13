import "server-only";

import { REVOKE_INLINE_ATTEMPTS } from "./config";
import { revokeAppleTokensWithRetry } from "./revoke";

/**
 * Integration point for FV-671's pending-account paths (under-18 reject,
 * cancel, reaper; spec §5.2). FV-671 ships a no-op stub of this exact name;
 * its callers should import this implementation instead.
 *
 * `ok` is false when any stored token could not be revoked, so the tombstone
 * stays and the reaper retries. Alerts are the caller's concern (the reaper
 * raises one after its fifth failed run); none is raised here.
 */
export async function revokeAppleTokensForPendingDeletion(
  userId: string,
): Promise<{ ok: boolean }> {
  const r = await revokeAppleTokensWithRetry(userId, REVOKE_INLINE_ATTEMPTS);
  return { ok: r.allOk };
}
