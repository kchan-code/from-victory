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

// Test-env shim: Next.js aliases "react-dom" to its own canary build that
// exports useFormState/useFormStatus (how App Router server actions work in
// React 18). The plain npm `react-dom@18.3.1` package Vitest resolves does
// NOT export them, so SubscribeForm crashes on mount without this shim.
// These tests only assert on rendered copy — they never submit the form —
// so a no-dispatch useState passthrough is enough.
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

import { SubscribeForm } from "@/components/subscribe/SubscribeForm";

// The action prop is passed directly by the page (no module-level import to
// mock) — a no-op async function satisfies the type.
const noopAction = async () => null;

afterEach(() => cleanup());

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
