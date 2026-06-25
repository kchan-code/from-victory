/**
 * @vitest-environment jsdom
 */
// FV-324 — /about page guards: exactly one <h1>, the canonical phrases present
// verbatim, both scripture references anchored, and the founder-voice
// "my own kids" exception (no other banned audience-language terms).
// Mirrors the pattern in landing-faq.test.tsx.

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Shared page chrome — not part of /about's own content. Mock so the test
// renders only the page's sections and avoids ScrollNav/Footer browser deps.
vi.mock("@/components/landing/ScrollNav", () => ({ ScrollNav: () => null }));
vi.mock("@/components/landing/Footer", () => ({ Footer: () => null }));

import AboutPage from "@/app/about/page";

// jsdom doesn't implement matchMedia — stub it so Reveal.tsx can mount.
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

describe("AboutPage — structure + brand-critical copy", () => {
  it("renders exactly one <h1> (the hero)", () => {
    const { container } = render(<AboutPage />);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent).toMatch(/Why From Victory\?/);
  });

  it("includes the canonical tagline and internal anchor verbatim", () => {
    const { container } = render(<AboutPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("Your Identity Is Secure. Compete From Victory.");
    expect(text).toContain(
      "Rooted in the Word. Fueled by the Spirit. Built for Victory.",
    );
  });

  it("anchors both scripture references", () => {
    const { container } = render(<AboutPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("1 Corinthians 15:57");
    // en-dash in "12:1–2" — substring stops before it to stay robust.
    expect(text).toContain("Hebrews 12:1");
  });
});

describe("AboutPage — audience language", () => {
  it("allows the founder's 'my own kids' but no other banned terms", () => {
    const { container } = render(<AboutPage />);
    const text = container.textContent ?? "";
    // Founder testimony exception (per CLAUDE.md + landing-faq.test.tsx).
    expect(text).toContain("my own kids");
    // No other banned audience-language terms anywhere on the page.
    expect(/kiddo|youngster|young person/i.test(text)).toBe(false);
    // The only "kid" usage is the founder's "my own kids".
    const withoutFounder = text.replace(/my own kids/gi, "");
    expect(/\bkid/i.test(withoutFounder)).toBe(false);
  });
});
