// Truth-line rotation state for the pregame {{truth}} slot.
//
// The resolver (audio-playlist.ts) picks TRUTH_SLUGS[index mod N] and skips
// `avoidTruthSlug` if the pick lands on it. This module supplies both inputs:
//   - pickTruthIndex(): a random index, chosen once per player mount (same
//     precedent as the pre-practice dialed-in opener rotation, FV-266).
//   - readLastTruthSlug() / rememberTruthSlug(): the slug the athlete heard
//     last session, so no line plays twice in a row.
//
// Privacy: the only thing persisted is a clip slug ("truth-07"). No athlete
// data, no selections, no timestamps. Storage is best-effort — every access
// is wrapped so a blocked or missing localStorage (private mode, SSR, native
// webview quirks) degrades to "no memory", never to an error.

import { TRUTH_SLUGS, isTruthSlug } from "./audio/truth-bank";

const STORAGE_KEY = "fv_truth_last";

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Random index into the truth bank. `random` is injectable for tests. */
export function pickTruthIndex(random: () => number = Math.random): number {
  const n = TRUTH_SLUGS.length;
  if (n === 0) return 0;
  const i = Math.floor(random() * n);
  return Math.min(Math.max(i, 0), n - 1);
}

/** The truth slug played last session on this device, or null. */
export function readLastTruthSlug(): string | null {
  try {
    const value = storage()?.getItem(STORAGE_KEY) ?? null;
    return value && value.startsWith("truth-") ? value : null;
  } catch {
    return null;
  }
}

/** Persist the truth slug the athlete is about to hear. Best-effort. */
export function rememberTruthSlug(slug: string): void {
  try {
    storage()?.setItem(STORAGE_KEY, slug);
  } catch {
    // Storage unavailable or full — rotation simply has no memory this time.
  }
}

/** Minimal per-clip shape needed to locate the truth clip's start offset. */
export type ClipDurationEntry = { slug: string; durationSec: number };

/**
 * FV-552 — pure decision helper for "has the truth clip actually started
 * playing yet." Given the session's ordered clip list (each with its
 * duration) and the current playhead position in seconds, returns the truth
 * slug once playback has reached its segment of the assembled timeline, or
 * null if playback hasn't gotten there yet (or the session has no truth
 * clip). Clips assemble back-to-back in array order — see
 * buildAssembledTimeline in audio-playlist.ts — so the truth clip's start
 * offset is just the summed duration of every clip before it.
 *
 * Pure and side-effect free: no localStorage, no DOM. Called from the
 * player's rAF loop (to decide when it's safe to call rememberTruthSlug)
 * and exercised directly in tests without touching browser APIs.
 */
export function truthSlugAtPlayhead(
  clips: readonly ClipDurationEntry[],
  currentSec: number,
): string | null {
  let cursor = 0;
  for (const clip of clips) {
    if (isTruthSlug(clip.slug)) {
      return currentSec >= cursor ? clip.slug : null;
    }
    cursor += clip.durationSec;
  }
  return null;
}
