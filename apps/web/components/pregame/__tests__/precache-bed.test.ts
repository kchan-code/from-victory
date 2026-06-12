// precache-bed.test.ts — FV-227
//
// Verifies that resolveReachableUrls (via precachePregameAudio) includes the
// chosen bed MP3 URL when bedId is set, and does NOT include any bed URL
// when bedId is null (silence).
//
// Node env — mocks the audio-playlist module so manifest resolution uses a
// controlled in-memory object (no relative-URL Request issues in Node), and
// stubs fetch + CacheStorage so no real network/browser APIs are needed.
//
// Bed paths in the mock use absolute http://localhost URLs because the Node.js
// Fetch API `new Request(url)` constructor rejects relative URLs.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (vi.mock is hoisted above imports by Vitest)
// Paths are inlined in each factory to avoid the "outer-scope variable not
// accessible in hoisted factory" gotcha — vi.mock factories run in a sandboxed
// context where file-level consts defined before the call may be undefined.
// ---------------------------------------------------------------------------

vi.mock("@/components/pregame/audio/beds", () => {
  // Use absolute URLs so new Request(path) works in the Node.js test env.
  const BEDS = [
    {
      id: "still",
      label: "Still",
      description: "Calm ambient tone",
      path: "http://localhost/audio/beds/bed-still.04f1b7b9.mp3",
      loopDurationSec: 60,
      recommendedGain: 0.35,
    },
    {
      id: "pulse",
      label: "Pulse",
      description: "Steady rhythmic beat",
      path: "http://localhost/audio/beds/bed-pulse.153b2ff8.mp3",
      loopDurationSec: 60,
      recommendedGain: 0.35,
    },
    {
      id: "rise",
      label: "Rise",
      description: "Building energy",
      path: "http://localhost/audio/beds/bed-rise.6af32fd2.mp3",
      loopDurationSec: 60,
      recommendedGain: 0.35,
    },
  ] as const;

  return {
    BEDS,
    BED_MIX_GAIN: 0.35,
    getBed: (id: string | null | undefined) =>
      id ? BEDS.find((b) => b.id === id) : undefined,
  };
});

vi.mock("@/components/pregame/audio-playlist", () => ({
  manifestUrl: () =>
    "http://localhost/audio/pregame/clips/manifest.json?mv=test",
  resolvePlaylist: () => [
    {
      slug: "opener-calm",
      url: "http://localhost/audio/pregame/clips/opener-calm.bbbbbbbb.mp3",
    },
    {
      slug: "hm-nervous-forward",
      url: "http://localhost/audio/pregame/clips/hm-nervous-forward.cccccccc.mp3",
    },
  ],
  resolvePracticePlaylist: () => null,
}));

// Import BEDS from the mocked module to get the absolute paths for assertions.
import { BEDS } from "@/components/pregame/audio/beds";

// ---------------------------------------------------------------------------
// CacheStorage + fetch stubs
// ---------------------------------------------------------------------------

function makeCacheStorageStub() {
  // cache.match() → hit for manifest URL; miss for everything else so fetch is
  // called (which the test then inspects to verify bed URL was requested).
  const matchFn = vi.fn(async (req: Request | string) => {
    const url = typeof req === "string" ? req : req.url;
    if (url.includes("manifest.json")) {
      return new Response(
        JSON.stringify({ version: "test", clips: {}, templates: [] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return undefined;
  });

  const cache = {
    match: matchFn,
    put: vi.fn(async () => {}),
    addAll: vi.fn(async () => {}),
  };

  return {
    open: vi.fn(async () => cache),
    match: vi.fn(async () => undefined),
    keys: vi.fn(async () => []),
    _cache: cache,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("precachePregameAudio with bedId (FV-227)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const cacheStub = makeCacheStorageStub();
    vi.stubGlobal("caches", cacheStub);
    // Return 200 for any URL so the precache loop doesn't blow up on network
    // fetches. The test then checks which URLs were fetched.
    fetchMock = vi.fn(async () => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("includes the chosen bed URL when bedId is set", async () => {
    const { precachePregameAudio } = await import(
      "@/components/pregame/audio-precache"
    );

    const stillBed = BEDS.find((b) => b.id === "still");
    expect(stillBed).toBeDefined();

    await precachePregameAudio({
      sport: "hockey",
      need: "Calm",
      position: "Forward",
      adversity: "nervous",
      bedId: "still",
    });

    // Collect all URLs passed to fetch (cache miss → network).
    const fetchedUrls = fetchMock.mock.calls.map((call: unknown[]) => {
      const arg = call[0] as Request | string;
      return arg instanceof Request ? arg.url : String(arg);
    });

    // The bed path (absolute URL) should appear among the fetched URLs.
    expect(fetchedUrls.some((u) => u.includes("bed-still"))).toBe(true);
  });

  it("does NOT include any bed URL when bedId is null (silence)", async () => {
    const { precachePregameAudio } = await import(
      "@/components/pregame/audio-precache"
    );

    await precachePregameAudio({
      sport: "hockey",
      need: "Calm",
      position: "Forward",
      adversity: "nervous",
      bedId: null,
    });

    const fetchedUrls = fetchMock.mock.calls.map((call: unknown[]) => {
      const arg = call[0] as Request | string;
      return arg instanceof Request ? arg.url : String(arg);
    });

    for (const bed of BEDS) {
      expect(
        fetchedUrls.some((u) => u.includes(`bed-${bed.id}`)),
        `Unexpected bed URL for "${bed.id}" fetched when bedId=null`,
      ).toBe(false);
    }
  });

  it("does NOT include any bed URL when bedId is undefined (backward-compat)", async () => {
    const { precachePregameAudio } = await import(
      "@/components/pregame/audio-precache"
    );

    await precachePregameAudio({
      sport: "hockey",
      need: "Calm",
      position: "Forward",
      adversity: "nervous",
      // bedId omitted → undefined
    });

    const fetchedUrls = fetchMock.mock.calls.map((call: unknown[]) => {
      const arg = call[0] as Request | string;
      return arg instanceof Request ? arg.url : String(arg);
    });

    for (const bed of BEDS) {
      expect(fetchedUrls.some((u) => u.includes(`bed-${bed.id}`))).toBe(false);
    }
  });
});
