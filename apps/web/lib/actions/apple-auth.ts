"use server";

import { cookies } from "next/headers";

import { z } from "zod";

import { bindAppleGrant } from "@/lib/auth/apple/bind";
import {
  expectedClientId,
  isAppleServerConfigured,
  isAppleSignInEnabled,
  isAppleSignInEntryAllowed,
  SSO_PREVIEW_COOKIE,
} from "@/lib/auth/apple/config";
import { establishAppleSession } from "@/lib/auth/apple/flow";
import { completeAppleHandoff } from "@/lib/auth/apple/handoff";
import { resolvePostSignInPath } from "@/lib/auth/apple/post-sign-in";
import { appleRateLimited } from "@/lib/auth/apple/rate-limit";
import { alertAppleRevokeFailure } from "@/lib/auth/apple/revoke";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Apple sign-in Server Actions (FV-673, spec §5.4). POST Server Actions get
// Next's built-in Origin check. Both gate on the per-surface SSO_* flag
// (rollback level 1) and use the IP-keyed rate-limit buckets from FV-671.
// Errors are generic: they never echo Apple's response or any token.
// =============================================================================

const GENERIC_ERROR = "Apple sign-in didn't work. Please try again.";

export type AppleSignInState =
  | { ok: true; path: string }
  | { ok: false; error: string };

const NativeSchema = z.object({
  identityToken: z.string().min(20).max(8192),
  authorizationCode: z.string().min(8).max(2048),
  // Raw nonce generated in WebView JS; its SHA-256 went to ASAuthorization.
  rawNonce: z.string().min(16).max(256),
});

/**
 * iOS native sheet: the code and token come from the same
 * ASAuthorizationAppleIDCredential within this one request (binding rule 5).
 * client_id = the bundle ID.
 */
export async function appleNativeSignIn(input: {
  identityToken: string;
  authorizationCode: string;
  rawNonce: string;
}): Promise<AppleSignInState> {
  if (!isAppleSignInEntryAllowed("ios", cookies().get(SSO_PREVIEW_COOKIE)?.value)) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const parsed = NativeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const clientId = expectedClientId("ios");
  if (!clientId || !isAppleServerConfigured("ios")) {
    return { ok: false, error: GENERIC_ERROR };
  }
  if (await appleRateLimited("apple_signin")) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const bound = await bindAppleGrant({
    suppliedIdToken: parsed.data.identityToken,
    code: parsed.data.authorizationCode,
    rawNonce: parsed.data.rawNonce,
    clientId,
  });
  if (!bound.ok) {
    if (bound.hadRefreshToken && !bound.revoked) {
      alertAppleRevokeFailure("revoke failed after a binding failure", {});
    }
    return { ok: false, error: GENERIC_ERROR };
  }

  const supabase = createClient();
  const session = await establishAppleSession(supabase, {
    idToken: bound.suppliedIdToken,
    rawNonce: parsed.data.rawNonce,
    sub: bound.sub,
    clientId,
    refreshToken: bound.refreshToken,
  });
  if (!session.ok) return { ok: false, error: GENERIC_ERROR };

  return { ok: true, path: await resolvePostSignInPath(supabase, session.userId) };
}

const HandoffSchema = z.object({
  handoff: z.string().regex(/^[A-Za-z0-9_-]{22,128}$/),
  verifier: z.string().regex(/^[A-Za-z0-9._~-]{32,128}$/),
});

/**
 * Android WebView: redeem the handoff the Auth Tab callback produced. IP
 * rate-limited (`apple_handoff`). The WebView's cookie client creates the
 * session; see completeAppleHandoff for the claim/verifier/finalize order.
 */
export async function appleHandoffComplete(input: {
  handoff: string;
  verifier: string;
}): Promise<AppleSignInState> {
  if (!isAppleSignInEnabled("android")) return { ok: false, error: GENERIC_ERROR };

  const parsed = HandoffSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  if (await appleRateLimited("apple_handoff")) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const result = await completeAppleHandoff(createClient(), parsed.data);
  if (!result.ok) return { ok: false, error: GENERIC_ERROR };
  return { ok: true, path: result.path };
}
