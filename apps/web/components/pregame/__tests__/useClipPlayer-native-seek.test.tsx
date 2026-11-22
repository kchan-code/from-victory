/** @vitest-environment jsdom */
import { Blob as NodeBlob } from "node:buffer";
import { act, cleanup, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useClipPlayer } from "../useClipPlayer";
import type { NarrationStateEvent, NarrationStatus } from "@/lib/native/narration";

vi.mock("../audio-playlist", () => ({
  manifestUrl: () => "/manifest.json",
  resolvePlaylist: () => [{ slug: "opening", url: "/clip.mp3", durationSec: 40, phases: [] }],
  resolvePracticePlaylist: () => [{ slug: "practice", url: "/clip.mp3", durationSec: 40, phases: [] }],
  buildAssembledTimeline: () => ({ totalDurationSec: 40, phases: [] }),
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
let emit: ((event: NarrationStateEvent) => void) | null;
const makeBridge = (withSeek: boolean) => ({
  begin: vi.fn(async () => undefined), append: vi.fn(async () => undefined),
  prepare: vi.fn(async () => ({ duration: 40 })),
  play: vi.fn(async () => { status = { ...status, state: "playing" }; }),
  pause: vi.fn(async () => { status = { ...status, state: "paused" }; }),
  getStatus: vi.fn(async () => status), dispose: vi.fn(async () => undefined),
  addListener: vi.fn(async (_name: string, listener: (event: NarrationStateEvent) => void) => {
    emit = listener;
    return { remove: vi.fn() };
  }),
  ...(withSeek ? {
    seek: vi.fn(async ({ position }: { sessionId: string; position: number }) => {
      status = position >= status.duration
        ? { ...status, position: status.duration, state: "ended" }
        : { ...status, position };
    }),
  } : {}),
});
let bridge: ReturnType<typeof makeBridge>;
const install = (withSeek: boolean) => {
  bridge = makeBridge(withSeek);
  vi.stubGlobal("Capacitor", { Plugins: { FVNarration: bridge } });
};

beforeEach(() => {
  vi.useFakeTimers();
  status = { state: "ready", position: 0, duration: 40 };
  emit = null;
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("Audio", vi.fn(() => { throw new Error("HTML playback must not open"); }));
  vi.stubGlobal("OfflineAudioContext", vi.fn(class {
    decodeAudioData = vi.fn(async () => ({ sampleRate: 24000 } as AudioBuffer));
  }));
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: true,
    json: async () => ({ durationSec: 40, phases: [] }),
    arrayBuffer: async () => new ArrayBuffer(4),
  })));
});
afterEach(async () => { cleanup(); await flush(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("native seek and transport (FV-784)", () => {
  it("routes scrub and 15 s skips to the native bridge", async () => {
    install(true);
    const { result } = renderHook(() => useClipPlayer(options));
    await act(flush);
    expect(result.current.nativeNarrationPlayer?.supportsSeek).toBe(true);
    expect(bridge.prepare).toHaveBeenCalledWith({ sessionId: expect.any(String), title: "Pregame" });
    await act(async () => { result.current.seekTo(20); await flush(); });
    expect(bridge.seek).toHaveBeenLastCalledWith(expect.objectContaining({ position: 20 }));
    expect(result.current.elapsedSec).toBe(20);
    await act(async () => { result.current.skipBackward15(); await flush(); });
    expect(bridge.seek).toHaveBeenLastCalledWith(expect.objectContaining({ position: 5 }));
    await act(async () => { result.current.skipForward15(); await flush(); });
    expect(bridge.seek).toHaveBeenLastCalledWith(expect.objectContaining({ position: 20 }));
  });

  it("completes once when a seek reaches the end, even if the native end event also arrives", async () => {
    install(true);
    const onCompleted = vi.fn();
    const { result } = renderHook(() => useClipPlayer({ ...options, onCompleted }));
    await act(flush);
    await act(async () => { result.current.play(); await flush(); });
    await act(async () => { result.current.seekTo(500); await flush(); });
    const sessionId = result.current.nativeNarrationPlayer!.sessionId;
    await act(async () => {
      emit?.({ sessionId, playing: false, position: 40, duration: 40, reason: "ended", state: "ended" });
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(bridge.seek).toHaveBeenLastCalledWith(expect.objectContaining({ position: 40 }));
    expect(result.current.completed).toBe(true);
    expect(onCompleted).toHaveBeenCalledOnce();
  });

  it("reflects a lock-screen pause pushed by the plugin without a tap", async () => {
    install(true);
    const { result } = renderHook(() => useClipPlayer(options));
    await act(flush);
    await act(async () => { result.current.play(); await flush(); });
    expect(result.current.playing).toBe(true);
    const sessionId = result.current.nativeNarrationPlayer!.sessionId;
    await act(async () => {
      emit?.({ sessionId, playing: false, position: 7, duration: 40, reason: "remotePause", state: "paused" });
      await flush();
    });
    expect(result.current.playing).toBe(false);
  });

  it("does nothing on a native build without seek", async () => {
    install(false);
    const { result } = renderHook(() => useClipPlayer(options));
    await act(flush);
    expect(result.current.nativeNarrationPlayer?.supportsSeek).toBe(false);
    await act(async () => { result.current.seekTo(20); result.current.skipForward15(); await flush(); });
    expect(result.current.elapsedSec).toBe(0);
    expect(result.current.completed).toBe(false);
  });
});
