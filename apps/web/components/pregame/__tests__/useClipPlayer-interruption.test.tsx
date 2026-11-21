/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { useClipPlayer } from "@/components/pregame/useClipPlayer";

vi.mock("@/components/pregame/audio-playlist", () => ({
  manifestUrl: () => "/audio/pregame/manifest.test.json",
  resolvePlaylist: () => [
    { slug: "opening", url: "/audio/pregame/opening.mp3", durationSec: 60, phases: [] },
  ],
  resolvePracticePlaylist: () => null,
  buildAssembledTimeline: () => ({ totalDurationSec: 60, phases: [] }),
  DIALED_IN_OPENER_VARIATIONS: ["pp-opener-dialed-in"],
}));

vi.mock("@/components/pregame/audio/encode-wav", () => ({
  assembleWavBlobWithBed: () => new Blob(["wav"], { type: "audio/wav" }),
  assembleWavBlob: () => new Blob(["wav"], { type: "audio/wav" }),
}));

vi.mock("@/components/pregame/audio/beds", () => ({
  getBed: () => undefined,
  BED_MIX_GAIN: 0.35,
}));

type ActionName = "play" | "pause" | "seekbackward" | "seekforward" | "seekto";
type ActionHandler = ((details?: MediaSessionActionDetails) => void) | null;

class FakeMediaSession {
  readonly handlers = new Map<ActionName, ActionHandler>();
  readonly positionStateCalls: MediaPositionState[] = [];
  metadata: MediaMetadata | null = null;

  setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
    if (
      action === "play" ||
      action === "pause" ||
      action === "seekbackward" ||
      action === "seekforward" ||
      action === "seekto"
    ) {
      this.handlers.set(action, handler as ActionHandler);
    }
  }

  setPositionState(state?: MediaPositionState) {
    if (state) this.positionStateCalls.push(state);
  }
}

class FakeAudioElement extends EventTarget {
  currentTime = 0;
  duration = 60;
  paused = true;
  ended = false;
  preload = "auto";
  src = "";
  hidden = false;

  readonly play = vi.fn(async () => {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
  });

  readonly pause = vi.fn(() => {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  });

  setAttribute(name: string, value: string): void {
    if (name === "data-fv-guided-session") {
      this.hidden = false;
    }
    if (value) {
      // no-op: jsdom test double only
    }
  }

  removeAttribute(_name: string): void {
    // no-op: jsdom test double only
  }

  remove(): void {
    // no-op: jsdom test double only
  }
}

const OPTIONS = {
  need: "Confidence",
  position: "Forward",
  adversity: "Benched",
} as const;

async function flushMicrotasks(times = 30): Promise<void> {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line no-await-in-loop -- deterministic microtask drain
    await Promise.resolve();
  }
}

let fakeAudio: FakeAudioElement;
let fakeMediaSession: FakeMediaSession;
let appendChildSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers();

  class FakeAudioContext {
    decodeAudioData(): Promise<AudioBuffer> {
      return Promise.resolve({ sampleRate: 24_000 } as AudioBuffer);
    }
    close(): Promise<void> {
      return Promise.resolve();
    }
  }

  fakeAudio = new FakeAudioElement();
  fakeMediaSession = new FakeMediaSession();
  appendChildSpy = vi
    .spyOn(document.body, "appendChild")
    .mockImplementation((node: Node) => node);

  vi.stubGlobal("AudioContext", FakeAudioContext);
  const AudioCtor = vi.fn(function AudioMock(this: unknown) {
    return fakeAudio as unknown as HTMLAudioElement;
  });
  vi.stubGlobal("Audio", AudioCtor as unknown as typeof Audio);
  vi.stubGlobal("fetch", vi.fn((url: string) => {
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
  }));

  Object.defineProperty(navigator, "mediaSession", {
    configurable: true,
    value: fakeMediaSession,
  });

  URL.createObjectURL = vi.fn(() => "blob:fv-test");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  appendChildSpy.mockRestore();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useClipPlayer interruption recovery (FV-780)", () => {
  it("reconciles OS interruptions and keeps resume/pause/seek controls usable", async () => {
    const { result } = renderHook(() => useClipPlayer(OPTIONS));

    await act(async () => {
      await flushMicrotasks();
    });
    expect(result.current.ready).toBe(true);

    await act(async () => {
      result.current.play();
      await flushMicrotasks();
    });
    expect(result.current.playing).toBe(true);
    expect(fakeAudio.play).toHaveBeenCalledTimes(1);

    fakeAudio.currentTime = 12.5;
    fakeAudio.paused = true;
    await act(async () => {
      fakeAudio.dispatchEvent(new Event("stalled"));
      await flushMicrotasks();
    });

    expect(result.current.playing).toBe(false);
    expect(result.current.elapsedSec).toBeCloseTo(12.5, 1);

    await act(async () => {
      result.current.play();
      await flushMicrotasks();
    });
    expect(result.current.playing).toBe(true);
    expect(fakeAudio.play).toHaveBeenCalledTimes(2);

    await act(async () => {
      result.current.pause();
      await flushMicrotasks();
    });
    expect(result.current.playing).toBe(false);
    expect(fakeAudio.pause).toHaveBeenCalled();

    const seekTo = fakeMediaSession.handlers.get("seekto");
    expect(seekTo).toBeTypeOf("function");
    await act(async () => {
      seekTo?.({ action: "seekto", seekTime: 25, fastSeek: false });
      await flushMicrotasks();
    });
    expect(fakeAudio.currentTime).toBe(25);
    expect(result.current.elapsedSec).toBeCloseTo(25, 1);
    expect(fakeMediaSession.positionStateCalls.length).toBeGreaterThan(0);
  });
});
