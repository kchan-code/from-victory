/** @vitest-environment jsdom */
import { Blob as NodeBlob } from "node:buffer";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  createNativeNarrationPlayer, getNarrationBridge, NARRATION_CHUNK_BYTES,
  NARRATION_MAX_BYTES, type NarrationStatus,
} from "../narration";

const wav = (size = 44) => new NodeBlob([new Uint8Array(size)]) as unknown as Blob;
const makeBridge = () => ({
  begin: vi.fn(async (): Promise<void> => undefined), append: vi.fn(async (): Promise<void> => undefined),
  prepare: vi.fn(async () => ({ duration: 10 })),
  play: vi.fn(async (): Promise<void> => undefined), pause: vi.fn(async (): Promise<void> => undefined),
  getStatus: vi.fn(async (): Promise<NarrationStatus> => ({ position: 0, duration: 10, state: "ready" })),
  dispose: vi.fn(async (): Promise<void> => undefined),
});
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); document.body.innerHTML = ""; });

describe("native narration bridge", () => {
  it("does not claim support on web or incomplete/old native shells", () => {
    vi.stubGlobal("Capacitor", undefined);
    expect(getNarrationBridge()).toBeNull();
    vi.stubGlobal("Capacitor", { Plugins: { FVNarration: { play() {} } } });
    expect(getNarrationBridge()).toBeNull();
    const bridge = makeBridge();
    vi.stubGlobal("Capacitor", { Plugins: { FVNarration: bridge } });
    expect(getNarrationBridge()).toBe(bridge);
  });
  it("sends bounded ordered chunks and never auto-plays during preparation", async () => {
    const bridge = makeBridge();
    const player = await createNativeNarrationPlayer(bridge, wav(NARRATION_CHUNK_BYTES + 45), new AbortController().signal);
    expect(bridge.append.mock.calls).toHaveLength(2);
    const calls = bridge.append.mock.calls as unknown as [{index:number;data:string}[] , {index:number;data:string}[]];
    expect(calls[0][0]?.index).toBe(0);
    expect(calls[1][0]?.index).toBe(1);
    expect(atob(calls[0][0]!.data).length).toBe(NARRATION_CHUNK_BYTES);
    expect(atob(calls[1][0]!.data).length).toBe(45);
    expect(bridge.play).not.toHaveBeenCalled();
    player.remove(); await flush();
  });
  it("rejects oversized input before allocating or beginning a native session", async () => {
    const bridge = makeBridge();
    await expect(createNativeNarrationPlayer(bridge, { size: NARRATION_MAX_BYTES + 1 } as Blob, new AbortController().signal)).rejects.toThrow("size");
    expect(bridge.begin).not.toHaveBeenCalled();
  });
  it("cancellation during transfer disposes only its session and never prepares", async () => {
    const bridge = makeBridge();
    const controller = new AbortController();
    bridge.append.mockImplementation(async () => { controller.abort(); });
    await expect(createNativeNarrationPlayer(bridge, wav(45), controller.signal)).rejects.toThrow("cancelled");
    expect(bridge.prepare).not.toHaveBeenCalled();
    expect(bridge.dispose).toHaveBeenCalledWith(expect.objectContaining({ sessionId: expect.any(String) }));
  });
  it("queues a replacement behind a timed-out begin and cleans up the late session first", async () => {
    const bridge = makeBridge();
    let finish!: () => void;
    bridge.begin.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const first = createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    const firstFailure = expect(first).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(15_001); await firstFailure;
    const second = createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    await flush();
    expect(bridge.begin).toHaveBeenCalledTimes(1);
    finish();
    const replacement = await second;
    expect(bridge.begin).toHaveBeenCalledTimes(2);
    const firstId = (bridge.begin.mock.calls as unknown as {sessionId:string}[][])[0]![0]!.sessionId;
    expect(bridge.dispose).toHaveBeenCalledWith({ sessionId: firstId });
    expect(replacement.sessionId).not.toBe(firstId);
    replacement.remove(); await flush();
  });
  it("uses native completion once, preserves external media controls, and releases the reload guard", async () => {
    const bridge = makeBridge();
    const mediaSession = { setActionHandler: vi.fn() };
    Object.defineProperty(navigator, "mediaSession", { value: mediaSession, configurable: true });
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    player.setAttribute("data-fv-guided-session", "active");
    const ended = vi.fn(); player.addEventListener("ended", ended);
    bridge.getStatus.mockResolvedValue({ position: 10, duration: 10, state: "ended" });
    await vi.advanceTimersByTimeAsync(750);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(mediaSession.setActionHandler).not.toHaveBeenCalled();
    const released = vi.fn(); document.addEventListener("fv:guided-session-end", released, { once: true });
    player.remove(); await flush();
    expect(document.querySelector("[data-fv-guided-session]")).toBeNull();
    expect(released).toHaveBeenCalledOnce();
  });
  it("serializes pause after a pending play and ignores status after disposal", async () => {
    const bridge = makeBridge();
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    let finish!: () => void;
    bridge.play.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    const playing = player.play(); await flush();
    player.pause(); player.remove(); finish(); await playing; await flush();
    expect(bridge.pause).not.toHaveBeenCalled();
    expect(bridge.dispose).toHaveBeenCalledWith({ sessionId: player.sessionId });
    expect(player.paused).toBe(true);
  });
});
