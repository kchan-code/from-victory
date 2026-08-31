/**
 * @vitest-environment jsdom
 */
// FV-511 — marketing a11y foundation: landmarks, skip link, entrance-
// animation fix.
//
// Coverage:
//   1. The homepage renders a `<main id="main-content">` landmark (ScrollNav
//      and Footer stay outside it — mocked here as page chrome, per the
//      about-page.test.tsx pattern, so this test stays focused on page.tsx's
//      own structure + the real Hero output).
//   2. Exactly one <h1> renders on the homepage (the hero).
//   3. The hero copy and mockups are NOT wrapped in a `.fv-reveal` element —
//      the hero must render fully visible in SSR HTML with or without JS.
//   4. app/layout.tsx defines a skip link (href="#main-content") as the
//      first focusable element in <body>, before {children} — verified at
//      the source level (mirrors the seo-geo-pass.test.ts file-read pattern;
//      RTL can't render a second <html>/<body> inside jsdom's document).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { vi } from "vitest";

// Shared page chrome + below-fold sections — not under test here. Mocking
// keeps this test focused on page.tsx's <main> wrapper and the real Hero
// output, and avoids pulling in unrelated browser-API surface (audio
// players, carousels, form actions) that already have their own coverage.
vi.mock("@/components/landing/ScrollNav", () => ({ ScrollNav: () => null }));
vi.mock("@/components/landing/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/landing/PregameSample", () => ({
  PregameSample: () => null,
}));
vi.mock("@/components/landing/Problem", () => ({ Problem: () => null }));
vi.mock("@/components/landing/Framework", () => ({ Framework: () => null }));
vi.mock("@/components/landing/HowItWorks", () => ({ HowItWorks: () => null }));
vi.mock("@/components/landing/AppPreview", () => ({ AppPreview: () => null }));
vi.mock("@/components/landing/Faith", () => ({ Faith: () => null }));
vi.mock("@/components/landing/Testimonials", () => ({
  Testimonials: () => null,
}));
vi.mock("@/components/landing/Founder", () => ({ Founder: () => null }));
vi.mock("@/components/landing/Faq", () => ({ Faq: () => null }));
vi.mock("@/components/landing/Waitlist", () => ({ Waitlist: () => null }));
vi.mock("@/components/landing/StructuredData", () => ({
  StructuredData: () => null,
}));
vi.mock("@/components/marketing/AttributionCapture", () => ({
  AttributionCapture: () => null,
}));
vi.mock("@/components/landing/icons", () => ({
  LandingIconDefs: () => null,
}));

import LandingPage from "@/app/page";

// jsdom doesn't implement matchMedia — stub it so Reveal.tsx can mount
// (unused sections are mocked out above, but this keeps the stub available
// for any Reveal-wrapped content still in the tree).
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

afterEach(() => cleanup());

describe("Homepage — <main> landmark + single h1", () => {
  it("renders a <main id=\"main-content\"> landmark wrapping the content sections", () => {
    const { container } = render(<LandingPage />);
    const mains = container.querySelectorAll("main");
    expect(mains).toHaveLength(1);
    expect(mains[0]?.id).toBe("main-content");
  });

  it("renders exactly one <h1> (the hero), and it lives inside <main>", () => {
    const { container } = render(<LandingPage />);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    const main = container.querySelector("main#main-content");
    expect(main).not.toBeNull();
    expect(main?.contains(h1s[0]!)).toBe(true);
  });
});

describe("Hero — renders visible in SSR HTML, no Reveal wrapper", () => {
  it("the hero copy column and h1 are not inside a .fv-reveal element", () => {
    const { container } = render(<LandingPage />);
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.closest(".fv-reveal")).toBeNull();
  });

  it("has zero .fv-reveal elements on the page (Hero no longer uses Reveal; all other sections are mocked in this test)", () => {
    const { container } = render(<LandingPage />);
    expect(container.querySelectorAll(".fv-reveal")).toHaveLength(0);
  });
});

describe("app/layout.tsx — skip link (source-level, mirrors seo-geo-pass.test.ts)", () => {
  const layout = readFileSync(resolve(__dirname, "../app/layout.tsx"), "utf8");

  it("defines a skip link targeting #main-content", () => {
    expect(layout).toContain('href="#main-content"');
    expect(layout).toMatch(/Skip to main content/i);
  });

  it("hides the skip link until keyboard-focused (sr-only pattern) and uses the cobalt token when visible", () => {
    expect(layout).toMatch(/sr-only[^"]*focus:not-sr-only/);
    expect(layout).toMatch(/focus:bg-cobalt/);
  });

  it("renders the skip link before {children} — first focusable element in <body>", () => {
    const skipLinkIndex = layout.indexOf('href="#main-content"');
    const childrenIndex = layout.indexOf("{children}");
    expect(skipLinkIndex).toBeGreaterThan(-1);
    expect(childrenIndex).toBeGreaterThan(-1);
    expect(skipLinkIndex).toBeLessThan(childrenIndex);
  });
});

describe("Skip-link target exists on every route's <main> (source-level)", () => {
  // FV-511 qa-reviewer finding: the skip link is a dead anchor on any route
  // whose <main> lacks the id. Pin the contract for the marketing pages that
  // ship their own <main> and for the shared AuthShell (10 auth routes).
  const routes = [
    "../app/about/page.tsx",
    "../app/parents/page.tsx",
    "../app/pricing/page.tsx",
    "../app/teams/page.tsx",
    "../app/contact/page.tsx",
    "../app/resources/page.tsx",
    "../components/auth/AuthShell.tsx",
  ];
  for (const rel of routes) {
    it(`${rel} carries id="main-content" on its <main>`, () => {
      const src = readFileSync(resolve(__dirname, rel), "utf8");
      expect(src).toMatch(/<main id="main-content"/);
    });
  }
});
