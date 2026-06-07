// FV-106 — per-athlete pregame audio precache.
//
// Resolves the REACHABLE clip URL set for a given athlete setup (sport ×
// position × adversity × personalizations), then warms the fv-audio-<bust>
// Cache Storage while the athlete is online (at Review time).
//
// Design constraints enforced here:
//   - NEVER fetches the 201 MB full library. Only the athlete's reachable set
//     (~single-digit MB: typically 1 opener + 1 cell + 3–5 personalization
//     clips).
//   - Uses the SAME cache name (fv-audio-<AUDIO_CACHE_BUST>) as the SW, so
//     cache.put() from the window-side is read by the SW's cache-first handler.
//     Window and SW share Cache Storage on the same origin.
//   - All URLs carry ?v=AUDIO_CACHE_BUST (from audioAssetUrl / bustUrl), so
//     a bust bump makes a new cache name AND new URLs simultaneously —
//     there is no scenario where an old URL is served from a new cache.
//   - This module is pure browser code (uses `caches`, `fetch`). Never import
//     it in Server Components or server actions.
//
// Reachable set for a pregame session:
//   1. manifest.json (the clips catalog — needed to resolve slugs).
//   2. For EACH clip in the resolved playlist: its MP3 via clip.url (already
//      cache-busted, already carries the /clips/ subpath from the manifest).
//   Sidecar JSONs are NOT cached — the clip player works from the in-memory
//   manifest and never fetches per-clip JSON at runtime.
//
// audio-playlist.ts is treated as READ-ONLY per FV-106 scope. This module
// calls resolvePlaylist() from audio-playlist.ts without modifying it.
//
// IMPORTANT — keeping the audio cache in sync with sw.js:
//   The cache name `fv-audio-${AUDIO_CACHE_BUST}` is constructed from
//   AUDIO_CACHE_BUST imported from audio-mapping.ts. The sw.js has its own
//   copy of the bust string (const AUDIO_CACHE_BUST = "16") that MUST be
//   kept in sync. When audio-engineer bumps AUDIO_CACHE_BUST in audio-mapping.ts,
//   the sw.js constant must be updated to match in the same PR.

import { AUDIO_CACHE_BUST } from "./audio-mapping";
import {
  manifestUrl,
  resolvePlaylist,
  type ClipManifest,
} from "./audio-playlist";
import type { Sport } from "./sport-registry";

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

/** The audio cache name. Matches sw.js `fv-audio-${AUDIO_CACHE_BUST}`. */
function audioCacheName(): string {
  return `fv-audio-${AUDIO_CACHE_BUST}`;
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
  );

  if (!resolved) return null;

  // Build the URL list: manifest JSON + each clip's MP3. clip.url is already
  // cache-busted (bustUrl) and already carries the correct /clips/ subpath from
  // the manifest catalog entry. Sidecar JSONs are intentionally NOT cached: the
  // clip player reads clip data from the in-memory manifest and never fetches
  // per-clip JSON at runtime, and audioAssetUrl(slug,"json") would emit
  // /audio/pregame/<slug>.json (no /clips/) — a 404 that would inflate `total`
  // without raising `cached`, so `done` could never become true.
  const urls: string[] = [manifestSrc];
  for (const clip of resolved) {
    urls.push(clip.url);
  }

  return urls;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Warm the fv-audio-<bust> cache with the athlete's reachable clip set.
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
 * fv-audio-<bust> cache WITHOUT fetching anything from the network.
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
