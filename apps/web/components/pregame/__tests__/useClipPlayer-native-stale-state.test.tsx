/** @vitest-environment jsdom */
import { Blob as NodeBlob } from "node:buffer";
import { act, cleanup, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useClipPlayer } from "../useClipPlayer";
import type { NarrationStatus } from "@/lib/native/narration";

vi.mock("../audio-playlist", () => ({
  manifestUrl: () => "/manifest.json",
  resolvePlaylist: () => [{ slug: "opening", url: "/clip.mp3", durationSec: 10, phases: [] }],
  resolvePracticePlaylist: () => [{ slug: "practice", url: "/clip.mp3", durationSec: 10, phases: [] }],
  buildAssembledTimeline: () => ({ totalDurationSec: 10, phases: [] }),
  DIALED_IN_OPENER_VARIATIONS: ["opener"],
}));
vi.mock("../audio/encode-wav", () => ({
  assembleWavBlobWithBed: () => new Blob([new Uint8Array(44)]),
  assembleWavBlob: () => new Blob([new Uint8Array(44)]),
}));
vi.mock("../audio/beds", () => ({ getBed: () => ({ path: "/bed.mp3" }), BED_MIX_GAIN: 0.35 }));

const options = { need: "Confidence", position: "Forward", adversity: "Benched" };
const flush = async () => { for (let i = 0; i < 100; i++) await Promise.resolve(); };
let status: NarrationStatus;
const bridge = {
  begin: vi.fn(async () => undefined), append: vi.fn(async () => undefined),
  prepare: vi.fn(async () => ({ duration: 10 })),
  play: vi.fn(async () => { status = { ...status, state: "playing" }; }),
  pause: vi.fn(async () => { status = { ...status, state: "paused" }; }),
  getStatus: vi.fn(async () => status), dispose: vi.fn(async () => undefined),
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  status = { state: "ready", position: 0, duration: 10 };
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("Capacitor", { Plugins: { FVNarration: bridge } });
  vi.stubGlobal("Audio", vi.fn(() => { throw new Error("HTML playback must not open"); }));
  vi.stubGlobal("OfflineAudioContext", vi.fn(class {
    decodeAudioData = vi.fn(async () => ({ sampleRate: 24000 } as AudioBuffer));
  }));
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: true,
    json: async () => ({ durationSec: 10, phases: [] }),
    arrayBuffer: async () => new ArrayBuffer(4),
  })));
});
afterEach(async () => { cleanup(); await flush(); vi.useRealTimers(); vi.unstubAllGlobals(); });

// FV-784: the native plugin can pause (route loss, CarPlay unplug) before the
// 250 ms status poll tells JavaScript. Fake timers keep the poll from running,
// so the hook still believes the old state when the athlete taps.
describe("native taps never trust stale playback state (FV-784)", () => {
  it("Play reaches the native bridge after the plugin paused itself", async () => {
    const { result } = renderHook(() => useClipPlayer(options));
    await act(flush);
    await act(async () => { result.current.play(); await flush(); });
    expect(result.current.playing).toBe(true);
    expect(bridge.play).toHaveBeenCalledTimes(1);

    status = { ...status, state: "paused", position: 4 };
    await act(async () => { result.current.play(); await flush(); });

    expect(bridge.play).toHaveBeenCalledTimes(2);
    expect(result.current.playing).toBe(true);
  });

  it("Pause reaches the native bridge after the plugin resumed without JavaScript", async () => {
    const { result } = renderHook(() => useClipPlayer(options));
    await act(flush);
    expect(result.current.playing).toBe(false);

    status = { ...status, state: "playing", position: 2 };
    await act(async () => { result.current.pause(); await flush(); });

    expect(bridge.pause).toHaveBeenCalledTimes(1);
    expect(result.current.playing).toBe(false);
  });
});
