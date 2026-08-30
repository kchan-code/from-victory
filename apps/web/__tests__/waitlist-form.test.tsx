/**
 * @vitest-environment jsdom
 *
 * RTL tests for WaitlistForm (FV-517).
 *
 * FV-517 scope:
 *   - The sport select lists only non-live sports (SUPPORTED_SPORTS-derived
 *     filter) — no live sport is a selectable option.
 *   - No default sport selection — a disabled placeholder is selected until
 *     the visitor chooses.
 *   - The first-name input and the optional-note textarea are removed from
 *     the form entirely (KC decision, docs/conversion-audit-2026-08-29.md
 *     §7.4).
 *   - Role radio chips are individually reachable at >=44px tall.
 *   - The `/teams` coach deep-link prefill (?role=coach) still works.
 *   - A live-sport URL param (?sport=hockey) shows a routing notice to the
 *     trial instead of preselecting anything.
 *
 * Cases:
 *   1. Sport select excludes every SUPPORTED_SPORTS entry.
 *   2. Sport select includes the non-live candidates + "Other".
 *   3. No default selection — placeholder option selected, disabled, value="".
 *   4. No #w-name input, no #w-note textarea.
 *   5. Role radio chips are >=44px tall (min-h-[44px] class present).
 *   6. ?role=coach prefills the Coach radio.
 *   7. ?sport=hockey (a live sport) shows the trial-routing notice with a
 *      link to /signup, and does not preselect a live sport.
 *   8. A non-live sport param (or no sport param) does not show the notice.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Test-env shim: Next.js aliases "react-dom" to its own canary build that
// exports useFormState/useFormStatus (how App Router server actions work in
// React 18). The plain npm `react-dom@18.3.1` package Vitest resolves does
// NOT export them, so WaitlistForm crashes on mount without this shim. These
// tests only assert on rendered copy/markup — they never submit the form —
// so a no-dispatch useState passthrough is enough. (Mirrors
// __tests__/subscribe-form.test.tsx.)
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  const React = await import("react");
  return {
    ...actual,
    useFormState: (_action: unknown, initialState: unknown) =>
      React.useState(initialState),
    useFormStatus: () => ({ pending: false }),
  };
});

// The real @/lib/actions/waitlist module chain imports "server-only" (via
// lib/supabase/server + lib/email/resend), which throws at import time
// outside a Next.js "react-server" bundling context. WaitlistForm only needs
// the `submitWaitlist` symbol as a value passed to useFormState (mocked
// above), so mock the module instead of pulling in the real chain. (Mirrors
// __tests__/next-game-prompt.test.tsx.)
vi.mock("@/lib/actions/waitlist", () => ({
  submitWaitlist: vi.fn(),
}));

import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

const NON_LIVE_SPORTS = [
  "Swimming",
  "Wrestling",
  "Volleyball",
  "Track & field",
  "Tennis",
  "Other",
];

function setUrl(search: string) {
  window.history.pushState({}, "", `/${search}`);
}

beforeEach(() => {
  setUrl("");
});

afterEach(() => {
  cleanup();
});

describe("WaitlistForm — sport select (FV-517)", () => {
  it("excludes every SUPPORTED_SPORTS entry from the select options", () => {
    render(<WaitlistForm />);
    const select = screen.getByLabelText(/primary sport/i);
    for (const sport of SUPPORTED_SPORTS) {
      const label = sportLabel(sport);
      expect(
        screen.queryByRole("option", { name: label }),
        `${label} must not be a waitlist select option (it is live)`,
      ).not.toBeInTheDocument();
      // Belt-and-suspenders: no option's value matches the live sport label.
      const options = Array.from(select.querySelectorAll("option"));
      expect(options.some((o) => o.value === label)).toBe(false);
    }
  });

  it("includes the non-live sport candidates and Other", () => {
    render(<WaitlistForm />);
    for (const sport of NON_LIVE_SPORTS) {
      expect(
        screen.getByRole("option", { name: sport }),
      ).toBeInTheDocument();
    }
  });

  it("has no default selection — the disabled placeholder is selected", () => {
    render(<WaitlistForm />);
    const select = screen.getByLabelText(/primary sport/i) as HTMLSelectElement;
    expect(select.value).toBe("");
    const placeholder = screen.getByRole("option", {
      name: "Choose your sport",
    }) as HTMLOptionElement;
    expect(placeholder.disabled).toBe(true);
    expect(placeholder.value).toBe("");
  });
});

describe("WaitlistForm — removed fields (FV-517)", () => {
  it("has no first-name input", () => {
    render(<WaitlistForm />);
    expect(document.getElementById("w-name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
  });

  it("has no optional-note textarea", () => {
    render(<WaitlistForm />);
    expect(document.getElementById("w-note")).not.toBeInTheDocument();
    expect(document.querySelector("textarea")).not.toBeInTheDocument();
  });

  it("still has the email field and the role radio group", () => {
    render(<WaitlistForm />);
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /athlete/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /coach.*ministry leader/i }),
    ).toBeInTheDocument();
  });
});

describe("WaitlistForm — role radio target size (FV-517)", () => {
  it("role radio chip labels carry the 44px minimum-height class", () => {
    render(<WaitlistForm />);
    const athleteRadio = screen.getByRole("radio", { name: /athlete/i });
    const chipLabel = athleteRadio.closest("label");
    expect(chipLabel).not.toBeNull();
    expect(chipLabel?.className).toContain("min-h-[44px]");
  });
});

describe("WaitlistForm — /teams coach deep-link prefill", () => {
  it("?role=coach prefills the Coach radio as checked", () => {
    setUrl("?role=coach&source=teams&intent=group-pricing");
    render(<WaitlistForm />);
    const coachRadio = screen.getByRole("radio", {
      name: /coach.*ministry leader/i,
    }) as HTMLInputElement;
    expect(coachRadio.checked).toBe(true);
  });

  it("shows the group-pricing banner for the /teams source", () => {
    setUrl("?role=coach&source=teams&intent=group-pricing");
    render(<WaitlistForm />);
    expect(screen.getByText(/group pricing request/i)).toBeInTheDocument();
  });
});

describe("WaitlistForm — live-sport arrival routes to the trial (FV-517)", () => {
  it("?sport=hockey shows a trial-routing notice linking to /signup", () => {
    setUrl("?sport=hockey");
    render(<WaitlistForm />);
    expect(screen.getByText(/available now/i)).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: /start your athlete.s 14-day free trial/i,
    });
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("?sport=Basketball (label form, case-insensitive) also shows the notice", () => {
    setUrl("?sport=Basketball");
    render(<WaitlistForm />);
    expect(screen.getByText(/available now/i)).toBeInTheDocument();
  });

  it("does not preselect a sport when arriving via a live-sport param", () => {
    setUrl("?sport=hockey");
    render(<WaitlistForm />);
    const select = screen.getByLabelText(/primary sport/i) as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("a non-live sport param does not show the trial notice", () => {
    setUrl("?sport=swimming");
    render(<WaitlistForm />);
    expect(screen.queryByText(/available now/i)).not.toBeInTheDocument();
  });

  it("no sport param does not show the trial notice", () => {
    render(<WaitlistForm />);
    expect(screen.queryByText(/available now/i)).not.toBeInTheDocument();
  });
});
