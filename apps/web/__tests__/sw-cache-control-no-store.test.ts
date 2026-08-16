// FV-489 — the service worker must never write "/" (or the other three
// NAVIGATION_CACHE_SAFELIST pages) to Cache Storage for a native-shell
// WebView, and must respect Cache-Control: no-store when it does write.
//
// Root cause this guards against: public/sw.js's networkFirstWithOfflineFallback
// writes any successful, safelisted navigation response (NAVIGATION_CACHE_SAFELIST
// includes "/") into a durable, cross-cold-start Cache Storage entry, keyed
// only by URL (no Vary). Before this fix, a "/" response served to the native
// shell (real content, OR the followed final response of a middleware
// redirect — fetch() on a navigation request follows redirects transparently,
// so a response's exposed `.headers` reflect the FINAL destination, not any
// intermediate 307) could get cached and later replayed to ANY future request
// for "/" — shell or browser, any auth state — without ever reaching the
// origin server, so middleware.ts's native-shell entry-point router never
// runs. Only `pm clear` (wiping Cache Storage) fixed it, which matches the
// observed device bug (sign-out lands on the marketing page and it survives
// force-stop + cold start).
//
// Two independent guards in sw.js, both covered here:
//   1. isNativeShellWebView — a module-level check against self.navigator.userAgent.
//      Primary guard: inside the shell, these paths are NEVER written to
//      Cache Storage, full stop, regardless of which response headers
//      survive a redirect chain.
//   2. Cache-Control: no-store — defense in depth, honored for any caller
//      (shell or not) whose response the server explicitly marks no-store.
//      See middleware.ts / middleware-native-shell-entry.test.ts for the
//      server side of guard 2.
//
// Extracted from the REAL sw.js source (same technique as
// __tests__/sw-route-strategy.test.ts's sync test) and exercised against a
// mocked Cache Storage + fetch + navigator, so this is a real behavioral
// test, not just a source-text regex.
//
// Node env — fetch/Response/URL are Node's own global implementations.

import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

const SW_PATH = path.resolve(__dirname, "..", "public", "sw.js");
const swSource = fs.readFileSync(SW_PATH, "utf8");
const NATIVE_SHELL_PATH = path.resolve(__dirname, "..", "lib", "native-shell.ts");
const nativeShellSource = fs.readFileSync(NATIVE_SHELL_PATH, "utf8");

const SHELL_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 FVNativeShell/1";
const BROWSER_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15";

/** Pull a `const NAME = <...>;` declaration out of the sw.js source. */
function extractConst(name: string): string {
  const re = new RegExp(`const ${name} =[\\s\\S]*?;\\n`, "m");
  const m = swSource.match(re);
  if (!m) throw new Error(`Could not extract const ${name} from sw.js`);
  return m[0];
}

/**
 * Pull the `async function networkFirstWithOfflineFallback(...) { ... }`
 * block out of sw.js. The source is consistently 2-space indented and the
 * function is declared at column 0, so its own closing brace is the first
 * "\n}" occurrence — same technique __tests__/sw-route-strategy.test.ts uses
 * for decideStrategy.
 */
function extractNetworkFirstWithOfflineFallback(): string {
  const m = swSource.match(
    /async function networkFirstWithOfflineFallback\([\s\S]*?\n}/m,
  );
  if (!m) {
    throw new Error(
      "Could not extract networkFirstWithOfflineFallback from sw.js",
    );
  }
  return m[0];
}

/**
 * Minimal in-memory Cache Storage stand-in. Only implements what
 * networkFirstWithOfflineFallback actually calls: caches.open(name) →
 * { put }, and caches.match(request-or-url, opts).
 */
function makeMockCaches() {
  const store = new Map<string, Response>();
  const putCalls: string[] = [];

  const caches = {
    open: async (_name: string) => ({
      put: (request: Request | string, response: Response) => {
        const url = typeof request === "string" ? request : request.url;
        putCalls.push(url);
        store.set(url, response);
      },
    }),
    match: async (request: Request | string) => {
      const url = typeof request === "string" ? request : request.url;
      return store.get(url);
    },
  };

  return { caches, putCalls, store };
}

/**
 * Build an executable copy of sw.js's networkFirstWithOfflineFallback,
 * injecting a mock `caches`, a controllable `fetch`, and a `self` (whose
 * `self.navigator.userAgent` decides isNativeShellWebView — computed once,
 * at "module evaluation" time, matching the real sw.js — which reads
 * `self.navigator`, mirroring every other global access in sw.js).
 * CACHE_VERSION, OFFLINE_URL, NAVIGATION_CACHE_SAFELIST, and
 * NATIVE_SHELL_UA_TOKEN are all pulled from the real source so this test
 * breaks if any of them drift.
 */
function buildSwNetworkFirstWithOfflineFallback(
  mockCaches: ReturnType<typeof makeMockCaches>["caches"],
  fetchImpl: typeof fetch,
  userAgent: string,
) {
  const body = [
    extractConst("CACHE_VERSION"),
    extractConst("OFFLINE_URL"),
    extractConst("NAVIGATION_CACHE_SAFELIST"),
    extractConst("NATIVE_SHELL_UA_TOKEN"),
    extractConst("isNativeShellWebView"),
    extractNetworkFirstWithOfflineFallback(),
    "return networkFirstWithOfflineFallback;",
  ].join("\n");
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const factory = new Function("caches", "fetch", "self", body) as (
    caches: unknown,
    fetch: unknown,
    self: unknown,
  ) => (request: Request) => Promise<Response>;
  return factory(mockCaches, fetchImpl, { navigator: { userAgent } });
}

describe("sw.js networkFirstWithOfflineFallback never caches for the native shell (FV-489)", () => {
  let mock: ReturnType<typeof makeMockCaches>;

  beforeEach(() => {
    mock = makeMockCaches();
  });

  it("does NOT write '/' to Cache Storage for a native-shell WebView, even with a cacheable response", async () => {
    const fetchImpl = (async () =>
      new Response("<html>marketing page</html>", {
        status: 200,
        headers: {
          "content-type": "text/html",
          // Deliberately NOT no-store — this asserts the isNativeShellWebView
          // guard fires on its own, independent of the Cache-Control guard.
          "cache-control": "public, max-age=0, must-revalidate",
        },
      })) as unknown as typeof fetch;

    const strategy = buildSwNetworkFirstWithOfflineFallback(
      mock.caches,
      fetchImpl,
      SHELL_UA,
    );
    const request = new Request("https://www.fromvictoryapp.com/");

    const response = await strategy(request);

    expect(response.status).toBe(200);
    expect(mock.putCalls).toHaveLength(0);
    expect(mock.store.size).toBe(0);
  });

  it("does NOT write a no-store '/' response to Cache Storage for an ordinary browser", async () => {
    const fetchImpl = (async () =>
      new Response("<html>shell entry-point router decides fresh</html>", {
        status: 200,
        headers: { "content-type": "text/html", "cache-control": "no-store" },
      })) as unknown as typeof fetch;

    const strategy = buildSwNetworkFirstWithOfflineFallback(
      mock.caches,
      fetchImpl,
      BROWSER_UA,
    );
    const request = new Request("https://www.fromvictoryapp.com/");

    const response = await strategy(request);

    expect(response.status).toBe(200);
    expect(mock.putCalls).toHaveLength(0);
  });

  it("still caches an ordinary (non-no-store) '/' response for a browser — offline behavior unchanged", async () => {
    const fetchImpl = (async () =>
      new Response("<html>marketing page</html>", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "cache-control": "public, max-age=0, must-revalidate",
        },
      })) as unknown as typeof fetch;

    const strategy = buildSwNetworkFirstWithOfflineFallback(
      mock.caches,
      fetchImpl,
      BROWSER_UA,
    );
    const request = new Request("https://www.fromvictoryapp.com/");

    await strategy(request);

    expect(mock.putCalls).toEqual(["https://www.fromvictoryapp.com/"]);
  });

  it("never caches a no-store response even with mixed-case / extra directives (browser)", async () => {
    const fetchImpl = (async () =>
      new Response("<html>x</html>", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "cache-control": "No-Store, must-revalidate",
        },
      })) as unknown as typeof fetch;

    const strategy = buildSwNetworkFirstWithOfflineFallback(
      mock.caches,
      fetchImpl,
      BROWSER_UA,
    );
    const request = new Request("https://www.fromvictoryapp.com/");

    await strategy(request);

    expect(mock.putCalls).toHaveLength(0);
  });

  it("never caches a non-safelisted path regardless of shell state or Cache-Control (unchanged baseline)", async () => {
    const fetchImpl = (async () =>
      new Response("<html>x</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as unknown as typeof fetch;

    const strategy = buildSwNetworkFirstWithOfflineFallback(
      mock.caches,
      fetchImpl,
      BROWSER_UA,
    );
    const request = new Request("https://www.fromvictoryapp.com/pricing");

    await strategy(request);

    expect(mock.putCalls).toHaveLength(0);
  });
});

describe("sw.js NATIVE_SHELL_UA_TOKEN stays in sync with lib/native-shell.ts (FV-489)", () => {
  it("both files declare the exact same shell token string", () => {
    const SHELL_TOKEN = "FVNativeShell/1";
    expect(swSource).toContain(`const NATIVE_SHELL_UA_TOKEN = "${SHELL_TOKEN}"`);
    expect(nativeShellSource).toContain(
      `const NATIVE_SHELL_UA_TOKEN = "${SHELL_TOKEN}"`,
    );
  });
});
