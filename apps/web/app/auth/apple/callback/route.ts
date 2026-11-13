import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { bindAppleGrant } from "@/lib/auth/apple/bind";
import {
  ANDROID_CALLBACK_SCHEME_URL,
  expectedClientId,
  isAppleServerConfigured,
  isAppleSignInEnabled,
} from "@/lib/auth/apple/config";
import { establishAppleSession } from "@/lib/auth/apple/flow";
import { purgeAppleHandoffs, writeAppleHandoff } from "@/lib/auth/apple/handoff";
import { resolvePostSignInPath } from "@/lib/auth/apple/post-sign-in";
import { appleRateLimited } from "@/lib/auth/apple/rate-limit";
import { alertAppleRevokeFailure, revokeAppleRefreshToken } from "@/lib/auth/apple/revoke";
import {
  APPLE_CHALLENGE_COOKIE,
  APPLE_COOKIE_NAMES,
  APPLE_NONCE_COOKIE,
  APPLE_STATE_COOKIE,
  appleCookieOptions,
  appleRedirectUri,
} from "@/lib/auth/apple/web-flow";
import { createClient } from "@/lib/supabase/server";

// /auth/apple/callback — Apple's `form_post` target (spec §5.4).
//
// CSRF: this is the ONLY cross-origin POST in the app. Apple posts from
// appleid.apple.com, so no Origin check can apply; the single-use `state`
// cookie (SameSite=None, __Host-) compared to the posted `state` is its CSRF
// defence. (The repo's middleware has no Origin gate; Next's built-in Origin
// check covers Server Actions only, never route handlers.)
//
// Failure rule: anything that fails after a refresh token exists revokes it;
// any session just created is signed out; the user lands on
// /signin?error=oauth. Nothing here logs codes, tokens, nonces, emails or sub.

export const dynamic = "force-dynamic";

function eq(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function clearCookies(res: NextResponse) {
  for (const name of APPLE_COOKIE_NAMES) {
    res.cookies.set(name, "", appleCookieOptions(0));
  }
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const failRedirect = () =>
    clearCookies(NextResponse.redirect(new URL("/signin?error=oauth", base), 303));

  const stateCookie = request.cookies.get(APPLE_STATE_COOKIE)?.value ?? "";
  const nonceCookie = request.cookies.get(APPLE_NONCE_COOKIE)?.value ?? "";
  const challenge = request.cookies.get(APPLE_CHALLENGE_COOKIE)?.value ?? null;
  const surface = challenge ? "android" : "web";

  // Rollback level 1: a disabled surface accepts no new sign-ins.
  if (!isAppleSignInEnabled(surface)) {
    return clearCookies(new NextResponse("Not found", { status: 404 }));
  }

  const clientId = expectedClientId(surface);
  if (!clientId || !isAppleServerConfigured(surface)) return failRedirect();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failRedirect();
  }
  const postedState = form.get("state");
  const code = form.get("code");
  const idToken = form.get("id_token");

  // Rule 5 (web / Android): the posted state must match this browser's cookie.
  if (
    typeof postedState !== "string" ||
    !stateCookie ||
    !nonceCookie ||
    !eq(postedState, stateCookie)
  ) {
    return failRedirect();
  }
  if (typeof code !== "string" || typeof idToken !== "string" || !code || !idToken) {
    return failRedirect(); // includes Apple's `error=user_cancelled_authorize`
  }

  if (await appleRateLimited("apple_signin")) return failRedirect();

  const bound = await bindAppleGrant({
    suppliedIdToken: idToken,
    code,
    rawNonce: nonceCookie,
    clientId,
    redirectUri: appleRedirectUri(base),
  });
  if (!bound.ok) {
    if (bound.hadRefreshToken && !bound.revoked) {
      alertAppleRevokeFailure("revoke failed after a binding failure", {});
    }
    return failRedirect();
  }

  if (surface === "android") {
    // No session here: park the verified credentials behind the verifier.
    try {
      const handoffId = await writeAppleHandoff({
        challenge: challenge as string,
        oauthState: postedState,
        clientId,
        sub: bound.sub,
        idToken: bound.suppliedIdToken,
        rawNonce: nonceCookie,
        refreshToken: bound.refreshToken,
      });
      deliverInBackground(purgeAppleHandoffs());
      const dest = new URL(ANDROID_CALLBACK_SCHEME_URL);
      dest.searchParams.set("handoff", handoffId);
      return clearCookies(NextResponse.redirect(dest, 303));
    } catch {
      if (!(await revokeAppleRefreshToken(bound.refreshToken, clientId))) {
        alertAppleRevokeFailure("revoke failed after a handoff write failure", {});
      }
      return failRedirect();
    }
  }

  // Web: sign in with the cookie-bound client.
  const supabase = createClient();
  const session = await establishAppleSession(supabase, {
    idToken: bound.suppliedIdToken,
    rawNonce: nonceCookie,
    sub: bound.sub,
    clientId,
    refreshToken: bound.refreshToken,
  });
  if (!session.ok) {
    // establishAppleSession already revoked + signed out.
    return failRedirect();
  }

  let path: string;
  try {
    path = await resolvePostSignInPath(supabase, session.userId);
  } catch {
    path = "/";
  }
  return clearCookies(NextResponse.redirect(new URL(path, base), 303));
}
