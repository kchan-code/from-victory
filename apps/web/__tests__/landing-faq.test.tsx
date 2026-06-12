/**
 * @vitest-environment jsdom
 */
// FV-236 — FAQ + Founder + Testimonials on the home page.
//
// Coverage:
//   1. All 7 questions render in the FAQ section.
//   2. Answers match the source copy (spot-pin 3 verbatim sentences).
//   3. JSON-LD parses and its questions array length === the rendered list.
//   4. Testimonials renders nothing while the array is empty.
//   5. No "kid" in the section copy (founder's "my own kids" line is
//      allowed — it's the founder speaking about his family, not product copy).

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { Faq, FAQ_ITEMS, FAQ_JSON_LD } from "@/components/landing/Faq";
import { Founder } from "@/components/landing/Founder";
import { Testimonials, TESTIMONIALS } from "@/components/landing/Testimonials";

// jsdom doesn't implement matchMedia — stub it so Reveal.tsx can mount.
// Reveal reads it only to check prefers-reduced-motion; returning false here
// is equivalent to "no preference" and causes Reveal to add "in" immediately.
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

// ── 1. All 7 questions render ────────────────────────────────────────────────

describe("Faq — all 7 questions render", () => {
  it("renders exactly 7 <summary> elements (one per FAQ entry)", () => {
    const { container } = render(<Faq />);
    const summaries = container.querySelectorAll("summary");
    expect(summaries).toHaveLength(FAQ_ITEMS.length);
    expect(summaries).toHaveLength(7);
  });

  it("renders every question text in the DOM", () => {
    const { container } = render(<Faq />);
    const summaryTexts = Array.from(container.querySelectorAll("summary span")).map(
      (el) => el.textContent ?? "",
    );
    for (const item of FAQ_ITEMS) {
      expect(summaryTexts).toContain(item.q);
    }
  });
});

// ── 2. Answers match the source copy (verbatim spot-pins) ───────────────────

describe("Faq — verbatim answer spot-pins", () => {
  it("privacy answer contains the authoritative privacy sentence verbatim", () => {
    render(<Faq />);
    // Use getAllByText with regex to avoid issues with multiple matches
    const els = screen.getAllByText(
      /It never shows what they selected or worked through inside a session\./,
    );
    expect(els.length).toBeGreaterThan(0);
  });

  it("therapy answer contains the not-therapy sentence verbatim", () => {
    render(<Faq />);
    const els = screen.getAllByText(
      /From Victory is mental-toughness and mindset training, not therapy, treatment, or clinical care\./,
    );
    expect(els.length).toBeGreaterThan(0);
  });

  it("screen-time answer contains the anti-scroll sentence verbatim", () => {
    render(<Faq />);
    const els = screen.getAllByText(
      /From Victory is built to be picked up, used, and put down/,
    );
    expect(els.length).toBeGreaterThan(0);
  });

  it("pricing answer (Q6) contains the sibling-discount sentence verbatim (FV-283)", () => {
    render(<Faq />);
    // Curator-final copy: first-athlete + additional-athlete pricing line.
    const els = screen.getAllByText(
      /\$5 a month, or \$49 a year for your first athlete — and \$3 a month, or \$29 a year, for each additional athlete in your household\./,
    );
    expect(els.length).toBeGreaterThan(0);
  });

  it("pricing answer (Q6) contains the household-generosity sentence verbatim (FV-283)", () => {
    render(<Faq />);
    // The FAQ copy uses a curly apostrophe (U+2019) in "that's"; match with a
    // character class that accepts both straight and curly apostrophes.
    const els = screen.getAllByText(
      /A household with more athletes pays less per athlete: that['’]s by design, because the same training serves your whole family\./,
    );
    expect(els.length).toBeGreaterThan(0);
  });
});

// ── 3. JSON-LD parses and its questions array length === rendered list ───────

describe("Faq — FAQ_JSON_LD structured data", () => {
  it("FAQ_JSON_LD.mainEntity has the same length as FAQ_ITEMS", () => {
    expect(FAQ_JSON_LD.mainEntity).toHaveLength(FAQ_ITEMS.length);
    expect(FAQ_JSON_LD.mainEntity).toHaveLength(7);
  });

  it("FAQ_JSON_LD is valid JSON (stringify/parse round-trip)", () => {
    const raw = JSON.stringify(FAQ_JSON_LD);
    const parsed = JSON.parse(raw) as typeof FAQ_JSON_LD;
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(7);
  });

  it("each mainEntity entry has a name matching the corresponding FAQ_ITEMS question", () => {
    for (let i = 0; i < FAQ_ITEMS.length; i++) {
      const entry = FAQ_JSON_LD.mainEntity[i];
      expect(entry).toBeDefined();
      expect(entry!.name).toBe(FAQ_ITEMS[i]!.q);
    }
  });

  it("FAQ_JSON_LD @context is schema.org", () => {
    expect(FAQ_JSON_LD["@context"]).toBe("https://schema.org");
  });

  it("the script tag is injected into the rendered section", () => {
    const { container } = render(<Faq />);
    const scriptEl = container.querySelector('script[type="application/ld+json"]');
    expect(scriptEl).not.toBeNull();
    const parsed = JSON.parse(scriptEl!.textContent ?? "{}") as {
      "@type": string;
      mainEntity: unknown[];
    };
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(7);
  });
});

// ── 4. Testimonials renders nothing while the array is empty ────────────────

describe("Testimonials — empty array renders null", () => {
  it("TESTIMONIALS is currently empty (no fabricated quotes)", () => {
    expect(TESTIMONIALS).toHaveLength(0);
  });

  it("renders nothing to the DOM when TESTIMONIALS is empty", () => {
    const { container } = render(<Testimonials />);
    expect(container.firstChild).toBeNull();
  });
});

// ── 5. No "kid" in the section copy (founder's "my own kids" is allowed) ────
//
// Scan rule: the word "kid" must not appear in athlete-facing product copy.
// The founder block uses the word in a personal family context
// ("for my own kids") which is exempt per the brief.
// We test the raw FAQ_ITEMS and FAQ_JSON_LD (the product copy) for the banned
// word, and test the Founder rendered output to confirm the "my own kids"
// personal usage does NOT trigger a false positive.

describe("Audience language — no banned 'kid' in product copy", () => {
  it("none of the FAQ questions contain 'kid' as a product-copy term", () => {
    // We allow the substring only if it is the founder's personal phrase:
    // "my own kids". Product-copy usage of "kid"/"kids"/"kiddo" is banned.
    const KID_PRODUCT_RE = /\bkid(?:do|s)?\b/i;
    const FOUNDER_EXCEPTION = /my own kids/i;
    for (const item of FAQ_ITEMS) {
      const combined = `${item.q} ${item.a}`;
      if (KID_PRODUCT_RE.test(combined)) {
        // If the match is present, it MUST be covered by the founder exception.
        // FAQ copy never mentions the founder's personal story, so any match here
        // is a genuine violation.
        expect(FOUNDER_EXCEPTION.test(combined)).toBe(true);
      }
    }
  });

  it("Founder component renders without throwing and contains the expected personal phrase", () => {
    // The founder block contains "my own kids" — this is the founder speaking
    // about his family; it is explicitly allowed per the brief.
    render(<Founder />);
    expect(screen.getByText(/my own kids/i)).toBeInTheDocument();
  });

  it("Founder component renders the canonical tagline verbatim", () => {
    render(<Founder />);
    expect(
      screen.getByText(/Your Identity Is Secure\. Compete From Victory\./i),
    ).toBeInTheDocument();
  });
});
