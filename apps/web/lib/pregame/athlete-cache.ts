/**
 * athlete-cache.ts (FV-154)
 *
 * Thin module for the `fv_athlete_cache` localStorage entry used by the
 * offline-tolerant pregame shell (FV-107).
 *
 * WHY A SEPARATE MODULE
 * ---------------------
 * `clearAthleteCache` needs to be imported by the sign-out button component
 * and the /signin mount effect. Importing it from `PregameClientShell` would
 * pull PregameFlow + the Supabase browser client into those bundles — heavy
 * and wrong. Extracting it here keeps the import lean (zero React, zero
 * Supabase; a 300-byte module).
 *
 * PII NOTE
 * --------
 * fv_athlete_cache is { sport, firstName } — a first name and sport string.
 * It lives in localStorage (device-local, never traverses the network, never
 * enters any SW cache). It must be cleared on sign-out and device re-pair so
 * a prior athlete's name does not survive a device-account switch on shared
 * hardware. See also PregameClientShell (FV-107) for the full PII policy.
 *
 * GUARDS
 * ------
 * All functions are `typeof window` guarded — this module is safe to import
 * from any Next.js file (Server Component, Server Action, client component).
 * On the server the functions are no-ops.
 */

export const ATHLETE_CACHE_KEY = "fv_athlete_cache";

/** Sport values the cache accepts. Must stay in sync with the Sport union. */
type CachedSport = "hockey" | "basketball";

export type AthleteCache = {
  sport: CachedSport;
  firstName: string;
};

/**
 * Read the athlete cache. Returns null on miss, invalid shape, or SSR.
 */
export function readAthleteCache(): AthleteCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ATHLETE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).sport !== "string" ||
      typeof (parsed as Record<string, unknown>).firstName !== "string"
    ) {
      return null;
    }
    const sport = (parsed as Record<string, unknown>).sport as string;
    if (sport !== "hockey" && sport !== "basketball") return null;
    return {
      sport: sport as CachedSport,
      firstName: (parsed as Record<string, unknown>).firstName as string,
    };
  } catch {
    return null;
  }
}

/**
 * Write the athlete cache. No-op on SSR or when localStorage is unavailable
 * (private browsing, quota exceeded).
 */
export function writeAthleteCache(cache: AthleteCache): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ATHLETE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Non-fatal: private browsing or storage quota. Online path still works;
    // offline path won't have a cache on this device.
  }
}

/**
 * Clear the athlete cache. Call this on sign-out and device re-pair so a
 * prior athlete's name doesn't survive a device-account switch.
 *
 * No-op on SSR. Never throws.
 */
export function clearAthleteCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ATHLETE_CACHE_KEY);
  } catch {
    // ignore
  }
}
