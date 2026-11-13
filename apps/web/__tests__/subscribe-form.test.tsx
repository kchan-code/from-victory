/**
 * @vitest-environment jsdom
 *
 * RTL tests for SubscribeForm's `isAdult` value-prop reminder (FV-442).
 *
 * The 13-25 expansion arc adds an adult_athlete self-serve checkout flow
 * (quantity always 1) alongside the existing parent flow (first athlete +
 * each-additional-athlete tiering). The component takes an `isAdult` prop
 * (default false) so every existing parent call site is byte-identical.
 *
 * Cases:
 *   1. Default (isAdult omitted) renders today's parent-tiering reminder.
 *   2. isAdult=false renders the same parent-tiering reminder explicitly.
 *   3. isAdult=true renders individual framing, with no "additional athlete"
 *      language anywhere in the reminder.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

let mockedFormState: unknown = null;

// Test-env shim: Next.js aliases "react-dom" to its own canary build that
// exports useFormState/useFormStatus (how App Router server actions work in
// React 18). The plain npm `react-dom@18.3.1` package Vitest resolves does
// NOT export them, so SubscribeForm crashes on mount without this shim.
// These tests only assert on rendered copy — they never submit the form —
// so a no-dispatch useState passthrough is enough.
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: (_action: unknown, initialState: unknown) => [
      mockedFormState ?? initialState,
      () => undefined,
    ],
    useFormStatus: () => ({ pending: false }),
  };
});

import { SubscribeForm } from "@/components/subscribe/SubscribeForm";

// The action prop is passed directly by the page (no module-level import to
// mock) — a no-op async function satisfies the type.
const noopAction = async () => null;

afterEach(() => {
  mockedFormState = null;
  cleanup();
});

describe("SubscribeForm — value-prop reminder (parent vs adult)", () => {
  it("defaults to parent tiering copy when isAdult is omitted", () => {
    render(<SubscribeForm trialEligible={false} action={noopAction} />);
    const reminder = screen.getByTestId("value-prop-reminder");
    expect(reminder.textContent).toMatch(/each additional athlete/i);
    expect(reminder.textContent).toContain("$5/mo or $49/yr");
  });

  it("isAdult=false renders the same parent tiering copy explicitly", () => {
    render(
      <SubscribeForm trialEligible={false} action={noopAction} isAdult={false} />,
    );
    const reminder = screen.getByTestId("value-prop-reminder");
    expect(reminder.textContent).toMatch(/each additional athlete/i);
  });

  it("isAdult=true renders individual framing with no additional-athlete tiering", () => {
    render(
      <SubscribeForm trialEligible={false} action={noopAction} isAdult={true} />,
    );
    const reminder = screen.getByTestId("value-prop-reminder");
    expect(reminder.textContent).not.toMatch(/additional athlete/i);
    expect(reminder.textContent).not.toMatch(/first athlete/i);
    expect(reminder.textContent?.toLowerCase()).toContain("just for you");
  });
});

describe("SubscribeForm — 7-day trial banner (FV-574)", () => {
  it("shows the 7-day banner and the auto-charge disclosure when trialEligible", () => {
    render(<SubscribeForm trialEligible={true} action={noopAction} />);

    const banner = screen.getByTestId("trial-eligible-banner");
    expect(banner.textContent).toContain("7-day free trial");
    expect(banner.textContent).not.toContain("14-day");
    // Consumer-protection disclosure (FTC negative-option guidance; privacy
    // finding on PR #185) must ride with the banner.
    expect(
      screen.getByTestId("trial-autocharge-disclosure").textContent,
    ).toContain("charged automatically when the trial ends");
  });

  it("renders no trial banner at all when not trialEligible", () => {
    render(<SubscribeForm trialEligible={false} action={noopAction} />);

    expect(screen.queryByTestId("trial-eligible-banner")).toBeNull();
    expect(screen.queryByTestId("trial-autocharge-disclosure")).toBeNull();
  });
});

describe("SubscribeForm — native-shell checkout message mapping (FV-715)", () => {
  it("maps native_shell_unavailable to URL-free UI copy", () => {
    mockedFormState = {
      ok: false as const,
      code: "native_shell_unavailable" as const,
      error: "Manage your subscription from a web browser at fromvictoryapp.com.",
    };

    render(<SubscribeForm trialEligible={false} action={noopAction} />);

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("This purchase isn't available in the app.");
    expect(alert.textContent).not.toContain("fromvictoryapp.com");
    expect(alert.textContent).not.toMatch(/[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(alert.textContent).not.toContain("http");
  });
});
