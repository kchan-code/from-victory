/**
 * @vitest-environment jsdom
 */
// FV-514 — homepage IA restructure: section order, CTA cadence, beta proof.
// FV-534 added the Visualization section (the audio-guided differentiator)
// between PregameSample and Method — 9 sections now.
//
// Coverage:
//   1. Exactly 9 sections render, in order (FV-514 §4 order with the
//      FV-534 Visualization section inserted third), by heading text.
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

// Expected heading sequence (1 h1 + 9 h2s; Faq + Waitlist are two
// components but one final section per the audit).
const EXPECTED_HEADINGS: RegExp[] = [
  /Visualize and compete/i, // 1. Hero (h1)
  /Hear a pregame session/i, // 2. PregameSample
  /Picture the play\. Prepare for pressure\./i, // 3. Visualization (FV-539: KC headline triple)
  /Rehearse it\. Reset from it\. Leave it with God\./i, // 4. Method (FV-538: pregame method)
  /Built for the moments athletes actually face\./i, // 5. AppPreview
  /What you see, and what stays private\./i, // 6. ParentTrust
  /14 days free\. Cancel anytime\./i, // 7. PricingSummary
  /Built by a hockey dad/i, // 8. Founder (+ beta proof)
  /Questions parents ask\./i, // 9a. Faq
  /Start training from secure identity\./i, // 9b. Waitlist
];

describe("Homepage — section order (FV-514 + FV-534)", () => {
  it("renders exactly one h1 and 9 h2s, in order", () => {
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

describe("Homepage — Visualization section copy pins (FV-539)", () => {
  it("renders KC's three block headings", () => {
    const { container } = render(<LandingPage />);
    const text = container.textContent ?? "";
    for (const heading of [
      "See your game, not a highlight reel.",
      "Practice the response.",
      "Remember what does not change.",
    ]) {
      expect(text).toContain(heading);
    }
  });

  it("makes no banned outcome or clinical claims in the section", () => {
    const { container } = render(<LandingPage />);
    const text = (container.textContent ?? "").toLowerCase();
    for (const banned of [
      "proven",
      "clinically",
      "science-backed",
      "guaranteed",
      "anxiety",
      "stress relief",
      "manifest",
    ]) {
      expect(text).not.toContain(banned);
    }
  });

  it("carries exactly one link — the article pointer, not a conversion CTA (FV-539)", () => {
    const { container } = render(<LandingPage />);
    const section = container.querySelector("#visualization");
    expect(section).not.toBeNull();
    const links = section!.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0]!.getAttribute("href")).toBe(
      "/resources/does-visualization-work-for-athletes",
    );
  });
});

describe("Homepage — Method pregame-method pins (FV-539)", () => {
  it("the lede names the phase count and length, and never implies audible daily training", () => {
    const { container } = render(<LandingPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("Three phases. About five minutes.");
    // Drift guard: daily training is text-only (FV-135). No copy may
    // reattach "hear" to an unnamed object the reader could bind to it.
    expect(text).not.toMatch(/you hear it\b/i);
  });

  it("renders the three pregame-method phases in order (FV-539: KC copy)", () => {
    const { container } = render(<LandingPage />);
    const text = container.textContent ?? "";
    const steps = [
      "Choose it. Hear it.",
      "Practice the way back.",
      "Leave it with God.",
    ];
    // Search forward from the previous step so the H2 (which ends with
    // the same "Leave it with God." phrase) can't satisfy step 3 early.
    let cursor = -1;
    for (const step of steps) {
      const at = text.indexOf(step, cursor + 1);
      expect(at, `missing step in order: ${step}`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it("the release phase describes the real session close and no outcome promise", () => {
    const { container } = render(<LandingPage />);
    const text = container.textContent ?? "";
    // The shipped session genuinely ends in a spoken prayer
    // (components/pregame/audio/segments.ts PRAYER_SEGMENTS) — the copy
    // may say so, and must keep the release framing rather than
    // pray-to-win.
    expect(text).toContain("Close in prayer.");
    expect(text).toContain("release the result you cannot control");
    expect(text.toLowerCase()).not.toContain("pray to win");
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
