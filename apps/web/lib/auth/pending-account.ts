import "server-only";

import { revokeAppleTokensForPendingDeletion } from "@/lib/auth/apple-revoke";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Shared "close a tombstoned, unestablished account" sequence (FV-671, spec
 * §5.2 "App side, after reject_underage or marked"):
 *
 *   1. revoke Apple tokens   (external call; the tombstone blocks completion
 *                             meanwhile) — a no-op stub until FV-673
 *   2. finalize_pending_deletion(uid) with the service client — the ONLY delete
 *      path: it re-checks `private.is_unestablished` under the per-user lock and
 *      deletes in SQL, so an account that became established is never removed
 *   3. sign the session out
 *
 * If revoke or finalize fails the tombstone STAYS and the reaper (A5) retries.
 * Logging is outcomes only — never the user id, email or birthdate.
 */
export type CloseOutcome = {
  /** What finalize_pending_deletion returned, or "skipped" / "error". */
  finalize: "deleted" | "not_pending" | "no_tombstone" | "skipped" | "error";
  /** False when the Apple revoke did not succeed (show the manual instruction). */
  revoked: boolean;
};

export async function closePendingAccount(
  userId: string,
): Promise<CloseOutcome> {
  let revoked = false;
  try {
    revoked = (await revokeAppleTokensForPendingDeletion(userId)).ok;
  } catch {
    revoked = false;
  }

  let finalize: CloseOutcome["finalize"] = "skipped";
  if (revoked) {
    try {
      const service = createServiceClient();
      const { data, error } = await service.rpc("finalize_pending_deletion", {
        p_user_id: userId,
      });
      if (error) {
        finalize = "error";
        console.error(
          `[pending-account] finalize_pending_deletion failed (code=${error.code ?? "n/a"}); tombstone kept for the reaper`,
        );
      } else if (
        data === "deleted" ||
        data === "not_pending" ||
        data === "no_tombstone"
      ) {
        finalize = data;
      } else {
        finalize = "error";
      }
    } catch {
      finalize = "error";
      console.error(
        "[pending-account] finalize_pending_deletion threw; tombstone kept for the reaper",
      );
    }
  } else {
    console.error(
      "[pending-account] Apple revoke did not succeed; tombstone kept, finalize skipped (reaper retries)",
    );
  }

  console.info(
    `[pending-account] closed: finalize=${finalize} revoked=${revoked}`,
  );

  // Always end the session, whatever happened above.
  try {
    await createClient().auth.signOut();
  } catch {
    /* the session cookie is cleared on the next request regardless */
  }

  return { finalize, revoked };
}
