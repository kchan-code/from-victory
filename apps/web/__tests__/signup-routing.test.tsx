/**
 * @vitest-environment jsdom
 *
 * FV-515 — signup routing: parent vs 18+ athlete choice and handoff
 * expectations.
 *
 * Scope: presentation/routing only. Covers:
 *   1. Hero's flag-gated secondary athlete line (present on, absent off).
 *   2. /signup: parent form always visible (no interstitial chooser — KC
 *      decision); flag-off renders exactly today's parent-form-only page;
 *      flag-on adds a same-screen secondary athlete card, a progress
 *      indicator (Account → Athlete → Trial), and a trial/billing
 *      disclosure.
 *   3. /signup/athlete: 404s when the flag is off; flag-on renders a
 *      progress indicator (Account → Trial) and the same disclosure
 *      pattern.
 *   4. Regression: "no credit card" never appears anywhere in apps/web —
 *      a card is required (lib/actions/subscription.ts).
 *
 * SignUpForm / AdultSignUpForm are stubbed (mirrors the SubscribeForm stub
 * in subscribe-page.test.tsx) — their own auth-logic internals are out of
 * scope for this routing/presentation issue and covered elsewhere
 * (__tests__/actions/auth-adult.test.ts).
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { isAdultSignupEnabledMock, redirectIfAuthedMock } = vi.hoisted(() => ({
  isAdultSignupEnabledMock: vi.fn(() => false),
  redirectIfAuthedMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/flags", () => ({
  isAdultSignupEnabled: isAdultSignupEnabledMock,
}));

vi.mock("@/lib/auth/guards", () => ({
  redirectIfAuthed: redirectIfAuthedMock,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// Stub the forms — this issue is scoped to routing/presentation (steps,
// disclosure, chooser card), not the forms' own auth-logic internals.
vi.mock("@/components/auth/SignUpForm", () => ({
  SignUpForm: ({ afterSubmit }: { afterSubmit?: ReactNode }) => (
    <div data-testid="signup-form-stub">{afterSubmit}</div>
  ),
}));
vi.mock("@/components/auth/AdultSignUpForm", () => ({
  AdultSignUpForm: ({ afterSubmit }: { afterSubmit?: ReactNode }) => (
    <div data-testid="adult-signup-form-stub">{afterSubmit}</div>
  ),
}));

import { Hero } from "@/components/landing/Hero";
import SignUpPage from "@/app/signup/page";
import AdultSignUpPage from "@/app/signup/athlete/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  isAdultSignupEnabledMock.mockReturnValue(false);
  redirectIfAuthedMock.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Hero — flag-gated secondary athlete line
// ---------------------------------------------------------------------------
describe("Hero — 18+ athlete path (FV-515)", () => {
  it("renders nothing extra when ENABLE_ADULT_SIGNUP is off (byte-identical to today)", () => {
    isAdultSignupEnabledMock.mockReturnValue(false);
    render(<Hero />);
    expect(
      screen.queryByText(/are you the athlete, and 18 or older/i),
    ).not.toBeInTheDocument();
    // The primary parent CTA is unaffected either way.
    expect(
      screen.getByRole("link", {
        name: /start your athlete.s 14-day free trial/i,
      }),
    ).toHaveAttribute("href", "/signup");
  });

  it("renders the verbatim secondary athlete line, linking to /signup/athlete, when the flag is on", () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    render(<Hero />);
    expect(
      screen.getByText(/are you the athlete, and 18 or older\?/i),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Create your own account" });
    expect(link).toHaveAttribute("href", "/signup/athlete");
  });
});

// ---------------------------------------------------------------------------
// /signup — parent form always visible; flag-gated secondary card + steps
// ---------------------------------------------------------------------------
describe("/signup — flag off: today's parent-form-only page, unchanged (FV-515)", () => {
  it("renders only the parent form — no progress indicator, no secondary card, no disclosure", async () => {
    isAdultSignupEnabledMock.mockReturnValue(false);
    const jsx = await SignUpPage();
    render(jsx);

    expect(screen.getByTestId("signup-form-stub")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Create your own account" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("trial-autocharge-disclosure"),
    ).not.toBeInTheDocument();
  });
});

describe("/signup — flag on: parent form + same-screen athlete card + handoff expectations (FV-515)", () => {
  it("keeps the parent form immediately visible — no interstitial chooser", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await SignUpPage();
    render(jsx);
    expect(screen.getByTestId("signup-form-stub")).toBeInTheDocument();
  });

  it("renders the athlete card with the verbatim copy, linking to /signup/athlete", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await SignUpPage();
    render(jsx);
    expect(
      screen.getByText(/are you the athlete, and 18 or older\?/i),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Create your own account" });
    expect(link).toHaveAttribute("href", "/signup/athlete");
  });

  it("renders the progress indicator with Account current, then Athlete, then Trial", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await SignUpPage();
    render(jsx);
    const list = screen.getByRole("list", { name: /signup progress/i });
    const items = list.querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(items[0]?.textContent).toMatch(/account/i);
    expect(items[1]?.textContent).toMatch(/athlete/i);
    expect(items[2]?.textContent).toMatch(/trial/i);
    const current = list.querySelector('[aria-current="step"]');
    expect(current?.textContent).toMatch(/account/i);
  });

  it("renders the trial/billing disclosure adjacent to the submit button, never promising 'no credit card'", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await SignUpPage();
    render(jsx);
    const disclosure = screen.getByTestId("trial-autocharge-disclosure");
    expect(disclosure.textContent).toMatch(/card required/i);
    expect(disclosure.textContent).toMatch(/first-time subscribers/i);
    expect(disclosure.textContent?.toLowerCase()).not.toContain(
      "no credit card",
    );
  });

  it("does not mention the dormant journal or fold pre-practice into pregame", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await SignUpPage();
    const { container } = render(jsx);
    const text = (container.textContent ?? "").toLowerCase();
    expect(text).not.toContain("journal");
    expect(text).not.toContain("pre-practice");
  });
});

// ---------------------------------------------------------------------------
// /signup/athlete — 404s when off; steps + disclosure when on
// ---------------------------------------------------------------------------
describe("/signup/athlete — 404s when ENABLE_ADULT_SIGNUP is off (FV-515)", () => {
  it("throws (notFound) rather than rendering", async () => {
    isAdultSignupEnabledMock.mockReturnValue(false);
    await expect(AdultSignUpPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("/signup/athlete — flag on: steps + handoff expectations (FV-515)", () => {
  it("renders the progress indicator with Account current, then Trial", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await AdultSignUpPage();
    render(jsx);
    const list = screen.getByRole("list", { name: /signup progress/i });
    const items = list.querySelectorAll("li");
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toMatch(/account/i);
    expect(items[1]?.textContent).toMatch(/trial/i);
    const current = list.querySelector('[aria-current="step"]');
    expect(current?.textContent).toMatch(/account/i);
  });

  it("renders the trial/billing disclosure, never promising 'no credit card'", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await AdultSignUpPage();
    render(jsx);
    const disclosure = screen.getByTestId("trial-autocharge-disclosure");
    expect(disclosure.textContent).toMatch(/card required/i);
    expect(disclosure.textContent).toMatch(/first-time subscribers/i);
    expect(disclosure.textContent?.toLowerCase()).not.toContain(
      "no credit card",
    );
  });
});

// ---------------------------------------------------------------------------
// Regression: "no credit card" never appears anywhere in apps/web source.
// A card IS required (lib/actions/subscription.ts) — never claim otherwise.
// ---------------------------------------------------------------------------
describe("Regression — 'no credit card' never appears in apps/web (FV-515)", () => {
  const ROOT = resolve(__dirname, "..");
  const SKIP_DIRS = new Set([
    "node_modules",
    ".next",
    ".git",
    "coverage",
    "playwright-report",
    "test-results",
  ]);
  const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".mdx"]);

  function walk(dir: string, out: string[]) {
    for (const entry of readdirSync(dir)) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full, out);
      } else if (TEXT_EXT.has(entry.slice(entry.lastIndexOf(".")))) {
        out.push(full);
      }
    }
  }

  it("no source file contains the phrase 'no credit card'", () => {
    const files: string[] = [];
    walk(ROOT, files);
    const offenders: string[] = [];
    for (const file of files) {
      // This test file legitimately references the banned phrase (as a
      // string literal, to assert its absence) — skip self.
      if (file.endsWith("signup-routing.test.tsx")) continue;
      const content = readFileSync(file, "utf8").toLowerCase();
      if (content.includes("no credit card")) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
