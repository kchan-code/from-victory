/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useClipPlayer } from "@/components/pregame/useClipPlayer";

vi.mock("@/components/pregame/audio-playlist", () => ({
  manifestUrl: () => "/audio/pregame/clips/manifest.test.json",
  resolvePlaylist: () => [
    { slug: "opening", url: "/audio/pregame/clips/opening.mp3", durationSec: 20, phases: [] },
    { slug: "reset", url: "/audio/pregame/clips/reset.mp3", durationSec: 10, phases: [] },
  ],
  resolvePracticePlaylist: () => null,
  buildAssembledTimeline: () => ({
    totalDurationSec: 30,
    phases: [
      { phase: "arrival", startSec: 0 },
      { phase: "visualization", startSec: 10 },
      { phase: "reset", startSec: 20 },
    ],
  }),
  DIALED_IN_OPENER_VARIATIONS: ["pp-opener-dialed-in"],
}));
vi.mock("@/components/pregame/audio/encode-wav", () => ({
  assembleWavBlobWithBed: () => new Blob([new Uint8Array(44)]),
}));
vi.mock("@/components/pregame/audio/beds", () => ({
  getBed: () => undefined,
  BED_MIX_GAIN: 0.35,
}));

const OPTIONS = {
  need: "Confidence",
  position: "Forward",
  adversity: "Benched in the third",
} as const;

type ActionName =
  | "play"
  | "pause"
  | "seekbackward"
  | "seekforward"
  | "seekto"
  | "previoustrack"
  | "nexttrack";

type TestAudioElement = HTMLAudioElement & { __setEnded: (value: boolean) => void };

let audioInstances: TestAudioElement[] = [];
let actionHandlers: Partial<Record<ActionName, MediaSessionActionHandler | null>>;
let setPositionState: ReturnType<typeof vi.fn>;
let originalCreateObjectURL: typeof URL.createObjectURL;
let originalRevokeObjectURL: typeof URL.revokeObjectURL;

async function flush(times = 25): Promise<void> {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line no-await-in-loop -- deliberate microtask drain
    await Promise.resolve();
  }
}

function createFakeAudioElement(): TestAudioElement {
  const audio = document.createElement("audio");
  let time = 0;
  let paused = true;
  let ended = false;

  Object.defineProperty(audio, "duration", { configurable: true, value: 30 });
  Object.defineProperty(audio, "currentTime", {
    configurable: true,
    get: () => time,
    set: (value: number) => {
      if (!Number.isFinite(value)) return;
      time = value;
      if (value >= 30) {
        ended = true;
      } else if (value >= 0) {
        ended = false;
      }
    },
  });
  Object.defineProperty(audio, "paused", {
    configurable: true,
    get: () => paused,
  });
  Object.defineProperty(audio, "ended", {
    configurable: true,
    get: () => ended,
  });
  audio.play = vi.fn(async () => {
    paused = false;
    ended = false;
    audio.dispatchEvent(new Event("play"));
  });
  audio.pause = vi.fn(() => {
    paused = true;
    audio.dispatchEvent(new Event("pause"));
  });
  audio.remove = vi.fn(() => {
    ended = true;
    if (audio.parentNode) audio.parentNode.removeChild(audio);
  });
  return Object.assign(audio, {
    __setEnded: (value: boolean) => {
      ended = value;
    },
  }) as TestAudioElement;
}

beforeEach(() => {
  audioInstances = [];
  actionHandlers = {};
  setPositionState = vi.fn();

  class FakeAudioContext {
    decodeAudioData(): Promise<AudioBuffer> {
      return Promise.resolve({
        sampleRate: 24000,
        getChannelData: () => new Float32Array(0),
      } as unknown as AudioBuffer);
    }
    close(): Promise<void> {
      return Promise.resolve();
    }
  }

  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
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
  function FakeAudioCtor(this: unknown) {
    const audio = createFakeAudioElement();
    audioInstances.push(audio);
    return audio as unknown as HTMLAudioElement;
  }
  vi.stubGlobal("Audio", FakeAudioCtor as unknown as typeof Audio);
  Reflect.deleteProperty(window as Window & { Capacitor?: unknown }, "Capacitor");

  const mediaSession = {
    metadata: null,
    setActionHandler: vi.fn((action: ActionName, handler: MediaSessionActionHandler | null) => {
      actionHandlers[action] = handler;
    }),
    setPositionState,
  };
  Object.defineProperty(window.navigator, "mediaSession", {
    configurable: true,
    value: mediaSession,
  });

  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => "blob:fv-controls");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window.navigator, "mediaSession");
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useClipPlayer controls + Media Session handlers (FV-781)", () => {
  it("clamps skip backward/forward, supports scrubbing, and preserves position across pause/resume", async () => {
    const { result } = renderHook(() => useClipPlayer(OPTIONS));
    await act(flush);
    expect(result.current.error).toBeNull();
    expect(result.current.ready).toBe(true);
    expect(audioInstances.length).toBeGreaterThan(0);

    const audio = audioInstances[audioInstances.length - 1];
    if (!audio) throw new Error("Expected test audio instance");

    await act(async () => {
      result.current.seekTo(4);
    });
    await act(async () => {
      result.current.skipBackward15();
    });
    expect(audio?.currentTime).toBe(0);
    expect(result.current.elapsedSec).toBe(0);

    await act(async () => {
      result.current.seekTo(12);
    });
    expect(audio?.currentTime).toBe(12);
    expect(result.current.elapsedSec).toBe(12);

    await act(async () => {
      result.current.play();
    });
    await act(async () => {
      result.current.pause();
    });
    const pausedAt = audio?.currentTime ?? -1;

    await act(async () => {
      result.current.play();
    });
    expect(audio?.currentTime).toBe(pausedAt);

    await act(async () => {
      result.current.seekTo(28);
      result.current.skipForward15();
    });
    expect(audio?.currentTime).toBe(30);
    expect(result.current.elapsedSec).toBe(30);
    expect(result.current.completed).toBe(true);

    await act(async () => {
      result.current.play();
    });
    expect(result.current.playing).toBe(false);
  });

  it("wires media action handlers to the same transport behavior and updates position state", async () => {
    const { result } = renderHook(() => useClipPlayer(OPTIONS));
    await act(flush);
    expect(result.current.error).toBeNull();
    const audio = audioInstances[audioInstances.length - 1];
    if (!audio) throw new Error("Expected test audio instance");

    expect(typeof actionHandlers.play).toBe("function");
    expect(typeof actionHandlers.pause).toBe("function");
    expect(typeof actionHandlers.seekbackward).toBe("function");
    expect(typeof actionHandlers.seekforward).toBe("function");
    expect(typeof actionHandlers.seekto).toBe("function");
    expect(typeof actionHandlers.previoustrack).toBe("function");
    expect(typeof actionHandlers.nexttrack).toBe("function");
    expect(result.current.hasStepNavigation).toBe(true);

    await act(async () => {
      result.current.seekTo(10);
      const seekForward15: MediaSessionActionDetails = { action: "seekforward", seekOffset: 15 };
      actionHandlers.seekforward?.(seekForward15);
    });
    expect(audio?.currentTime).toBe(25);

    await act(async () => {
      const seekBackward15: MediaSessionActionDetails = { action: "seekbackward", seekOffset: 15 };
      actionHandlers.seekbackward?.(seekBackward15);
    });
    expect(audio?.currentTime).toBe(10);

    await act(async () => {
      const seekTo22: MediaSessionActionDetails = { action: "seekto", seekTime: 22 };
      actionHandlers.seekto?.(seekTo22);
    });
    expect(audio?.currentTime).toBe(22);

    await act(async () => {
      const previousTrack: MediaSessionActionDetails = { action: "previoustrack" };
      actionHandlers.previoustrack?.(previousTrack);
    });
    expect(audio?.currentTime).toBe(20);

    await act(async () => {
      result.current.seekTo(10);
      const nextTrack: MediaSessionActionDetails = { action: "nexttrack" };
      actionHandlers.nexttrack?.(nextTrack);
    });
    expect(audio?.currentTime).toBe(20);

    await act(async () => {
      const playAction: MediaSessionActionDetails = { action: "play" };
      actionHandlers.play?.(playAction);
    });
    expect(result.current.playing).toBe(true);

    await act(async () => {
      const pauseAction: MediaSessionActionDetails = { action: "pause" };
      actionHandlers.pause?.(pauseAction);
    });
    expect(result.current.playing).toBe(false);

    expect(setPositionState).toHaveBeenCalled();
  });

  it("completes when paused skip lands exactly at session end without ended event dispatch", async () => {
    const { result } = renderHook(() => useClipPlayer(OPTIONS));
    await act(flush);
    const audio = audioInstances[audioInstances.length - 1];
    if (!audio) throw new Error("Expected test audio instance");

    await act(async () => {
      result.current.seekTo(20);
      result.current.pause();
    });
    expect(result.current.playing).toBe(false);
    expect(result.current.completed).toBe(false);

    await act(async () => {
      result.current.skipForward15();
    });
    expect(audio.currentTime).toBe(30);
    expect(result.current.completed).toBe(true);

    await act(async () => {
      result.current.play();
    });
    expect(result.current.playing).toBe(false);
  });

  it("uses 15-second default offsets when media-session seekbackward/seekforward omit seekOffset", async () => {
    renderHook(() => useClipPlayer(OPTIONS));
    await act(flush);
    const audio = audioInstances[audioInstances.length - 1];
    if (!audio) throw new Error("Expected test audio instance");

    await act(async () => {
      audio.currentTime = 10;
      const seekForwardDefault: MediaSessionActionDetails = { action: "seekforward" };
      actionHandlers.seekforward?.(seekForwardDefault);
    });
    expect(audio.currentTime).toBe(25);

    await act(async () => {
      const seekBackwardDefault: MediaSessionActionDetails = { action: "seekbackward" };
      actionHandlers.seekbackward?.(seekBackwardDefault);
    });
    expect(audio.currentTime).toBe(10);
  });
});
