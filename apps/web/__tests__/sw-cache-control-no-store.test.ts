// FV-489 round 2 — the service worker must NEVER write "/" to Cache Storage,
// for ANY User-Agent (native shell or ordinary browser), full stop.
//
// Round 1 (merged, PR #440) tried to detect "am I the native shell" from
// inside the service worker via `self.navigator.userAgent` and skip the
// cache write only in that case. It shipped with 2052 passing tests and did
// nothing on real hardware: a signed-in-parent → sign-out → force-stop →
// cold-start sequence on a real Android device still landed on the cached
// marketing page. Only `pm clear` (wiping Cache Storage) fixed it — proving
// the SW-side UA check never evaluated true. Root cause: there is no
// confirmed evidence that Capacitor's `appendUserAgent` (which decorates the
// WebView's own page requests) reaches the service worker's separate global
// scope or the `fetch()` it performs from there.
//
// Round 2's fix is structural, not signal-based: "/" is removed from
// `NAVIGATION_CACHE_SAFELIST` entirely, so `networkFirstWithOfflineFallback`
// cannot write it to Cache Storage no matter what `self.navigator.userAgent`
// says — there is no UA branch left to fail silently. This file's job is to
// prove that in a way round 1's test suite did NOT: by asserting the "/"
// case with a UA-independent lens (parametrized over shell AND browser UA,
// and over both a normal 200 and a "no-store" response), rather than only
// asserting "the shell branch fires."
//
// Extracted from the REAL sw.js source (same technique as
// __tests__/sw-route-strategy.test.ts's sync test) and exercised against a
// mocked Cache Storage + fetch, so this is a real behavioral test, not just
// a source-text regex.
//
// Node env — fetch/Response/URL are Node's own global implementations.

import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

const SW_PATH = path.resolve(__dirname, "..", "public", "sw.js");
const swSource = fs.readFileSync(SW_PATH, "utf8");

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
function makeMockCaches(seed?: Record<string, Response>) {
  const store = new Map<string, Response>(Object.entries(seed ?? {}));
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
 * injecting a mock `caches` and a controllable `fetch`. Deliberately does
 * NOT inject `self` / `navigator` — the real function no longer reads
 * `self.navigator.userAgent` (that dependency was removed in FV-489 round
 * 2), and this factory would throw a ReferenceError if the source still
 * referenced `self` anywhere in this extracted block, which is itself a
 * regression guard: if a future edit reintroduces a `self.*` read inside
 * this function, this test file fails to even build the harness.
 * CACHE_VERSION, OFFLINE_URL, and NAVIGATION_CACHE_SAFELIST are all pulled
 * from the real source so this test breaks if any of them drift.
 */
function buildSwNetworkFirstWithOfflineFallback(
  mockCaches: ReturnType<typeof makeMockCaches>["caches"],
  fetchImpl: typeof fetch,
) {
  const body = [
    extractConst("CACHE_VERSION"),
    extractConst("OFFLINE_URL"),
    extractConst("NAVIGATION_CACHE_SAFELIST"),
    extractNetworkFirstWithOfflineFallback(),
    "return networkFirstWithOfflineFallback;",
  ].join("\n");
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const factory = new Function("caches", "fetch", body) as (
    caches: unknown,
    fetch: unknown,
  ) => (request: Request) => Promise<Response>;
  return factory(mockCaches, fetchImpl);
}

describe("sw.js NAVIGATION_CACHE_SAFELIST permanently excludes '/' (FV-489 round 2)", () => {
  it("the safelist array literal in sw.js does not contain \"/\"", () => {
    const decl = extractConst("NAVIGATION_CACHE_SAFELIST");
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const arr = new Function(
      `${decl}\nreturn NAVIGATION_CACHE_SAFELIST;`,
    )() as string[];
    expect(arr).not.toContain("/");
    expect(arr).toEqual(["/offline", "/privacy", "/terms"]);
  });

  it("sw.js no longer defines the unproven SW-UA signal as live code", () => {
    // The doc comments legitimately mention these identifiers in prose to
    // explain what was removed and why (auditability) — assert there is no
    // live DECLARATION or executable READ of them left, not that the bare
    // words never appear anywhere in the file.
    expect(swSource).not.toMatch(/const\s+isNativeShellWebView\b/);
    expect(swSource).not.toMatch(/const\s+NATIVE_SHELL_UA_TOKEN\b/);
    expect(swSource).not.toMatch(/self\.navigator\.userAgent\s*\|\|/);
    expect(swSource).not.toMatch(/!\s*isNativeShellWebView\b/);
  });
});

describe("sw.js networkFirstWithOfflineFallback never writes '/' to Cache Storage — UA-independent (FV-489 round 2)", () => {
  let mock: ReturnType<typeof makeMockCaches>;

  beforeEach(() => {
    mock = makeMockCaches();
  });

  // The core regression case round 1's test suite did NOT cover: a normal,
  // fully cacheable 200 response for "/" — no no-store, no shell-specific
  // anything — for BOTH a shell UA and an ordinary browser UA. Round 1 only
  // asserted the shell branch; round 2 must hold regardless of UA because
  // there is no UA branch left at all.
  it.each([
    ["native-shell WebView", SHELL_UA],
    ["ordinary browser", BROWSER_UA],
  ])(
    "does NOT write '/' to Cache Storage for a %s, even with an ordinary cacheable response",
    async (_label, userAgent) => {
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
      );
      const request = new Request("https://www.fromvictoryapp.com/", {
        headers: { "user-agent": userAgent },
      });

      const response = await strategy(request);

      expect(response.status).toBe(200);
      expect(mock.putCalls).toHaveLength(0);
      expect(mock.store.size).toBe(0);
    },
  );

  it.each([
    ["native-shell WebView", SHELL_UA],
    ["ordinary browser", BROWSER_UA],
  ])(
    "does NOT write a no-store '/' response to Cache Storage for a %s",
    async (_label, userAgent) => {
      const fetchImpl = (async () =>
        new Response("<html>shell entry-point router decides fresh</html>", {
          status: 200,
          headers: { "content-type": "text/html", "cache-control": "no-store" },
        })) as unknown as typeof fetch;

      const strategy = buildSwNetworkFirstWithOfflineFallback(
        mock.caches,
        fetchImpl,
      );
      const request = new Request("https://www.fromvictoryapp.com/", {
        headers: { "user-agent": userAgent },
      });

      const response = await strategy(request);

      expect(response.status).toBe(200);
      expect(mock.putCalls).toHaveLength(0);
    },
  );

  it("falls back to the precached OFFLINE_URL for '/' when the network fails and nothing is cached (no stale marketing page can be served)", async () => {
    // Seeded under the literal OFFLINE_URL key ("/offline") — that's exactly
    // how the real function looks it up: `caches.match(OFFLINE_URL)` passes
    // the bare constant string, not a resolved Request/URL.
    const seeded = makeMockCaches({
      "/offline": new Response("<html>offline fallback</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    });
    const fetchImpl = (async () => {
      throw new Error("network unavailable");
    }) as unknown as typeof fetch;

    const strategy = buildSwNetworkFirstWithOfflineFallback(
      seeded.caches,
      fetchImpl,
    );
    const request = new Request("https://www.fromvictoryapp.com/", {
      headers: { "user-agent": BROWSER_UA },
    });

    const response = await strategy(request);
    const text = await response.text();

    expect(text).toContain("offline fallback");
    // Never a marketing/"/" entry — there isn't one, and can never be one.
    expect(seeded.store.has("https://www.fromvictoryapp.com/")).toBe(false);
  });

  it("still caches an ordinary (non-no-store) '/offline' response for a browser — offline behavior unchanged", async () => {
    const fetchImpl = (async () =>
      new Response("<html>offline</html>", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "cache-control": "public, max-age=0, must-revalidate",
        },
      })) as unknown as typeof fetch;

    const strategy = buildSwNetworkFirstWithOfflineFallback(
      mock.caches,
      fetchImpl,
    );
    const request = new Request("https://www.fromvictoryapp.com/offline", {
      headers: { "user-agent": BROWSER_UA },
    });

    await strategy(request);

    expect(mock.putCalls).toEqual(["https://www.fromvictoryapp.com/offline"]);
  });

  it.each([
    ["native-shell WebView", SHELL_UA],
    ["ordinary browser", BROWSER_UA],
  ])(
    "still caches '/privacy' and '/terms' for a %s (no UA gate on the remaining safelisted pages)",
    async (_label, userAgent) => {
      for (const path of ["/privacy", "/terms"]) {
        const localMock = makeMockCaches();
        const fetchImpl = (async () =>
          new Response(`<html>${path}</html>`, {
            status: 200,
            headers: { "content-type": "text/html" },
          })) as unknown as typeof fetch;

        const strategy = buildSwNetworkFirstWithOfflineFallback(
          localMock.caches,
          fetchImpl,
        );
        const request = new Request(
          `https://www.fromvictoryapp.com${path}`,
          { headers: { "user-agent": userAgent } },
        );

        await strategy(request);

        expect(localMock.putCalls).toEqual([
          `https://www.fromvictoryapp.com${path}`,
        ]);
      }
    },
  );

  it("never caches a no-store response even with mixed-case / extra directives (browser, safelisted page)", async () => {
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
    );
    const request = new Request("https://www.fromvictoryapp.com/privacy", {
      headers: { "user-agent": BROWSER_UA },
    });

    await strategy(request);

    expect(mock.putCalls).toHaveLength(0);
  });

  it("never caches a non-safelisted path regardless of UA or Cache-Control (unchanged baseline)", async () => {
    const fetchImpl = (async () =>
      new Response("<html>x</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as unknown as typeof fetch;

    const strategy = buildSwNetworkFirstWithOfflineFallback(
      mock.caches,
      fetchImpl,
    );
    const request = new Request("https://www.fromvictoryapp.com/pricing", {
      headers: { "user-agent": BROWSER_UA },
    });

    await strategy(request);

    expect(mock.putCalls).toHaveLength(0);
  });
});
