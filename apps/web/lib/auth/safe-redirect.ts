/**
 * FV-725 — strict same-origin relative redirect.
 *
 * The WHATWG URL parser treats "\" as "/". `new URL("/\\evil.com", origin)`
 * therefore becomes `https://evil.com/`, and a check of
 * `startsWith("/") && !startsWith("//")` lets that payload through.
 * Percent-decoding can reintroduce the same tricks (`%5C`, `%2F%2F`, and
 * double-encoding), so every decode layer is checked before the value is
 * resolved.
 *
 * Accepts only a relative path that starts with a single "/". Returns that
 * path (pathname + search + hash), or "/" when `candidate` is missing or
 * unsafe. Callers pass the request origin; the resolved URL must have that
 * exact origin.
 */

const MAX_REDIRECT_LENGTH = 2048;

/** How many percent-decodes to peel before refusing to guess. */
const MAX_DECODE_LAYERS = 5;

/** C0, DEL, C1, and the Unicode line/paragraph separators. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/;

/** Encoded C0 / DEL / C1 controls (`%0A`, `%09`, `%7F`, `%80`, …). */
const ENCODED_CONTROL = /%(?:0[0-9a-f]|1[0-9a-f]|7f|8[0-9a-f]|9[0-9a-f])/i;

/** Encoded backslash (`%5C`), any case. */
const ENCODED_BACKSLASH = /%5c/i;

/** Encoded protocol-relative marker (`%2F%2F`), any case. */
const ENCODED_DOUBLE_SLASH = /%2f%2f/i;

const ABSOLUTE_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** A "%" that is not the start of a valid %HH sequence. */
const DANGLING_PERCENT = /%(?![0-9a-f]{2})/i;

function isRelativePath(value: string): boolean {
  if (value.length === 0 || value.length > MAX_REDIRECT_LENGTH) return false;
  if (CONTROL_CHARS.test(value)) return false;
  if (value.includes("\\")) return false;
  if (value.includes("//")) return false;
  if (ENCODED_CONTROL.test(value)) return false;
  if (ENCODED_BACKSLASH.test(value)) return false;
  if (ENCODED_DOUBLE_SLASH.test(value)) return false;
  if (DANGLING_PERCENT.test(value)) return false;
  if (ABSOLUTE_SCHEME.test(value)) return false;
  // A single leading slash. "//" and "/\" are already rejected above;
  // this is the direct "must start with exactly one /" guard.
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  return true;
}

/**
 * Peel percent-encoding so a double-encoded backslash or double-slash cannot
 * hide in a later layer. Null means malformed encoding, or still encoded
 * after the cap — both fail closed.
 */
function decodeLayers(value: string): string[] | null {
  const layers: string[] = [];
  let current = value;
  for (let i = 0; i < MAX_DECODE_LAYERS; i++) {
    layers.push(current);
    if (!/%[0-9a-f]{2}/i.test(current)) return layers;
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return null;
    }
    if (decoded === current) return layers;
    current = decoded;
  }
  return null;
}

/**
 * Safe relative path for a `next` / `redirect` / `returnTo` query value.
 * `origin` is the request origin (`URL.origin`) the redirect must stay on.
 */
export function safeRedirectPath(
  candidate: string | null | undefined,
  origin: string,
): string {
  if (typeof candidate !== "string" || candidate.length === 0) return "/";

  const layers = decodeLayers(candidate);
  if (layers === null || layers.some((layer) => !isRelativePath(layer))) {
    return "/";
  }

  let base: URL;
  let resolved: URL;
  try {
    base = new URL(origin);
    if (base.protocol !== "https:" && base.protocol !== "http:") return "/";
    if (base.username !== "" || base.password !== "") return "/";
    resolved = new URL(candidate, base);
  } catch {
    return "/";
  }

  if (resolved.origin !== base.origin) return "/";
  if (resolved.username !== "" || resolved.password !== "") return "/";

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  if (!isRelativePath(path)) return "/";

  // The path we hand back must itself resolve on the request origin. This
  // is the backstop if a later URL parser still treats a surviving
  // character as a host separator.
  try {
    const again = new URL(path, base);
    if (again.origin !== base.origin) return "/";
    if (again.username !== "" || again.password !== "") return "/";
  } catch {
    return "/";
  }

  return path;
}
