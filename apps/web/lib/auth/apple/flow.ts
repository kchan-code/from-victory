import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { alertAppleRevokeFailure, revokeAppleRefreshToken } from "./revoke";
import { storeAppleRefreshToken } from "./store";

// =============================================================================
// Shared sign-in steps for the web callback, iOS native action and Android
// handoff completion (spec §5.4 rule 4 + "Failure handling").
// =============================================================================

type AuthLike = Pick<SupabaseClient["auth"], "signInWithIdToken" | "getUser" | "signOut">;
export type SupabaseLike = { auth: AuthLike; from: SupabaseClient["from"] };

/**
 * signInWithIdToken (raw nonce to Supabase; Apple already saw the SHA-256),
 * then binding rule 4: the session user's `apple` identity provider id must
 * equal the verified `sub`. Reads only the identity provider id, never
 * the provider's profile payload (§5.8).
 */
export async function signInWithAppleAndCheckIdentity(
  supabase: SupabaseLike,
  args: { idToken: string; rawNonce: string; sub: string },
): Promise<{ ok: true; userId: string } | { ok: false }> {
  try {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: args.idToken,
      nonce: args.rawNonce,
    });
    if (error) return { ok: false };

    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) return { ok: false };

    const match = (data.user.identities ?? []).some((i) => {
      if (i.provider !== "apple") return false;
      // GoTrue returns the provider's subject as the identity `id`
      // (`provider_id` on newer API versions). Both carry the Apple sub.
      const providerId = (i as { provider_id?: string }).provider_id ?? i.id;
      return providerId === args.sub;
    });
    return match ? { ok: true, userId: data.user.id } : { ok: false };
  } catch {
    return { ok: false };
  }
}

/** Fail-closed teardown: revoke the redeemed token, end any session just created. */
export async function failClosed(
  supabase: SupabaseLike,
  args: { refreshToken?: string; clientId: string },
): Promise<void> {
  if (args.refreshToken) {
    const revoked = await revokeAppleRefreshToken(args.refreshToken, args.clientId);
    if (!revoked) alertAppleRevokeFailure("revoke failed after a rejected sign-in", {});
  }
  try {
    await supabase.auth.signOut();
  } catch {
    /* best effort; the cookie is cleared by the redirect path too */
  }
}

/**
 * Sign in + identity check + durable token store, in that order, for flows
 * where we hold the refresh token directly (web callback, iOS native).
 * On ANY failure: revoke + sign out (no Apple account left signed in without
 * a stored credential).
 */
export async function establishAppleSession(
  supabase: SupabaseLike,
  args: { idToken: string; rawNonce: string; sub: string; clientId: string; refreshToken: string },
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const signedIn = await signInWithAppleAndCheckIdentity(supabase, args);
  if (!signedIn.ok) {
    await failClosed(supabase, { refreshToken: args.refreshToken, clientId: args.clientId });
    return { ok: false };
  }
  try {
    await storeAppleRefreshToken({
      userId: signedIn.userId,
      clientId: args.clientId,
      sub: args.sub,
      refreshToken: args.refreshToken,
    });
  } catch {
    await failClosed(supabase, { refreshToken: args.refreshToken, clientId: args.clientId });
    return { ok: false };
  }
  return signedIn;
}
