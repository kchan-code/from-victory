/**
 * From Victory — App Shell Service Worker (FV-105)
 *
 * Strategy matrix:
 *   /_next/static/*  + icon/font assets  → cache-first  (populated as-fetched)
 *   navigations (mode === "navigate")    → network-first → offline fallback
 *   /api/*  /auth/*  cross-origin        → always network, never cached
 *   /audio/*                             → skipped entirely (FV-106 owns this)
 *
 * No build-time manifest injection. No Workbox. Hand-written and auditable.
 * kids-privacy-officer: the cache stores only static build assets and the
 * offline fallback HTML. No user data, no auth tokens, no journal content,
 * no audio (FV-106). Cache is device-local only (no sync/share surface).
 *
 * Bump CACHE_VERSION any time the shell layout or offline page changes.
 */

const CACHE_VERSION = "fv-shell-v1";

/**
 * Caches we own and are allowed to keep alive.
 * Any cache name NOT in this list is deleted on activate.
 */
const OWNED_CACHES = [CACHE_VERSION];

/**
 * The offline fallback is fetched and cached during install so it is
 * always available even before the athlete has visited the page online.
 */
const OFFLINE_URL = "/offline";

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
  const url = new URL(request.url);

  // Only handle same-origin requests — never intercept cross-origin/CDN/Supabase.
  if (url.origin !== self.location.origin) {
    return; // fall through to the browser's default network fetch
  }

  // ---- 1. NEVER cache — always network (pass straight through) ----
  //
  // /api/*          — server actions, webhooks, data endpoints
  // /auth/*         — Supabase auth callbacks (contains redirect tokens)
  // /dashboard/*    — parent dashboard (server-rendered, needs fresh auth)
  // /signin*        — auth flow pages
  // /signup*        — auth flow pages
  // /forgot-*       — auth flow pages
  // /reset-*        — auth flow pages
  // /subscribe*     — Stripe checkout / subscription flow
  // /audio/*        — audio pipeline (owned by FV-106, do NOT intercept)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/dashboard/") ||
    url.pathname.startsWith("/signin") ||
    url.pathname.startsWith("/signup") ||
    url.pathname.startsWith("/forgot-") ||
    url.pathname.startsWith("/reset-") ||
    url.pathname.startsWith("/subscribe") ||
    url.pathname.startsWith("/audio/")
  ) {
    return; // fall through — browser handles with no SW interception
  }

  // ---- 2. Static build assets — cache-first ----
  //
  // /_next/static/* is content-addressed by Next.js (hash in filename),
  // so cache-forever is safe. Populate as the athlete visits pages.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ---- 3. Brand asset files — cache-first ----
  //
  // Icons and fonts accessed by their full path. The SW picks these up
  // after first load and serves them offline on subsequent visits.
  const isIconOrFont =
    /\.(png|svg|ico|webmanifest|woff2|woff|ttf|otf)$/.test(url.pathname);
  if (isIconOrFont) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ---- 4. Navigation requests — network-first with offline fallback ----
  //
  // This is what makes the installed PWA launch offline. The browser's
  // navigation request goes to the network first; if it fails (no connectivity)
  // we serve the offline page from the install-time cache.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // All other same-origin requests (non-cacheable JS chunks, etc.) fall
  // through to the browser's default network fetch with no interception.
});

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
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Cache miss + network failure: nothing we can do for a non-navigation.
    return new Response("Network error", { status: 503 });
  }
}

// ---------------------------------------------------------------------------
// Strategy: network-first with offline fallback (navigation only)
// ---------------------------------------------------------------------------
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache successful navigations so the shell is available offline next time.
    if (networkResponse.ok && networkResponse.type !== "opaque") {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Network failed — serve whatever we have cached for this URL.
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    // No cached version of this specific page; serve the branded offline page.
    const offlineFallback = await caches.match(OFFLINE_URL);
    if (offlineFallback) return offlineFallback;

    // Final backstop if something went very wrong during install.
    return new Response(
      "<!doctype html><html><head><title>Offline</title></head><body style='background:#050505;color:#F7F7F7;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px'><div><p style='color:#DFAF37;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px'>From Victory</p><h1 style='font-size:28px;margin-bottom:12px'>You're offline</h1><p style='opacity:0.6;font-size:15px'>Connect and reopen the app to continue.</p></div></body></html>",
      { headers: { "Content-Type": "text/html" } }
    );
  }
}
