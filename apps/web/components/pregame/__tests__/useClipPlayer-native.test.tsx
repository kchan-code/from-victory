/** @vitest-environment jsdom */
import { Blob as NodeBlob } from "node:buffer";
import { act, cleanup, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useClipPlayer } from "../useClipPlayer";
import { useBreathAudio } from "../audio/useBreathAudio";
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
const options = { need: "Confidence", position: "Forward", adversity: "Benched", bedId: "still" };
const flush = async () => { for (let i = 0; i < 100; i++) await Promise.resolve(); };
let status: NarrationStatus;
let bridge: ReturnType<typeof makeBridge>;
let fetchMock: ReturnType<typeof vi.fn>;
function makeBridge() {
  return {
    begin: vi.fn(async () => undefined), append: vi.fn(async () => undefined),
    prepare: vi.fn(async () => ({ duration: 10 })),
    play: vi.fn(async () => { status = { ...status, state: "playing" }; }),
    pause: vi.fn(async () => { status = { ...status, state: "paused" }; }),
    getStatus: vi.fn(async () => status), dispose: vi.fn(async () => undefined),
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  status = { state: "ready", position: 0, duration: 10 };
  bridge = makeBridge();
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("Capacitor", { Plugins: { FVNarration: bridge } });
  vi.stubGlobal("AudioContext", vi.fn(() => { throw new Error("Live context must not open"); }));
  vi.stubGlobal("Audio", vi.fn(() => { throw new Error("HTML playback must not open"); }));
  vi.stubGlobal("OfflineAudioContext", vi.fn(class {
    decodeAudioData = vi.fn(async () => ({ sampleRate: 24000 } as AudioBuffer));
  }));
  fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ durationSec: 10, phases: [] }),
    arrayBuffer: async () => new ArrayBuffer(4),
  }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(async () => { cleanup(); await flush(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("native music + voice integration", () => {
  it.each([false, true])("prepares %s practice without live audio or a competing music bed", async (practice) => {
    const onCompleted = vi.fn();
    const { result, unmount } = renderHook(() => useClipPlayer({ ...options, practice, onCompleted }));
    await act(flush);
    expect(result.current.ready).toBe(true);
    expect(window.AudioContext).not.toHaveBeenCalled();
    expect(window.Audio).not.toHaveBeenCalled();
    expect(window.OfflineAudioContext).toHaveBeenCalledWith(1, 1, 24000);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("bed.mp3"))).toBe(false);
    expect(bridge.play).not.toHaveBeenCalled();
    await act(async () => { result.current.play(); await flush(); });
    expect(result.current.playing).toBe(true);
    await act(async () => { result.current.pause(); await flush(); });
    expect(result.current.playing).toBe(false);
    status = { state: "ended", position: 10, duration: 10 };
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(result.current.completed).toBe(true);
    expect(onCompleted).toHaveBeenCalledOnce();
    expect(document.querySelector("[data-fv-guided-session]")).toBeNull();
    unmount(); await flush();
    expect(bridge.dispose).toHaveBeenCalled();
  });
  it("native preparation failure reports an error without starting HTML audio", async () => {
    bridge.prepare.mockRejectedValue(new Error("Native audio unavailable"));
    const { result } = renderHook(() => useClipPlayer(options));
    await act(flush);
    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBe("Native audio unavailable");
    expect(window.Audio).not.toHaveBeenCalled();
    expect(bridge.dispose).toHaveBeenCalled();
  });
  it("releases the previous player before a changed session becomes ready", async () => {
    const { result, rerender } = renderHook(({ need }) => useClipPlayer({ ...options, need }), { initialProps: { need: "Confidence" } });
    await act(flush);
    expect(result.current.ready).toBe(true);
    rerender({ need: "Calm" }); await act(flush);
    expect(bridge.begin).toHaveBeenCalledTimes(2);
    expect(bridge.dispose).toHaveBeenCalled();
    expect(document.querySelectorAll("[data-fv-guided-session]")).toHaveLength(1);
  });
  it("routes the narrated breathing step through the same native player", async () => {
    const { result, unmount } = renderHook(() => useBreathAudio({ slug: "breath-threshold", expectedRounds: 3 }));
    await act(flush);
    expect(result.current.status).toBe("ready");
    expect(result.current.usesNativeAudio).toBe(true);
    await act(async () => { await result.current.play(); });
    expect(result.current.isPlaying).toBe(true);
    expect(bridge.play).toHaveBeenCalledOnce();
    expect(window.Audio).not.toHaveBeenCalled();
    unmount(); await flush(); expect(bridge.dispose).toHaveBeenCalled();
  });
});
