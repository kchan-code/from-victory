/**
 * @vitest-environment jsdom
 *
 * FV-671: full form -> code step flows (state-driven useFormState mock).
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { stateRef, completeMock } = vi.hoisted(() => ({
  stateRef: { current: null as unknown },
  completeMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: (action: unknown) => [stateRef.current, action],
    useFormStatus: () => ({ pending: false }),
  };
});
vi.mock("@/lib/actions/email-signup", () => ({
  startEmailSignup: vi.fn(),
  completeEmailSignup: completeMock,
  verifyEmailOnly: vi.fn(),
  resendSignupCode: vi.fn(),
}));
vi.mock("@/lib/actions/auth", () => ({ signIn: vi.fn() }));

import { SignUpForm } from "@/components/auth/SignUpForm";
import { SignInForm } from "@/components/auth/SignInForm";
import { VerifyCodeStep } from "@/components/auth/VerifyCodeStep";

afterEach(() => {
  cleanup();
  stateRef.current = null;
});

describe("sign-in branch", () => {
  it("renders the code step when signIn returns verify_code, and can go back", () => {
    stateRef.current = {
      ok: true,
      step: "verify_code",
      email: "legacy@x.com",
      purpose: "signin",
    };
    render(<SignInForm />);
    expect(screen.getByTestId("verify-code-step")).toBeInTheDocument();
    expect(screen.getByText("legacy@x.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify and sign in" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));
    expect(screen.queryByTestId("verify-code-step")).toBeNull();
  });
});

describe("signup branch", () => {
  it("shows the code step and keeps step-1 form mounted (hidden) for going back", () => {
    stateRef.current = {
      ok: true,
      step: "verify_code",
      email: "p@x.com",
      purpose: "signup",
      role: "parent",
    };
    const { container } = render(<SignUpForm />);
    expect(screen.getByTestId("verify-code-step")).toBeInTheDocument();
    const form = container.querySelector('form:not([data-testid])');
    expect(form).toHaveAttribute("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));
    expect(screen.queryByTestId("verify-code-step")).toBeNull();
    expect(container.querySelector("form")).not.toHaveAttribute("hidden");
  });
});

describe("error rendering", () => {
  it("ties a bad-code error to the input and shows generic errors as alerts", () => {
    stateRef.current = { ok: false, error: "That code didn't work.", field: "token" };
    const { rerender } = render(
      <VerifyCodeStep
        email="a@b.com"
        purpose="signup"
        action={completeMock}
        onChangeEmail={() => {}}
      />,
    );
    const input = screen.getByLabelText("6-digit code");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toBe("verify-code-intro token-error");
    expect(screen.getByRole("alert")).toHaveTextContent("didn't work");

    stateRef.current = { ok: false, error: "Something went wrong." };
    rerender(
      <VerifyCodeStep
        email="a@b.com"
        purpose="signup"
        action={completeMock}
        onChangeEmail={() => {}}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong.");
  });
});
