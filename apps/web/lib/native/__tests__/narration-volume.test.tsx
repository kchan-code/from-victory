/** @vitest-environment jsdom */
import { Blob as NodeBlob } from "node:buffer";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNativeNarrationPlayer, getNarrationVolume, setNarrationVolume, type NarrationBridge, type NativeNarrationPlayer } from "../narration";
import { NarrationVolumeControl } from "@/components/pregame/NarrationVolumeControl";
const flush = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
const players: NativeNarrationPlayer[] = [];
function bridgeWithVolume() {
  let playing = false;
  return {
    begin: vi.fn(async () => undefined), append: vi.fn(async () => undefined),
    prepare: vi.fn(async () => ({ duration: 10 })),
    play: vi.fn(async () => { playing = true; }), pause: vi.fn(async () => { playing = false; }),
    getStatus: vi.fn(async () => ({ duration: 10, position: 2, state: playing ? "playing" as const : "paused" as const })),
    dispose: vi.fn(async () => undefined),
    setVolume: vi.fn(async ({ volume }: { sessionId: string; volume: number }) => ({ volume })),
  };
}
async function create(bridge: NarrationBridge) {
  const player = await createNativeNarrationPlayer(bridge, new NodeBlob([new Uint8Array(44)]) as unknown as Blob, new AbortController().signal);
  players.push(player);
  return player;
}
beforeEach(() => { vi.useFakeTimers(); setNarrationVolume(1); });
afterEach(async () => {
  cleanup(); players.splice(0).forEach((player) => player.remove()); await flush(); vi.useRealTimers();
});
describe("narration volume", () => {
  it("reveals volume on demand and preserves playback and gain after Done", async () => {
    const bridge = bridgeWithVolume(); const player = await create(bridge); await player.play();
    render(<NarrationVolumeControl player={player} />);
    const trigger = screen.getByRole("button", { name: /^Voice/ });
    expect(screen.queryByRole("slider")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    const slider = screen.getByRole("slider", { name: "Narration volume" });
    expect(document.activeElement).toBe(slider);
    await act(async () => { fireEvent.change(slider, { target: { value: "0" } }); await flush(); });
    expect(screen.getByRole("slider")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("slider")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(screen.getByRole("button", { name: /^Voice muted/ })).toBeTruthy();
    expect(getNarrationVolume()).toBe(0);
    expect(bridge.pause).not.toHaveBeenCalled();
    expect(bridge.dispose).not.toHaveBeenCalled();
  });
  it("dismisses with Escape or outside interaction without stealing outside focus", async () => {
    const player = await create(bridgeWithVolume());
    render(<><NarrationVolumeControl player={player} /><button>Outside</button></>);
    const trigger = screen.getByRole("button", { name: /^Voice/ });
    fireEvent.click(trigger); fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("slider")).toBeNull(); expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    const outside = screen.getByRole("button", { name: "Outside" });
    outside.focus(); fireEvent.pointerDown(outside);
    expect(screen.queryByRole("slider")).toBeNull(); expect(document.activeElement).toBe(outside);
  });
  it("starts at full volume and applies the preference before exposing a ready player", async () => {
    const bridge = bridgeWithVolume();
    const player = await create(bridge);
    expect(getNarrationVolume()).toBe(1);
    expect(player.supportsVolume).toBe(true);
    expect(bridge.setVolume).toHaveBeenCalledWith({ sessionId: player.sessionId, volume: 1 });
    expect(bridge.play).not.toHaveBeenCalled();
  });
  it("coalesces rapid live changes to the latest desired value", async () => {
    const bridge = bridgeWithVolume(); const player = await create(bridge); await player.play();
    bridge.setVolume.mockClear();
    let finish!: (result: {volume:number}) => void;
    bridge.setVolume.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    setNarrationVolume(0.8); await flush();
    setNarrationVolume(0.7); setNarrationVolume(0.5); setNarrationVolume(0.2);
    expect(bridge.setVolume).toHaveBeenCalledTimes(1);
    finish({ volume: 0.8 }); await flush();
    expect(bridge.setVolume).toHaveBeenCalledTimes(2);
    expect(bridge.setVolume).toHaveBeenLastCalledWith({ sessionId: player.sessionId, volume: 0.2 });
    expect(player.paused).toBe(false);
  });
  it("honors mute while paused, on resume, and in the next step", async () => {
    const bridge = bridgeWithVolume(); const player = await create(bridge);
    await player.play(); player.pause(); await flush();
    setNarrationVolume(0); await flush(); await player.play();
    expect(bridge.setVolume).toHaveBeenLastCalledWith({ sessionId: player.sessionId, volume: 0 });
    player.remove(); await flush();
    const next = await create(bridge);
    expect(bridge.setVolume).toHaveBeenLastCalledWith({ sessionId: next.sessionId, volume: 0 });
    expect(getNarrationVolume()).toBe(0);
  });
  it("keeps older native playback working and hides unsupported controls", async () => {
    const bridge = bridgeWithVolume();
    const { setVolume: _unused, ...oldBridge } = bridge;
    const player = await create(oldBridge);
    render(<NarrationVolumeControl player={player} />);
    expect(player.supportsVolume).toBe(false);
    expect(screen.queryByRole("slider")).toBeNull();
    await player.play(); expect(oldBridge.play).toHaveBeenCalledOnce();
  });
  it("shows a nonfatal error and permits retry without stopping narration", async () => {
    const bridge = bridgeWithVolume(); const player = await create(bridge); await player.play();
    render(<NarrationVolumeControl player={player} />);
    fireEvent.click(screen.getByRole("button", { name: /^Voice/ }));
    bridge.setVolume.mockRejectedValueOnce(new Error("temporary failure"));
    await act(async () => { fireEvent.change(screen.getByRole("slider"), { target: { value: "35" } }); await flush(); });
    expect(screen.getByRole("status").textContent).toContain("Couldn’t change narration volume");
    expect(player.paused).toBe(false); expect(bridge.dispose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Open Voice to retry");
    fireEvent.click(screen.getByRole("button", { name: /^Voice/ }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Retry" })); await flush(); });
    expect(screen.queryByRole("status")).toBeNull();
    expect(bridge.setVolume).toHaveBeenLastCalledWith({ sessionId: player.sessionId, volume: 0.35 });
  });
  it("initial volume rejection remains ready with an error, rather than losing all narration", async () => {
    const bridge = bridgeWithVolume(); bridge.setVolume.mockRejectedValueOnce(new Error("unsupported state"));
    setNarrationVolume(0.4);
    const player = await create(bridge);
    expect(player.volumeError).toBeTruthy();
    await player.play(); expect(player.paused).toBe(false); expect(player.volumeError).toBeNull();
  });
  it("ignores stale volume results after disposal and targets only the next session", async () => {
    const bridge = bridgeWithVolume(); const player = await create(bridge);
    let finish!: (result: {volume:number}) => void;
    bridge.setVolume.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    setNarrationVolume(0.3); await flush(); player.remove();
    const changed = vi.fn(); player.addEventListener("volumechange", changed);
    const next = await create(bridge); setNarrationVolume(0.6); await flush(); finish({ volume: 0.3 }); await flush();
    expect(changed).not.toHaveBeenCalled();
    expect(bridge.setVolume).toHaveBeenLastCalledWith({ sessionId: next.sessionId, volume: 0.6 });
  });
  it("labels mute accessibly and explains that the phone controls both audio sources", async () => {
    const player = await create(bridgeWithVolume()); render(<NarrationVolumeControl player={player} />);
    fireEvent.click(screen.getByRole("button", { name: /^Voice/ }));
    await act(async () => { fireEvent.change(screen.getByRole("slider", { name: "Narration volume" }), { target: { value: "0" } }); await flush(); });
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("Muted");
    expect(screen.getByText(/Phone volume changes both/)).toBeTruthy();
    expect(getNarrationVolume()).toBe(0);
  });
});
