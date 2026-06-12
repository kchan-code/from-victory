// FV-106 — per-athlete pregame audio precache.
// FV-142 — per-clip content-addressed filenames; manifest-version cache rotation.
//
// Resolves the REACHABLE clip URL set for a given athlete setup (sport ×
// position × adversity × personalizations), then warms the fv-audio-<mv>
// Cache Storage while the athlete is online (at Review time).
//
// Design constraints enforced here:
//   - NEVER fetches the full library. Only the athlete's reachable set
//     (~single-digit MB: typically 1 opener + 1 cell + 3–5 personalization
//     clips).
//   - Uses the SAME cache name (fv-audio-<MANIFEST_VERSION>) as the SW, so
//     cache.put() from the window-side is read by the SW's cache-first handler.
//     Window and SW share Cache Storage on the same origin.
//   - Clip URLs are content-addressed (<slug>.<hash8>.mp3 — no ?v= needed).
//     The manifest URL includes ?mv=<MANIFEST_VERSION> so CDN + browsers
//     fetch the updated manifest when any clip changes.
//   - A MANIFEST_VERSION bump makes a new cache name AND new manifest URL
//     simultaneously — no scenario where old URLs are served from a new cache.
//   - This module is pure browser code (uses `caches`, `fetch`). Never import
//     it in Server Components or server actions.
//
// Reachable set for a pregame session:
//   1. manifest.json?mv=<MANIFEST_VERSION> (the clips catalog).
//   2. For EACH clip in the resolved playlist: its content-addressed MP3.
//   Sidecar JSONs are NOT cached — the clip player works from the in-memory
//   manifest and never fetches per-clip JSON at runtime.
//
// audio-playlist.ts is treated as READ-ONLY per FV-106 scope. This module
// calls resolvePlaylist() from audio-playlist.ts without modifying it.
//
// IMPORTANT — keeping the audio cache in sync with sw.js:
//   The cache name `fv-audio-${MANIFEST_VERSION}` is constructed from
//   MANIFEST_VERSION imported from audio-mapping.ts. The sw.js has its own
//   copy of the manifest version string (const MANIFEST_VERSION = "...")
//   that MUST be kept in sync. When audio-engineer runs a clip regen and
//   manifest.json is updated, update MANIFEST_VERSION in audio-mapping.ts
//   AND in sw.js to match in the same PR.

import { MANIFEST_VERSION } from "./audio-mapping";
import {
  manifestUrl,
  resolvePlaylist,
  type ClipManifest,
} from "./audio-playlist";
import { getBed } from "./audio/beds";
import type { Sport } from "./sport-registry";
import type { PrayerStyle } from "./types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type PrecacheParams = {
  /** The athlete's sport (e.g. "hockey", "basketball"). */
  sport: Sport;
  /** The athlete's pregame need (Today's Focus). */
  need: string;
  /** The athlete's position/role (e.g. "Forward", "Guard"). */
  position: string | null;
  /** The athlete's selected adversity (hard moment). */
  adversity: string | null;
  /** Athlete's chosen reset anchor (optional — personalization). */
  anchor?: string | null;
  /** Athlete's chosen self-talk phrase (optional — personalization). */
  selfTalk?: string | null;
  /** Athlete's chosen cue word (optional — personalization). */
  cueWord?: string | null;
  /** How the athlete will close the session. Affects the reachable clip set:
   *  self-guided swaps shared-prayer → shared-prayer-selfguided and drops
   *  shared-sendoff, so the warmed set must match. Defaults to guided. */
  prayerStyle?: PrayerStyle | null;
  /** FV-144 — athlete-picked positive-play viz slugs. Changes which viz clips
   *  are reachable (the picks replace the flagship), so the warmed set must
   *  match what the session will actually play. Empty/undefined = flagship. */
  positivePlays?: string[] | null;
  /**
   * FV-227 — athlete-chosen music bed id ("still" | "pulse" | "rise"), or null
   * for silence. When non-null, the bed's content-addressed MP3 is added to the
   * reachable URL set so it is warmed alongside the clip files. Silence → no
   * extra URL, no change to existing behaviour.
   */
  bedId?: string | null;
};

/** Live status returned by precache + check functions. */
export type PrecacheStatus = {
  /** Number of assets confirmed present in the audio cache. */
  cached: number;
  /** Total assets in the reachable set (0 until resolved). */
  total: number;
  /** True when cached === total && total > 0. */
  done: boolean;
  /** Non-null when an unrecoverable error occurred. */
  error: string | null;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** The audio cache name. Matches sw.js `fv-audio-${MANIFEST_VERSION}`. */
function audioCacheName(): string {
  return `fv-audio-${MANIFEST_VERSION}`;
}

/**
 * Compute the full reachable URL set for a given athlete setup.
 * Resolves the clip slugs and builds the list of all MP3 + JSON URLs.
 *
 * @param cacheOnly When true, reads the manifest ONLY from the audio cache —
 *   no network call. Returns null if the manifest isn't cached yet. Used by
 *   checkPregameAudioCached to inspect cache state without side effects.
 *   When false (default), falls back to network on cache miss.
 *
 * Returns null when:
 *   - Cache Storage API is unavailable (non-HTTPS, older browser).
 *   - Manifest fetch fails (offline AND not yet cached, with cacheOnly=false).
 *   - Manifest is not in cache (with cacheOnly=true).
 *   - No template matches the (need, position, adversity) combination.
 *
 * Fail-closed: callers show nothing (or an error state) on null.
 */
async function resolveReachableUrls(
  params: PrecacheParams,
  cacheOnly = false,
): Promise<string[] | null> {
  if (typeof caches === "undefined") return null;

  const manifestSrc = manifestUrl(); // cache-busted manifest URL
  const manifestGetReq = new Request(manifestSrc, { method: "GET" });

  let manifestResponse: Response | null = null;
  try {
    const audioCache = await caches.open(audioCacheName());
    const cached = await audioCache.match(manifestGetReq);
    if (cached) {
      manifestResponse = cached;
    } else if (!cacheOnly) {
      // Not in cache and network is allowed — fetch from network.
      manifestResponse = await fetch(manifestGetReq);
    }
    // cacheOnly + cache miss → manifestResponse stays null → return null below.
  } catch {
    return null;
  }

  if (!manifestResponse || !manifestResponse.ok) return null;

  let manifest: ClipManifest;
  try {
    manifest = (await manifestResponse.json()) as ClipManifest;
  } catch {
    return null;
  }

  // Resolve the ordered clip list for this athlete's setup.
  // resolvePlaylist is imported statically at the top; audio-playlist.ts is a
  // pure module (no browser APIs, no side effects) — safe to call here.
  const resolved = resolvePlaylist(
    params.need,
    params.position ?? "",
    params.adversity ?? "",
    manifest,
    params.anchor ?? null,
    params.selfTalk ?? null,
    params.cueWord ?? null,
    params.sport,
    params.prayerStyle ?? null,
    params.positivePlays ?? null,
  );

  if (!resolved) return null;

  // Build the URL list: manifest JSON + each clip's MP3. clip.url is already
  // content-addressed (<slug>.<hash8>.mp3) and already carries the correct /clips/ subpath from
  // the manifest catalog entry. Sidecar JSONs are intentionally NOT cached: the
  // clip player reads clip data from the in-memory manifest and never fetches
  // per-clip JSON at runtime, and audioAssetUrl(slug,"json") would emit
  // /audio/pregame/<slug>.json (no /clips/) — a 404 that would inflate `total`
  // without raising `cached`, so `done` could never become true.
  const urls: string[] = [manifestSrc];
  for (const clip of resolved) {
    urls.push(clip.url);
  }

  // FV-227: if the athlete chose a bed, add its URL so it is warmed offline
  // alongside the clip files. Silence (null/undefined) → no extra URL.
  if (params.bedId) {
    const bed = getBed(params.bedId);
    if (bed) urls.push(bed.path);
  }

  return urls;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Warm the fv-audio-<mv> cache with the athlete's reachable clip set.
 * Fetches the manifest, resolves the clip URLs, and calls cache.addAll() on
 * any URLs not already present — no duplicate network requests.
 *
 * Intended to be called client-side when the athlete reaches the Review screen
 * while online. Safe to call multiple times; already-cached URLs are skipped.
 *
 * The `onProgress` callback is called after each URL is confirmed cached, so
 * the caller can display a live progress count (e.g. "3 / 12").
 *
 * Returns the final PrecacheStatus. On any error returns { done:false, error }.
 */
export async function precachePregameAudio(
  params: PrecacheParams,
  onProgress?: (status: PrecacheStatus) => void,
): Promise<PrecacheStatus> {
  const errStatus = (msg: string): PrecacheStatus => ({
    cached: 0,
    total: 0,
    done: false,
    error: msg,
  });

  if (typeof caches === "undefined") {
    return errStatus("Cache Storage not available");
  }

  const urls = await resolveReachableUrls(params);
  if (!urls) {
    return errStatus("Could not resolve audio clip list");
  }

  const total = urls.length;
  let cachedCount = 0;

  let audioCache: Cache;
  try {
    audioCache = await caches.open(audioCacheName());
  } catch {
    return errStatus("Could not open audio cache");
  }

  // Fetch and cache each URL individually so we can report progress and skip
  // already-cached entries. caches.addAll() would be simpler but gives no
  // granularity and fails the entire batch on a single error.
  for (const url of urls) {
    try {
      // Use a GET request for the cache key (consistent with SW strategy).
      const getReq = new Request(url, { method: "GET" });
      const already = await audioCache.match(getReq);
      if (already) {
        cachedCount++;
        onProgress?.({ cached: cachedCount, total, done: false, error: null });
        continue;
      }

      const response = await fetch(getReq);
      if (response.ok && response.status !== 206 && response.type !== "opaque") {
        await audioCache.put(getReq, response);
        cachedCount++;
        onProgress?.({ cached: cachedCount, total, done: false, error: null });
      }
      // Non-OK responses are silently skipped — a missing optional clip (e.g.
      // an unrendered personalization slug) should not abort the entire precache.
    } catch {
      // Individual fetch failure — skip and continue; we'd rather have 11/12
      // clips cached than abort on a transient network hiccup.
    }
  }

  const done = cachedCount === total && total > 0;
  const finalStatus: PrecacheStatus = { cached: cachedCount, total, done, error: null };
  onProgress?.(finalStatus);
  return finalStatus;
}

/**
 * Check how many of the athlete's reachable audio URLs are already in the
 * fv-audio-<mv> cache WITHOUT fetching anything from the network.
 *
 * Used by the ReviewScreen indicator to show accurate cache state keyed to
 * actual Cache Storage contents — never navigator.onLine (which lies on lie-fi).
 *
 * Returns { cached:0, total:0, done:false, error:null } when the URL set
 * cannot be resolved (manifest not yet cached, no template match, etc.).
 * The caller should treat that as "not ready" with no error shown.
 */
export async function checkPregameAudioCached(
  params: PrecacheParams,
): Promise<PrecacheStatus> {
  if (typeof caches === "undefined") {
    return { cached: 0, total: 0, done: false, error: null };
  }

  // cacheOnly=true: resolveReachableUrls reads the manifest from cache only —
  // no network call. If the manifest isn't cached yet, returns null → { 0/0 }.
  const urls = await resolveReachableUrls(params, /* cacheOnly */ true);
  if (!urls) {
    return { cached: 0, total: 0, done: false, error: null };
  }

  const total = urls.length;
  let cachedCount = 0;

  let audioCache: Cache;
  try {
    audioCache = await caches.open(audioCacheName());
  } catch {
    return { cached: 0, total, done: false, error: null };
  }

  for (const url of urls) {
    const getReq = new Request(url, { method: "GET" });
    const hit = await audioCache.match(getReq);
    if (hit) cachedCount++;
  }

  return {
    cached: cachedCount,
    total,
    done: cachedCount === total && total > 0,
    error: null,
  };
}
