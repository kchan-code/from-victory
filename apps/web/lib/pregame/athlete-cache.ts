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
 * fv_athlete_cache is { sport, firstName, offlineUntil, verifiedAt } — a
 * first name, a sport string, and two timestamps (FV-625).
 * It lives in localStorage (device-local, never traverses the network, never
 * enters any SW cache). It must be cleared on sign-out and device re-pair so
 * a prior athlete's name does not survive a device-account switch on shared
 * hardware. See also PregameClientShell (FV-107) for the full PII policy.
 *
 * OFFLINE ENTITLEMENT (FV-625, KC policy 2026-11-09: "until the last
 * verified subscription period ends")
 * ------------------------------------------------------------------------
 * PregameClientShell writes, ONLY after an online GET /api/athlete/access
 * said the athlete is entitled:
 *   - `offlineUntil` — the server's answer: the end of the last verified
 *     entitlement period (subscription period / trial end / dated comp
 *     grant), ISO string; or null when the entitlement has no end date
 *     (a perpetual comp grant) or gating is off → NO offline window.
 *   - `verifiedAt`   — this DEVICE's clock (ms) at that check.
 * Offline, the shell opens pregame only when `hasUsableOfflineEntitlement`
 * says so (see it for the exact rule). Pre-FV-625 entries, legacy
 * `entitlementVerified` entries and corrupted values all read as
 * `offlineUntil: null` → no offline pregame until one online check.
 * No level, status, plan or provider is stored on the device.
 *
 * GUARDS
 * ------
 * All functions are `typeof window` guarded — this module is safe to import
 * from any Next.js file (Server Component, Server Action, client component).
 * On the server the functions are no-ops.
 */

import { SUPPORTED_SPORTS, type Sport } from "@/lib/sports";

export const ATHLETE_CACHE_KEY = "fv_athlete_cache";

// Sport values the cache accepts = the athlete-selectable set (SUPPORTED_SPORTS,
// the single source of truth). `import type Sport` is erased at runtime, so this
// module stays lean (no React/Supabase pulled in).
type CachedSport = Sport;

export type AthleteCache = {
  sport: CachedSport;
  firstName: string;
  /** FV-625 — end of the last verified entitlement period (ISO), or null = no offline window. */
  offlineUntil: string | null;
  /** FV-625 — device clock (epoch ms) when that entitlement was verified online. */
  verifiedAt: number | null;
};

/**
 * FV-625 — may this cache entry open pregame WITHOUT an online check right
 * now? All of:
 *   1. an entry exists with a parseable `offlineUntil` and a finite
 *      `verifiedAt` (null / missing / corrupted → no);
 *   2. `nowMs < offlineUntil` — strictly before the period end; AT the end
 *      it has expired;
 *   3. `nowMs >= verifiedAt` — a device clock set back to before the last
 *      online check is treated as tampered/unreliable → no.
 * Limitation (documented, not solvable offline): the device clock is the
 * only clock available offline. Rule 3 stops rolling it back past the last
 * check, but a clock set back to a moment inside [verifiedAt, offlineUntil)
 * still passes. Revocation on the next online contact is unaffected.
 */
export function hasUsableOfflineEntitlement(
  cache: AthleteCache | null,
  nowMs: number = Date.now(),
): boolean {
  if (!cache || cache.offlineUntil === null || cache.verifiedAt === null) {
    return false;
  }
  const untilMs = Date.parse(cache.offlineUntil);
  if (!Number.isFinite(untilMs) || !Number.isFinite(cache.verifiedAt)) {
    return false;
  }
  if (!Number.isFinite(nowMs)) return false;
  return nowMs >= cache.verifiedAt && nowMs < untilMs;
}

function readOfflineUntil(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return Number.isFinite(Date.parse(value)) ? value : null;
}

function readVerifiedAt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

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
    if (!(SUPPORTED_SPORTS as readonly string[]).includes(sport)) return null;
    return {
      sport: sport as CachedSport,
      firstName: (parsed as Record<string, unknown>).firstName as string,
      // FV-625: anything but a parseable date / finite number reads as null
      // (no offline window) — legacy `entitlementVerified` entries included.
      offlineUntil: readOfflineUntil((parsed as Record<string, unknown>).offlineUntil),
      verifiedAt: readVerifiedAt((parsed as Record<string, unknown>).verifiedAt),
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
 * prior athlete's name doesn't survive a device-account switch, and when
 * training access is revoked (FV-625: PregameClientShell on a blocked
 * answer, /athlete/paused on mount) so offline pregame stops unlocking.
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
