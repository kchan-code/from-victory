import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";

import { HANDOFF_TTL_MS, PURGE_MAX_REVOKE_ATTEMPTS } from "./config";
import { signInWithAppleAndCheckIdentity, type SupabaseLike } from "./flow";
import { resolvePostSignInPath } from "./post-sign-in";
import { revokeAppleRefreshToken } from "./revoke";
import {
  claimHandoffRow,
  createHandoff,
  decryptHandoffField,
  deletePurgedHandoff,
  finalizeHandoff,
  listPurgeCandidates,
  recordPurgeRevokeAttempt,
  recordVerifierMismatch,
  releaseHandoff,
} from "./store";

// =============================================================================
// Android handoff (spec §5.4 "Android app"). The callback writes the row; the
// WebView completes it with the verifier. Purge revokes before it deletes.
// =============================================================================

/** >= 128 bits of entropy, URL-safe. */
export function newHandoffId(): string {
  return randomBytes(32).toString("base64url");
}

/** The challenge is SHA-256(verifier), base64url without padding (PKCE S256). */
export function challengeForVerifier(verifier: string): string {
  return createHash("sha256").update(verifier, "utf8").digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Callback side: persist the verified, bound credentials. Throws on failure. */
export async function writeAppleHandoff(args: {
  challenge: string;
  oauthState: string;
  clientId: string;
  sub: string;
  idToken: string;
  rawNonce: string;
  refreshToken: string;
}): Promise<string> {
  const id = newHandoffId();
  await createHandoff({
    id,
    ...args,
    expiresAt: new Date(Date.now() + HANDOFF_TTL_MS),
  });
  return id;
}

export type HandoffCompleteResult =
  | { ok: true; path: string }
  // invalid: replayed / unknown / expired / bad verifier. unavailable: a
  // transient or binding failure (the row is reset so the WebView can retry).
  | { ok: false; error: "invalid" | "unavailable" };

/**
 * `supabase` MUST be the WebView's cookie-bound client. Ordering is the spec's:
 * claim (fenced) -> verifier -> signInWithIdToken + identity check ->
 * finalize (one transaction). The refresh token is never deleted until it has
 * been transferred (finalize) or revoked (purge).
 */
export async function completeAppleHandoff(
  supabase: SupabaseLike,
  args: { handoff: string; verifier: string },
): Promise<HandoffCompleteResult> {
  let claim: Awaited<ReturnType<typeof claimHandoffRow>>;
  try {
    claim = await claimHandoffRow(args.handoff);
  } catch {
    return { ok: false, error: "unavailable" };
  }
  if (!claim) return { ok: false, error: "invalid" };

  const release = async () => {
    try {
      await releaseHandoff(args.handoff, claim!.claimId);
    } catch {
      /* the stale-claim rule (2 min) recovers an unreleased row */
    }
  };
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* best effort */
    }
  };

  // Verifier check. ONLY mismatches count toward attempts.
  if (!safeEqual(challengeForVerifier(args.verifier), claim.challenge)) {
    try {
      await recordVerifierMismatch(args.handoff, claim.claimId);
    } catch {
      await release();
    }
    return { ok: false, error: "invalid" };
  }

  let idToken: string;
  let rawNonce: string;
  let refreshToken: string;
  try {
    idToken = decryptHandoffField(args.handoff, claim.idTokenEnc, claim.keyVersion);
    rawNonce = decryptHandoffField(args.handoff, claim.nonceEnc, claim.keyVersion);
    refreshToken = decryptHandoffField(args.handoff, claim.refreshEnc, claim.keyVersion);
  } catch {
    await release();
    return { ok: false, error: "unavailable" };
  }

  const signedIn = await signInWithAppleAndCheckIdentity(supabase, {
    idToken,
    rawNonce,
    sub: claim.sub,
  });
  if (!signedIn.ok) {
    await signOut();
    await release();
    return { ok: false, error: "unavailable" };
  }

  let transferred = false;
  try {
    transferred = await finalizeHandoff({
      handoffId: args.handoff,
      claimId: claim.claimId,
      userId: signedIn.userId,
      clientId: claim.clientId,
      refreshToken,
    });
  } catch {
    transferred = false;
  }
  if (!transferred) {
    // Stale fence, purge, or storage error: no session without a stored credential.
    await signOut();
    await release(); // fenced: a no-op if the claim is no longer ours
    return { ok: false, error: "unavailable" };
  }

  const path = await resolvePostSignInPath(supabase, signedIn.userId);
  return { ok: true, path };
}

// ---- purge ------------------------------------------------------------------

export type PurgeSummary = { purged: number; kept: number; forced: number };

/**
 * Revoke-then-delete for expired / burned handoffs (spec §5.4 step 4).
 * If revoke fails the row is kept and retried; after PURGE_MAX_REVOKE_ATTEMPTS
 * failed runs it is deleted anyway and an alert (internal row id only) is
 * raised. Not gated by SSO_* flags.
 */
export async function purgeAppleHandoffs(limit = 20): Promise<PurgeSummary> {
  const summary: PurgeSummary = { purged: 0, kept: 0, forced: 0 };
  let candidates: Awaited<ReturnType<typeof listPurgeCandidates>>;
  try {
    candidates = await listPurgeCandidates(limit);
  } catch {
    return summary;
  }

  for (const c of candidates) {
    let revoked = false;
    try {
      const token = decryptHandoffField(c.id, c.refreshEnc, c.keyVersion);
      revoked = await revokeAppleRefreshToken(token, c.clientId);
    } catch {
      revoked = false;
    }

    try {
      if (revoked) {
        if (await deletePurgedHandoff(c.id)) summary.purged++;
        continue;
      }
      const attempts = await recordPurgeRevokeAttempt(c.id);
      if (attempts >= PURGE_MAX_REVOKE_ATTEMPTS) {
        if (await deletePurgedHandoff(c.id)) summary.forced++;
        deliverInBackground(
          notifyError(
            "[apple-signin] handoff purged without confirmed revoke",
            "A handoff row was deleted after repeated Apple revoke failures.",
            { handoff_row: c.id.slice(0, 8) },
          ),
        );
      } else {
        summary.kept++;
      }
    } catch {
      summary.kept++;
    }
  }
  return summary;
}
