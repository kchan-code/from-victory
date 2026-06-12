/**
 * @vitest-environment jsdom
 */
// FV-172 — lie-fi timeout guard for useClipPlayer's init().
//
// On the rink the network often connects but never delivers throughput
// ("lie-fi"), so fetch() hangs forever. Before this guard, `ready` never
// flipped and the play button stayed disabled on "Preparing your session…" —
// the text-mode fallback (screens-b.tsx, which converts any non-"no template"
// error to text mode) never fired. These tests pin the new behaviour:
//
//   1. A hung MANIFEST fetch aborts at the ~15s deadline → setError → fallback.
//   2. A hung CLIP fetch aborts at the deadline → setError → fallback.
//   3. A FAST (cache-served / offline) load reaches `ready` and is NOT subject
//      to a spurious timeout when the clock runs past the deadline — i.e. the
//      deadline wraps only network-bound work and is cleared once it settles.
//
// jsdom is opted-in per-file via the docblock above (the global env stays
// "node"; see vitest.config.ts). The audio-playlist + encode-wav modules are
// mocked so init() reaches the decode/assemble path with no real manifest,
// network, or WAV math; fetch and the decode-only AudioContext are stubbed.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

import { useClipPlayer } from "@/components/pregame/useClipPlayer";

// ── module mocks ──
// manifestUrl returns a stable string containing "manifest" so the fetch stub
// can distinguish the manifest request from clip requests. resolvePlaylist
// returns a single clip; buildAssembledTimeline a minimal timeline. The decode
// path consumes these via the mocked encode-wav assembleWavBlob.
vi.mock("@/components/pregame/audio-playlist", () => ({
  manifestUrl: () => "/audio/pregame/manifest.test.json",
  resolvePlaylist: () => [{ slug: "clip-a", url: "/audio/pregame/clip-a.mp3" }],
  resolvePracticePlaylist: () => null,
  buildAssembledTimeline: () => ({ totalDurationSec: 1, phases: [] }),
}));

vi.mock("@/components/pregame/audio/encode-wav", () => ({
  assembleWavBlob: () => new Blob(["wav"], { type: "audio/wav" }),
  // FV-227: useClipPlayer now calls assembleWavBlobWithBed instead of
  // assembleWavBlob. Stub it to return a minimal WAV Blob (same as above).
  assembleWavBlobWithBed: () => new Blob(["wav"], { type: "audio/wav" }),
}));

// FV-227: mock the beds registry so getBed("still") returns a stable path
// the fetch stub can intercept. Without this mock the test would need to know
// the real content-addressed filename.
vi.mock("@/components/pregame/audio/beds", () => ({
  getBed: (id: string) =>
    id === "still"
      ? { id: "still", path: "/audio/beds/bed-still.test.mp3" }
      : undefined,
  BED_MIX_GAIN: 0.35,
}));

// A pregame combination that exercises the non-practice resolve branch.
const PREGAME_OPTS = {
  need: "Confidence",
  position: "Forward",
  adversity: "Benched in the third",
} as const;

// Same combination but with a bed selected (FV-227).
const PREGAME_OPTS_WITH_BED = {
  ...PREGAME_OPTS,
  bedId: "still",
} as const;

// Drain the microtask queue so init()'s awaited (fake-timer-independent)
// promise chain runs to completion. Promises are NOT faked by useFakeTimers, so
// this resolves the immediately-settled fetch/decode mocks without advancing
// the deadline clock.
async function flushMicrotasks(times = 25) {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential microtask drain
    await Promise.resolve();
  }
}

// A fetch that never resolves on its own but rejects with an AbortError when the
// provided signal aborts — faithfully modelling a hung network connection that
// the AbortController can still cancel.
function hangingFetchUntilAbort(
  init?: { signal?: AbortSignal },
): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;
    if (signal) {
      signal.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    }
    // otherwise: never settles
  });
}

let originalCreateObjectURL: typeof URL.createObjectURL;
let originalRevokeObjectURL: typeof URL.revokeObjectURL;

beforeEach(() => {
  vi.useFakeTimers();

  // Decode-only AudioContext stub: jsdom has no Web Audio. decodeAudioData
  // resolves a placeholder buffer; close() is a no-op promise.
  class FakeAudioContext {
    decodeAudioData(): Promise<AudioBuffer> {
      return Promise.resolve({} as AudioBuffer);
    }
    close(): Promise<void> {
      return Promise.resolve();
    }
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);

  // Blob URL plumbing is unimplemented in jsdom — stub both halves.
  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => "blob:fv-test");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useClipPlayer lie-fi timeout (FV-172)", () => {
  it("aborts a hung manifest fetch at the deadline and surfaces an error → text-mode fallback", async () => {
    const fetchMock = vi.fn((_url: string, init?: { signal?: AbortSignal }) =>
      hangingFetchUntilAbort(init),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useClipPlayer(PREGAME_OPTS));

    // Manifest fetch issued with the wired abort signal; still preparing.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, manifestInit] = fetchMock.mock.calls[0] ?? [];
    expect(manifestInit).toMatchObject({ signal: expect.any(AbortSignal) });
    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBeNull();

    // Advance past the ~15s deadline → abort → reject → setError.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
      await flushMicrotasks();
    });

    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBeTruthy();
    // Anything other than the silent "no template" sentinel flips screens-b to
    // text mode — confirm we did NOT emit that sentinel.
    expect(result.current.error).not.toBe("no template");
  });

  it("aborts hung clip fetches at the deadline (manifest already resolved) → text-mode fallback", async () => {
    const fetchMock = vi.fn((url: string, init?: { signal?: AbortSignal }) => {
      if (url.includes("manifest")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clips: {} }),
        } as unknown as Response);
      }
      // Clip request hangs until the deadline aborts it.
      return hangingFetchUntilAbort(init);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useClipPlayer(PREGAME_OPTS));

    // Manifest resolves; clip fetch is now in flight (hanging).
    await act(async () => {
      await flushMicrotasks();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.ready).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
      await flushMicrotasks();
    });

    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error).not.toBe("no template");
  });

  it("bed fetch that never resolves → ready still flips, session is voice-only (FV-227 regression)", async () => {
    // Regression: before the BED_DEADLINE_MS guard, a connected-but-stalled
    // bed fetch after the clip deadline had cleared would hang "Preparing your
    // session…" forever, blocking setReady(true).
    //
    // Setup: clips resolve fast (manifest + arrayBuffer immediate), but the
    // bed URL hangs until aborted. The 5 s bed deadline must abort the bed
    // fetch and allow init() to fall through to setReady(true) (voice-only).
    const fetchMock = vi.fn((url: string, init?: { signal?: AbortSignal }) => {
      if (url.includes("manifest")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clips: {} }),
        } as unknown as Response);
      }
      if (url.includes("bed-still")) {
        // Bed fetch hangs until aborted.
        return hangingFetchUntilAbort(init);
      }
      // Clip fetch resolves immediately.
      return Promise.resolve({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useClipPlayer(PREGAME_OPTS_WITH_BED));

    // Drain microtasks so the clip path completes (manifest + clips fast).
    await act(async () => {
      await flushMicrotasks(30);
    });

    // Clips are done but the bed fetch is still hanging — not yet ready.
    expect(result.current.error).toBeNull();
    expect(result.current.ready).toBe(false);

    // Advance past the ~5 s bed deadline → abort → voice-only fall-through.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
      await flushMicrotasks(30);
    });

    // Session must be ready (voice-only); no error.
    expect(result.current.error).toBeNull();
    expect(result.current.ready).toBe(true);
  });

  it("does NOT spuriously time out a fast (cache-served) load: reaches ready and stays ready past the deadline", async () => {
    // Every fetch resolves immediately — models cache/offline hits with no
    // network latency. If the deadline wrongly wrapped the CPU-bound decode (or
    // were not cleared once fetches settle), advancing past it would flip the
    // ready session into an error. It must not.
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("manifest")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clips: {} }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useClipPlayer(PREGAME_OPTS));

    await act(async () => {
      await flushMicrotasks();
    });

    // Fast path completed: player is ready, no error.
    expect(result.current.error).toBeNull();
    expect(result.current.ready).toBe(true);

    // Run the clock well past the ~15s deadline. A correctly-cleared deadline
    // produces no timeout; the session stays ready.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
      await flushMicrotasks();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.ready).toBe(true);
  });
});
