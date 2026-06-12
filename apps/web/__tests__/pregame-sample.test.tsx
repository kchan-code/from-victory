/**
 * @vitest-environment jsdom
 */
// FV-235 — landing audio sample (PregameSample).
//
// Pins the PR #199 review findings:
//   1. SAMPLE_SRC must exist on disk — a clip regen re-hashes the filename
//      and would otherwise silently 404 the play button on prod.
//   2. Renders with the Play label; tap toggles to Pause and back (the
//      double-tap rAF orphan is guarded by tick()'s paused check + the
//      pendingPlay ref — exercised via rapid toggles not throwing).
//   3. No audio element (and no network) before the first tap.
//   4. Scrubbing before first play is a safe no-op.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

import {
  PregameSample,
  SAMPLE_SRC,
  SAMPLE_DURATION_SEC,
} from "@/components/landing/PregameSample";

let playSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // jsdom ships neither matchMedia nor IntersectionObserver; the Reveal
  // wrapper uses both. Minimal stubs.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  class IntersectionObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserverStub,
  });

  playSpy = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PregameSample — sample asset integrity", () => {
  it("SAMPLE_SRC exists on disk (regen guard: a re-hashed clip must fail CI, not 404 prod)", () => {
    const publicDir = join(__dirname, "..", "public");
    expect(existsSync(join(publicDir, SAMPLE_SRC))).toBe(true);
  });

  it("SAMPLE_DURATION_SEC is in the issue's 30–60s window", () => {
    expect(SAMPLE_DURATION_SEC).toBeGreaterThanOrEqual(30);
    expect(SAMPLE_DURATION_SEC).toBeLessThanOrEqual(60);
  });
});

describe("PregameSample — player behavior", () => {
  it("renders with the Play label and the derived duration placeholder", () => {
    render(<PregameSample />);
    expect(
      screen.getByRole("button", { name: /play pregame session sample/i }),
    ).toBeDefined();
    expect(
      screen.getByText(`~${Math.round(SAMPLE_DURATION_SEC)} seconds`),
    ).toBeDefined();
  });

  it("does not create the audio element before first tap (lazy wiring)", () => {
    render(<PregameSample />);
    expect(playSpy).not.toHaveBeenCalled();
  });

  it("tap toggles Play → Pause → Play without errors (rapid-toggle safe)", async () => {
    render(<PregameSample />);
    const btn = screen.getByTestId("pregame-sample-play-btn");

    await act(async () => {
      fireEvent.click(btn);
    });
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(btn.getAttribute("aria-label")).toMatch(/pause/i);

    await act(async () => {
      fireEvent.click(btn); // pause
      fireEvent.click(btn); // play again — second loop must not orphan
      fireEvent.click(btn); // pause again
    });
    expect(btn.getAttribute("aria-label")).toMatch(/play/i);
  });

  it("scrubbing before first play is a silent no-op", () => {
    render(<PregameSample />);
    const range = screen.getByTestId("pregame-sample-progress");
    expect(() => {
      fireEvent.change(range, { target: { value: "500" } });
    }).not.toThrow();
    // No audio exists, so progress must remain at 0.
    expect((range as HTMLInputElement).value).toBe("0");
  });

  it("announces play state via the status region (not the visible countdown)", async () => {
    render(<PregameSample />);
    const btn = screen.getByTestId("pregame-sample-play-btn");
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(screen.getByRole("status").textContent).toMatch(/playing/i);
  });
});
