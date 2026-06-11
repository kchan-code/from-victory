/**
 * session-cache.ts (FV-223)
 *
 * Thin module for the `fv_pregame_session` localStorage entry — the
 * "Run it like last time" one-tap re-run feature.
 *
 * WHY A SEPARATE MODULE
 * ---------------------
 * Mirrors athlete-cache.ts (FV-154). `clearPregameSession` must be
 * callable from SignOutButton, ClearCacheOnMount, and any future sign-out
 * path without pulling in React, PregameFlow, or Supabase. Zero deps
 * outside standard types.
 *
 * WHAT IS STORED
 * --------------
 * Content choices only — no PII, no history. Single most-recent setup,
 * overwritten on each completion. Fields stored:
 *
 *   sport          — the sport the setup was built for ("hockey" | "basketball")
 *   need           — Today's Focus selection (NeedToday string)
 *   role           — position/role string, or null for no-ask sports
 *   positivePlays  — array of viz-* slug strings (1–3)
 *   adversity      — Hard Moment string (canonical key)
 *   anchor         — Reset Anchor string
 *   selfTalk       — Self-Talk phrase string
 *   cueWord        — Cue Word string
 *   prayerStyle    — "guided" | "self-guided"
 *
 * None of these are PII. They are athlete training preferences — the same
 * setup options visible on the Review screen — persisted device-locally
 * for UX convenience only. They are never sent over the network, never
 * stored in any SW cache, and must be cleared on sign-out and device
 * re-pair so a prior athlete's choices don't survive a device-account
 * switch on shared hardware.
 *
 * GUARDS
 * ------
 * All functions are `typeof window` guarded — safe to import from any
 * Next.js file (Server Component, Server Action, client component).
 * On the server the functions are no-ops.
 */

export const PREGAME_SESSION_CACHE_KEY = "fv_pregame_session";

// Mirrors the Sport union in sport-registry.ts. Extended as new sports land
// so the session cache accepts every sport the pregame engine supports.
type CachedSport = "hockey" | "basketball" | "baseball";
type CachedPrayerStyle = "guided" | "self-guided";

/**
 * The persisted setup. Every field was chosen by the athlete in the flow;
 * none are PII. Null values mean the field was not set (e.g. role = null
 * for a no-ask sport). We accept null rather than omitting keys so the
 * shape validator can distinguish "field present but null" from "field
 * absent / corrupt" deterministically.
 */
export type PregameSessionCache = {
  sport: CachedSport;
  need: string;
  role: string | null;
  positivePlays: string[];
  adversity: string;
  anchor: string;
  selfTalk: string;
  cueWord: string;
  prayerStyle: CachedPrayerStyle;
};

/**
 * Read the pregame session cache. Returns null on miss, invalid shape,
 * or SSR.
 */
export function readPregameSession(): PregameSessionCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREGAME_SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return validatePregameSession(parsed);
  } catch {
    return null;
  }
}

/**
 * Write the pregame session cache. No-op on SSR or when localStorage is
 * unavailable (private browsing, quota exceeded).
 */
export function writePregameSession(session: PregameSessionCache): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PREGAME_SESSION_CACHE_KEY,
      JSON.stringify(session),
    );
  } catch {
    // Non-fatal: private browsing or storage quota. One-tap re-run simply
    // won't be offered on this device — full setup remains the fallback.
  }
}

/**
 * Clear the pregame session cache. Call this on sign-out and device
 * re-pair alongside clearAthleteCache() so a prior athlete's setup choices
 * don't survive a device-account switch.
 *
 * No-op on SSR. Never throws.
 */
export function clearPregameSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREGAME_SESSION_CACHE_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Internal shape validator
// ---------------------------------------------------------------------------

/**
 * Validate the parsed JSON against the expected PregameSessionCache shape.
 * Returns null on any shape violation so the caller never works with a
 * partially-valid object.
 */
export function validatePregameSession(
  parsed: unknown,
): PregameSessionCache | null {
  if (typeof parsed !== "object" || parsed === null) return null;

  const r = parsed as Record<string, unknown>;

  // sport — must be a supported CachedSport value
  const sport = r["sport"];
  if (sport !== "hockey" && sport !== "basketball" && sport !== "baseball") return null;

  // need — non-empty string
  const need = r["need"];
  if (typeof need !== "string" || need.trim().length === 0) return null;

  // role — string or null (no-ask sports)
  const role = r["role"];
  if (typeof role !== "string" && role !== null) return null;

  // positivePlays — array of strings (may be empty for legacy — accept it;
  // the flow's required guard will catch it during validation)
  const positivePlays = r["positivePlays"];
  if (!Array.isArray(positivePlays)) return null;
  for (const p of positivePlays) {
    if (typeof p !== "string") return null;
  }

  // adversity — non-empty string
  const adversity = r["adversity"];
  if (typeof adversity !== "string" || adversity.trim().length === 0) return null;

  // anchor — non-empty string
  const anchor = r["anchor"];
  if (typeof anchor !== "string" || anchor.trim().length === 0) return null;

  // selfTalk — non-empty string
  const selfTalk = r["selfTalk"];
  if (typeof selfTalk !== "string" || selfTalk.trim().length === 0) return null;

  // cueWord — non-empty string
  const cueWord = r["cueWord"];
  if (typeof cueWord !== "string" || cueWord.trim().length === 0) return null;

  // prayerStyle — "guided" | "self-guided"
  const prayerStyle = r["prayerStyle"];
  if (prayerStyle !== "guided" && prayerStyle !== "self-guided") return null;

  return {
    sport: sport as CachedSport,
    need,
    role: role as string | null,
    positivePlays: positivePlays as string[],
    adversity,
    anchor,
    selfTalk,
    cueWord,
    prayerStyle: prayerStyle as CachedPrayerStyle,
  };
}
