/**
 * `next` allow-list for /auth/callback (FV-672; spec FV-569 §5.3).
 * Pure + exported so it is unit-testable. Anything not on the list resolves to
 * null and the caller falls back to the role home.
 */
export const CALLBACK_NEXT_ALLOWLIST = [
  "/welcome",
  "/dashboard",
  "/athlete",
  "/subscribe",
  "/reset-password",
] as const;

/**
 * Returns a same-origin `pathname[?search]` for an allow-listed `next`, else
 * null. Rejects protocol-relative (`//evil`), backslash tricks (`/\evil`),
 * absolute URLs, control characters, and any path off the allow-list. A path
 * is allowed when it equals an entry or sits under it (`/athlete/pregame`).
 */
export function sanitizeCallbackNext(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  // eslint-disable-next-line no-control-regex -- reason: reject control chars in a redirect target
  if (raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw, "https://placeholder.invalid");
  } catch {
    return null;
  }
  if (parsed.origin !== "https://placeholder.invalid") return null;

  const allowed = CALLBACK_NEXT_ALLOWLIST.some(
    (p) => parsed.pathname === p || parsed.pathname.startsWith(`${p}/`),
  );
  if (!allowed) return null;
  return `${parsed.pathname}${parsed.search}`;
}

/** The recovery (password reset) callback: keeps its `?reset=invalid` failure mode. */
export function isRecoveryNext(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const safe = sanitizeCallbackNext(raw);
  return safe !== null && new URL(safe, "https://x.invalid").pathname === "/reset-password";
}
