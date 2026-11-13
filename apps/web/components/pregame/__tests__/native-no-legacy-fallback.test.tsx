/** @vitest-environment jsdom */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AudioSessionScreen } from "../screens-b";
import { INITIAL_STATE } from "../types";
import { getNarrationBridge, type NarrationBridge } from "@/lib/native/narration";
vi.mock("@/lib/native/narration", () => ({ getNarrationBridge: vi.fn() }));
vi.mock("../useClipPlayer", () => ({ useClipPlayer: () => ({
  ready: false, playing: false, completed: false, error: "no template",
  elapsedSec: 0, totalSec: 0, timeline: null, play: vi.fn(), pause: vi.fn(),
}) }));
const state = { ...INITIAL_STATE, need: "Confidence" as const, role: "Forward", adversity: "Benched" };
// A static render deliberately does not flush passive effects. This captures
// the vulnerable frame between clipPlayer.error and audioMode="text".
const errorFrame = () => renderToStaticMarkup(
  <AudioSessionScreen state={state} set={vi.fn()} onContinue={vi.fn()} />,
);
describe("native narration errors", () => {
  it("cannot mount/preload legacy HTML audio before the text-mode effect runs", () => {
    vi.mocked(getNarrationBridge).mockReturnValue({} as NarrationBridge);
    expect(errorFrame()).not.toContain("<audio");
  });
  it("preserves the legacy browser fallback", () => {
    vi.mocked(getNarrationBridge).mockReturnValue(null);
    expect(errorFrame()).toContain("<audio");
  });
});
