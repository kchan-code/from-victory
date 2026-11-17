/**
 * clearOfflineAudioCaches (FV-754)
 *
 * Deletes every `fv-audio-*` Cache Storage bucket on this device. The clips are
 * public, but WHICH clips are present reflects the previous athlete's sport,
 * position and selections (audio-precache warms only their reachable set), so
 * the buckets must not outlive the account on a shared phone.
 *
 * Deletes by PREFIX, not just the current `fv-audio-<MANIFEST_VERSION>` name,
 * so a bucket left by an older manifest version goes too. The `fv-shell-*`
 * page cache and anything else are left alone.
 *
 * Call ONLY where access ended or the account changed (sign-out, /signin,
 * sign-in as a different athlete, account deletion). Never on the ordinary
 * Pregame open path: an athlete who downloaded a session must still have the
 * audio on an offline cold start.
 *
 * Best effort: never throws, no-ops when Cache Storage is unavailable (SSR,
 * non-HTTPS, old browser). Returns a promise so a caller/test can await it, but
 * UI call sites fire and forget.
 *
 * Deliberately import-free so sign-out/sign-in bundles do not pull the audio
 * manifest in with it.
 */
export const AUDIO_CACHE_PREFIX = "fv-audio-";

export async function clearOfflineAudioCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(AUDIO_CACHE_PREFIX))
        .map((key) => caches.delete(key).catch(() => false)),
    );
  } catch {
    // Best effort — a failed clear must never block sign-out or sign-in.
  }
}
