import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Parent-facing athlete account state (FV-630).
 *
 *   not_invited    — no username, never signed in, no live code
 *   needs_username — no username, but the account HAS signed in: an athlete
 *                    paired before usernames existed (FV-320) who trains on a
 *                    device today. An invite adds a username (and a new
 *                    password) so they can sign in on any phone.
 *   pending        — no username yet; a live invite code is out
 *   ready          — the athlete finished setup (username + password)
 *
 * `pendingRecovery` is set when a ready athlete has a live password-reset
 * code out. Reads through get_athlete_invite_statuses(), which is scoped to
 * auth.uid()'s linked athletes and returns metadata only — never a code, a
 * hash, or the username.
 */
export type InviteState = "not_invited" | "needs_username" | "pending" | "ready";

export interface AthleteInviteStatus {
  state: InviteState;
  /** Expiry of the live invite (pending) or recovery code (ready), if any. */
  expiresAt: string | null;
  pendingRecovery: boolean;
}

export const NOT_INVITED_STATUS: AthleteInviteStatus = {
  state: "not_invited",
  expiresAt: null,
  pendingRecovery: false,
};

export function toInviteStatus(row: {
  account_ready: boolean;
  signed_in_before: boolean;
  pending_purpose: "invite" | "recovery" | null;
  pending_expires_at: string | null;
}): AthleteInviteStatus {
  if (row.account_ready) {
    return {
      state: "ready",
      expiresAt: row.pending_purpose ? row.pending_expires_at : null,
      pendingRecovery: row.pending_purpose !== null,
    };
  }
  if (row.pending_purpose !== null) {
    return {
      state: "pending",
      expiresAt: row.pending_expires_at,
      pendingRecovery: false,
    };
  }
  if (row.signed_in_before) {
    return { state: "needs_username", expiresAt: null, pendingRecovery: false };
  }
  return NOT_INVITED_STATUS;
}

/**
 * Status for every athlete linked to the signed-in parent. A failed read is
 * returned as `null` (the caller renders a neutral fallback) — never guessed.
 */
export async function getInviteStatusMap(): Promise<Map<
  string,
  AthleteInviteStatus
> | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_athlete_invite_statuses");
    if (error) {
      console.error(`[invites.status] status rpc failed: ${error.message}`);
      return null;
    }
    const map = new Map<string, AthleteInviteStatus>();
    for (const row of data ?? []) {
      map.set(row.athlete_id, toInviteStatus(row));
    }
    return map;
  } catch (err) {
    // A status read must never take the dashboard down.
    console.error(
      `[invites.status] status rpc threw: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}
