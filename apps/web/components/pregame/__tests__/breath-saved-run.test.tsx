/** @vitest-environment jsdom */
// FV-758: the breathing step on a saved run. The focus is already chosen, so
// the text, the button and the recording must not ask for one; and a device
// without the saved-run recording must fall back to the standard one.
import { cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BREATH_SAVED_SLUG, BREATH_SLUG, BreathScreen } from "../screens-a";
import { INITIAL_STATE } from "../types";
import * as breathAudio from "../audio/useBreathAudio";
import type { BreathAudioState } from "../audio/useBreathAudio";

vi.mock("../BreathingSphere", () => ({
  BreathingSphere: () => <div data-testid="sphere" />,
}));

const TIMELINE = { slug: "x", durationSec: 10, phases: [{ phase: "intro", startSec: 0 }] };
const okJson = () => new Response(JSON.stringify(TIMELINE), { status: 200 });

function stubAudio(): BreathAudioState {
  return {
    nativeNarrationPlayer: null,
    resolvedSlug: BREATH_SLUG,
    status: "missing",
    isPlaying: false,
    hasStarted: false,
    usesNativeAudio: false,
    controlled: { phase: "idle", t: 0, round: 0, isPlaying: false },
    rawPhase: "idle",
    rounds: 3,
    audioRef: { current: null },
    play: vi.fn(async () => undefined),
    pause: vi.fn(),
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("BreathScreen wording (FV-758)", () => {
  let hook: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    hook = vi.spyOn(breathAudio, "useBreathAudio").mockImplementation(() => stubAudio());
  });

  it("saved run: no focus wording before or after breathing, and the button starts the session", () => {
    const { rerender } = render(
      <BreathScreen state={INITIAL_STATE} set={vi.fn()} onContinue={vi.fn()} savedRun />,
    );
    expect(screen.getByText("Lead your body back to ready.")).toBeTruthy();
    expect(screen.queryByText(/focus/i)).toBeNull();

    rerender(
      <BreathScreen state={{ ...INITIAL_STATE, breathDone: true }} set={vi.fn()} onContinue={vi.fn()} savedRun />,
    );
    expect(screen.getByText("Your session is set.")).toBeTruthy();
    expect(screen.getByText("Ready.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "START MY SESSION" })).toBeTruthy();
    expect(screen.queryByText(/focus/i)).toBeNull();
  });

  it("saved run asks for the saved-run recording with the standard one as fallback", () => {
    render(<BreathScreen state={INITIAL_STATE} set={vi.fn()} onContinue={vi.fn()} savedRun />);
    expect(hook).toHaveBeenCalledWith(
      expect.objectContaining({ slug: BREATH_SAVED_SLUG, fallbackSlug: BREATH_SLUG }),
    );
  });

  it("fresh run is unchanged: standard recording and the focus wording", () => {
    const { rerender } = render(<BreathScreen state={INITIAL_STATE} set={vi.fn()} onContinue={vi.fn()} />);
    expect(hook).toHaveBeenCalledWith(expect.objectContaining({ slug: BREATH_SLUG }));
    expect(screen.getByText("Before you choose your focus, lead your body back to ready.")).toBeTruthy();

    rerender(<BreathScreen state={{ ...INITIAL_STATE, breathDone: true }} set={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByText("Now your mind chooses what to train.")).toBeTruthy();
    expect(screen.getByText("Ready. Now set your focus.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "SET MY FOCUS" })).toBeTruthy();
  });
});

describe("useBreathAudio fallback (FV-758)", () => {
  const run = () =>
    renderHook(() =>
      breathAudio.useBreathAudio({ slug: BREATH_SAVED_SLUG, fallbackSlug: BREATH_SLUG, expectedRounds: 3 }),
    );

  it("uses the requested recording when its timeline loads", async () => {
    const fetchMock = vi.fn(async () => okJson());
    vi.stubGlobal("fetch", fetchMock);
    const { result } = run();
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.resolvedSlug).toBe(BREATH_SAVED_SLUG);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the standard recording when the saved one is a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes(BREATH_SAVED_SLUG) ? new Response("", { status: 404 }) : okJson(),
      ),
    );
    const { result } = run();
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.resolvedSlug).toBe(BREATH_SLUG);
  });

  it("falls back when the saved one cannot be fetched at all (offline cache miss)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes(BREATH_SAVED_SLUG)) throw new TypeError("Failed to fetch");
        return okJson();
      }),
    );
    const { result } = run();
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.resolvedSlug).toBe(BREATH_SLUG);
  });

  it("reports missing when neither recording is available", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    const { result } = run();
    await waitFor(() => expect(result.current.status).toBe("missing"));
  });
});
