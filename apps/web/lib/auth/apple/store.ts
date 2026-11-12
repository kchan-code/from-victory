import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

import {
  decryptValue,
  encryptValue,
  handoffAad,
  packEncrypted,
  tokenAad,
  unpackEncrypted,
  type EncryptedValue,
} from "./token-crypto";

// =============================================================================
// Persistence wrappers for private.apple_signin_tokens / _handoffs. The tables
// are only reachable through the service-role-only SQL functions from
// 20261112110000_fv673_apple_signin.sql. Typed locally (the generated
// types.ts is hand-maintained and not touched by this change).
// =============================================================================

type RpcResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;
type Rpc = { rpc: (fn: string, args?: Record<string, unknown>) => RpcResult<unknown> };

function rpcClient(): Rpc {
  // reason: the new functions are not in the hand-maintained generated types.
  return createServiceClient() as unknown as Rpc;
}

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpcClient().rpc(fn, args);
  // Message is a Postgres/PostgREST error string; it never contains token
  // material because tokens are only ever passed as ciphertext.
  if (error) throw new Error(`apple_store:${fn}`);
  return data as T;
}

export type StoredToken = {
  clientId: string;
  sub: string;
  value: EncryptedValue;
};

export async function listStoredTokens(userId: string): Promise<StoredToken[]> {
  const rows = await call<
    {
      client_id: string;
      sub: string;
      ciphertext: string;
      iv: string;
      tag: string;
      key_version: number;
    }[]
  >("list_apple_signin_tokens", { p_user_id: userId });
  return (rows ?? []).map((r) => ({
    clientId: r.client_id,
    sub: r.sub,
    value: { ciphertext: r.ciphertext, iv: r.iv, tag: r.tag, keyVersion: r.key_version },
  }));
}

export function decryptStoredToken(userId: string, t: StoredToken): string {
  return decryptValue(t.value, tokenAad(userId, t.clientId));
}

/** Encrypts and upserts the refresh token for (user, client). Throws on failure. */
export async function storeAppleRefreshToken(args: {
  userId: string;
  clientId: string;
  sub: string;
  refreshToken: string;
}): Promise<void> {
  const enc = encryptValue(args.refreshToken, tokenAad(args.userId, args.clientId));
  await call("upsert_apple_signin_token", {
    p_user_id: args.userId,
    p_client_id: args.clientId,
    p_sub: args.sub,
    p_ciphertext: enc.ciphertext,
    p_iv: enc.iv,
    p_tag: enc.tag,
    p_key_version: enc.keyVersion,
  });
}

export async function deleteStoredToken(userId: string, clientId: string): Promise<void> {
  await call("delete_apple_signin_token", { p_user_id: userId, p_client_id: clientId });
}

// ---- handoffs ---------------------------------------------------------------

export type ClaimedHandoff = {
  claimId: string;
  challenge: string;
  clientId: string;
  sub: string;
  idToken: string; // decrypted
  rawNonce: string; // decrypted
  refreshToken: string; // decrypted
};

export async function createHandoff(args: {
  id: string;
  challenge: string;
  oauthState: string;
  clientId: string;
  sub: string;
  idToken: string;
  rawNonce: string;
  refreshToken: string;
  expiresAt: Date;
}): Promise<void> {
  const aad = handoffAad(args.id);
  const a = encryptValue(args.idToken, aad);
  const b = encryptValue(args.rawNonce, aad);
  const c = encryptValue(args.refreshToken, aad);
  await call("create_apple_handoff", {
    p_id: args.id,
    p_challenge: args.challenge,
    p_oauth_state: args.oauthState,
    p_client_id: args.clientId,
    p_sub: args.sub,
    p_id_token_enc: packEncrypted(a),
    p_nonce_enc: packEncrypted(b),
    p_refresh_enc: packEncrypted(c),
    p_key_version: a.keyVersion,
    p_expires_at: args.expiresAt.toISOString(),
  });
}

/**
 * Atomic claim. Returns null when the handoff is unknown, replayed, already
 * claimed (and not stale), burned or expired. Decrypts after claiming so a
 * decrypt failure is handled by the caller as a transient failure (release).
 */
export async function claimHandoffRow(id: string): Promise<{
  claimId: string;
  challenge: string;
  clientId: string;
  sub: string;
  keyVersion: number;
  idTokenEnc: string;
  nonceEnc: string;
  refreshEnc: string;
} | null> {
  const rows = await call<
    {
      claim_id: string;
      challenge: string;
      client_id: string;
      sub: string;
      id_token_enc: string;
      nonce_enc: string;
      refresh_enc: string;
      key_version: number;
    }[]
  >("claim_apple_handoff", { p_id: id });
  const r = rows?.[0];
  if (!r) return null;
  return {
    claimId: r.claim_id,
    challenge: r.challenge,
    clientId: r.client_id,
    sub: r.sub,
    keyVersion: r.key_version,
    idTokenEnc: r.id_token_enc,
    nonceEnc: r.nonce_enc,
    refreshEnc: r.refresh_enc,
  };
}

export function decryptHandoffField(
  id: string,
  packed: string,
  keyVersion: number,
): string {
  return decryptValue(unpackEncrypted(packed, keyVersion), handoffAad(id));
}

/** Returns the new state ('pending' | 'burned'), or null if the fence failed. */
export async function recordVerifierMismatch(
  id: string,
  claimId: string,
): Promise<"pending" | "burned" | null> {
  const s = await call<string | null>("record_apple_handoff_mismatch", {
    p_id: id,
    p_claim_id: claimId,
  });
  return s === "pending" || s === "burned" ? s : null;
}

export async function releaseHandoff(id: string, claimId: string): Promise<boolean> {
  return Boolean(await call<boolean>("release_apple_handoff", { p_id: id, p_claim_id: claimId }));
}

/**
 * One-transaction transfer: deletes the handoff (fenced by claim_id) and
 * upserts the token. Returns false when the fence failed (nothing changed).
 */
export async function finalizeHandoff(args: {
  handoffId: string;
  claimId: string;
  userId: string;
  clientId: string;
  refreshToken: string;
}): Promise<boolean> {
  const enc = encryptValue(args.refreshToken, tokenAad(args.userId, args.clientId));
  return Boolean(
    await call<boolean>("finalize_apple_handoff", {
      p_handoff_id: args.handoffId,
      p_claim_id: args.claimId,
      p_user_id: args.userId,
      p_ciphertext: enc.ciphertext,
      p_iv: enc.iv,
      p_tag: enc.tag,
      p_key_version: enc.keyVersion,
    }),
  );
}

export type PurgeCandidate = {
  id: string;
  clientId: string;
  refreshEnc: string;
  keyVersion: number;
  revokeAttempts: number;
};

export async function listPurgeCandidates(limit: number): Promise<PurgeCandidate[]> {
  const rows = await call<
    {
      id: string;
      client_id: string;
      refresh_enc: string;
      key_version: number;
      revoke_attempts: number;
    }[]
  >("list_apple_handoffs_for_purge", { p_limit: limit });
  return (rows ?? []).map((r) => ({
    id: r.id,
    clientId: r.client_id,
    refreshEnc: r.refresh_enc,
    keyVersion: r.key_version,
    revokeAttempts: r.revoke_attempts,
  }));
}

export async function recordPurgeRevokeAttempt(id: string): Promise<number> {
  const n = await call<number | null>("record_apple_handoff_revoke_attempt", { p_id: id });
  return typeof n === "number" ? n : 0;
}

export async function deletePurgedHandoff(id: string): Promise<boolean> {
  return Boolean(await call<boolean>("delete_apple_handoff_purged", { p_id: id }));
}
