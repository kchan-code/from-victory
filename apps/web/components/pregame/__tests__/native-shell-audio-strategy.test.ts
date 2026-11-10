/**
 * @vitest-environment jsdom
 *
 * FV-638 — native shells: "Set up for later" download + offline Pregame audio.
 *
 * Both shipped Capacitor shells inject `window.Capacitor`. Before FV-638 that
 * alone selected the NativeCacheStrategy stub, whose warm/check/isCached
 * throw — so in the Android app the download always failed ("Couldn't
 * connect") and a saved session never read as offline-ready, even though the
 * Android WebView runs the Service Worker + Cache Storage exactly like the PWA.
 *
 * These tests pin the capability-based selection:
 *   - browser / PWA (no Capacitor)          → WebCacheStrategy (unchanged)
 *   - Capacitor + Service Worker (Android)  → WebCacheStrategy (FV-638 fix)
 *   - Capacitor, no Service Worker (iOS)    → NativeCacheStrategy (unchanged)
 * and that, in an Android-shell-like runtime, the real precache → check round
 * trip through the production default strategy now completes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/components/pregame/audio-playlist", () => ({
  manifestUrl: () => "http://localhost/audio/pregame/clips/manifest.json?mv=test",
  resolvePlaylist: () => [
    { slug: "opener-calm", url: "http://localhost/audio/pregame/clips/opener-calm.aaaaaaaa.mp3" },
    { slug: "hm-nervous-forward", url: "http://localhost/audio/pregame/clips/hm-nervous-forward.bbbbbbbb.mp3" },
  ],
  resolvePracticePlaylist: () => null,
}));

import {
  selectCacheStrategy,
  WebCacheStrategy,
  NativeCacheStrategy,
  _resetCacheStrategyForTests,
} from "@/lib/audio/cache-strategy";
import {
  precachePregameAudio,
  checkPregameAudioCached,
} from "@/components/pregame/audio-precache";

// --- a real (Map-backed) Cache Storage stub so warm → check round-trips ------
function makeCacheStorage() {
  const entries = new Map<string, Response>();
  const keyOf = (req: Request | string) => (typeof req === "string" ? req : req.url);
  const cache = {
    match: vi.fn(async (req: Request | string) => entries.get(keyOf(req))?.clone()),
    put: vi.fn(async (req: Request | string, res: Response) => {
      entries.set(keyOf(req), res);
    }),
  };
  return { storage: { open: vi.fn(async () => cache) }, entries };
}

const MANIFEST_BODY = JSON.stringify({ version: "test", clips: {}, templates: [] });

function stubNetwork() {
  const fetchMock = vi.fn(async (req: Request | string) => {
    const url = typeof req === "string" ? req : req.url;
    if (url.includes("manifest.json")) {
      return new Response(MANIFEST_BODY, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("mp3-bytes", { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function installCapacitor() {
  Object.defineProperty(window, "Capacitor", {
    value: { getPlatform: () => "android" },
    configurable: true,
    writable: true,
  });
}

function installServiceWorker() {
  Object.defineProperty(navigator, "serviceWorker", {
    value: { controller: null, register: vi.fn() },
    configurable: true,
    writable: true,
  });
}

const PARAMS = {
  sport: "hockey" as const,
  need: "Calm",
  position: "Forward",
  adversity: "nervous",
};

beforeEach(() => {
  _resetCacheStrategyForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  // jsdom: remove the injected globals so each test starts from a plain browser.
  delete (window as unknown as Record<string, unknown>).Capacitor;
  delete (navigator as unknown as Record<string, unknown>).serviceWorker;
  _resetCacheStrategyForTests();
});

describe("selectCacheStrategy — capability-based (FV-638)", () => {
  it("browser / PWA (no Capacitor) → WebCacheStrategy", () => {
    vi.stubGlobal("caches", makeCacheStorage().storage);
    installServiceWorker();
    expect(selectCacheStrategy()).toBeInstanceOf(WebCacheStrategy);
  });

  it("browser without Service Worker support (no Capacitor) → still WebCacheStrategy (unchanged)", () => {
    expect(selectCacheStrategy()).toBeInstanceOf(WebCacheStrategy);
  });

  it("Android shell (Capacitor + Service Worker + Cache Storage) → WebCacheStrategy", () => {
    installCapacitor();
    installServiceWorker();
    vi.stubGlobal("caches", makeCacheStorage().storage);
    expect(selectCacheStrategy()).toBeInstanceOf(WebCacheStrategy);
  });

  it("iOS shell (Capacitor, no navigator.serviceWorker) → NativeCacheStrategy (unchanged)", () => {
    installCapacitor();
    vi.stubGlobal("caches", makeCacheStorage().storage);
    expect(selectCacheStrategy()).toBeInstanceOf(NativeCacheStrategy);
  });

  it("Capacitor + Service Worker but no Cache Storage → NativeCacheStrategy (cannot warm)", () => {
    installCapacitor();
    installServiceWorker();
    expect(selectCacheStrategy()).toBeInstanceOf(NativeCacheStrategy);
  });
});

describe("Android shell — Set up for later round trip through the production default", () => {
  it("precache downloads every reachable URL and the saved session then reads as offline-ready", async () => {
    installCapacitor();
    installServiceWorker();
    const { storage, entries } = makeCacheStorage();
    vi.stubGlobal("caches", storage);
    const fetchMock = stubNetwork();

    const progress: number[] = [];
    const status = await precachePregameAudio(PARAMS, (s) => progress.push(s.cached));

    // manifest + 2 clips, all warmed into fv-audio-<mv>; no error, no stub throw.
    expect(status).toEqual({ cached: 3, total: 3, done: true, error: null });
    expect(entries.size).toBe(3);
    expect(progress.at(-1)).toBe(3);
    expect(fetchMock).toHaveBeenCalled();

    // Offline from here: the check must not touch the network.
    fetchMock.mockClear();
    fetchMock.mockImplementation(async (req: Request | string) => {
      const url = typeof req === "string" ? req : req.url;
      // The SW would serve the cached manifest; emulate that cache-first read.
      const hit = entries.get(url);
      if (hit) return hit.clone();
      throw new TypeError("Failed to fetch");
    });
    const check = await checkPregameAudioCached(PARAMS);
    expect(check).toEqual({ cached: 3, total: 3, done: true, error: null });
  });

  it("a second Set up for later is idempotent (already-cached URLs are not re-downloaded)", async () => {
    installCapacitor();
    installServiceWorker();
    const { storage } = makeCacheStorage();
    vi.stubGlobal("caches", storage);
    const fetchMock = stubNetwork();

    await precachePregameAudio(PARAMS);
    const clipFetchesBefore = fetchMock.mock.calls.filter((c) =>
      String(c[0] instanceof Request ? c[0].url : c[0]).endsWith(".mp3"),
    ).length;
    await precachePregameAudio(PARAMS);
    const clipFetchesAfter = fetchMock.mock.calls.filter((c) =>
      String(c[0] instanceof Request ? c[0].url : c[0]).endsWith(".mp3"),
    ).length;
    expect(clipFetchesAfter).toBe(clipFetchesBefore);
  });
});

describe("iOS shell — behavior unchanged by FV-638", () => {
  it("Set up for later still reports the native stub's error (no silent success)", async () => {
    installCapacitor();
    const { storage, entries } = makeCacheStorage();
    vi.stubGlobal("caches", storage);
    stubNetwork();
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const status = await precachePregameAudio(PARAMS);
    expect(status.done).toBe(false);
    expect(status.error).toMatch(/NativeCacheStrategy/);
    expect(entries.size).toBe(0);
  });
});
