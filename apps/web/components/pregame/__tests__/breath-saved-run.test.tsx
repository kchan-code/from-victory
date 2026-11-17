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

describe("BreathScreen saved-recording warm (FV-758)", () => {
  const withController = (present: boolean) =>
    vi.stubGlobal("navigator", { ...navigator, serviceWorker: { controller: present ? {} : null } });
  const done = { ...INITIAL_STATE, breathDone: true };
  beforeEach(() => {
    vi.spyOn(breathAudio, "useBreathAudio").mockImplementation(() => stubAudio());
  });

  it("fresh run, breathing finished, worker in control: fetches the MP3 and then the timeline", async () => {
    withController(true);
    const fetchMock = vi.fn(async (_url: string) => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<BreathScreen state={done} set={vi.fn()} onContinue={vi.fn()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0]?.[0]).toContain(`${BREATH_SAVED_SLUG}.mp3`);
    expect(fetchMock.mock.calls[1]?.[0]).toContain(`${BREATH_SAVED_SLUG}.json`);
  });

  it("does not fetch before breathing finishes, on a saved run, or without a worker", async () => {
    const fetchMock = vi.fn(async (_url: string) => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    withController(true);
    render(<BreathScreen state={INITIAL_STATE} set={vi.fn()} onContinue={vi.fn()} />);
    render(<BreathScreen state={done} set={vi.fn()} onContinue={vi.fn()} savedRun />);
    withController(false);
    render(<BreathScreen state={done} set={vi.fn()} onContinue={vi.fn()} />);
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
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
    // Timeline, then a HEAD for its MP3.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back when the saved timeline loads but its MP3 is not reachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) =>
        url.includes(BREATH_SAVED_SLUG) && init?.method === "HEAD"
          ? new Response(null, { status: 503 })
          : okJson(),
      ),
    );
    const { result } = run();
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.resolvedSlug).toBe(BREATH_SLUG);
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
