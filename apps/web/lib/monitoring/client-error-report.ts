/**
 * First-party client error payload (FV-729).
 *
 * Shared by the browser reporter and POST /api/client-error. Imported from
 * Client Components — no database, cookies, or server-only code.
 *
 * Privacy contract (kids-privacy-officer reviews this shape):
 *   - No user id, no session, no athlete content, no free-text journal.
 *   - `route` is a path. Query strings are dropped. UUID segments become `:id`.
 *   - `message` is optional. It is truncated and stripped of emails, ids,
 *     bearer tokens, and secret-shaped pairs before it can reach an alert.
 *   - Unknown fields (userId, email, shell spoof, stack) are ignored.
 */

const MAX_MESSAGE = 160;
const MAX_ROUTE = 200;

const UUID_EXACT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_ANY =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const ROUTE_SEGMENT = /^[a-z0-9][a-z0-9-]{0,63}$/;
const DIGEST = /^[A-Za-z0-9_-]{1,80}$/;
const BUILD = /^[a-f0-9]{7,40}$/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER = /bearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const SECRET_PAIR =
  /\b(password|token|secret|code|authorization|cookie|session)\b\s*[:=]\s*\S+/gi;
const LONG_TOKEN = /\b[A-Za-z0-9+/=_-]{40,}\b/g;

export type ClientErrorReport = {
  route: string;
  digest?: string;
  build?: string;
  message?: string;
};

export function sanitizeRoute(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/") || path.length > MAX_ROUTE) return null;
  if (path.includes("@") || path.includes("\\") || path.includes(" ")) {
    return null;
  }

  const safe: string[] = [];
  for (const part of path.split("/")) {
    if (part.length === 0) continue;
    if (part.includes(".")) return null;
    const normalized = part.toLowerCase();
    if (UUID_EXACT.test(normalized) || !ROUTE_SEGMENT.test(normalized)) {
      safe.push(":id");
    } else {
      safe.push(normalized);
    }
  }
  return `/${safe.join("/")}`;
}

/** Truncate and strip structured PII. Returns undefined when nothing remains. */
export function redactClientErrorMessage(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const cleaned = raw
    .replace(/https?:\/\/\S+/gi, (url) => url.split("?")[0] ?? "")
    .replace(EMAIL, "[email]")
    .replace(UUID_ANY, "[id]")
    .replace(BEARER, "bearer [redacted]")
    .replace(SECRET_PAIR, "$1=[redacted]")
    .replace(LONG_TOKEN, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE);
  return cleaned.length > 0 ? cleaned : undefined;
}

export function parseClientErrorReport(input: unknown): ClientErrorReport | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const body = input as Record<string, unknown>;
  const route = sanitizeRoute(body.route);
  if (!route) return null;

  const report: ClientErrorReport = { route };
  if (typeof body.digest === "string" && DIGEST.test(body.digest)) {
    report.digest = body.digest;
  }
  if (typeof body.build === "string" && BUILD.test(body.build)) {
    report.build = body.build.toLowerCase();
  }
  const message = redactClientErrorMessage(body.message);
  if (message) report.message = message;
  return report;
}

/**
 * Browser Origin check for the report endpoint. Missing Origin is allowed
 * (some WebViews omit it). A present Origin must be this app, localhost, or
 * the configured site URL — not an arbitrary third party.
 */
export function isAllowedErrorOrigin(
  origin: string | null,
  siteUrl: string | undefined,
): boolean {
  if (!origin) return true;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  const host = parsed.host.toLowerCase();
  if (host === "localhost" || host.startsWith("localhost:")) return true;
  if (host === "www.fromvictoryapp.com" || host === "fromvictoryapp.com") {
    return true;
  }
  if (!siteUrl) return false;
  try {
    return new URL(siteUrl).host.toLowerCase() === host;
  } catch {
    return false;
  }
}
