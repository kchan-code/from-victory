/** @vitest-environment jsdom */
import { Blob as NodeBlob } from "node:buffer";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  createNativeNarrationPlayer, type NarrationStateEvent, type NarrationStatus,
} from "../narration";

const wav = () => new NodeBlob([new Uint8Array(44)]) as unknown as Blob;
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
let status: NarrationStatus;
let emit: (event: NarrationStateEvent) => void;
const handle = { remove: vi.fn(async () => undefined) };
const makeBridge = (withSeek = true) => ({
  begin: vi.fn(async (): Promise<void> => undefined), append: vi.fn(async (): Promise<void> => undefined),
  prepare: vi.fn(async () => ({ duration: 10 })),
  play: vi.fn(async (): Promise<void> => { status = { ...status, state: "playing" }; }),
  pause: vi.fn(async (): Promise<void> => { status = { ...status, state: "paused" }; }),
  getStatus: vi.fn(async (): Promise<NarrationStatus> => status),
  dispose: vi.fn(async (): Promise<void> => undefined),
  addListener: vi.fn(async (_name: "stateChange", listener: (event: NarrationStateEvent) => void) => {
    emit = listener;
    return handle;
  }),
  ...(withSeek ? {
    seek: vi.fn(async ({ position }: { sessionId: string; position: number }): Promise<void> => {
      status = position >= status.duration
        ? { ...status, position: status.duration, state: "ended" }
        : { ...status, position };
    }),
  } : {}),
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  status = { position: 0, duration: 10, state: "ready" };
});
afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ""; });

describe("native narration state events (FV-784)", () => {
  it("reconciles a native self-pause immediately, without waiting for the poll", async () => {
    const bridge = makeBridge();
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    await flush();
    await player.play();
    expect(player.paused).toBe(false);
    const paused = vi.fn(); player.addEventListener("pause", paused);
    const polls = bridge.getStatus.mock.calls.length;

    emit({ sessionId: player.sessionId, playing: false, position: 4, duration: 10, reason: "routeChange", state: "paused" });

    expect(player.paused).toBe(true);
    expect(player.currentTime).toBe(4);
    expect(paused).toHaveBeenCalledOnce();
    expect(bridge.getStatus.mock.calls.length).toBe(polls);
    player.remove(); await flush();
  });

  it("ignores events for another session and removes its listener on teardown", async () => {
    const bridge = makeBridge();
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    await flush();
    emit({ sessionId: "other", playing: true, position: 3, duration: 10, reason: "play", state: "playing" });
    expect(player.paused).toBe(true);
    player.remove(); await flush();
    expect(handle.remove).toHaveBeenCalledOnce();
    emit({ sessionId: player.sessionId, playing: true, position: 3, duration: 10, reason: "play" });
    expect(player.paused).toBe(true);
  });

  it("keeps polling as a fallback on shells without listener support", async () => {
    const { addListener: _unused, ...bridge } = makeBridge();
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    await player.play();
    status = { ...status, state: "paused", position: 2 };
    await vi.advanceTimersByTimeAsync(300);
    expect(player.paused).toBe(true);
    player.remove(); await flush();
  });

  it("feature-detects seek: older shells report no support and never call it", async () => {
    const bridge = makeBridge(false);
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    expect(player.supportsSeek).toBe(false);
    await player.seek(5);
    expect(player.currentTime).toBe(0);
    player.remove(); await flush();
  });

  it("clamps seek and completes exactly once when seeking to the end", async () => {
    const bridge = makeBridge();
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    expect(player.supportsSeek).toBe(true);
    await player.seek(-3);
    expect(bridge.seek).toHaveBeenLastCalledWith({ sessionId: player.sessionId, position: 0 });
    await player.seek(6);
    expect(player.currentTime).toBe(6);
    const ended = vi.fn(); player.addEventListener("ended", ended);
    await player.seek(99);
    expect(bridge.seek).toHaveBeenLastCalledWith({ sessionId: player.sessionId, position: 10 });
    emit({ sessionId: player.sessionId, playing: false, position: 10, duration: 10, reason: "ended", state: "ended" });
    await vi.advanceTimersByTimeAsync(500);
    expect(player.ended).toBe(true);
    expect(ended).toHaveBeenCalledOnce();
    player.remove(); await flush();
  });
});
