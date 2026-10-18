/**
 * @vitest-environment jsdom
 *
 * FV-611: the first-run sport picker exit must be a labeled "Sign out"
 * control. The previous control was a back-arrow glyph with
 * aria-label="Sign out", so a first-run athlete who tapped back was
 * signed out. These tests pin the visible label, the accessible name,
 * and the absence of a Back / arrow exit.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));

// Test-env shim: Next aliases react-dom to a canary that exports
// useFormState / useFormStatus. The plain react-dom Vitest resolves does
// not. These tests never submit the sport form.
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

vi.mock("@/lib/actions/auth", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/lib/actions/athlete-sport", () => ({
  selectSport: vi.fn(),
}));

import SportPicker from "@/components/athlete/SportPicker";
import { ATHLETE_CACHE_KEY } from "@/lib/pregame/athlete-cache";
import { PREGAME_SESSION_CACHE_KEY } from "@/lib/pregame/session-cache";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("SportPicker exit control (FV-611)", () => {
  it("renders a Sign out button whose visible label is its accessible name", () => {
    render(<SportPicker currentSport="hockey" />);

    const button = screen.getByRole("button", { name: "Sign out" });
    expect(button).toBeVisible();
    expect(button).toHaveTextContent(/^Sign out$/);
    expect(button).toHaveAttribute("type", "submit");
    // An aria-label would let a glyph disagree with the words on screen.
    expect(button).not.toHaveAttribute("aria-label");
    expect(button.closest("header")).not.toBeNull();
  });

  it("has no Back control and no arrow glyph on the sign-out button", () => {
    render(<SportPicker currentSport="hockey" />);

    expect(
      screen.queryByRole("button", { name: /back/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /back/i })).not.toBeInTheDocument();

    const signOut = screen.getByRole("button", { name: "Sign out" });
    expect(signOut.querySelector("svg")).toBeNull();
    expect(signOut.innerHTML).not.toMatch(/M19 12H5|M11 6l-6 6/);
  });

  it("clears device caches when the sign-out form is submitted", () => {
    window.localStorage.setItem(
      ATHLETE_CACHE_KEY,
      JSON.stringify({ sport: "hockey", firstName: "Jordan" }),
    );
    window.localStorage.setItem(
      PREGAME_SESSION_CACHE_KEY,
      JSON.stringify({ sport: "hockey" }),
    );
    window.localStorage.setItem("fv_tour_hub_done", "1");
    window.localStorage.setItem("fv_tour_pregame_done", "1");

    render(<SportPicker currentSport="hockey" />);
    const button = screen.getByRole("button", { name: "Sign out" });
    const form = button.closest("form");
    if (!form) throw new Error("Sign out button is not inside a form");
    fireEvent.submit(form);

    expect(window.localStorage.getItem(ATHLETE_CACHE_KEY)).toBeNull();
    expect(window.localStorage.getItem(PREGAME_SESSION_CACHE_KEY)).toBeNull();
    expect(window.localStorage.getItem("fv_tour_hub_done")).toBeNull();
    expect(window.localStorage.getItem("fv_tour_pregame_done")).toBeNull();
  });
});
