// FV-227 — device-level music bed preference.
//
// Persisted to localStorage under `fv_pregame_bed` (separate from the session
// cache so the sound choice survives across sessions and sport switches without
// being considered part of the per-session "Run it like last time" data).
//
// Default is null (silence) — the most conservative choice for athletes who
// haven't yet expressed a preference. null is stored as the literal string
// "silence" so the key's presence signals an explicit choice; key absence
// restores the default seamlessly.
//
// PERSISTENCE DECISION — why `fv_pregame_bed` survives signout/account-switch:
//   This key is intentionally NOT cleared by the five auth surfaces that wipe
//   other device state (signout, account-switch, athlete-cache clear, pair
//   reset, and the session cache clear). Rationale: a sound preference is
//   zero-PII device-level ambient taste — the same as a browser font-size
//   preference. Clearing it on signout would silently reset a choice the
//   athlete made (e.g. "Always use Rain") every time their parent logs back
//   in, which is hostile UX. Compare with `fv_athlete_cache` and
//   `fv_pregame_session`, which DO contain identity-adjacent data (profile
//   name, session choices) and ARE cleared on auth transitions.
//
//   kids-privacy-officer adjudicates this decision in the PR's privacy pass
//   (FV-227). If the review determines the device sound preference must be
//   cleared on signout, add `BED_PREF_KEY` to the clear list in
//   `lib/auth/clear-device-state.ts` (or wherever auth cleanup lives).
//
// All functions are window-guarded and try/catch-wrapped so they're safe to
// import from any Next.js context (Server Component, client component, SSR).

export const BED_PREF_KEY = "fv_pregame_bed";

// The on-disk value for silence (null in-memory).
const SILENCE_TOKEN = "silence";

/**
 * Read the stored bed preference. Returns null (silence) on miss, SSR,
 * or any error. An unknown stored value (e.g. from a future schema change)
 * also returns null so the UI gracefully falls back to silence.
 */
export function readBedPreference(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BED_PREF_KEY);
    if (!raw || raw === SILENCE_TOKEN) return null;
    // Accept only non-empty strings up to 32 chars (bed ids are short: "still",
    // "pulse", "rise"). A poisoned or oversized value falls back to silence.
    if (raw.length <= 32 && raw.trim().length > 0) return raw;
    return null;
  } catch {
    return null;
  }
}

/**
 * Write the bed preference. Pass null to store silence. No-op on SSR or when
 * localStorage is unavailable (private browsing, quota exceeded).
 */
export function writeBedPreference(bedId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BED_PREF_KEY, bedId ?? SILENCE_TOKEN);
  } catch {
    // Non-fatal.
  }
}
