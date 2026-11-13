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

const { isAdultSignupEnabledMock, redirectIfAuthedMock, shellCapabilityMock } =
  vi.hoisted(() => ({
    isAdultSignupEnabledMock: vi.fn(() => false),
    redirectIfAuthedMock: vi.fn().mockResolvedValue(undefined),
    shellCapabilityMock: vi.fn(
      () => null as "legacy-native" | "ios-iap" | "android-play" | null,
    ),
  }));

vi.mock("@/lib/flags", () => ({
  isAdultSignupEnabled: isAdultSignupEnabledMock,
}));

vi.mock("@/lib/auth/guards", () => ({
  redirectIfAuthed: redirectIfAuthedMock,
}));

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
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
  shellCapabilityMock.mockReturnValue(null);
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
        name: /start your athlete.s 7-day free trial/i,
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
describe("/signup — flag off: parent form, no 18+ row (FV-515, FV-707)", () => {
  it("renders the parent form and the 7-day note, with no 18+ row and no progress list", async () => {
    isAdultSignupEnabledMock.mockReturnValue(false);
    const jsx = await SignUpPage();
    render(jsx);

    expect(screen.getByTestId("signup-form-stub")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("signup-adult-entry")).not.toBeInTheDocument();
    expect(screen.queryByText(/are you the athlete, and 18 or older/i)).not.toBeInTheDocument();
    const note = screen.getByTestId("signup-trial-note");
    expect(note).toHaveTextContent("7 days free, then $5/mo or $49/yr.");
    expect(note.textContent).not.toMatch(/14/);
  });
});

describe("/signup — flag on: parent form + same-screen athlete card + handoff expectations (FV-515)", () => {
  it("keeps the parent form immediately visible — no interstitial chooser", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await SignUpPage();
    render(jsx);
    expect(screen.getByTestId("signup-form-stub")).toBeInTheDocument();
  });

  it("renders the 18+ row under the subtitle, linking to /signup/athlete", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await SignUpPage();
    render(jsx);
    const link = screen.getByTestId("signup-adult-entry");
    expect(link).toHaveAttribute("href", "/signup/athlete");
    expect(link).toHaveTextContent(
      "Training yourself and 18 or older? Create your own account",
    );
    expect(
      screen.queryByText(/are you the athlete, and 18 or older\?/i),
    ).not.toBeInTheDocument();
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

  it("renders the 7-day note under the button, never promising 'no credit card'", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await SignUpPage();
    render(jsx);
    const note = screen.getByTestId("signup-trial-note");
    expect(note).toHaveTextContent("7 days free, then $5/mo or $49/yr.");
    expect(note).toHaveTextContent("Cancel anytime.");
    expect(note).toHaveTextContent(
      "Free trial for first-time subscribers with one athlete. Next, add your athlete from your dashboard.",
    );
    expect(note.textContent).not.toMatch(/14/);
    expect(note.textContent?.toLowerCase()).not.toContain("no credit card");
    expect(note.textContent?.toLowerCase()).not.toContain("card required");
    expect(screen.queryByTestId("signup-ios-subscription-note")).not.toBeInTheDocument();
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

  it("renders the 7-day note, never a 14-day claim or 'no credit card'", async () => {
    isAdultSignupEnabledMock.mockReturnValue(true);
    const jsx = await AdultSignUpPage();
    render(jsx);
    const note = screen.getByTestId("signup-trial-note");
    expect(note).toHaveTextContent("7 days free, then $5/mo or $49/yr.");
    expect(note).toHaveTextContent("Cancel anytime.");
    expect(note).toHaveTextContent(
      "Free trial for first-time subscribers. Next, you pick a plan.",
    );
    expect(note.textContent).not.toMatch(/14/);
    expect(note.textContent?.toLowerCase()).not.toContain("no credit card");
    expect(note.textContent?.toLowerCase()).not.toContain("card required");
    expect(screen.queryByTestId("signup-ios-subscription-note")).not.toBeInTheDocument();
  });
});

describe("signup trial copy by shell capability (FV-707, FV-719)", () => {
  it.each(["ios-iap", "legacy-native", "android-play"] as const)(
    "%s: parent and adult signup omit web prices, card terms, and the trial length",
    async (capability) => {
      shellCapabilityMock.mockReturnValue(capability);
      isAdultSignupEnabledMock.mockReturnValue(true);

      const parent = await SignUpPage();
      const { unmount } = render(parent);
      expect(screen.queryByTestId("signup-trial-note")).not.toBeInTheDocument();
      expect(screen.queryByText(/\$5\/mo/)).not.toBeInTheDocument();
      expect(screen.queryByText(/7 days free/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/card required/i)).not.toBeInTheDocument();
      if (capability === "ios-iap") {
        expect(screen.getByTestId("signup-ios-subscription-note")).toHaveTextContent(
          "After you create your account, you choose a subscription in the app.",
        );
      } else {
        expect(screen.queryByTestId("signup-ios-subscription-note")).not.toBeInTheDocument();
      }
      unmount();

      const adult = await AdultSignUpPage();
      render(adult);
      expect(screen.queryByTestId("signup-trial-note")).not.toBeInTheDocument();
      expect(screen.queryByText(/\$5\/mo/)).not.toBeInTheDocument();
      expect(screen.queryByText(/7 days free/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/card required/i)).not.toBeInTheDocument();
      if (capability === "ios-iap") {
        expect(screen.getByTestId("signup-ios-subscription-note")).toHaveTextContent(
          "After you create your account, you choose a subscription in the app.",
        );
      } else {
        expect(screen.queryByTestId("signup-ios-subscription-note")).not.toBeInTheDocument();
      }
    },
  );

  it("keeps the card-required auto-charge sentence on checkout only", () => {
    const ROOT = resolve(__dirname, "..");
    const signup = readFileSync(join(ROOT, "app/signup/page.tsx"), "utf8").toLowerCase();
    const adult = readFileSync(join(ROOT, "app/signup/athlete/page.tsx"), "utf8").toLowerCase();
    const disclosure = readFileSync(
      join(ROOT, "components/auth/TrialDisclosure.tsx"),
      "utf8",
    ).toLowerCase();
    const checkout = readFileSync(
      join(ROOT, "components/subscribe/SubscribeForm.tsx"),
      "utf8",
    );
    expect(signup).not.toContain("card required");
    expect(adult).not.toContain("card required");
    expect(disclosure).not.toContain("card required");
    expect(checkout).toContain(
      "Card required. It will be charged automatically when the trial",
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
