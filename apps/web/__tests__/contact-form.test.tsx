/**
 * @vitest-environment jsdom
 *
 * FV-770: an error return keeps what the person typed (React 19 resets
 * uncontrolled fields after an action; the form refills from state.values).
 * useFormState is shimmed with a controllable state (same pattern as
 * athlete-form.test.tsx).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import type { ContactActionState } from "@/lib/actions/contact";

const { formStateOverride } = vi.hoisted(() => ({
  formStateOverride: { current: null as ContactActionState },
}));

vi.mock("server-only", () => ({}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: (_action: unknown, initialState: unknown) => [
      formStateOverride.current ?? initialState,
      vi.fn(),
    ],
    useFormStatus: () => ({ pending: false }),
  };
});

vi.mock("@/lib/actions/contact", () => ({ submitContact: vi.fn() }));

import { ContactForm } from "@/components/landing/ContactForm";

afterEach(() => {
  cleanup();
  formStateOverride.current = null;
});

describe("ContactForm error state (FV-770)", () => {
  it("refills the typed values and shows the error", () => {
    formStateOverride.current = {
      ok: false,
      error: "Your message did not go through.",
      values: { name: "Jordan", email: "j@example.com", message: "Hello" },
    };
    render(<ContactForm />);
    expect(screen.getByLabelText("First name")).toHaveValue("Jordan");
    expect(screen.getByLabelText("Email")).toHaveValue("j@example.com");
    expect(screen.getByLabelText("Message")).toHaveValue("Hello");
    expect(screen.getByRole("alert")).toHaveTextContent("did not go through");
  });

  it("starts empty with no state", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });
});
