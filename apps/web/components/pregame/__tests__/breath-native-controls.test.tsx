/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BreathScreen } from "../screens-a";
import { INITIAL_STATE } from "../types";
import { useBreathAudio, type BreathAudioState } from "../audio/useBreathAudio";
vi.mock("../audio/useBreathAudio", () => ({ useBreathAudio: vi.fn() }));
vi.mock("../BreathingSphere", () => ({
  BreathingSphere: ({ onTap, onComplete }: { onTap?: () => void; onComplete?: () => void }) =>
    <button onClick={onTap ?? onComplete}>Start sphere</button>,
}));
let audio: BreathAudioState;
beforeEach(() => {
  audio = {
    status: "loading", isPlaying: false, hasStarted: false, usesNativeAudio: true,
    controlled: { phase: "idle", t: 0, round: 0, isPlaying: false },
    rawPhase: "idle", rounds: 3, audioRef: { current: null },
    play: vi.fn(async () => undefined), pause: vi.fn(),
  };
  vi.mocked(useBreathAudio).mockImplementation(() => audio);
});
afterEach(cleanup);
describe("native breathing controls", () => {
  it("does not offer a silent sphere while native preparation is pending", () => {
    const { rerender } = render(<BreathScreen state={INITIAL_STATE} set={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByRole("status").textContent).toContain("Preparing");
    expect(screen.queryByRole("button", { name: "Start sphere" })).toBeNull();
    audio = { ...audio, status: "ready" };
    rerender(<BreathScreen state={INITIAL_STATE} set={vi.fn()} onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Start sphere" }));
    expect(audio.play).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Resume breathing" })).toBeNull();
  });
  it("offers an explicit resume after interruption mid-breath but not after completion", () => {
    audio = { ...audio, status: "ready", hasStarted: true, controlled: { phase: "inhale", t: 0.5, round: 1, isPlaying: false } };
    const { rerender } = render(<BreathScreen state={INITIAL_STATE} set={vi.fn()} onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Resume breathing" }));
    expect(audio.play).toHaveBeenCalledOnce();
    rerender(<BreathScreen state={{ ...INITIAL_STATE, breathDone: true }} set={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Resume breathing" })).toBeNull();
  });
  it("pauses narration when the athlete skips the breathing step", () => {
    audio = { ...audio, status: "ready", isPlaying: true, hasStarted: true };
    const set = vi.fn();
    render(<BreathScreen state={INITIAL_STATE} set={set} onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Already settled" }));
    expect(audio.pause).toHaveBeenCalledOnce();
    expect(set).toHaveBeenCalledWith("breathDone", true);
  });
});
