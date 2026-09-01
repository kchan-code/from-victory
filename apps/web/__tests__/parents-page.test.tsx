/**
 * @vitest-environment jsdom
 */
// FV-550 — the /parents conversion refresh, pinned.
//
// Coverage:
//   1. The recut hero (parent door): locked H1 pair, five-element pregame
//      lede; the dead framings stay dead.
//   2. Pregame is described by the approved five elements everywhere.
//   3. Privacy callout discloses the full collected set (incl. the FV-320
//      self-chosen username).
//   4. Canonical tagline appears exactly once, verbatim.
//   5. Access: 13-17 under the parent account; 18+ self-serve trial line.
//   6. Cross-links: /athletes (verbatim H1 label) + the two parent-audience
//      articles under "Read it here. They train it in the app."
//   7. Claim discipline: no population claims, no outcome-promise "builds",
//      one privacy line, no customer-facing em dashes, athlete closer stays
//      on /athletes.

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("@/components/landing/ScrollNav", () => ({ ScrollNav: () => null }));
vi.mock("@/components/landing/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/marketing/AttributionCapture", () => ({
  AttributionCapture: () => null,
}));
vi.mock("@/components/landing/icons", () => ({
  LandingIconDefs: () => null,
}));

import ParentsPage from "@/app/parents/page";
import { ATHLETES_H1, ATHLETES_HREF } from "@/lib/gtm/page-titles";

beforeEach(() => {
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

describe("/parents — recut hero (FV-550)", () => {
  it("renders the parent-door H1 and the five-element pregame lede", () => {
    const { container } = render(<ParentsPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("Daily training is the foundation.");
    expect(text).toContain("calls it up.");
    expect(text).toContain(
      "breath, visualization, identity\n              in Christ, a focus cue, and prayer".replace(/\s+/g, " "),
    );
  });

  it("the dead framings stay dead", () => {
    const { container } = render(<ParentsPage />);
    const text = container.textContent ?? "";
    for (const dead of [
      "You invest in their body",
      "foundation beneath it",
      "first shot, first possession, first tee",
      "See the first shift on the ice",
      "Serious athletes go deeper",
      "locker room",
      "a plan for the hard moment, and a send-off",
    ]) {
      expect(text, `dead copy still present: ${dead}`).not.toContain(dead);
    }
    // Outcome-promise phrasing is out: no "builds identity" / "builds
    // discipline"; training language only.
    expect(text).not.toMatch(/builds (identity|discipline|resilience)/i);
  });
});

describe("/parents — privacy disclosures (FV-550)", () => {
  it("discloses the full collected set including the self-chosen username", () => {
    const { container } = render(<ParentsPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("first name, birthdate, and a");
    expect(text).toContain("self-chosen username");
    expect(text).toContain("No email");
    expect(text).toContain("not a mental");
  });

  it('carries exactly one "Privacy is a feature" line', () => {
    const { container } = render(<ParentsPage />);
    const text = container.textContent ?? "";
    expect(text.split("Privacy is a feature").length - 1).toBe(1);
    expect(text).toContain("Privacy is a feature, not a loophole.");
  });
});

describe("/parents — tagline and access (FV-550)", () => {
  it("renders the canonical tagline exactly once, verbatim", () => {
    const { container } = render(<ParentsPage />);
    const text = container.textContent ?? "";
    const TAGLINE = "Your Identity Is Secure. Compete From Victory.";
    expect(text.split(TAGLINE).length - 1).toBe(1);
  });

  it("states both access paths: 13-17 under the parent account, 18+ self-serve", () => {
    const { container } = render(<ParentsPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("Athletes 13-17 train under your account");
    expect(text).toContain(
      "athletes 18+ can start their own 14-day trial, $5/mo or $49/yr",
    );
  });
});

describe('/parents — "Read it here. They train it in the app." links (FV-550)', () => {
  it("renders the locked distinction heading", () => {
    const { container } = render(<ParentsPage />);
    expect(container.textContent ?? "").toContain(
      "Read it here. They train it in the app.",
    );
  });

  it("links the athlete page with its verbatim H1 label", () => {
    const { container } = render(<ParentsPage />);
    const link = container.querySelector(`a[href="${ATHLETES_HREF}"]`);
    expect(link).not.toBeNull();
    expect(link!.textContent).toContain(ATHLETES_H1);
  });

  it("links the two parent-audience articles by exact slug", () => {
    const { container } = render(<ParentsPage />);
    for (const href of [
      "/resources/when-your-athlete-gets-cut-a-parents-guide",
      "/resources/sports-psychology-and-faith-do-they-mix",
    ]) {
      expect(
        container.querySelector(`a[href="${href}"]`),
        `missing link ${href}`,
      ).not.toBeNull();
    }
  });
});

describe("/parents — voice scans (FV-550)", () => {
  it("contains no customer-facing em dashes", () => {
    const { container } = render(<ParentsPage />);
    expect(container.textContent ?? "").not.toContain("—");
  });

  it("hockey appears only inside labeled sport lists, never as the default", () => {
    const { container } = render(<ParentsPage />);
    const text = container.textContent ?? "";
    // Every hockey mention on this page sits in the seven-sport list.
    const occurrences = text.split(/hockey/i).length - 1;
    const listed = text.split(
      /hockey, basketball, golf, football, baseball, lacrosse/i,
    ).length - 1;
    expect(occurrences).toBe(listed);
  });

  it("the athlete closer stays on /athletes", () => {
    const { container } = render(<ParentsPage />);
    expect(container.textContent ?? "").not.toContain(
      "Play hard, fearless, and free.",
    );
    // And the athlete H1 appears only as the cross-link label, not as a
    // heading on this page.
    const h1 = container.querySelector("h1");
    expect(h1!.textContent).not.toContain("The mental game, moment by moment.");
  });

  it('contains no "kid"-class words', () => {
    const { container } = render(<ParentsPage />);
    expect(container.textContent ?? "").not.toMatch(/\bkids?\b|kiddo|youngster/i);
  });
});
