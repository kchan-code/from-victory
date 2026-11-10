/**
 * CacheStrategy — storage abstraction for the pregame audio pipeline.
 *
 * WHY THIS EXISTS
 * ---------------
 * The web PWA path uses Cache Storage + Service Worker:
 *   - audio-precache.ts warms `fv-audio-<MANIFEST_VERSION>` with the athlete's
 *     reachable clip set by calling caches.open() + cache.put() directly.
 *   - useClipPlayer.ts fetches clips via the normal fetch() API; the SW's
 *     audioCacheFirst handler intercepts /audio/pregame/* requests and serves
 *     from Cache Storage transparently.
 *
 * The iOS native shell (Option C hybrid — separate PR) cannot use Cache Storage
 * or the Service Worker: Capacitor serves assets over capacitor://, which the
 * SW never intercepts. Instead, the native shell downloads clips to the
 * Filesystem plugin's data directory before the session starts and resolves
 * URLs to local file:// paths at playback time.
 *
 * This interface is the seam between the two worlds. Both implementations share
 * the same warm/check/resolve/isCached contract. The selection point in each
 * consumer (audio-precache.ts, useClipPlayer.ts) picks the right implementation
 * via selectCacheStrategy(). It adds NO Capacitor dependency and produces NO
 * behavior change on web.
 *
 * FV-638: the selection is CAPABILITY-based, not platform-based. Our Android
 * shell loads the hosted app over https (server.url) in a Chromium WebView that
 * runs the Service Worker and Cache Storage exactly like the PWA, so it uses
 * WebCacheStrategy. Only a Capacitor shell WITHOUT Service Worker support
 * (today: the iOS WKWebView, which has no App-Bound Domains configured) gets
 * the NativeCacheStrategy stub — unchanged from before FV-638.
 *
 * NATIVE IMPLEMENTATION NOTE
 * --------------------------
 * NativeCacheStrategy is a COMPILE-SAFE STUB that satisfies the interface so
 * it builds in the web bundle without importing any @capacitor/* package.
 * The real filesystem implementation is a separate PR gated on:
 *   - product-strategist approval of the native dependency
 *   - @capacitor/filesystem + @capacitor/app in package.json
 * That PR replaces the stub body with real Filesystem.writeFile / readFile calls.
 *
 * BEHAVIOR CONTRACT
 * -----------------
 * WebCacheStrategy:
 *   warm:     fetch + cache.put each URL if not already present (audio-precache
 *             behavior, promoted here verbatim). progress callback fires after
 *             each URL is confirmed cached.
 *   check:    count how many URLs have a cached GET response (cache-only, no
 *             network). Returns the count; max = urls.length.
 *   resolve:  identity — returns the URL unchanged. The SW audioCacheFirst
 *             handler serves the response from Cache Storage transparently, so
 *             callers do not need to change URLs on web.
 *   isCached: true if a GET-keyed cache entry exists for the URL.
 *
 * NativeCacheStrategy (stub):
 *   warm/check/isCached: throw a clear error so a caller wired to the wrong
 *             strategy fails loudly in development.
 *   resolve:  returns the URL unchanged as a safe no-op (the session can still
 *             run in text-mode fallback if audio fails).
 */

import { MANIFEST_VERSION } from "@/components/pregame/audio-mapping";

// ---------------------------------------------------------------------------
// Platform detection helper
// ---------------------------------------------------------------------------

/**
 * Returns true when the runtime looks like a Capacitor-hosted native shell.
 *
 * In the native shell, window.Capacitor is injected by the Capacitor bridge
 * before any JavaScript runs. On the web (PWA, browser, SSR) it is absent.
 *
 * This check is intentionally conservative: if Capacitor is NOT present we
 * always use WebCacheStrategy, which is the correct default for both the web
 * PWA and any server-side rendering context.
 *
 * NOTE: this IS true in both shipped shells (Android and iOS). It is not by
 * itself the strategy switch — see selectCacheStrategy() (FV-638).
 */
function isNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  // reason: window.Capacitor is injected by the Capacitor bridge at runtime;
  // it has no TypeScript declaration in a web-only build, so we access it via
  // a safe property-existence check rather than casting.
  return Object.prototype.hasOwnProperty.call(window, "Capacitor");
}

/**
 * FV-638 — can this runtime run the Service-Worker audio path?
 *
 * WebCacheStrategy needs BOTH Cache Storage (to warm `fv-audio-<mv>`) and a
 * Service Worker (sw.js audioCacheFirst serves those entries offline). The
 * Android Capacitor WebView has both; the iOS WKWebView (no App-Bound Domains)
 * exposes no `navigator.serviceWorker`, so it keeps the native stub.
 */
function hasServiceWorkerAudioPath(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof caches === "undefined") return false;
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

// ---------------------------------------------------------------------------
// CacheStrategy interface
// ---------------------------------------------------------------------------

export interface CacheStrategy {
  /**
   * Warm the audio cache with the given set of URLs.
   *
   * For each URL:
   *   - If already cached/present, count it and call onProgress without
   *     fetching again (idempotent warm call).
   *   - If not cached, fetch from network (web) or download to disk (native)
   *     and store. On per-URL failure, skip and continue (never throws —
   *     a partial warm still leaves the session playable for cached clips).
   *
   * @param urls    Ordered URL list: manifest URL first, then clip MP3 URLs.
   * @param onProgress  Called after each URL is confirmed ready. Receives
   *                    (cachedCount, total) so the caller can show progress.
   */
  warm(
    urls: string[],
    onProgress?: (cachedCount: number, total: number) => void,
  ): Promise<void>;

  /**
   * Check how many of the given URLs are already present in the cache /
   * on disk WITHOUT fetching anything from the network.
   *
   * Returns the count of ready URLs (0 to urls.length). Used by
   * checkPregameAudioCached to reflect accurate cache state.
   */
  check(urls: string[]): Promise<number>;

  /**
   * Resolve a content-addressed URL to a playable URL.
   *
   * Web:    Returns the URL unchanged. The SW audioCacheFirst handler intercepts
   *         the fetch and serves the cached response transparently — callers do
   *         not need a different URL.
   *
   * Native: Returns a local file:// path so HTMLAudioElement / fetch() can read
   *         the file directly without a network request (the SW is not running
   *         in the native shell).
   *
   * This is the hook that makes useClipPlayer.ts fetch-agnostic with respect to
   * the storage backend. The web implementation is a zero-cost identity.
   */
  resolve(url: string): Promise<string>;

  /**
   * Returns true if the given URL is immediately available (cached/on-disk)
   * without a network fetch.
   */
  isCached(url: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// WebCacheStrategy — wraps Cache Storage, IDENTICAL to the prior behavior
// ---------------------------------------------------------------------------

/** The audio cache name. Mirrors sw.js `fv-audio-${MANIFEST_VERSION}`. */
function audioCacheName(): string {
  return `fv-audio-${MANIFEST_VERSION}`;
}

export class WebCacheStrategy implements CacheStrategy {
  /**
   * Opens (or creates) the shared audio Cache Storage bucket.
   * Returns null when caches is unavailable (non-HTTPS, older browser, SSR).
   */
  private async openCache(): Promise<Cache | null> {
    if (typeof caches === "undefined") return null;
    try {
      return await caches.open(audioCacheName());
    } catch {
      return null;
    }
  }

  async warm(
    urls: string[],
    onProgress?: (cachedCount: number, total: number) => void,
  ): Promise<void> {
    const cache = await this.openCache();
    if (!cache) return;

    const total = urls.length;
    let cachedCount = 0;

    for (const url of urls) {
      try {
        const getReq = new Request(url, { method: "GET" });
        const already = await cache.match(getReq);
        if (already) {
          cachedCount++;
          onProgress?.(cachedCount, total);
          continue;
        }
        const response = await fetch(getReq);
        if (
          response.ok &&
          response.status !== 206 &&
          response.type !== "opaque"
        ) {
          await cache.put(getReq, response);
          cachedCount++;
          onProgress?.(cachedCount, total);
        }
        // Non-OK responses silently skipped — partial warm still useful.
      } catch {
        // Individual fetch failure — skip and continue.
      }
    }
  }

  async check(urls: string[]): Promise<number> {
    const cache = await this.openCache();
    if (!cache) return 0;

    let count = 0;
    for (const url of urls) {
      try {
        const getReq = new Request(url, { method: "GET" });
        const hit = await cache.match(getReq);
        if (hit) count++;
      } catch {
        // Match failure — treat as miss.
      }
    }
    return count;
  }

  async resolve(url: string): Promise<string> {
    // Web: identity — SW handles cache-serving transparently.
    return url;
  }

  async isCached(url: string): Promise<boolean> {
    const cache = await this.openCache();
    if (!cache) return false;
    try {
      const hit = await cache.match(new Request(url, { method: "GET" }));
      return hit !== undefined;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// NativeCacheStrategy — compile-safe stub (NO @capacitor/* imports)
// ---------------------------------------------------------------------------
//
// This stub satisfies the CacheStrategy interface so the web build compiles
// cleanly. It is selected only in a Capacitor shell with no Service Worker
// support (today: iOS) — see selectCacheStrategy() (FV-638). The real
// Filesystem implementation is a follow-up PR gated on @capacitor/filesystem
// being approved and installed.
//
// warm/check/isCached throw an error because a native warm must never silently
// no-op — that would leave the native session without audio. resolve returns
// the URL unchanged so the session can still fall back to text mode rather than
// crashing.

export class NativeCacheStrategy implements CacheStrategy {
  async warm(
    _urls: string[],
    _onProgress?: (cachedCount: number, total: number) => void,
  ): Promise<void> {
    throw new Error(
      "[NativeCacheStrategy] warm() is not implemented — " +
        "the real Filesystem implementation ships in the native PR.",
    );
  }

  async check(_urls: string[]): Promise<number> {
    throw new Error(
      "[NativeCacheStrategy] check() is not implemented — " +
        "the real Filesystem implementation ships in the native PR.",
    );
  }

  async resolve(url: string): Promise<string> {
    // Safe no-op: returns the original URL so the session can still attempt a
    // network fetch and fall back to text mode if it fails. A stale warning is
    // issued so it is visible in native development logs.
    console.warn(
      "[NativeCacheStrategy] resolve() is a stub — returning original URL. " +
        "The real Filesystem implementation ships in the native PR.",
    );
    return url;
  }

  async isCached(_url: string): Promise<boolean> {
    throw new Error(
      "[NativeCacheStrategy] isCached() is not implemented — " +
        "the real Filesystem implementation ships in the native PR.",
    );
  }
}

// ---------------------------------------------------------------------------
// Strategy selection — the SINGLE selection point for both consumers
// ---------------------------------------------------------------------------

let _cachedStrategy: CacheStrategy | null = null;

/**
 * Return the appropriate CacheStrategy for the current runtime.
 *
 * WebCacheStrategy whenever the runtime has the Service-Worker audio path —
 * the browser, the installed PWA, AND the Android Capacitor shell (FV-638:
 * selecting the stub there broke "Set up for later" and offline audio).
 * NativeCacheStrategy only for a Capacitor shell WITHOUT that path (today:
 * iOS WKWebView — unchanged). The result is memoized so both consumers
 * (audio-precache.ts and useClipPlayer.ts) share a single instance per page
 * load — the instance is stateless today, but memoizing is cheap insurance.
 *
 * The native PR will complete the NativeCacheStrategy implementation; at that
 * point the selection point here is the ONLY file that changes on the strategy
 * selection axis.
 */
export function selectCacheStrategy(): CacheStrategy {
  if (_cachedStrategy) return _cachedStrategy;
  _cachedStrategy =
    isNativeShell() && !hasServiceWorkerAudioPath()
      ? new NativeCacheStrategy()
      : new WebCacheStrategy();
  return _cachedStrategy;
}

/**
 * Reset the memoized strategy — for testing only.
 * Allows tests to verify both strategy paths without module reloads.
 */
export function _resetCacheStrategyForTests(): void {
  _cachedStrategy = null;
}
