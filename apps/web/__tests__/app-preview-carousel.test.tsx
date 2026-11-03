/**
 * @vitest-environment jsdom
 */
// FV-513 — accessible product-preview carousel (real app screenshots).
//
// Coverage:
//   1. Renders exactly 5 slides, each with the real screenshot src + the
//      catalog alt text (no fake hand-built UI).
//   2. Prev/next buttons are present, sized >=44px, keyboard accessible
//      (native <button>), and clicking them updates the "N of 5" progress.
//   3. Progress reads "1 of 5" initially and carries aria-live="polite".
//   4. The carousel container has role="group" + aria-roledescription
//      "carousel" + an accessible name (aria-label).
//   5. Each slide carries role="group" + aria-roledescription="slide" +
//      an "N of 5: <label>" aria-label.
//   6. No fake-UI strings ("9:41", "Complete Day 8", "Hi Jordan.") appear
//      as rendered text in the accessibility tree — those only exist as
//      pixels inside the screenshots now.

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

import { AppPreview } from "@/components/landing/AppPreview";

beforeEach(() => {
  // jsdom ships neither matchMedia nor IntersectionObserver — Reveal and the
  // carousel's active-slide tracking use both. Minimal stubs (mirrors
  // pregame-sample.test.tsx).
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
  // jsdom doesn't implement scrollIntoView — the component guards this with
  // optional chaining, but stub it too so we can assert it was invoked.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const EXPECTED_SLIDES = [
  { src: "/images/screens/screen-home-dashboard.png", label: "Home" },
  { src: "/images/screens/screen-pregame-intro.png", label: "Pre-Game Reset" },
  {
    src: "/images/screens/screen-pregame-positive-plays.png",
    label: "Positive Plays",
  },
  {
    src: "/images/screens/screen-pregame-guided-session.png",
    label: "Guided Session",
  },
  {
    src: "/images/screens/screen-pre-practice-lockin.png",
    label: "Pre-Practice Lock In",
  },
];

describe("AppPreview — 5 real-screenshot slides", () => {
  it("renders exactly 5 slides with the expected images and alt text", () => {
    const { container } = render(<AppPreview />);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(5);

    images.forEach((img, i) => {
      const expected = EXPECTED_SLIDES[i]!;
      // next/image rewrites src through /_next/image?url=<encoded>&w=&q=
      // rather than rendering the raw path, so assert the encoded original
      // path is present rather than an exact src match.
      expect(img.getAttribute("src") ?? "").toContain(
        encodeURIComponent(expected.src),
      );
      expect(img.getAttribute("alt")).toBeTruthy();
      expect(img.getAttribute("alt")).not.toBe("");
    });
  });

  it("labels each slide group with role=group, aria-roledescription=slide, and an N of 5 aria-label", () => {
    const { container } = render(<AppPreview />);
    const slides = container.querySelectorAll(
      '[aria-roledescription="slide"]',
    );
    expect(slides).toHaveLength(5);
    slides.forEach((slide, i) => {
      expect(slide.getAttribute("role")).toBe("group");
      expect(slide.getAttribute("aria-label")).toBe(
        `${i + 1} of 5: ${EXPECTED_SLIDES[i]!.label}`,
      );
    });
  });

  it("the carousel container has role=group, aria-roledescription=carousel, and an accessible name", () => {
    const { container } = render(<AppPreview />);
    const carousel = container.querySelector(
      '[aria-roledescription="carousel"]',
    );
    expect(carousel).not.toBeNull();
    expect(carousel?.getAttribute("role")).toBe("group");
    expect(carousel?.getAttribute("aria-label")).toBeTruthy();
  });
});

describe("AppPreview — controls + progress", () => {
  it("progress reads '1 of 5' initially and is aria-live=polite", () => {
    const { getByTestId } = render(<AppPreview />);
    const progress = getByTestId("app-preview-progress");
    expect(progress).toHaveAttribute("aria-live", "polite");
    expect(progress.textContent).toBe("1 of 5");
  });

  it("prev/next buttons are present, >=44px, and clicking next advances the progress readout", () => {
    const { getByTestId } = render(<AppPreview />);
    const prev = getByTestId("app-preview-prev");
    const next = getByTestId("app-preview-next");
    const progress = getByTestId("app-preview-progress");

    expect(prev.tagName).toBe("BUTTON");
    expect(next.tagName).toBe("BUTTON");
    expect(prev.className).toMatch(/w-11/);
    expect(prev.className).toMatch(/h-11/);
    expect(next.className).toMatch(/w-11/);
    expect(next.className).toMatch(/h-11/);

    // Disabled at the start (no color-only state — native `disabled`).
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(progress.textContent).toBe("2 of 5");
    expect(prev).not.toBeDisabled();

    fireEvent.click(prev);
    expect(progress.textContent).toBe("1 of 5");
    expect(prev).toBeDisabled();
  });

  it("next is disabled once the last slide is reached (clamped, not wrapping)", () => {
    const { getByTestId } = render(<AppPreview />);
    const next = getByTestId("app-preview-next");
    const progress = getByTestId("app-preview-progress");

    fireEvent.click(next);
    fireEvent.click(next);
    fireEvent.click(next);
    fireEvent.click(next);
    expect(progress.textContent).toBe("5 of 5");
    expect(next).toBeDisabled();

    // One more click is a no-op (clamped).
    fireEvent.click(next);
    expect(progress.textContent).toBe("5 of 5");
  });

  it("focus-visible ring uses the cobalt token, never gold, on the carousel controls (UI progress affordance, not brand mark)", () => {
    const { getByTestId } = render(<AppPreview />);
    expect(getByTestId("app-preview-prev").className).toMatch(
      /focus-visible:ring-cobalt/,
    );
    expect(getByTestId("app-preview-next").className).toMatch(
      /focus-visible:ring-cobalt/,
    );
  });
});

describe("AppPreview — no fake-UI text in the accessibility tree", () => {
  it("does not render '9:41', 'Complete Day 8', or 'Hi Jordan.' as text (screenshots may contain them as pixels only)", () => {
    const { container } = render(<AppPreview />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("9:41");
    expect(text).not.toContain("Complete Day 8");
    expect(text).not.toContain("Hi Jordan.");
  });
});
