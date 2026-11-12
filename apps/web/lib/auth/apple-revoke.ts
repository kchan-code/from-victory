import "server-only";

/**
 * Seam used by every pending-account deletion path (under-18, cancel, reaper):
 * revoke, THEN finalize_pending_deletion. FV-673 supplies the implementation.
 * `ok: false` → the caller keeps the tombstone so the reaper retries.
 */
export { revokeAppleTokensForPendingDeletion } from "./apple/revoke-pending";
