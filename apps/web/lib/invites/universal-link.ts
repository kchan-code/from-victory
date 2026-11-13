/**
 * Invite universal-link contract (FV-630) — PURE, safe in client + server.
 *
 * Link shape:  https://www.fromvictoryapp.com/invite#code=7KQ2-M9XD-4HTR-PW3B
 *
 * The code rides in the URL FRAGMENT, not the query string, on purpose:
 * browsers never send the fragment to the server, so the bearer code stays
 * out of Vercel request logs, CDN logs, Referer headers, and link-preview
 * fetches (Messages unfurls the page without it). The /invite page and the
 * native handler read it client-side.
 *
 * The iOS app claims ONLY this path via apple-app-site-association (see
 * app/.well-known/apple-app-site-association/route.ts) and the native handler
 * (components/native/NativeInviteLinkHandler.tsx) accepts ONLY URLs that pass
 * `parseInviteUniversalLink` below — exact https scheme, exact host, no
 * credentials or port, exact path, no query, and either no fragment or a
 * single well-formed `code=` fragment.
 */

import { formatInviteCode, normalizeInviteCode } from "./code";

/** The one host the app associates with (apex 301s to www in vercel.json). */
export const INVITE_LINK_HOST = "www.fromvictoryapp.com";
export const INVITE_PATH = "/invite";

/** Build the shareable invite URL for a canonical code. */
export function buildInviteUrl(origin: string, canonicalCode: string): string {
  return `${origin.replace(/\/+$/, "")}${INVITE_PATH}#code=${formatInviteCode(canonicalCode)}`;
}

/** In-app path for a canonical code (what the WebView navigates to). */
export function inviteAppPath(canonicalCode: string | null): string {
  return canonicalCode
    ? `${INVITE_PATH}#code=${formatInviteCode(canonicalCode)}`
    : INVITE_PATH;
}

/**
 * Read a code from a location hash ("#code=...") — used by the /invite page.
 * Returns the canonical code or null.
 */
export function readCodeFromHash(hash: string | null | undefined): string | null {
  if (!hash) return null;
  const m = /^#code=([A-Za-z0-9-]{16,19})$/.exec(hash);
  return m ? normalizeInviteCode(m[1]) : null;
}

/**
 * Strictly validate a URL delivered to the native app (universal link or
 * launch URL). Returns the same-origin in-app path to navigate to, or null to
 * ignore the URL entirely.
 */
export function parseInviteUniversalLink(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 256) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.hostname !== INVITE_LINK_HOST) return null;
  if (url.port !== "") return null;
  if (url.username !== "" || url.password !== "") return null;
  if (url.pathname !== INVITE_PATH && url.pathname !== `${INVITE_PATH}/`) {
    return null;
  }
  if (url.search !== "") return null;

  if (url.hash === "") return inviteAppPath(null);
  const code = readCodeFromHash(url.hash);
  return code ? inviteAppPath(code) : null;
}
