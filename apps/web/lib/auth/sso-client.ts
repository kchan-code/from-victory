// Client-safe helpers for the SSO entry points (FV-674, spec FV-569 §5.3/§5.4).
// No server-only imports: this runs in the browser / WebView.

import { NATIVE_AUTH_CALLBACK_PREFIX } from "@/lib/native/auth";

export const APP_CALLBACK_URL = NATIVE_AUTH_CALLBACK_PREFIX;

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 32 random bytes as base64url: 43 chars. */
export function randomBase64Url(byteLength = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(digest);
}

/** Apple nonce: SHA-256 hex of the raw nonce (matches server hashNonce). */
export async function sha256Hex(input: string): Promise<string> {
  return Array.from(await sha256(input), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Android handoff challenge: SHA-256(verifier), base64url, no padding (43 chars). */
export async function androidChallengeFor(verifier: string): Promise<string> {
  return toBase64Url(await sha256(verifier));
}

/** Parse the callback URL an in-app session returns. Null if it isn't ours. */
export function parseAppCallback(raw: string): URLSearchParams | null {
  if (!raw.startsWith(APP_CALLBACK_URL)) return null;
  try {
    return new URL(raw).searchParams;
  } catch {
    return null;
  }
}
