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
