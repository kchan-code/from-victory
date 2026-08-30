/**
 * @vitest-environment jsdom
 */
// FV-516 — Pricing page: one plan card with annual/monthly segmented control.
//
// Coverage:
//   1. Exactly one <h1> on the page.
//   2. Annual is the default selected billing interval (radiogroup a11y state).
//   3. Both interval prices ($49/yr and $5/mo) are visible on the segmented
//      control before any interaction — monthly is never hidden.
//   4. Toggling the control switches the displayed price and per-interval copy.
//   5. First-athlete and additional-athlete prices are present for both
//      intervals.
//   6. The 14-day-trial + cancel-anytime terms sit directly adjacent to the
//      single primary CTA.

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Shared page chrome — not part of /pricing's own content. Mock so the test
// renders only the page's sections and avoids ScrollNav/Footer browser deps.
// Mirrors the pattern in about-page.test.tsx.
import { vi } from "vitest";
vi.mock("@/components/landing/ScrollNav", () => ({ ScrollNav: () => null }));
vi.mock("@/components/landing/Footer", () => ({ Footer: () => null }));

import PricingPage from "@/app/pricing/page";

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

describe("PricingPage — structure", () => {
  it("renders exactly one <h1>", () => {
    const { container } = render(<PricingPage />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});

describe("PricingPage — billing-interval segmented control", () => {
  it("defaults to annual selected", () => {
    render(<PricingPage />);
    const annual = screen.getByTestId("interval-annual");
    const monthly = screen.getByTestId("interval-monthly");
    expect(annual).toHaveAttribute("aria-checked", "true");
    expect(monthly).toHaveAttribute("aria-checked", "false");
  });

  it("shows both interval prices on the control before any interaction", () => {
    render(<PricingPage />);
    const annual = screen.getByTestId("interval-annual");
    const monthly = screen.getByTestId("interval-monthly");
    expect(annual).toHaveTextContent("$49");
    expect(annual).toHaveTextContent("/yr");
    expect(monthly).toHaveTextContent("$5");
    expect(monthly).toHaveTextContent("/mo");
  });

  it("is a labeled radiogroup with two radio options", () => {
    render(<PricingPage />);
    const group = screen.getByTestId("interval-radiogroup");
    expect(group).toHaveAttribute("role", "radiogroup");
    expect(group).toHaveAttribute("aria-label", "Billing interval");
    expect(screen.getByTestId("interval-annual")).toHaveAttribute("role", "radio");
    expect(screen.getByTestId("interval-monthly")).toHaveAttribute("role", "radio");
  });

  it("toggling to monthly switches the displayed price and marks monthly checked", () => {
    render(<PricingPage />);
    expect(screen.getByTestId("plan-price")).toHaveTextContent("$49");

    fireEvent.click(screen.getByTestId("interval-monthly"));

    expect(screen.getByTestId("plan-price")).toHaveTextContent("$5");
    expect(screen.getByTestId("interval-monthly")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByTestId("interval-annual")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("toggling back to annual restores the annual price", () => {
    render(<PricingPage />);
    fireEvent.click(screen.getByTestId("interval-monthly"));
    fireEvent.click(screen.getByTestId("interval-annual"));
    expect(screen.getByTestId("plan-price")).toHaveTextContent("$49");
  });
});

describe("PricingPage — first + additional athlete pricing", () => {
  it("shows first-athlete and additional-athlete annual prices by default", () => {
    render(<PricingPage />);
    expect(screen.getByTestId("plan-price")).toHaveTextContent("$49");
    expect(screen.getByTestId("plan-additional")).toHaveTextContent(
      /\$29\/yr each additional athlete/,
    );
  });

  it("shows first-athlete and additional-athlete monthly prices after toggling", () => {
    render(<PricingPage />);
    fireEvent.click(screen.getByTestId("interval-monthly"));
    expect(screen.getByTestId("plan-price")).toHaveTextContent("$5");
    expect(screen.getByTestId("plan-additional")).toHaveTextContent(
      /\$3\/mo each additional athlete/,
    );
  });
});

describe("PricingPage — single primary CTA with adjacent terms", () => {
  it("renders exactly one plan CTA linking to /signup", () => {
    render(<PricingPage />);
    const ctas = screen.getAllByTestId("plan-cta");
    expect(ctas).toHaveLength(1);
    expect(ctas[0]).toHaveAttribute("href", "/signup");
  });

  it("trial + cancel-anytime terms sit directly adjacent to the primary CTA", () => {
    render(<PricingPage />);
    const cta = screen.getByTestId("plan-cta");
    const terms = screen.getByTestId("plan-cta-terms");
    expect(cta.nextElementSibling).toBe(terms);
    expect(terms).toHaveTextContent(/14 days free/i);
    expect(terms).toHaveTextContent(/cancel anytime/i);
  });
});

describe("PricingPage — shared feature list stated once", () => {
  it("renders each feature exactly once (no duplicated per-interval list)", () => {
    render(<PricingPage />);
    expect(
      screen.getAllByText(
        "Daily training session (hockey, basketball, golf, football, baseball, lacrosse & soccer)",
      ),
    ).toHaveLength(1);
    expect(screen.getAllByText("Pregame guided audio (~5 min)")).toHaveLength(1);
  });
});
