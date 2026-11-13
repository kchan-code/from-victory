import { randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import {
  APPLE_AUTHORIZE_URL,
  expectedClientId,
  isAppleServerConfigured,
  isAppleSignInEntryAllowed,
  SSO_PREVIEW_COOKIE,
} from "@/lib/auth/apple/config";
import { appleRateLimited } from "@/lib/auth/apple/rate-limit";
import { hashNonce } from "@/lib/auth/apple/verify";
import {
  APPLE_CHALLENGE_COOKIE,
  APPLE_NONCE_COOKIE,
  APPLE_STATE_COOKIE,
  appleCookieOptions,
  appleRedirectUri,
} from "@/lib/auth/apple/web-flow";

// /auth/apple/start — step 1 of the web / Android Apple flow (spec §5.4).
// GET. Off => 404 (rollback level 1). Misconfigured / rate-limited / bad input
// => back to /signin?error=oauth with nothing set.

const CHALLENGE_RE = /^[A-Za-z0-9_-]{43}$/; // base64url SHA-256, no padding

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const isAndroid = params.get("app") === "android";
  const surface = isAndroid ? "android" : "web";

  if (!isAppleSignInEntryAllowed(surface, request.cookies.get(SSO_PREVIEW_COOKIE)?.value)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const fail = () => NextResponse.redirect(new URL("/signin?error=oauth", base), 303);

  const clientId = expectedClientId(surface);
  if (!clientId || !isAppleServerConfigured(surface)) return fail();

  let challenge: string | null = null;
  if (isAndroid) {
    challenge = params.get("challenge");
    if (!challenge || !CHALLENGE_RE.test(challenge)) return fail();
  }

  if (await appleRateLimited("apple_signin")) return fail();

  const state = randomBytes(32).toString("base64url");
  const rawNonce = randomBytes(32).toString("base64url");

  const authorize = new URL(APPLE_AUTHORIZE_URL);
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", appleRedirectUri(base));
  authorize.searchParams.set("response_type", "code id_token");
  authorize.searchParams.set("response_mode", "form_post");
  authorize.searchParams.set("scope", "email");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("nonce", hashNonce(rawNonce));

  const res = NextResponse.redirect(authorize, 303);
  res.cookies.set(APPLE_STATE_COOKIE, state, appleCookieOptions());
  res.cookies.set(APPLE_NONCE_COOKIE, rawNonce, appleCookieOptions());
  if (challenge) res.cookies.set(APPLE_CHALLENGE_COOKIE, challenge, appleCookieOptions());
  res.headers.set("Cache-Control", "no-store");
  return res;
}
