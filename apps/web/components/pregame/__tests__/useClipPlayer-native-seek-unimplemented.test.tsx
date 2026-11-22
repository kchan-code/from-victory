/** @vitest-environment jsdom */
import { Blob as NodeBlob } from "node:buffer";
import { act, cleanup, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useClipPlayer } from "../useClipPlayer";
import type { NarrationStatus } from "@/lib/native/narration";

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
const impl: Record<string, unknown> = {
  begin: async () => undefined, append: async () => undefined,
  prepare: async () => ({ duration: 40 }),
  play: async () => { status = { ...status, state: "playing" }; },
  pause: async () => { status = { ...status, state: "paused" }; },
  getStatus: async () => status, dispose: async () => undefined,
};
// The registerPlugin Proxy on an old shell without PluginHeaders: seek looks
// like a function but rejects as not implemented.
const proxy = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop !== "string" || prop === "then" || prop === "$$typeof") return undefined;
    if (prop in impl) return impl[prop];
    return () => Promise.reject(Object.assign(
      new Error(`"FVNarration.${prop}()" is not implemented on android`), { code: "UNIMPLEMENTED" },
    ));
  },
});

beforeEach(() => {
  vi.useFakeTimers();
  status = { state: "ready", position: 0, duration: 40 };
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("Capacitor", { Plugins: { FVNarration: proxy } });
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

describe("native seek not implemented on the installed build (FV-784)", () => {
  it("re-renders with seek unsupported and keeps the session alive", async () => {
    let renders = 0;
    const { result } = renderHook(() => { renders += 1; return useClipPlayer(options); });
    await act(flush);
    expect(result.current.nativeNarrationPlayer?.supportsSeek).toBe(true);
    const before = renders;
    await act(async () => { result.current.skipForward15(); await flush(); });
    expect(result.current.nativeNarrationPlayer?.supportsSeek).toBe(false);
    expect(renders).toBeGreaterThan(before);
    expect(result.current.error).toBeNull();
    await act(async () => { result.current.play(); await flush(); });
    expect(result.current.playing).toBe(true);
  });
});
