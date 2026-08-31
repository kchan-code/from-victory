/**
 * @vitest-environment jsdom
 */
// FV-514 — homepage IA restructure: 8-section order, CTA cadence, beta proof.
//
// Coverage:
//   1. Exactly 8 sections render, in the audit's §4 target order (by
//      heading text, in document order).
//   2. The Hebrews 12:1-2 spine verse appears exactly once on the page.
//   3. The beta-athlete quote renders, labeled as beta feedback, with the
//      non-identifying "Beta hockey athlete" attribution.
//   4. The parent-trust and pricing-summary headings render verbatim.
//   5. Exactly 4 conversion CTAs point to /signup (hero, after-sample,
//      after-preview, final/Waitlist) — the audit's CTA cadence.
//   6. Testimonials is no longer imported/rendered on the homepage.
//
// Page chrome (ScrollNav, Footer, StructuredData, AttributionCapture,
// LandingIconDefs) is mocked, mirroring marketing-a11y-foundation.test.tsx —
// this test is about page.tsx's section order and copy, not chrome.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/components/landing/ScrollNav", () => ({ ScrollNav: () => null }));
vi.mock("@/components/landing/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/landing/StructuredData", () => ({
  StructuredData: () => null,
}));
vi.mock("@/components/marketing/AttributionCapture", () => ({
  AttributionCapture: () => null,
}));
vi.mock("@/components/landing/icons", () => ({
  LandingIconDefs: () => null,
}));
// WaitlistForm pulls in a "use server" action module (lib/actions/waitlist)
// that transitively imports the `server-only` package, which throws when
// imported outside Next's RSC boundary. Waitlist.tsx's own heading + CTA
// link (what this test asserts) live outside WaitlistForm, so mocking just
// the form sub-component keeps those intact.
vi.mock("@/components/landing/WaitlistForm", () => ({
  WaitlistForm: () => null,
}));
// FV-515: Hero now reads isAdultSignupEnabled() (lib/flags.ts), which itself
// imports the `server-only` marker package — same transitive-throw issue as
// WaitlistForm above (server-only throws unconditionally outside Next's RSC
// bundler). Neutralize the marker package only (matches the existing pattern
// in __tests__/actions/auth-adult.test.ts) so the real lib/flags.ts still
// reads ENABLE_ADULT_SIGNUP — unset in this suite, so isAdultSignupEnabled()
// is false and Hero renders its unmodified, flag-off markup.
vi.mock("server-only", () => ({}));

import LandingPage from "@/app/page";

beforeEach(() => {
  // jsdom ships neither matchMedia nor IntersectionObserver — Reveal (every
  // section) and AppPreview's active-slide tracking use both. PregameSample
  // creates an HTMLAudioElement lazily on tap only, so play()/pause() aren't
  // exercised by a render-only test, but stubbing matchMedia is required for
  // every Reveal-wrapped section to mount without throwing.
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
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Expected heading sequence (1 h1 + 8 h2s across the 8 audit §4 sections;
// Faq + Waitlist are two components but one "section 8" per the audit).
const EXPECTED_HEADINGS: RegExp[] = [
  /Visualize and compete/i, // 1. Hero (h1)
  /Hear a pregame session/i, // 2. PregameSample
  /A daily rhythm for the athlete.s mind and spirit\./i, // 3. Method
  /Built for the moments athletes actually face\./i, // 4. AppPreview
  /What you see, and what stays private\./i, // 5. ParentTrust
  /14 days free\. Cancel anytime\./i, // 6. PricingSummary
  /Built by a hockey dad/i, // 7. Founder (+ beta proof)
  /Questions parents ask\./i, // 8a. Faq
  /Start training from secure identity\./i, // 8b. Waitlist
];

describe("Homepage — 8-section order (FV-514)", () => {
  it("renders exactly one h1 and 8 h2s, in the audit's §4 order", () => {
    const { container } = render(<LandingPage />);
    const headings = Array.from(container.querySelectorAll("h1, h2"));
    expect(headings).toHaveLength(EXPECTED_HEADINGS.length);
    headings.forEach((h, i) => {
      expect(h.textContent ?? "").toMatch(EXPECTED_HEADINGS[i]!);
    });
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});

describe("Homepage — one Hebrews 12:1-2 quote (FV-514)", () => {
  it("the spine verse quote appears exactly once on the page", () => {
    const { container } = render(<LandingPage />);
    const text = container.textContent ?? "";
    const QUOTE =
      "Let us run with perseverance the race marked out for us, fixing our eyes on Jesus.";
    const matches = text.split(QUOTE).length - 1;
    expect(matches).toBe(1);
  });
});

describe("Homepage — beta feedback quote (FV-514)", () => {
  it("renders the approved beta quote, labeled as beta feedback, with non-identifying attribution", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(
        /helped me picture my first shift and gave me one thing to focus on/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Beta hockey athlete")).toBeInTheDocument();
    expect(screen.getByText(/beta feedback/i)).toBeInTheDocument();
  });

  it("does not frame the beta quote with a performance-outcome claim", () => {
    const { container } = render(<LandingPage />);
    const text = (container.textContent ?? "").toLowerCase();
    for (const banned of ["won the game", "scored", "champion", "undefeated"]) {
      expect(text).not.toContain(banned);
    }
  });
});

describe("Homepage — parent-trust and pricing-summary headings (FV-514)", () => {
  it("renders the parent-trust heading verbatim", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        name: "What you see, and what stays private.",
      }),
    ).toBeInTheDocument();
  });

  it("renders the pricing-summary heading verbatim", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: "14 days free. Cancel anytime." }),
    ).toBeInTheDocument();
  });
});

describe("Homepage — CTA cadence: 4 conversion CTAs to /signup (FV-514)", () => {
  it("has exactly 4 links to /signup: hero, after-sample, after-preview, final", () => {
    const { container } = render(<LandingPage />);
    const signupLinks = container.querySelectorAll('a[href="/signup"]');
    expect(signupLinks).toHaveLength(4);
    signupLinks.forEach((link) => {
      expect(link.textContent ?? "").toMatch(
        /start your athlete.s 14-day free trial/i,
      );
    });
  });
});

describe("Homepage — Testimonials no longer rendered (FV-514)", () => {
  it("app/page.tsx does not import the Testimonials component", () => {
    const page = readFileSync(resolve(__dirname, "../app/page.tsx"), "utf8");
    expect(page).not.toContain("Testimonials");
  });

  it("app/page.tsx no longer imports the retired Problem/Framework/HowItWorks/Faith sections", () => {
    const page = readFileSync(resolve(__dirname, "../app/page.tsx"), "utf8");
    expect(page).not.toMatch(/from "@\/components\/landing\/Problem"/);
    expect(page).not.toMatch(/from "@\/components\/landing\/Framework"/);
    expect(page).not.toMatch(/from "@\/components\/landing\/HowItWorks"/);
    expect(page).not.toMatch(/from "@\/components\/landing\/Faith"/);
  });
});
