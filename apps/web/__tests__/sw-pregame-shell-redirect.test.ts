// FV-756 — the service worker must not store a REDIRECTED response as the
// Pregame page.
//
// pregameShellNetworkFirst stores a 200 for /athlete/pregame so the page can
// open offline. A fetch that followed a redirect also ends in a 200, for a
// different page (for example /update-required once a minimum app build is
// set). Stored under the Pregame address, that page would be served as
// Pregame offline. The in-app warm request (lib/pregame/warm-shell.ts) follows
// redirects, so this path is reachable on every online Pregame open.
//
// The function is extracted from the REAL sw.js source and run against a
// mocked Cache Storage and fetch (same technique as
// sw-cache-control-no-store.test.ts).

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SW_PATH = path.resolve(__dirname, "..", "public", "sw.js");
const swSource = fs.readFileSync(SW_PATH, "utf8");

const PREGAME_URL = "https://www.fromvictoryapp.com/athlete/pregame";

function extractConst(name: string): string {
  const m = swSource.match(new RegExp(`const ${name} =[\\s\\S]*?;\\n`, "m"));
  if (!m) throw new Error(`Could not extract const ${name} from sw.js`);
  return m[0];
}

function extractPregameShellNetworkFirst(): string {
  const m = swSource.match(/async function pregameShellNetworkFirst\([\s\S]*?\n}/m);
  if (!m) throw new Error("Could not extract pregameShellNetworkFirst from sw.js");
  return m[0];
}

function makeMockCaches() {
  const store = new Map<string, Response>();
  const putCalls: string[] = [];
  const key = (r: Request | string) => (typeof r === "string" ? r : r.url);
  const caches = {
    open: async (_name: string) => ({
      put: async (request: Request | string, response: Response) => {
        putCalls.push(key(request));
        store.set(key(request), response);
      },
    }),
    match: async (request: Request | string) => store.get(key(request)),
  };
  return { caches, putCalls, store };
}

function build(
  mockCaches: ReturnType<typeof makeMockCaches>["caches"],
  fetchImpl: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  const factory = new Function(
    "caches",
    "fetch",
    "Response",
    `${extractConst("CACHE_VERSION")}
     ${extractConst("OFFLINE_URL")}
     ${extractPregameShellNetworkFirst()}
     return pregameShellNetworkFirst;`,
  );
  return factory(mockCaches, fetchImpl, Response) as (request: Request) => Promise<Response>;
}

/** A 200 HTML response; `redirected` is read-only on Response, so define it. */
function page(body: string, redirected: boolean): Response {
  const res = new Response(body, { status: 200, headers: { "content-type": "text/html" } });
  Object.defineProperty(res, "redirected", { value: redirected });
  return res;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("pregameShellNetworkFirst and redirected responses (FV-756)", () => {
  it("returns a redirected 200 to the caller but does not store it", async () => {
    const { caches, putCalls } = makeMockCaches();
    const run = build(caches, async () => page("UPDATE REQUIRED", true));

    const res = await run(new Request(PREGAME_URL));
    await flush();

    expect(await res.text()).toBe("UPDATE REQUIRED");
    expect(putCalls).toEqual([]);
  });

  it("a redirected response does not replace a Pregame page stored earlier", async () => {
    const { caches, putCalls } = makeMockCaches();
    let mode: "ok" | "redirected" | "offline" = "ok";
    const run = build(caches, async () => {
      if (mode === "offline") throw new TypeError("Failed to fetch");
      return mode === "ok" ? page("PREGAME", false) : page("UPDATE REQUIRED", true);
    });

    // Online: the real page is stored.
    await run(new Request(PREGAME_URL));
    await flush();
    expect(putCalls).toEqual([PREGAME_URL]);

    // Online again, now redirected: nothing new is stored.
    mode = "redirected";
    await run(new Request(PREGAME_URL));
    await flush();
    expect(putCalls).toEqual([PREGAME_URL]);

    // Offline: the page served is still Pregame.
    mode = "offline";
    const offline = await run(new Request(PREGAME_URL));
    expect(await offline.text()).toBe("PREGAME");
  });

  it("still stores an ordinary 200 from a non-navigation request and serves it offline", async () => {
    const { caches, putCalls } = makeMockCaches();
    let online = true;
    const run = build(caches, async () => {
      if (!online) throw new TypeError("Failed to fetch");
      return page("PREGAME", false);
    });

    // The warm request: a plain same-origin GET, not a navigation.
    await run(new Request(PREGAME_URL, { method: "GET", credentials: "same-origin", cache: "no-store" }));
    await flush();
    expect(putCalls).toEqual([PREGAME_URL]);

    online = false;
    const offline = await run(new Request(PREGAME_URL));
    expect(await offline.text()).toBe("PREGAME");
  });

  it("the source guards on `redirected` (fails if the condition is removed)", () => {
    expect(extractPregameShellNetworkFirst()).toMatch(/!networkResponse\.redirected/);
  });
});
