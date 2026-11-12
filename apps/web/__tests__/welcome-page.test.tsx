/**
 * @vitest-environment jsdom
 *
 * /welcome page (FV-672, SSO A3; spec FV-569 §5.2): auth-email line, account
 * type preselection from `?as=`, parent-only when the adult flag is off, the
 * "couldn't check" card on a failed read, and the confirm step for "Use a
 * different account".
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));

// Test-env shim: the hoisted react-dom has no useFormState / useFormStatus.
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  const React = await import("react");
  return {
    ...actual,
    useFormState: (_action: unknown, initialState: unknown) => [
      React.useState(initialState)[0],
      () => undefined,
    ],
    useFormStatus: () => ({ pending: false }),
  };
});

const h = vi.hoisted(() => ({
  requireOnboarding: vi.fn(),
  adult: vi.fn(),
  FakeSessionCheckError: class extends Error {},
}));
const FakeSessionCheckError = h.FakeSessionCheckError;

vi.mock("@/lib/auth/guards", () => ({
  requireOnboarding: () => h.requireOnboarding(),
  SessionCheckError: h.FakeSessionCheckError,
}));
vi.mock("@/lib/flags", () => ({ isAdultSignupEnabled: () => h.adult() }));
vi.mock("@/lib/actions/onboarding", () => ({
  completeOnboarding: vi.fn(),
  cancelOnboarding: vi.fn(),
}));
vi.mock("next/image", () => ({
  default: (p: { alt: string }) => <span>{p.alt}</span>,
}));

import WelcomePage, { metadata } from "@/app/welcome/page";

async function renderPage(as?: string) {
  const ui = await WelcomePage({ searchParams: { as } });
  return render(ui);
}

beforeEach(() => {
  h.requireOnboarding.mockResolvedValue({ userId: "u1", email: "me@example.com" });
  h.adult.mockReturnValue(true);
});
afterEach(cleanup);

describe("/welcome", () => {
  it("is noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("shows only 'Signed in as <auth email>'", async () => {
    await renderPage();
    expect(screen.getByTestId("welcome-signed-in-as")).toHaveTextContent(
      "Signed in as me@example.com",
    );
  });

  it("preselects the parent card by default and the adult card for ?as=adult", async () => {
    const { unmount } = await renderPage();
    const radios = () => screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios().find((r) => r.value === "parent")!.checked).toBe(true);
    expect(screen.getByLabelText(/parent or guardian, 18 or older/i)).toBeInTheDocument();
    unmount();

    await renderPage("adult");
    expect(radios().find((r) => r.value === "adult")!.checked).toBe(true);
    expect(screen.getByLabelText("Birthdate")).toHaveAttribute("autocomplete", "bday");
    expect(screen.getByLabelText("Sport")).toBeInTheDocument();
    expect(screen.getByLabelText("I'm 18 or older.")).toBeInTheDocument();
  });

  it("is parent-only (no cards, ignores ?as=adult) when the adult flag is off", async () => {
    h.adult.mockReturnValue(false);
    await renderPage("adult");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryByLabelText("Birthdate")).toBeNull();
    expect(screen.getByLabelText(/parent or guardian/i)).toBeInTheDocument();
  });

  it("a failed read renders the 'couldn't check' card with a retry, never the form", async () => {
    h.requireOnboarding.mockRejectedValue(new FakeSessionCheckError());
    await renderPage();
    expect(screen.getByTestId("welcome-status-unknown")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-status-unknown-retry")).toHaveAttribute("href", "/welcome");
    expect(screen.queryByLabelText("First name")).toBeNull();
  });

  it("any other thrown value (redirects) propagates", async () => {
    h.requireOnboarding.mockRejectedValue(new Error("NEXT_REDIRECT:/signin"));
    await expect(WelcomePage({ searchParams: {} })).rejects.toThrow("NEXT_REDIRECT");
  });

  it("'Use a different account' needs a confirm step; the relay line is present", async () => {
    await renderPage();
    expect(screen.getByText(/hidden Apple email and already have an account/i)).toBeInTheDocument();
    expect(screen.queryByText("Yes, use a different account")).toBeNull();
    fireEvent.click(screen.getByTestId("welcome-use-different-account"));
    expect(screen.getByText("Yes, use a different account")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Stay here"));
    expect(screen.queryByText("Yes, use a different account")).toBeNull();
  });
});
