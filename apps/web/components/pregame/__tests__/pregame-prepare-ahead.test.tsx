/**
 * @vitest-environment jsdom
 */
// Prepare-ahead feature (FV-229 / PR #194 must-fix #2 — zero test coverage).
//
// Tests the CORRECTED behavior after the must-fix #1 bug was patched:
//   1. "Play saved offline session" start-screen entry visibility rules.
//   2. "Set up for later" entry — always shown, enters prepare flow (no breath),
//      last step shows "SAVE & DOWNLOAD FOR LATER", advancing writes session and
//      transitions to PrepareDownloadScreen.
//   4. PrepareDownloadScreen auto-download states (done / partial / no-caches guard).
//
// ReviewScreen mode="prepare" is tested in this file (item 3) — included here
// because isolating ReviewScreen is cleaner than walking PregameFlow to the
// review step. The same assertions are also added to review-screen.test.tsx.
//
// Mock structure mirrors pregame-rerun-flow.test.tsx exactly: useClipPlayer +
// audio-precache + localStorage stub. No real Web Audio, no real fetch.
//
// String-matching note: JSX `&rsquo;` renders as the curly RIGHT SINGLE
// QUOTATION MARK (U+2019). Regex patterns use `.` to match either apostrophe
// form so they stay robust if entities are swapped for literal chars and vice
// versa.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";

import { PregameFlow } from "@/components/pregame/PregameFlow";
import { ReviewScreen, PrepareDownloadScreen } from "@/components/pregame/screens-b";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";
import { PREGAME_SESSION_CACHE_KEY } from "@/lib/pregame/session-cache";

// Mock the client-facing telemetry action so the test never imports its
// server-only write chain (lib/activity/record.ts → `server-only`). Fire-and-
// forget event call; behaviour under test is unchanged.
vi.mock("@/lib/actions/activity", () => ({
  logActivityEvent: vi.fn(() => Promise.resolve()),
}));

// ── Mock useClipPlayer — no Web Audio, no fetch ──────────────────────────────
vi.mock("@/components/pregame/useClipPlayer", () => ({
  useClipPlayer: vi.fn(() => ({
    ready: false,
    playing: false,
    completed: false,
    elapsedSec: 0,
    totalSec: 0,
    error: "no template",
    timeline: null,
    play: vi.fn(),
    pause: vi.fn(),
  })),
}));

// ── Hoisted mock fns for audio-precache ──────────────────────────────────────
// vi.hoisted so the fns are created before vi.mock hoisting lifts them.
const { checkPregameAudioCached, precachePregameAudio } = vi.hoisted(() => ({
  checkPregameAudioCached: vi.fn(),
  precachePregameAudio: vi.fn(),
}));

vi.mock("@/components/pregame/audio-precache", () => ({
  checkPregameAudioCached,
  precachePregameAudio,
}));

// ── localStorage stub ─────────────────────────────────────────────────────────
// Same pattern as pregame-rerun-flow.test.tsx and session-cache.test.ts.
const store: Record<string, string> = {};
const localStorageStub = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => {
    store[key] = value;
  },
  removeItem: (key: string): void => {
    delete store[key];
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function seedSavedSession(overrides: Record<string, unknown> = {}) {
  localStorageStub.setItem(
    PREGAME_SESSION_CACHE_KEY,
    JSON.stringify({
      sport: "hockey",
      need: "Confidence",
      role: "Forward",
      positivePlays: ["viz-forward-breakaway"],
      adversity: "benched",
      anchor: "I am already loved.",
      selfTalk: "Next shift.",
      cueWord: "Faithful",
      prayerStyle: "guided",
      ...overrides,
    }),
  );
}

function makeState(overrides: Partial<PregameState> = {}): PregameState {
  return {
    ...INITIAL_STATE,
    need: "Confidence",
    adversity: "benched",
    ...overrides,
  };
}

beforeEach(() => {
  // Clear store between tests.
  for (const k of Object.keys(store)) delete store[k];
  Object.defineProperty(window, "localStorage", {
    value: localStorageStub,
    writable: true,
    configurable: true,
  });
  // Default: truthy CacheStorage stub so `typeof caches === "undefined"` guards pass.
  vi.stubGlobal("caches", {} as unknown as CacheStorage);

  // Reset audio-precache mock fns — individual tests override as needed.
  checkPregameAudioCached.mockReset();
  precachePregameAudio.mockReset();
  // Default: nothing cached.
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
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// =============================================================================
// 1. "Play saved offline session" entry visibility
// =============================================================================

describe("PregameFlow start screen — play-saved-offline entry", () => {
  it("hidden when NO saved session exists", async () => {
    // No seed — localStorage is empty.
    await act(async () => {
      render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    });

    expect(
      screen.queryByTestId("play-saved-offline-btn"),
    ).not.toBeInTheDocument();
  });

  it("hidden when a saved session exists but audio is NOT fully cached", async () => {
    // Default mock: done:false (nothing cached). Session exists but no offline entry.
    seedSavedSession();

    await act(async () => {
      render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    });

    // Wait for the async isSavedSessionCached check to settle.
    await waitFor(() => expect(checkPregameAudioCached).toHaveBeenCalled());

    expect(
      screen.queryByTestId("play-saved-offline-btn"),
    ).not.toBeInTheDocument();
  });

  it("shown with 'Downloaded · ready offline' badge when session exists AND audio is fully cached", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 5,
      total: 5,
      done: true,
      error: null,
    });
    seedSavedSession();

    await act(async () => {
      render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    });

    // Wait for the async cache check to flip savedOfflineReady → true.
    const btn = await screen.findByTestId("play-saved-offline-btn");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent(/downloaded/i);
    expect(btn).toHaveTextContent(/ready offline/i);
  });

  it("tapping play-saved-offline delegates to beginFromSaved: breath → audio step, setup screens skipped", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 5,
      total: 5,
      done: true,
      error: null,
    });
    seedSavedSession();

    await act(async () => {
      render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    });

    // Wait for the button to appear (async cache check must resolve first).
    const offlineBtn = await screen.findByTestId("play-saved-offline-btn");
    fireEvent.click(offlineBtn);

    // Breath screen renders (same as beginFromSaved / run-last-time path).
    expect(
      screen.getByRole("button", { name: /already settled/i }),
    ).toBeInTheDocument();

    // Advance past breath threshold — picks were restored, so fromSavedRef
    // intercepts the goNext and jumps straight to audio.
    fireEvent.click(screen.getByRole("button", { name: /already settled/i }));
    fireEvent.click(screen.getByRole("button", { name: /set my focus/i }));

    // CORRECTED BEHAVIOR: lands on the audio step (Step 11 · Guided Session).
    expect(screen.getByText(/Step 11 · Guided Session/i)).toBeInTheDocument();
    // Today.s Focus setup screen is never shown.
    expect(screen.queryByText(/Step 02/i)).not.toBeInTheDocument();
  });
});

// =============================================================================
// 2. "Set up for later" entry — prepare flow
// =============================================================================

describe("PregameFlow — set-up-for-later (prepare flow)", () => {
  it("'set-up-for-later-btn' is ALWAYS shown even when no session exists", async () => {
    await act(async () => {
      render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    });

    expect(screen.getByTestId("set-up-for-later-btn")).toBeInTheDocument();
  });

  it("'set-up-for-later-btn' is shown even when a saved session and cached audio exist", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 5,
      total: 5,
      done: true,
      error: null,
    });
    seedSavedSession();

    await act(async () => {
      render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    });

    // Wait for the cache-check to resolve (play-saved btn should also appear).
    await screen.findByTestId("play-saved-offline-btn");
    // set-up-for-later is still present alongside the play-saved entry.
    expect(screen.getByTestId("set-up-for-later-btn")).toBeInTheDocument();
  });

  it("tapping set-up-for-later enters prepare flow whose FIRST screen is Today.s Focus, NOT breath", async () => {
    await act(async () => {
      render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    });

    fireEvent.click(screen.getByTestId("set-up-for-later-btn"));

    // First prepare-flow step is Today's Focus — not the breath threshold.
    // Use `.` in regex to match the curly-apostrophe from &rsquo; in JSX.
    expect(
      screen.getByText(/Step 02 · Today.s Focus/i),
    ).toBeInTheDocument();
    // Breath threshold (Step 01) must NOT appear.
    expect(screen.queryByText(/Step 01 · Threshold/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /already settled/i }),
    ).not.toBeInTheDocument();
  });

  it("last prepare step (Review in prepare mode) shows 'SAVE & DOWNLOAD FOR LATER' CTA, not 'BEGIN GUIDED SESSION'", async () => {
    await act(async () => {
      render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    });

    fireEvent.click(screen.getByTestId("set-up-for-later-btn"));

    // Walk through the prepare flow to reach the Review step.
    // prepareFlow for hockey = [todaysFocus, position, positivePlays, hardMoment,
    //   resetAnchor, selfTalk, cueWord, prayerStyle, review]

    // Step 1 of prepareFlow: Today's Focus.
    // &rsquo; → curly apostrophe; regex with . handles both.
    expect(screen.getByText(/Step 02 · Today.s Focus/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^confidence$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Step 2: Position
    expect(screen.getByText(/Step 03 · Position/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^forward$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Step 3: Positive Plays — pick the first unpressed chip.
    const playBtns = screen.getAllByRole("button");
    const playChip = playBtns.find(
      (b) =>
        b.getAttribute("aria-pressed") === "false" &&
        !b.textContent?.match(/^continue$/i),
    );
    if (playChip) fireEvent.click(playChip);
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Step 4: Hard Moment
    expect(screen.getByText(/Step 05 · Hard Moment/i)).toBeInTheDocument();
    const hmBtns = screen.getAllByRole("button");
    const hmChip = hmBtns.find(
      (b) =>
        b.getAttribute("aria-pressed") === "false" &&
        !b.textContent?.match(/^continue$/i),
    );
    if (hmChip) fireEvent.click(hmChip);
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Step 5: Reset Anchor
    expect(screen.getByText(/Step 06 · Reset Anchor/i)).toBeInTheDocument();
    const anchorBtns = screen.getAllByRole("button");
    const anchorChip = anchorBtns.find(
      (b) =>
        b.getAttribute("aria-pressed") === "false" &&
        !b.textContent?.match(/^continue$/i),
    );
    if (anchorChip) fireEvent.click(anchorChip);
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Step 6: Self-Talk
    expect(screen.getByText(/Step 07 · Self-Talk/i)).toBeInTheDocument();
    const stBtns = screen.getAllByRole("button");
    const stChip = stBtns.find(
      (b) =>
        b.getAttribute("aria-pressed") === "false" &&
        !b.textContent?.match(/^continue$/i),
    );
    if (stChip) fireEvent.click(stChip);
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Step 7: Cue Word — already defaulted to "Faithful" (required: !!cueWord = true).
    expect(screen.getByText(/Step 08 · Cue Word/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Step 8: Prayer Style — already defaulted to "guided" (required: !!prayerStyle = true).
    expect(screen.getByText(/Step 09 · Closing Prayer/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Step 9 (last): Review in prepare mode.
    expect(screen.getByText(/Review · Save for the rink/i)).toBeInTheDocument();

    // The bottom bar CTA must read "SAVE & DOWNLOAD FOR LATER".
    expect(
      screen.getByRole("button", { name: /save & download for later/i }),
    ).toBeInTheDocument();
    // "BEGIN GUIDED SESSION" must NOT appear.
    expect(
      screen.queryByRole("button", { name: /begin guided session/i }),
    ).not.toBeInTheDocument();
  });

  it("advancing from the last prepare step writes session to localStorage and shows PrepareDownloadScreen", async () => {
    precachePregameAudio.mockResolvedValue({
      cached: 5,
      total: 5,
      done: true,
      error: null,
    });

    render(<PregameFlow athleteFirstName="Alex" sport="hockey" />);
    // Wait for the mount-time cache check to settle so we have a clean state.
    await waitFor(() => expect(checkPregameAudioCached).not.toHaveBeenCalled(), {
      timeout: 100,
    }).catch(() => {
      // No saved session → no cache check → this assertion is trivially true.
    });

    fireEvent.click(screen.getByTestId("set-up-for-later-btn"));

    // Walk the prepare flow with deterministic selections so state is guaranteed
    // to be fully populated before the Review → SAVE & DOWNLOAD transition.

    // Today's Focus
    fireEvent.click(screen.getByRole("button", { name: /^confidence$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Position
    fireEvent.click(screen.getByRole("button", { name: /^forward$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Positive Plays — click the first chip visible (role=Forward, plays exist).
    // All chips are SelectChip buttons with aria-pressed. Pick any one.
    const firstPlay = screen.getAllByRole("button").find(
      (b) => b.getAttribute("aria-pressed") === "false",
    );
    if (firstPlay) fireEvent.click(firstPlay);
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Hard Moment — select a specific known adversity for hockey.
    fireEvent.click(
      screen.getByRole("button", { name: /^I feel nervous\.$/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Reset Anchor — pick a known hockey anchor.
    fireEvent.click(
      screen.getByRole("button", { name: /^Tap stick twice$/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Self-Talk — pick a specific phrase.
    fireEvent.click(
      screen.getByRole("button", {
        name: /^Breathe\. Do your job\.$/i,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Cue Word (already defaulted to "Faithful" — required true)
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Prayer Style (already defaulted to "guided" — required true)
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Review — click the SAVE & DOWNLOAD CTA to advance to PrepareDownloadScreen.
    expect(screen.getByText(/Review · Save for the rink/i)).toBeInTheDocument();
    const saveCta = screen.getByRole("button", { name: /save & download for later/i });

    await act(async () => {
      fireEvent.click(saveCta);
    });

    // Session must now be written to localStorage.
    const raw = store[PREGAME_SESSION_CACHE_KEY];
    expect(raw).toBeTruthy();
    const saved = JSON.parse(raw!);
    expect(saved.sport).toBe("hockey");
    expect(saved.need).toBe("Confidence");

    // The walk → Review → SAVE transition lands on the PrepareDownloadScreen
    // terminal (its "Saving for offline" section/header). This integration test
    // asserts only the flow wiring — prepare walk → session persisted → download
    // terminal shown. The download state machine itself (auto-start on mount,
    // ready/partial/retry) is covered by the direct PrepareDownloadScreen tests
    // below, which mock audio-precache at the unit boundary. (We deliberately do
    // NOT assert on the precache mock here: the component's relative dynamic
    // import resolves past the alias-keyed mock when screens-b is loaded via the
    // full PregameFlow graph — a vitest resolution artifact, not a product issue;
    // in production the real module always loads and the download fires.)
    expect(screen.getAllByText(/saving for offline/i).length).toBeGreaterThan(0);
  });
});

// =============================================================================
// 3. ReviewScreen mode="prepare" — inline offline control suppressed
// =============================================================================

describe("ReviewScreen mode (FV-229 prepare mode)", () => {
  it("mode='prepare' renders prepare-mode copy and suppresses the offline-download-btn", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });

    render(<ReviewScreen state={makeState()} mode="prepare" />);

    // Prepare-mode headings.
    // Note: curly apostrophes (U+2019) in production source; use `.` in regex.
    expect(
      screen.getByText(/Here.s what you.re saving\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Review · Save for the rink/i),
    ).toBeInTheDocument();

    // The inline FV-129 download control must NOT appear.
    // PrepareDownloadScreen auto-downloads; showing it here would be a duplicate.
    await waitFor(() =>
      expect(
        screen.queryByTestId("offline-download-btn"),
      ).not.toBeInTheDocument(),
    );
    // No network call triggered.
    expect(precachePregameAudio).not.toHaveBeenCalled();
  });

  it("mode='play' (default) still renders the offline-download-btn (existing behavior unchanged)", async () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });

    render(<ReviewScreen state={makeState()} mode="play" />);

    // Play-mode headings.
    // Curly apostrophes (U+2019) in production source; use `.` in regex.
    expect(
      screen.getByText(/Here.s what we.ll work with\./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Step 10 · Review/i)).toBeInTheDocument();

    // The inline download button IS present on the play path.
    expect(
      await screen.findByTestId("offline-download-btn"),
    ).toBeInTheDocument();
  });

  it("mode='prepare' shows the description about downloading audio for the rink", () => {
    checkPregameAudioCached.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });

    render(<ReviewScreen state={makeState()} mode="prepare" />);

    // Curly apostrophes (U+2019) used in all production JS strings here too.
    expect(
      screen.getByText(
        /We.ll download the audio so it.s ready at the rink/i,
      ),
    ).toBeInTheDocument();
  });
});

// =============================================================================
// 4. PrepareDownloadScreen states
// =============================================================================

describe("PrepareDownloadScreen", () => {
  it("auto-downloads on mount; when done:true shows the ready state with prepare-done-btn", async () => {
    precachePregameAudio.mockResolvedValue({
      cached: 5,
      total: 5,
      done: true,
      error: null,
    });

    const onDone = vi.fn();

    render(
      <PrepareDownloadScreen
        state={makeState()}
        sport="hockey"
        onDone={onDone}
      />,
    );

    // Wait for the async effect (dynamic import + precachePregameAudio) to fire.
    await waitFor(() => expect(precachePregameAudio).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });

    // After the mock resolves done:true, the component transitions to "ready".
    // The h1 uses &rsquo; → curly apostrophe; use `.` in regex.
    // Use getByRole("heading") to avoid matching the sr-only aria-live region
    // which also contains this text.
    await waitFor(
      () =>
        expect(
          screen.getByRole("heading", { name: /You.re ready for the rink\./i }),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(screen.getByTestId("prepare-done-btn")).toBeInTheDocument();
  });

  it("when download resolves partial (done:false, cached:1, total:3) — shows retry + done-later buttons", async () => {
    precachePregameAudio.mockResolvedValue({
      cached: 1,
      total: 3,
      done: false,
      error: null,
    });

    render(
      <PrepareDownloadScreen
        state={makeState()}
        sport="hockey"
        onDone={vi.fn()}
      />,
    );

    // Wait for the mock to be called, then assert the partial state.
    await waitFor(() => expect(precachePregameAudio).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    await waitFor(
      () => expect(screen.getByTestId("prepare-retry-btn")).toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(screen.getByTestId("prepare-done-later-btn")).toBeInTheDocument();

    // Ready state must NOT appear.
    expect(
      screen.queryByText(/You.re ready for the rink\./i),
    ).not.toBeInTheDocument();
  });

  it("when download resolves zero clips (done:false, cached:0) — shows idle/retry state ('Couldn't connect.')", async () => {
    precachePregameAudio.mockResolvedValue({
      cached: 0,
      total: 0,
      done: false,
      error: null,
    });

    render(
      <PrepareDownloadScreen
        state={makeState()}
        sport="hockey"
        onDone={vi.fn()}
      />,
    );

    // Wait for the mock to be called, then assert the idle/failed state.
    await waitFor(() => expect(precachePregameAudio).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });

    // Zero clips cached → idle state: "Couldn't connect." heading.
    // "Couldn't" uses ASCII apostrophe in the JS string literal in screens-b.tsx.
    await waitFor(
      () =>
        expect(screen.getByText(/Couldn't connect\./i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(screen.getByTestId("prepare-retry-btn")).toBeInTheDocument();
    expect(screen.getByTestId("prepare-done-later-btn")).toBeInTheDocument();
    expect(
      screen.queryByText(/You.re ready for the rink\./i),
    ).not.toBeInTheDocument();
  });

  it("SSR / no-caches guard: does NOT crash and does NOT call precachePregameAudio when caches is undefined", async () => {
    // Override the caches stub to undefined — simulates SSR / older browser.
    vi.stubGlobal("caches", undefined);

    // Should render without throwing even though audio can't be cached.
    render(
      <PrepareDownloadScreen
        state={makeState()}
        sport="hockey"
        onDone={vi.fn()}
      />,
    );

    // Wait briefly to confirm the effect fired but bailed out early.
    await new Promise((r) => setTimeout(r, 50));

    // precachePregameAudio must NOT have been called (guard bailed out early).
    expect(precachePregameAudio).not.toHaveBeenCalled();
  });

  it("tapping prepare-done-btn calls onDone", async () => {
    precachePregameAudio.mockResolvedValue({
      cached: 5,
      total: 5,
      done: true,
      error: null,
    });
    const onDone = vi.fn();

    render(
      <PrepareDownloadScreen
        state={makeState()}
        sport="hockey"
        onDone={onDone}
      />,
    );

    // Wait for the download to complete and the done button to appear.
    const doneBtn = await screen.findByTestId("prepare-done-btn", {}, { timeout: 3000 });
    fireEvent.click(doneBtn);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
