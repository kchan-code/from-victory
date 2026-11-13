/**
 * Stale deployment recovery (FV-731).
 *
 * A store WebView that stays open across a production deploy calls server
 * actions whose ids no longer exist. Next surfaces that as a framework error
 * ("Failed to find Server Action" / "older or newer deployment"). The error
 * boundary reloads once so the athlete picks up the new build, then stops so
 * a real fault cannot loop.
 *
 * This file is imported by Client Components. No server-only imports.
 */

export const STALE_DEPLOYMENT_RELOAD_COOLDOWN_MS = 30_000;

const RELOAD_KEY = "fv-stale-deployment-reload-at";

const STALE_PATTERNS: readonly RegExp[] = [
  /failed to find server action/i,
  /server action [\s\S]{0,120}was not found/i,
  /older or newer deployment/i,
  /failed-to-find-server-action/i,
  /deployment skew/i,
  /unrecognized server action/i,
];

export function isStaleDeploymentError(error: { message?: string }): boolean {
  const message = error.message ?? "";
  if (!message) return false;
  return STALE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * True when this incident has not already hard-reloaded inside the cooldown.
 * A null/NaN timestamp means we have not reloaded yet.
 */
export function shouldReloadForStaleDeployment(
  now: number,
  lastReloadAt: number | null,
): boolean {
  if (lastReloadAt == null || !Number.isFinite(lastReloadAt)) return true;
  return now - lastReloadAt >= STALE_DEPLOYMENT_RELOAD_COOLDOWN_MS;
}

/** Full navigation reload. Split out so the global error screen can call it. */
export function hardReload(): void {
  window.location.reload();
}

/** One hard reload per cooldown. Returns false when the reload is skipped. */
export function reloadOnceForStaleDeployment(now = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.sessionStorage.getItem(RELOAD_KEY);
    const last = stored == null || stored === "" ? null : Number(stored);
    if (!shouldReloadForStaleDeployment(now, last)) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    return false;
  }
  hardReload();
  return true;
}
