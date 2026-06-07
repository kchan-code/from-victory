/**
 * @vitest-environment jsdom
 */
// FV-132 — unit tests for the FV-129 opt-in "Download for offline" control on
// the pregame Review screen (ReviewScreen / OfflineDownloadControl in
// screens-b.tsx).
//
// This is the repo's first jsdom/RTL component test. The global vitest env
// stays "node" (see vitest.config.ts); only this file opts into jsdom via the
// docblock above, so the existing node-env tests are untouched.
//
// Strategy:
//  - audio-precache is a browser-only module ReviewScreen dynamically imports.
//    We mock it (vi.hoisted so the fns exist before vi.mock is hoisted) to drive
//    the state machine deterministically with NO real Cache Storage / network.
//  - ReviewScreen guards on `typeof caches === "undefined"`; jsdom has no
//    CacheStorage, so we stub a truthy `caches` global to let the guards pass.
//    The component never touches caches directly — all cache work lives in the
//    mocked module.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react";

import { ReviewScreen } from "@/components/pregame/screens-b";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";

// Hoisted mock fns — created before vi.mock is hoisted to the top of the module.
const { checkPregameAudioCached, precachePregameAudio } = vi.hoisted(() => ({
  checkPregameAudioCached: vi.fn(),
  precachePregameAudio: vi.fn(),
}));

vi.mock("@/components/pregame/audio-precache", () => ({
  checkPregameAudioCached,
  precachePregameAudio,
}));

function makeState(overrides: Partial<PregameState> = {}): PregameState {
  // need + adversity must be set or ReviewScreen's mount check early-returns.
  return {
    ...INITIAL_STATE,
    need: "Confidence",
    role: "Forward",
    adversity: "Benched in the third",
    ...overrides,
  };
}

const DOWNLOAD_BTN = /download audio for offline play/i;
const RETRY_BTN = /retry offline audio download/i;

beforeEach(() => {
  // Truthy CacheStorage stub so the `typeof caches === "undefined"` guards pass.
  vi.stubGlobal("caches", {} as unknown as CacheStorage);
  checkPregameAudioCached.mockReset();
  precachePregameAudio.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ReviewScreen offline download (FV-129 / FV-132)", () => {
  it("shows the opt-in button and fires NO network when nothing is cached", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });

    render(<ReviewScreen state={makeState()} />);

    const btn = await screen.findByRole("button", { name: DOWNLOAD_BTN });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent(/download for offline/i);

    // The network-free check ran; the network-spending precache did NOT.
    await waitFor(() => expect(checkPregameAudioCached).toHaveBeenCalledTimes(1));
    expect(precachePregameAudio).not.toHaveBeenCalled();
  });

  it("shows the Ready offline badge when clips are already cached (no action, no network)", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 5,
      total: 5,
      done: true,
      error: null,
    });

    render(<ReviewScreen state={makeState()} />);

    expect(await screen.findByText(/ready offline/i)).toBeInTheDocument();
    expect(precachePregameAudio).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: DOWNLOAD_BTN }),
    ).not.toBeInTheDocument();
  });

  it("downloads on tap and resolves to Ready offline", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });
    precachePregameAudio.mockImplementation(
      async (
        _params: unknown,
        onProgress?: (s: {
          cached: number;
          total: number;
          done: boolean;
          error: null;
        }) => void,
      ) => {
        onProgress?.({ cached: 1, total: 3, done: false, error: null });
        onProgress?.({ cached: 3, total: 3, done: false, error: null });
        return { cached: 3, total: 3, done: true, error: null };
      },
    );

    render(<ReviewScreen state={makeState()} />);

    const btn = await screen.findByRole("button", { name: DOWNLOAD_BTN });
    fireEvent.click(btn);

    // precachePregameAudio is reached only after an `await import()`, so assert
    // the resolved outcome first, then the call count.
    expect(await screen.findByText(/ready offline/i)).toBeInTheDocument();
    expect(precachePregameAudio).toHaveBeenCalledTimes(1);
  });

  it("shows a retry button and announces the partial state when the download is incomplete", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });
    precachePregameAudio.mockResolvedValue({
      cached: 2,
      total: 5,
      done: false,
      error: null,
    });

    render(<ReviewScreen state={makeState()} />);

    fireEvent.click(await screen.findByRole("button", { name: DOWNLOAD_BTN }));

    const retry = await screen.findByRole("button", { name: RETRY_BTN });
    expect(retry).toHaveTextContent(/tap to retry/i);

    // The aria-live region announces the partial state (the "." in the regex
    // tolerates the curly apostrophe in "didn't").
    await waitFor(() =>
      expect(
        screen.getByText(/Download didn.t finish, 2 of 5 clips saved\. Tap to retry\./),
      ).toBeInTheDocument(),
    );
  });

  it("keeps focus on the SAME button across the tap→download transition", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });
    // Pending download so we can observe the loading state mid-flight.
    let resolveDownload!: (value: {
      cached: number;
      total: number;
      done: boolean;
      error: null;
    }) => void;
    precachePregameAudio.mockImplementation(
      () =>
        new Promise((res) => {
          resolveDownload = res;
        }),
    );

    render(<ReviewScreen state={makeState()} />);

    const btn = await screen.findByRole("button", { name: DOWNLOAD_BTN });
    btn.focus();
    expect(btn).toHaveFocus();

    fireEvent.click(btn);

    // Same element is now busy AND still focused — the focus-preservation
    // invariant the FV-129 a11y fix guarantees (idle/loading share one <button>).
    await waitFor(() => expect(btn).toHaveAttribute("aria-busy", "true"));
    expect(btn).toHaveFocus();
    expect(document.activeElement).toBe(btn);

    // Settle the pending promise so the test exits cleanly (wait for the dynamic
    // import + mock to run so resolveDownload is assigned).
    await waitFor(() => expect(precachePregameAudio).toHaveBeenCalled());
    await act(async () => {
      resolveDownload({ cached: 1, total: 1, done: true, error: null });
    });
  });

  it("does not throw or warn if the component unmounts mid-download", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });
    let resolveDownload!: (value: {
      cached: number;
      total: number;
      done: boolean;
      error: null;
    }) => void;
    precachePregameAudio.mockImplementation(
      () =>
        new Promise((res) => {
          resolveDownload = res;
        }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = render(<ReviewScreen state={makeState()} />);
    fireEvent.click(await screen.findByRole("button", { name: DOWNLOAD_BTN }));
    await waitFor(() => expect(precachePregameAudio).toHaveBeenCalled());

    // Unmount while the download is still in flight, then resolve it. The
    // cancellation ref must swallow the post-unmount resolution path.
    unmount();
    await act(async () => {
      resolveDownload({ cached: 3, total: 3, done: true, error: null });
    });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("returns to the idle download button when the download saves zero clips (total failure)", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });
    precachePregameAudio.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });

    render(<ReviewScreen state={makeState()} />);
    fireEvent.click(await screen.findByRole("button", { name: DOWNLOAD_BTN }));
    await waitFor(() => expect(precachePregameAudio).toHaveBeenCalled());

    // Zero clips saved → control returns to the tappable idle offer: never stuck
    // on "Downloading…", never a false "ready", and no retry affordance.
    const btn = await screen.findByRole("button", { name: DOWNLOAD_BTN });
    expect(btn).toHaveTextContent(/download for offline/i);
    expect(btn).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByText(/ready offline/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: RETRY_BTN }),
    ).not.toBeInTheDocument();
  });

  it("recovers to the idle button if the download throws unexpectedly", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });
    precachePregameAudio.mockRejectedValue(new Error("network blew up"));

    render(<ReviewScreen state={makeState()} />);
    fireEvent.click(await screen.findByRole("button", { name: DOWNLOAD_BTN }));
    await waitFor(() => expect(precachePregameAudio).toHaveBeenCalled());

    // The handler's try/catch resets to idle — no stuck spinner, no false "ready".
    const btn = await screen.findByRole("button", { name: DOWNLOAD_BTN });
    expect(btn).toHaveTextContent(/download for offline/i);
    expect(screen.queryByText(/ready offline/i)).not.toBeInTheDocument();
  });
});
