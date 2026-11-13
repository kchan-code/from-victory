/**
 * @vitest-environment jsdom
 *
 * FV-707: adult and parent signup form copy, including the password
 * Show/Hide control and the 18+ footer.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: (_action: unknown, initialState: unknown) => [
      initialState,
      vi.fn(),
    ],
    useFormStatus: () => ({ pending: false }),
  };
});

vi.mock("@/lib/actions/auth", () => ({ signUp: vi.fn() }));
vi.mock("@/lib/actions/auth-adult", () => ({ signUpAdultAthlete: vi.fn() }));

import { AdultSignUpForm } from "@/components/auth/AdultSignUpForm";
import { SignUpForm } from "@/components/auth/SignUpForm";

afterEach(() => {
  cleanup();
});

describe("signup forms (FV-707)", () => {
  it("parent password can be shown and hidden", () => {
    render(<SignUpForm />);
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: "Create parent account" }),
    ).toBeInTheDocument();
  });

  it("adult form keeps the 18+ gates and points under-18 athletes to an invite", () => {
    render(<AdultSignUpForm />);

    expect(
      screen.getByRole("button", { name: "Create my account" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "At least 8 characters.",
    );
    expect(screen.getByLabelText("Date of birth")).toHaveAccessibleDescription(
      "You must be 18 or older to create your own account.",
    );
    expect(
      screen.getByRole("checkbox", {
        name: "I confirm I am 18 years of age or older.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Terms of Use/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Terms of Use" }),
    ).toHaveAttribute("href", "/terms");
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: "Ask a parent to invite you" }),
    ).toHaveAttribute("href", "/invite");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/signin",
    );

    const password = screen.getByLabelText("Password") as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(
      screen.queryByRole("button", { name: "Show password" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toHaveTextContent("Hide");
  });
});
