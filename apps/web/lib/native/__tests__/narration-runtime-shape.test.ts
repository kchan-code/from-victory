/** @vitest-environment jsdom */
import { Blob as NodeBlob } from "node:buffer";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  createNativeNarrationPlayer, getNarrationBridge, type NarrationBridge,
  type NarrationStateEvent, type NarrationStatus,
} from "../narration";

// On device, Capacitor.Plugins.FVNarration is the registerPlugin Proxy: every
// property is a function, and a method the installed binary lacks rejects with
// UNIMPLEMENTED when called. PluginHeaders lists what the binary really has.
const wav = () => new NodeBlob([new Uint8Array(44)]) as unknown as Blob;
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const BASE_METHODS = ["begin", "append", "prepare", "play", "pause", "setVolume", "getStatus", "dispose"];
let status: NarrationStatus;
let emit: ((event: NarrationStateEvent) => void) | null;

function implementation(): Record<string, (...args: never[]) => unknown> {
  return {
    begin: async () => undefined, append: async () => undefined,
    prepare: async () => ({ duration: 10 }),
    play: async () => { status = { ...status, state: "playing" }; },
    pause: async () => { status = { ...status, state: "paused" }; },
    setVolume: async () => ({ volume: 1 }),
    getStatus: vi.fn(async () => status),
    dispose: async () => undefined,
    addListener: async (_name: string, listener: (event: NarrationStateEvent) => void) => {
      emit = listener;
      return { remove: () => undefined };
    },
    seek: vi.fn(async ({ position }: { position: number }) => { status = { ...status, position }; }),
  };
}
function runtimeProxy(impl: Record<string, unknown>, nativeMethods: string[]): NarrationBridge {
  return new Proxy({}, {
    get(_target, prop) {
      if (typeof prop !== "string" || prop === "then" || prop === "$$typeof") return undefined;
      if (prop === "addListener" || nativeMethods.includes(prop)) return impl[prop];
      return () => Promise.reject(Object.assign(
        new Error(`"FVNarration.${prop}()" is not implemented on ios`), { code: "UNIMPLEMENTED" },
      ));
    },
  }) as NarrationBridge;
}
function install(nativeMethods: string[], headers: boolean) {
  const impl = implementation();
  const bridge = runtimeProxy(impl, nativeMethods);
  vi.stubGlobal("Capacitor", {
    Plugins: { FVNarration: bridge },
    ...(headers ? {
      PluginHeaders: [
        { name: "App", methods: [{ name: "seek", rtype: "promise" }] },
        { name: "FVNarration", methods: nativeMethods.map((name) => ({ name, rtype: "promise" })) },
      ],
    } : {}),
  });
  return { bridge: getNarrationBridge()!, impl };
}

beforeEach(() => {
  vi.useFakeTimers();
  status = { position: 0, duration: 10, state: "ready" };
  emit = null;
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); document.body.innerHTML = ""; });

describe("seek detection against the real Capacitor runtime shape (FV-784)", () => {
  it("an installed build whose PluginHeaders lack seek reports no seek support", async () => {
    const { bridge } = install(BASE_METHODS, true);
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    expect(player.supportsSeek).toBe(false);
    player.remove(); await flush();
  });

  it("a build whose PluginHeaders list seek reports support", async () => {
    const { bridge } = install([...BASE_METHODS, "seek"], true);
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    expect(player.supportsSeek).toBe(true);
    player.remove(); await flush();
  });

  it("a seek that rejects as not implemented turns seek off without failing playback", async () => {
    const { bridge } = install(BASE_METHODS, false);
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    expect(player.supportsSeek).toBe(true);
    const unavailable = vi.fn(); player.addEventListener("seekunavailable", unavailable);
    const failed = vi.fn(); player.addEventListener("error", failed);
    await expect(player.seek(5)).resolves.toBeUndefined();
    expect(player.supportsSeek).toBe(false);
    expect(unavailable).toHaveBeenCalledOnce();
    expect(failed).not.toHaveBeenCalled();
    await player.play();
    expect(player.paused).toBe(false);
    player.remove(); await flush();
  });
});

describe("events and polls cannot undo each other (FV-784)", () => {
  it("a poll that sampled before a newer stateChange does not flip paused back", async () => {
    const { bridge, impl } = install([...BASE_METHODS, "seek"], true);
    const player = await createNativeNarrationPlayer(bridge, wav(), new AbortController().signal);
    await player.play();
    expect(player.paused).toBe(false);
    let answer!: (value: NarrationStatus) => void;
    (impl.getStatus as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise<NarrationStatus>((resolve) => { answer = resolve; }),
    );
    await vi.advanceTimersByTimeAsync(260);
    const staleSnapshot: NarrationStatus = { position: 3, duration: 10, state: "playing" };
    emit!({ sessionId: player.sessionId, playing: false, position: 3, duration: 10, reason: "routeChange", state: "paused" });
    expect(player.paused).toBe(true);
    answer(staleSnapshot);
    await flush();
    expect(player.paused).toBe(true);
    player.remove(); await flush();
  });
});
