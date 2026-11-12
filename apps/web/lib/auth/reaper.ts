import "server-only";

import { PURGE_MAX_REVOKE_ATTEMPTS, REVOKE_INLINE_ATTEMPTS } from "@/lib/auth/apple/config";
import { purgeAppleHandoffs, type PurgeSummary } from "@/lib/auth/apple/handoff";
import { revokeAppleTokensWithRetry } from "@/lib/auth/apple/revoke";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Cleanup reaper (FV-674, SSO A5; spec FV-569 §5.2 + §5.7).
 *
 * Closes accounts that signed up (email/Apple/Google) but never completed
 * onboarding, plus tombstoned accounts whose inline revoke/finalize failed.
 *
 * Per candidate id (found by public.reaper_find_candidates, advisory only):
 *   1. no tombstone yet -> reaper_mark (re-checks is_unestablished under the
 *      per-user lock; `not_pending` -> skip, nothing is touched)
 *   2. revoke Apple tokens (up to REVOKE_INLINE_ATTEMPTS in this run)
 *   3. revoke ok -> finalize_pending_deletion (re-checks under the lock; the
 *      ONLY delete path)
 *      revoke failed -> reaper_bump_attempts; once attempts >= 5 failed runs,
 *      finalize WITHOUT revoking (Apple TN3194: the deletion must be fulfilled;
 *      finalize still re-checks) and raise an alert (internal id prefix only)
 * Then the Apple handoff purge (§5.4 step 4).
 *
 * NOT gated by any SSO_* flag: the reaper, purge and every deletion path stay
 * active when sign-in entry points are switched off (spec §13 rollback).
 *
 * Logging/alerts: counts and an 8-char internal id prefix only. Never an email,
 * provider data, token, birthdate or any auth metadata.
 */

/** Hard cap per run (spec §5.7). */
export const REAPER_CAP = 100;

export type ReaperSummary = {
  dryRun: boolean;
  candidates: number;
  tombstoned: number;
  /** Dry run only: untombstoned candidates a live run would mark. */
  wouldMark: number;
  marked: number;
  skippedNotPending: number;
  deleted: number;
  /** Finalize reported not_pending / no_tombstone (nothing deleted). */
  finalizeNoop: number;
  revokeFailed: number;
  forced: number;
  errors: number;
  purge: PurgeSummary | null;
};

type Candidate = { user_id: string; tombstoned: boolean; attempts: number };

/** Dry run is the default; only the literal string "false" goes live. */
export function isReaperDryRun(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.REAPER_DRY_RUN ?? "").trim().toLowerCase() !== "false";
}

function emptySummary(dryRun: boolean): ReaperSummary {
  return {
    dryRun, candidates: 0, tombstoned: 0, wouldMark: 0, marked: 0, skippedNotPending: 0,
    deleted: 0, finalizeNoop: 0, revokeFailed: 0, forced: 0, errors: 0, purge: null,
  };
}

export async function runReaper(dryRun: boolean): Promise<ReaperSummary> {
  const s = emptySummary(dryRun);
  const service = createServiceClient();

  const { data, error } = await service.rpc("reaper_find_candidates", { p_limit: REAPER_CAP });
  if (error) {
    s.errors++;
    console.error(`[cron/reap-incomplete-signups] finder failed (code=${error.code ?? "n/a"})`);
    return s;
  }
  const candidates = ((data ?? []) as Candidate[]).slice(0, REAPER_CAP);
  s.candidates = candidates.length;
  s.tombstoned = candidates.filter((c) => c.tombstoned).length;

  if (dryRun) {
    // Computes counts only. Writes nothing: no mark, no revoke, no delete and
    // no handoff purge (the purge deletes rows and calls Apple).
    s.wouldMark = s.candidates - s.tombstoned;
    return s;
  }

  for (const c of candidates) {
    try {
      await processOne(service, c, s);
    } catch {
      s.errors++;
    }
  }

  try {
    s.purge = await purgeAppleHandoffs();
  } catch {
    s.errors++;
  }
  return s;
}

type Service = ReturnType<typeof createServiceClient>;

async function finalize(service: Service, id: string, s: ReaperSummary): Promise<boolean> {
  const { data, error } = await service.rpc("finalize_pending_deletion", { p_user_id: id });
  if (error) {
    s.errors++;
    console.error(
      `[cron/reap-incomplete-signups] finalize failed (code=${error.code ?? "n/a"}); tombstone kept`,
    );
    return false;
  }
  if (data === "deleted") s.deleted++;
  else s.finalizeNoop++;
  return true;
}

async function processOne(service: Service, c: Candidate, s: ReaperSummary): Promise<void> {
  const id = c.user_id;
  let attempts = c.attempts;

  if (!c.tombstoned) {
    const { data, error } = await service.rpc("reaper_mark", { p_user_id: id });
    if (error) {
      s.errors++;
      return;
    }
    if (data === "not_pending") {
      s.skippedNotPending++;
      return;
    }
    s.marked++;
  }

  // Attempts already at the limit (a previous run failed at finalize): do not
  // keep retrying the external call, fulfil the deletion.
  let force = attempts >= PURGE_MAX_REVOKE_ATTEMPTS;

  if (!force) {
    let revoked = false;
    try {
      revoked = (await revokeAppleTokensWithRetry(id, REVOKE_INLINE_ATTEMPTS)).allOk;
    } catch {
      revoked = false;
    }
    if (!revoked) {
      s.revokeFailed++;
      const { data, error } = await service.rpc("reaper_bump_attempts", { p_user_id: id });
      if (error) {
        s.errors++;
        return;
      }
      attempts = typeof data === "number" ? data : attempts + 1;
      if (attempts < PURGE_MAX_REVOKE_ATTEMPTS) return; // tombstone stays; next run retries
      force = true;
    }
  }

  const ok = await finalize(service, id, s);
  if (ok && force) {
    s.forced++;
    deliverInBackground(
      notifyError(
        "[apple-signin] pending account closed without confirmed revoke",
        "A pending account was deleted after repeated Apple revoke failures.",
        { user: id.slice(0, 8) },
      ),
    );
  }
}
