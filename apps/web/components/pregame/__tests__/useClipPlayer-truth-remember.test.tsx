/**
 * @vitest-environment jsdom
 */
// FV-552 — rememberTruthSlug must fire on confirmed playback start of the
// truth clip, not at resolvePlaylist() time.
//
// Bug: the pre-fix hook called rememberTruthSlug() immediately after
// resolvePlaylist() succeeded — before any fetch, decode, or playback. A
// session that then failed (clip fetch failed, decode failed, AudioContext
// unsupported, deadline timeout) or that the athlete backed out of before
// playback had already advanced `fv_truth_last` to a line never heard, so
// the rotation silently skipped it next session.
//
// This file pins the regression at the hook level: resolve succeeds, the
// clip fetch then fails, and `fv_truth_last` in localStorage must remain
// untouched. It reuses the mocking harness established in
// useClipPlayer-timeout.test.tsx (mock audio-playlist + encode-wav so init()
// reaches the real network/decode path with no real manifest or WAV math).
//
// The positive "does get remembered once playback reaches the truth clip"
// path is covered as a pure function in truth-rotation.test.ts
// (truthSlugAtPlayhead) — simulating real HTMLAudioElement playback + rAF
// timing in jsdom is not a reliable signal, so the hook's wiring of that
// helper is exercised here only for the "never touch storage on failure"
// contract, which needs no timing simulation.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

import { useClipPlayer } from "@/components/pregame/useClipPlayer";

const TRUTH_STORAGE_KEY = "fv_truth_last";

// resolvePlaylist returns a truth-slug clip so the pre-fix eager-remember
// bug would have written to storage the instant resolve succeeded.
vi.mock("@/components/pregame/audio-playlist", () => ({
  manifestUrl: () => "/audio/pregame/manifest.test.json",
  resolvePlaylist: () => [
    { slug: "opener-a", url: "/audio/pregame/opener-a.mp3", durationSec: 5, phases: [] },
    { slug: "truth-07", url: "/audio/pregame/truth-07.mp3", durationSec: 4, phases: [] },
  ],
  resolvePracticePlaylist: () => null,
  buildAssembledTimeline: () => ({ totalDurationSec: 9, phases: [] }),
  DIALED_IN_OPENER_VARIATIONS: [
    "pp-opener-dialed-in",
    "pp-opener-dialed-in-2",
    "pp-opener-dialed-in-3",
  ],
}));

vi.mock("@/components/pregame/audio/encode-wav", () => ({
  assembleWavBlob: () => new Blob(["wav"], { type: "audio/wav" }),
  assembleWavBlobWithBed: () => new Blob(["wav"], { type: "audio/wav" }),
}));

vi.mock("@/components/pregame/audio/beds", () => ({
  getBed: () => undefined,
  BED_MIX_GAIN: 0.35,
}));

const PREGAME_OPTS = {
  need: "Confidence",
  position: "Forward",
  adversity: "Benched in the third",
} as const;

async function flushMicrotasks(times = 30) {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential microtask drain
    await Promise.resolve();
  }
}

// jsdom's built-in localStorage isn't reliably usable under this project's
// vitest setup (see the same pattern in session-cache.test.ts) — stub it
// explicitly so getItem/setItem/clear are plain, inspectable functions.
const store: Record<string, string> = {};
const localStorageStub = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => {
    store[key] = value;
  },
  removeItem: (key: string): void => {
    delete store[key];
  },
  clear: (): void => {
    for (const k of Object.keys(store)) delete store[k];
  },
};

beforeEach(() => {
  vi.useFakeTimers();
  localStorageStub.clear();
  Object.defineProperty(window, "localStorage", {
    value: localStorageStub,
    writable: true,
    configurable: true,
  });

  class FakeAudioContext {
    decodeAudioData(): Promise<AudioBuffer> {
      return Promise.resolve({} as AudioBuffer);
    }
    close(): Promise<void> {
      return Promise.resolve();
    }
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);

  URL.createObjectURL = vi.fn(() => "blob:fv-test");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  localStorageStub.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useClipPlayer truth-slug remember timing (FV-552)", () => {
  it("resolve succeeds but the clip fetch then fails: fv_truth_last stays untouched", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("manifest")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clips: {} }),
        } as unknown as Response);
      }
      // Every clip fetch fails — session never reaches decode or playback.
      return Promise.resolve({ ok: false, status: 500 } as unknown as Response);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useClipPlayer(PREGAME_OPTS));

    await act(async () => {
      await flushMicrotasks();
    });

    // Session failed (not the silent "no template" sentinel — resolve DID
    // succeed above; the clip fetch is what failed).
    expect(result.current.error).toBeTruthy();
    expect(result.current.error).not.toBe("no template");
    expect(result.current.ready).toBe(false);

    // The bug: rememberTruthSlug() used to fire right after resolvePlaylist
    // succeeded, before this failure was even known. Fixed behavior: storage
    // is untouched because playback never started.
    expect(localStorageStub.getItem(TRUTH_STORAGE_KEY)).toBeNull();
  });

  it("a hung manifest fetch that times out: fv_truth_last stays untouched", async () => {
    const fetchMock = vi.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useClipPlayer(PREGAME_OPTS));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
      await flushMicrotasks();
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.ready).toBe(false);
    expect(localStorageStub.getItem(TRUTH_STORAGE_KEY)).toBeNull();
  });
});
