/** @vitest-environment jsdom */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AudioSessionScreen } from "../screens-b";
import { INITIAL_STATE } from "../types";
import { getNarrationBridge, type NarrationBridge } from "@/lib/native/narration";

vi.mock("@/lib/native/narration", () => ({ getNarrationBridge: vi.fn() }));
vi.mock("../NarrationVolumeControl", () => ({ NarrationVolumeControl: () => null }));
let nativePlayer: { supportsSeek?: boolean } | null = null;
vi.mock("../useClipPlayer", () => ({ useClipPlayer: () => ({
  ready: true, playing: false, completed: false, error: null,
  elapsedSec: 0, totalSec: 120, timeline: null, play: vi.fn(), pause: vi.fn(),
  seekTo: vi.fn(), skipBackward15: vi.fn(), skipForward15: vi.fn(),
  hasStepNavigation: false, nativeNarrationPlayer: nativePlayer,
}) }));

const state = { ...INITIAL_STATE, need: "Confidence" as const, role: "Forward", adversity: "Benched" };
const render = () => renderToStaticMarkup(
  <AudioSessionScreen state={state} set={vi.fn()} onContinue={vi.fn()} />,
);

describe("native seek panel (FV-784)", () => {
  it("shows the scrubber and 15 s skips when the native build supports seek", () => {
    vi.mocked(getNarrationBridge).mockReturnValue({} as NarrationBridge);
    nativePlayer = { supportsSeek: true };
    const html = render();
    expect(html).toContain("Scrub guided session position");
    expect(html).toContain("Skip back 15 seconds");
    expect(html).toContain("Skip forward 15 seconds");
  });
  it("keeps the panel hidden on an older native build without seek", () => {
    vi.mocked(getNarrationBridge).mockReturnValue({} as NarrationBridge);
    nativePlayer = { supportsSeek: false };
    expect(render()).not.toContain("Scrub guided session position");
  });
  it("keeps the panel hidden while a native player is still preparing", () => {
    vi.mocked(getNarrationBridge).mockReturnValue({} as NarrationBridge);
    nativePlayer = null;
    expect(render()).not.toContain("Scrub guided session position");
  });
  it("keeps the browser panel", () => {
    vi.mocked(getNarrationBridge).mockReturnValue(null);
    nativePlayer = null;
    expect(render()).toContain("Scrub guided session position");
  });
});
