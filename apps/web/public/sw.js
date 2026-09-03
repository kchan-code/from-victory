/**
 * From Victory — App Shell Service Worker (FV-105, revised FV-105-v2; FV-106 audio cache;
 * FV-107 offline-tolerant pregame auth)
 *
 * Strategy matrix:
 *   SAFELIST navigations (/offline, /privacy, /terms) → network-first,
 *       response also written to cache (these pages contain NO user data).
 *       "/" is deliberately NOT in this list — see FV-489 round 2 below.
 *   /athlete/pregame navigation → network-first, cache the PII-free shell
 *       response, serve from cache when offline (FV-107). Also caches the
 *       RSC payload so client-side navigation works offline.
 *       Contract: pregame/page.tsx MUST remain a PII-free static shell —
 *       no server-side user data. Enforced by the server component returning
 *       only <PregameClientShell />.
 *   ALL other /athlete/* navigations → network-first, offline fallback, NO
 *       cache write (authenticated/minor HTML — first_name, sport, rhythm —
 *       must never persist in Cache Storage past sign-out or on shared devices)
 *   /_next/static/* + icon/font assets  → cache-first (populated as-fetched)
 *   /audio/pregame/* (mp3 + json + manifest) → cache-first in AUDIO_CACHE
 *       (FV-106). Per-athlete set is warmed at Review time by audio-precache.ts.
 *   BYPASS list (always network, never cached):
 *       /api, /auth, /athlete (except /athlete/pregame — see above), /dashboard,
 *       /pair, signin/signup/forgot/reset, /subscribe
 *       Note: /audio/* was here in FV-105 stub; FV-106 now owns /audio/pregame/*
 *       (cache-first in AUDIO_CACHE). All other /audio/* still fall through.
 *   cross-origin → fall through, never intercepted
 *
 * No build-time manifest injection. No Workbox. Hand-written and auditable.
 * kids-privacy-officer: cache stores ONLY static build assets, the offline
 * fallback HTML, the three safelisted public pages (none contain PII; "/" is
 * deliberately excluded — see FV-489 round 2 below), the PII-free pregame
 * shell (FV-107 — page contains no server-side user data; auth + profile
 * resolved entirely client-side), and pregame audio clip files (public
 * static assets, zero PII). All other authenticated /athlete/* pages and the
 * pairing flow (/pair) are NEVER written to cache. Cache is device-local
 * only (no sync/share surface).
 *
 * Bump CACHE_VERSION any time the shell layout or offline page changes.
 * Update MANIFEST_VERSION (below) whenever pregame clips change — the
 * generator derives it from the catalog content-hash, and it rotates the
 * SW audio cache so stale clips are evicted at activate.
 */

const CACHE_VERSION = "fv-shell-v7"; // bumped: FV-493 — BYPASS_PREFIXES said
// "/dashboard/" (trailing slash), so bare /dashboard missed the bypass and
// went through the navigation strategy. event.respondWith(fetch(request))
// re-issues from ServiceWorkerGlobalScope, which drops Capacitor's appended
// FVNativeShell/1 UA (the FV-489 mechanism), so isNativeShell() was false
// and an unpaid parent's dashboard rendered web prices + "Choose a plan"
// in-shell. v6 (FV-489 round 2) removed "/" from NAVIGATION_CACHE_SAFELIST;
// this bump ships the corrected bypass to installed shells.

/**
 * FV-142 — per-clip content-addressed filenames.
 *
 * MANIFEST_VERSION is the content-hash of the clip catalog (first 8 hex of
 * sha256 of the sorted slug→hash8 map). It is written into manifest.json by
 * the generator and must be kept in sync with MANIFEST_VERSION in
 * apps/web/components/pregame/audio-mapping.ts.
 *
 * How it rotates the audio cache:
 *   1. Creates a new cache named fv-audio-<new-value>.
 *   2. The activate handler prunes all fv-audio-<old-value> caches.
 *   3. audio-precache.ts uses MANIFEST_VERSION (imported from audio-mapping.ts)
 *      to open the same named cache — both sides always agree.
 *
 * CRITICAL: keep these in sync or cache open/read will disagree.
 *
 * How to update: after running `npm run audio:generate -- --mode clips`,
 * read the new manifestVersion from stdout or from manifest.json, and
 * update this string AND MANIFEST_VERSION in audio-mapping.ts in the same PR.
 * The `audio-cache-bust` CI job enforces this parity.
 */
const MANIFEST_VERSION = "da23db2c"; // sync with audio-mapping.ts:MANIFEST_VERSION
const AUDIO_CACHE = `fv-audio-${MANIFEST_VERSION}`;

/**
 * Caches we own and are allowed to keep alive.
 * Any cache name NOT in this list is deleted on activate.
 * AUDIO_CACHE is included so it survives rotate; the old fv-audio-* caches
 * (different bust value) are NOT in this list and are deleted on activate.
 */
const OWNED_CACHES = [CACHE_VERSION, AUDIO_CACHE];

/**
 * The offline fallback is fetched and cached during install so it is
 * always available even before the athlete has visited the page online.
 */
const OFFLINE_URL = "/offline";

/**
 * Navigation SAFELIST — the ONLY paths whose HTML response is written
 * to Cache Storage after a successful network fetch. All three are static,
 * fully public pages with zero PII. Every other navigation goes
 * network-first but is NEVER cached (defense against persisting
 * authenticated or minor-PII HTML on shared devices).
 *
 * FV-489 round 2 — "/" is deliberately EXCLUDED from this list, permanently.
 * "/" is the one safelisted path whose content is auth-dependent inside the
 * native shell: middleware.ts's entry-point router (lib/native-shell-router.ts)
 * must decide fresh, per request, where a shell visitor lands (signed out →
 * /signin, parent → /dashboard, athlete → /athlete, marketing content only
 * for an ordinary browser). A cached "/" response — from ANY context, shell
 * or browser — replayed on a later cold start would bypass that router
 * entirely. That is the exact bug this file was previously patched for
 * (round 1, FV-489) and that patch failed on-device: it tried to detect
 * "am I the native shell" from inside the SW via `self.navigator.userAgent`,
 * and there is no confirmed evidence that Capacitor's `appendUserAgent`
 * (which decorates the WebView's own page requests) reaches the service
 * worker's separate global scope or the `fetch()` it performs. Removing "/"
 * from this list instead means the write this bug depends on can never
 * happen, for any User-Agent, provable by reading this file — no signal
 * needs to reach the SW at all. Cost: browser/PWA visitors lose *offline*
 * access to the marketing homepage (a marketing page, not core function);
 * an offline "/" visit now falls through to the branded OFFLINE_URL fallback
 * below, same as any other uncached page. Do not re-add "/" here without a
 * device-verified way to scope the cache write to non-shell, non-auth-
 * dependent responses only.
 *
 * The remaining three pages (/offline, /privacy, /terms) carry no
 * auth-dependent branching in the native-shell router (NATIVE_SHELL_ROUTED_PATHS
 * in lib/native-shell-router.ts is just "/", "/pricing", "/parents") and are
 * identical content regardless of who requests them, so caching them for a
 * shell WebView is not a privacy or routing risk — no UA check is needed for
 * them either.
 */
const NAVIGATION_CACHE_SAFELIST = ["/offline", "/privacy", "/terms"];

// Paths the native-shell entry router owns (FV-478 / FV-489). Mirrors
// NATIVE_SHELL_ENTRY_PATHS in lib/sw/route-strategy.ts and
// NATIVE_SHELL_ROUTED_PATHS in lib/native-shell-router.ts.
const NATIVE_SHELL_ENTRY_PATHS = ["/", "/pricing", "/parents"];

/**
 * FV-107 — pregame offline shell path.
 *
 * /athlete/pregame is excluded from the all-network bypass and gets its own
 * strategy: network-first with cache-write and offline cache-serve.
 *
 * PRIVACY CONTRACT (must be maintained):
 *   pregame/page.tsx must remain a PII-free static server shell that renders
 *   ONLY <PregameClientShell /> — a client component that handles auth and
 *   profile loading entirely client-side after mount. The server component must
 *   never call requireAthlete() or embed any user data (name, sport, birthdate)
 *   in the server-rendered HTML or RSC payload. If this contract is broken, the
 *   cached pregame shell will contain minor PII and this strategy MUST be reverted
 *   to the all-network bypass.
 *
 * What gets cached:
 *   - Navigation (mode: "navigate") responses: the server-rendered HTML shell.
 *     This HTML references /_next/static/* bundles but contains no user data.
 *   - RSC fetch responses (Next-Router prefetch/client navigation requests):
 *     the RSC JSON payload for the PregameClientShell component tree. Also
 *     contains no user data.
 *   Both are keyed by exact URL (pathname + query) in CACHE_VERSION.
 *
 * What does NOT get cached (unchanged):
 *   All other /athlete/* pages, /dashboard, auth flows, etc. continue to use
 *   the all-network bypass below.
 */
const PREGAME_PATH = "/athlete/pregame";

/**
 * FV-126 — bypass list extracted as a constant so the routing DECISION can be
 * mirrored exactly from the pure function in apps/web/lib/sw/route-strategy.ts
 * (BYPASS_PREFIXES). Same-origin path prefixes that ALWAYS go to the network
 * and are NEVER written to Cache Storage. See section "1c" comment below for the
 * per-prefix privacy rationale. /athlete (no trailing slash) bypasses /athlete
 * and every /athlete/* page EXCEPT /athlete/pregame (handled earlier, FV-107).
 */
const BYPASS_PREFIXES = [
  "/api/",
  "/auth/",
  "/athlete",
  // No trailing slash (FV-493): must cover bare /dashboard too. A navigation
  // the SW intercepts loses the shell's appended UA (FV-489), so the unpaid
  // parent dashboard would render web prices in-shell.
  "/dashboard",
  "/pair",
  "/signin",
  "/signup",
  "/forgot-",
  "/reset-",
  "/subscribe",
  "/audio/",
];

/**
 * FV-126 — brand-asset (icon/font) extension test, mirrored from
 * ICON_OR_FONT_RE in apps/web/lib/sw/route-strategy.ts.
 */
const ICON_OR_FONT_RE = /\.(png|svg|ico|webmanifest|woff2|woff|ttf|otf)$/;

/**
 * FV-495 — the only methods this SW intercepts at all. Mirrored from
 * INTERCEPTABLE_METHODS in apps/web/lib/sw/route-strategy.ts (sync-tested).
 *
 * Non-GET/HEAD requests (Server Action POSTs, uploads, DELETEs) are handed
 * straight to the browser with no respondWith: they are never cacheable, and
 * Cache.put() REJECTS for any non-GET request — before this guard, a Server
 * Action POST to /athlete/pregame matched pregame-shell-network-first by
 * pathname and its cache.put() fired an unhandled TypeError on every pregame
 * run. HEAD stays interceptable: audioCacheFirst answers screens-b.tsx's HEAD
 * probes from the cached GET so the offline preflight works.
 */
const INTERCEPTABLE_METHODS = ["GET", "HEAD"];

/** FV-495 — method gate applied before decideStrategy. Mirror of the TS. */
function isInterceptableMethod(method) {
  return INTERCEPTABLE_METHODS.includes(method);
}

// ---------------------------------------------------------------------------
// FV-126 — route → cache-strategy DECISION (pure, mirror of the TS source).
//
// This is a hand-mirrored copy of `decideStrategy()` in
// apps/web/lib/sw/route-strategy.ts. The TS module is the single, unit-tested
// source of truth; sw.js cannot import TS at runtime (static file, same reason
// MANIFEST_VERSION is duplicated), so the logic is copied here and a sync test
// (__tests__/sw-route-strategy.test.ts) asserts the two stay equivalent.
//
// Returns one of:
//   "audio-cache-first" | "pregame-shell-network-first" | "cache-first" |
//   "network-first-offline-fallback" | "passthrough"
//
// Inputs mirror what the fetch handler derives from the FetchEvent:
//   pathname     = url.pathname
//   isSameOrigin = url.origin === self.location.origin
//   isNavigate   = request.mode === "navigate"
//
// KEEP THIS IN SYNC with route-strategy.ts — branch order and prefixes are
// asserted by the sync test. Do not reorder branches.
// ---------------------------------------------------------------------------
function decideStrategy(pathname, isSameOrigin, isNavigate) {
  // 0. cross-origin — never intercepted.
  if (!isSameOrigin) {
    return "passthrough";
  }

  // 1a. Pregame audio — cache-first in the audio cache (FV-106).
  if (pathname.startsWith("/audio/pregame/")) {
    return "audio-cache-first";
  }

  // 1a-ii. Music beds — cache-first in the SAME audio cache (FV-227).
  if (pathname.startsWith("/audio/beds/")) {
    return "audio-cache-first";
  }

  // 1b. Pregame shell — network-first, cache the PII-free shell (FV-107).
  // Checked BEFORE the /athlete bypass below so pregame gets its strategy.
  if (pathname === PREGAME_PATH || pathname === PREGAME_PATH + "/") {
    return "pregame-shell-network-first";
  }

  // 1c. NEVER cache — always network (passthrough). Logical OR of prefixes.
  for (const prefix of BYPASS_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return "passthrough";
    }
  }

  // 2. Static build assets — cache-first (content-addressed by Next.js).
  if (pathname.startsWith("/_next/static/")) {
    return "cache-first";
  }

  // 3. Brand asset files (icons + fonts) — cache-first.
  if (ICON_OR_FONT_RE.test(pathname)) {
    return "cache-first";
  }

  // 3b. Native-shell entry paths — passthrough, NEVER intercepted (FV-489).
  //
  // middleware.ts redirects these by auth state when the request carries
  // Capacitor's appended `FVNativeShell/1` User-Agent. The SW must not handle
  // them: event.respondWith(fetch(request)) re-issues the request from the
  // ServiceWorkerGlobalScope, which does NOT carry that appended UA. The
  // server then sees an ordinary browser, correctly returns the 200 marketing
  // page instead of the 307, and the SW hands it straight to the page —
  // showing prices inside the shell.
  //
  // "passthrough" means no respondWith at all, so the browser performs the
  // navigation itself with the real UA and middleware fires. Deliberately NOT
  // a UA check in here: two prior attempts (#440, #441) failed on device
  // because no UA signal reliably reaches this scope. Not intercepting is the
  // only fix that doesn't depend on one.
  if (isNavigate && NATIVE_SHELL_ENTRY_PATHS.includes(pathname)) {
    return "passthrough";
  }

  // 4. Navigation requests — network-first with offline fallback.
  if (isNavigate) {
    return "network-first-offline-fallback";
  }

  // 5. Everything else (non-cacheable JS chunks, etc.) — passthrough.
  return "passthrough";
}

// ---------------------------------------------------------------------------
// INSTALL — precache the offline fallback; skip waiting so we activate fast.
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      // Pre-populate the offline fallback page.
      // Use "reload" to bypass the HTTP cache on install so we always get fresh.
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      // Take over immediately — don't wait for old SW to idle out.
      await self.skipWaiting();
    })()
  );
});

// ---------------------------------------------------------------------------
// ACTIVATE — prune stale caches, then claim all clients.
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete every cache this origin owns that isn't in our current list.
      // This also purges any fv-shell-v1/v2 caches that may have stored
      // authenticated /athlete/* HTML from the pre-safelist implementation.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !OWNED_CACHES.includes(key))
          .map((key) => caches.delete(key))
      );
      // Claim existing tabs so they're covered without a reload.
      await self.clients.claim();
    })()
  );
});

// ---------------------------------------------------------------------------
// FETCH — route every request to the right strategy.
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // FV-495 — method gate FIRST: only GET and HEAD are ever intercepted.
  // Everything else (Server Action POSTs, etc.) gets no respondWith — the
  // browser performs the request natively and nothing here can touch it.
  if (!isInterceptableMethod(request.method)) {
    return;
  }

  const url = new URL(request.url);

  // FV-126 — single decision point. `decideStrategy` (mirror of the pure
  // function in apps/web/lib/sw/route-strategy.ts) classifies the request by
  // pathname + same-origin + navigate flag. The dispatch below maps each
  // strategy name to its handler. Behavior is identical to the previous inline
  // branch chain — the route classification table is documented per-branch
  // inside decideStrategy and in route-strategy.ts.
  //
  // Per-route rationale (unchanged):
  //   1a.  /audio/pregame/*  — MP3s, sidecar JSON, clips manifest. Public static
  //        (zero PII), served cache-first from AUDIO_CACHE so the guided session
  //        plays offline once precached (audio-precache.ts). HEAD probes from
  //        screens-b.tsx are answered from the cached GET inside audioCacheFirst.
  //   1a-ii. /audio/beds/*   — content-addressed ambient beds, same AUDIO_CACHE.
  //   1b.  /athlete/pregame  — the ONLY /athlete/* path with a cache strategy.
  //        PII-free static shell; HTML + RSC payloads safe to serve offline.
  //        INVARIANT: if pregame/page.tsx ever renders server-side user data,
  //        remove it from route-strategy.ts (and here) so it bypasses again.
  //   1c.  bypass list (BYPASS_PREFIXES) — /api, /auth, /athlete (minor PII:
  //        name, sport, rhythm), /dashboard, /pair, auth flow pages, /subscribe,
  //        and all other /audio/* — always network, NEVER cached.
  //   2.   /_next/static/*   — content-addressed; cache-first. (/_next/image is
  //        NOT matched — it's a query-param optimizer endpoint, must stay live.)
  //   3.   icon/font files   — cache-first (ICON_OR_FONT_RE).
  //   4.   navigations        — network-first + offline fallback; only the
  //        NAVIGATION_CACHE_SAFELIST pages are written to cache.
  //   passthrough — cross-origin + non-cacheable chunks: no respondWith, the
  //        browser's default network fetch handles it (never cached).
  const strategy = decideStrategy(
    url.pathname,
    url.origin === self.location.origin,
    request.mode === "navigate"
  );

  switch (strategy) {
    case "audio-cache-first":
      event.respondWith(audioCacheFirst(request));
      return;
    case "pregame-shell-network-first":
      event.respondWith(pregameShellNetworkFirst(request));
      return;
    case "cache-first":
      event.respondWith(cacheFirst(request));
      return;
    case "network-first-offline-fallback":
      event.respondWith(networkFirstWithOfflineFallback(request));
      return;
    case "passthrough":
    default:
      // Fall through — the browser handles it with no SW interception.
      return;
  }
});

// ---------------------------------------------------------------------------
// PUSH — FV-164 daily training reminder
//
// Receives a push message from the cron and shows a visible notification.
// Payload shape: { title: string, body: string, url: string }
//
// Privacy: the payload content is NEVER logged and is not cached anywhere in
// Cache Storage. We only read it to populate the transient notification.
// `userVisibleOnly` is implicitly satisfied — every push call here results
// in a showNotification() call. No silent pushes.
//
// Tag "fv-daily-reminder" collapses duplicate notifications (e.g. if the
// cron fires twice) so the athlete never sees duplicate banners.
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  let title = "Time to train";
  let body = "A few minutes for your mind today. Your training is ready when you are.";
  let url = "/athlete";

  // Parse the push payload. If it's missing or malformed, fall back to the
  // hardcoded defaults above — the notification must always show something.
  if (event.data) {
    try {
      const data = event.data.json();
      if (typeof data.title === "string" && data.title.length > 0) {
        title = data.title;
      }
      if (typeof data.body === "string" && data.body.length > 0) {
        body = data.body;
      }
      if (typeof data.url === "string" && data.url.length > 0) {
        url = data.url;
      }
    } catch {
      // Malformed JSON — use defaults. Do NOT log the raw payload (privacy).
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url },
      tag: "fv-daily-reminder",
    })
  );
});

// ---------------------------------------------------------------------------
// NOTIFICATIONCLICK — FV-164 daily training reminder
//
// When the athlete taps the notification:
//   1. Close the notification.
//   2. If an /athlete tab is already open, bring it into focus.
//   3. Otherwise open /athlete in a new tab.
//
// Privacy: we only inspect window URLs to find an existing tab — we do not
// log them or send them anywhere.
// ---------------------------------------------------------------------------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Resolve the target to a SAME-ORIGIN path before handing it to openWindow.
  // Defense-in-depth: today's payloads are first-party (cron sends "/athlete"),
  // but never pass an unvalidated URL to openWindow — a cross-origin value would
  // be an open redirect launched from a trusted notification.
  let targetUrl = "/athlete";
  const rawUrl = event.notification.data?.url;
  if (typeof rawUrl === "string" && rawUrl.length > 0) {
    try {
      const resolved = new URL(rawUrl, self.location.origin);
      if (resolved.origin === self.location.origin) {
        targetUrl = resolved.pathname + resolved.search;
      }
    } catch {
      // Malformed — keep the default.
    }
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Look for an existing window on this origin that is already open.
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          // Prefer a window already at /athlete or any /athlete/* path.
          if (
            clientUrl.origin === self.location.origin &&
            clientUrl.pathname.startsWith("/athlete")
          ) {
            await client.focus();
            return;
          }
        } catch {
          // Malformed client URL — skip.
        }
      }

      // No matching window found — open a new one.
      await self.clients.openWindow(targetUrl);
    })()
  );
});

// ---------------------------------------------------------------------------
// Strategy: audio cache-first (FV-106)
// Serves /audio/pregame/* from AUDIO_CACHE.
//
// HEAD requests: browsers/screens-b.tsx probe audio files with HEAD to check
// reachability before starting a session. Offline, a cached GET response can
// answer a HEAD probe. We match with {ignoreMethod:true} so a cached GET
// satisfies the HEAD check, then strip the body from the response so the
// reply is a valid HEAD response. This keeps screens-b.tsx's preflight logic
// working offline without touching that file.
//
// GET requests: standard cache-first. On cache miss, fetch from network and
// store in AUDIO_CACHE (not the shell cache, so audio rotates independently).
// Only 200 OK non-206 non-opaque responses are cached.
//
// 206 Partial Content is intentionally NOT cached — the `caches` API does not
// support storing range responses, and attempting to do so in some browsers
// throws or produces a corrupt entry. Range requests fall through to network.
// ---------------------------------------------------------------------------
async function audioCacheFirst(request) {
  const isHead = request.method === "HEAD";

  // For HEAD: look up the cached GET response (ignoreMethod:true) so an
  // already-cached file answers the offline probe.
  const cached = await caches.match(
    isHead ? new Request(request.url, { method: "GET" }) : request,
  );
  if (cached) {
    if (isHead) {
      // Synthesize a HEAD response: same status/headers, no body.
      return new Response(null, {
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers,
      });
    }
    return cached;
  }

  // Cache miss — try the network.
  // Always fetch as GET so we can cache the body for future offline use,
  // even when the original request was HEAD.
  try {
    const fetchRequest = isHead
      ? new Request(request.url, { method: "GET" })
      : request;
    const networkResponse = await fetch(fetchRequest);

    // Cache 200 OK, non-206, non-opaque responses. Caching the GET body means
    // future HEAD probes (and GET requests) are served offline.
    if (
      networkResponse.ok &&
      networkResponse.status !== 206 &&
      networkResponse.type !== "opaque"
    ) {
      const cache = await caches.open(AUDIO_CACHE);
      // Best-effort background write (FV-495): a rejected put (quota, eviction
      // race) must never surface as an unhandled rejection in the SW.
      cache
        .put(new Request(request.url, { method: "GET" }), networkResponse.clone())
        .catch(() => {/* best-effort cache write */});
    }

    if (isHead) {
      // Return a proper HEAD response (no body) to the caller.
      return new Response(null, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: networkResponse.headers,
      });
    }
    return networkResponse;
  } catch {
    // Network failure on a cache miss: nothing we can do.
    return new Response("Audio unavailable offline", { status: 503 });
  }
}

// ---------------------------------------------------------------------------
// Strategy: pregame shell network-first (FV-107)
//
// /athlete/pregame only. The page is a PII-free static server shell (renders
// <PregameClientShell />, no user data). We cache the response — both the
// navigation HTML and RSC data fetches — so offline visits can mount the
// client component and run the pregame flow.
//
// Network success: serve + cache (keyed by full URL).
// Network failure: serve from cache if available, else serve the offline page.
//
// Cache invalidation: CACHE_VERSION is bumped on every deploy that changes the
// app shell. Activation pruning removes the old version. Stale pregame shell
// cache entries (from a prior deployment) are swept away automatically when
// the SW activates on the next online visit after a deploy.
//
// PRIVACY: only responses from /athlete/pregame are written here. The Set-Cookie
// guard below ensures that if the response ever carries auth token cookies (which
// it won't given the static shell contract), we do not cache it — this is a
// backstop, not the primary guarantee.
// ---------------------------------------------------------------------------
async function pregameShellNetworkFirst(request) {
  // Try network first.
  try {
    const networkResponse = await fetch(request);

    // Only cache 200 OK responses. 3xx (redirect to /signin if offline auth
    // somehow runs server-side) or error responses must not be cached.
    if (
      networkResponse.ok &&
      networkResponse.status === 200 &&
      networkResponse.type !== "opaque"
    ) {
      // Guard: if the response carries a Set-Cookie header (auth token),
      // it's NOT PII-free. Do not cache it — fall through and serve the
      // network response uncached. This is a backstop; in normal operation
      // the static shell page never sets cookies.
      const hasCookies = networkResponse.headers.has("set-cookie");
      if (!hasCookies) {
        const cache = await caches.open(CACHE_VERSION);
        // clone() before consuming body in the cache.put() call.
        // Best-effort background write (FV-495): never an unhandled rejection.
        cache
          .put(request, networkResponse.clone())
          .catch(() => {/* best-effort cache write */});
      }
    }

    return networkResponse;
  } catch {
    // Network failure — serve from cache if available.
    const cached = await caches.match(request, { ignoreSearch: false });
    if (cached) return cached;

    // No cache: serve the offline fallback.
    // The client (PregameClientShell) detects the offline state via the
    // network error on getUser() and shows "Connect first" if no localStorage
    // cache exists. If the user got here via client-side navigation within the
    // React app (the normal PWA flow), the React app is still alive — only
    // hard/direct navigations to /athlete/pregame land here.
    const offlineFallback = await caches.match(OFFLINE_URL);
    if (offlineFallback) return offlineFallback;

    return new Response(
      '<!doctype html><html lang="en"><head><title>Offline</title></head><body style="background:#050505;color:#F7F7F7;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px"><div><p style="color:#DFAF37;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px">From Victory</p><h1 style="font-size:28px;margin-bottom:12px">You\'re offline</h1><p style="opacity:0.6;font-size:15px">Open the pregame session once with a connection so it\'s ready at the rink.</p></div></body></html>',
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

// ---------------------------------------------------------------------------
// Strategy: cache-first
// Read from cache; if not there, fetch from network and store the response.
// ---------------------------------------------------------------------------
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    // Only cache successful, non-opaque responses to avoid caching error pages.
    if (
      networkResponse.ok &&
      networkResponse.status !== 206 && // partial content — don't cache
      networkResponse.type !== "opaque"
    ) {
      const cache = await caches.open(CACHE_VERSION);
      // Best-effort background write (FV-495): never an unhandled rejection.
      cache
        .put(request, networkResponse.clone())
        .catch(() => {/* best-effort cache write */});
    }
    return networkResponse;
  } catch {
    // Cache miss + network failure: nothing we can do for a non-navigation.
    return new Response("Network error", { status: 503 });
  }
}

// ---------------------------------------------------------------------------
// Strategy: network-first with offline fallback (navigation only)
//
// PRIVACY CONTRACT:
//   - cache.put() is called ONLY when the request pathname is in
//     NAVIGATION_CACHE_SAFELIST (/offline, /privacy, /terms — NOT "/", see
//     the safelist's own doc comment above for why "/" is permanently
//     excluded, FV-489 round 2).
//   - All other navigation responses are returned directly from the network
//     and NEVER written to Cache Storage.
//   - The /offline fallback is always served from the precached copy
//     installed at SW boot — it is a static, PII-free page.
//
// FV-489 round 2 — the shell-vs-browser problem this used to solve for "/"
// (a shell response replayed on cold start, bypassing the in-shell
// entry-point router) is now solved structurally: "/" is never in
// NAVIGATION_CACHE_SAFELIST, so `isSafelisted` is false for it and this
// function cannot write it to Cache Storage for ANY User-Agent, shell or
// browser. The round-1 fix's `isNativeShellWebView` check (reading
// self.navigator.userAgent inside the SW) has been removed — it was
// verified on-device to never evaluate true, i.e. it did nothing, because
// there is no confirmed way for Capacitor's appendUserAgent (applied to the
// WebView's page requests) to reach the service worker's own global scope.
// No UA signal reaching the SW is required by this function anymore.
//
// The one remaining guard, Cache-Control: no-store, stays as ordinary
// defense in depth (honored for ANY caller, shell or browser) in case a
// future safelisted response is ever marked no-store server-side.
// ---------------------------------------------------------------------------
async function networkFirstWithOfflineFallback(request) {
  const url = new URL(request.url);
  const isSafelisted = NAVIGATION_CACHE_SAFELIST.includes(url.pathname);

  try {
    const networkResponse = await fetch(request);
    const noStore = (networkResponse.headers.get("cache-control") || "")
      .toLowerCase()
      .includes("no-store");
    // Only write safelisted public pages to cache — never authenticated
    // HTML, never "/" (permanently excluded from the safelist, see above),
    // and never a response the server explicitly marked no-store.
    if (
      isSafelisted &&
      networkResponse.ok &&
      networkResponse.type !== "opaque" &&
      !noStore
    ) {
      const cache = await caches.open(CACHE_VERSION);
      // Best-effort background write (FV-495): never an unhandled rejection.
      cache
        .put(request, networkResponse.clone())
        .catch(() => {/* best-effort cache write */});
    }
    return networkResponse;
  } catch {
    // Network failed — serve whatever we have cached for this URL.
    // (Only safelisted pages will have a cached copy, which is intentional.)
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    // No cached version of this specific page; serve the branded offline page.
    const offlineFallback = await caches.match(OFFLINE_URL);
    if (offlineFallback) return offlineFallback;

    // Final backstop if something went very wrong during install.
    return new Response(
      '<!doctype html><html lang="en"><head><title>Offline</title></head><body style="background:#050505;color:#F7F7F7;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px"><div><p style="color:#DFAF37;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px">From Victory</p><h1 style="font-size:28px;margin-bottom:12px">You\'re offline</h1><p style="opacity:0.6;font-size:15px">Connect and reopen the app to continue.</p></div></body></html>',
      { headers: { "Content-Type": "text/html" } }
    );
  }
}
