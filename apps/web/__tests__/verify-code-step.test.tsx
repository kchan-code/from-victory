/**
 * @vitest-environment jsdom
 *
 * FV-671: shared 6-digit code step (signup + unconfirmed sign-in) and the
 * forms that feed it.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { startMock, completeMock, verifyMock, resendMock, signInMock } =
  vi.hoisted(() => ({
    startMock: vi.fn(),
    completeMock: vi.fn(),
    verifyMock: vi.fn(),
    resendMock: vi.fn(),
    signInMock: vi.fn(),
  }));

vi.mock("server-only", () => ({}));
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: (_a: unknown, initial: unknown) => [initial, vi.fn()],
    useFormStatus: () => ({ pending: false }),
  };
});
vi.mock("@/lib/actions/email-signup", () => ({
  startEmailSignup: startMock,
  completeEmailSignup: completeMock,
  verifyEmailOnly: verifyMock,
  resendSignupCode: resendMock,
}));
vi.mock("@/lib/actions/auth", () => ({ signIn: signInMock }));

import { VerifyCodeStep } from "@/components/auth/VerifyCodeStep";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { SignInForm } from "@/components/auth/SignInForm";

beforeEach(() => {
  vi.useFakeTimers();
  resendMock.mockResolvedValue({ ok: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

function step(props: Partial<React.ComponentProps<typeof VerifyCodeStep>> = {}) {
  return render(
    <VerifyCodeStep
      email="a@b.com"
      purpose="signup"
      role="parent"
      action={completeMock}
      retained={{ first_name: "Sam", consent: "on" }}
      onChangeEmail={() => {}}
      {...props}
    />,
  );
}

describe("VerifyCodeStep", () => {
  it("shows the email, labels the input, and focuses it", () => {
    step();
    const input = screen.getByLabelText("6-digit code");
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("pattern", "[0-9]{6}");
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
  });

  it("only accepts digits", () => {
    step();
    const input = screen.getByLabelText("6-digit code") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "12a3-45678" } });
    expect(input.value).toBe("123456");
  });

  it("re-submits retained fields as hidden inputs", () => {
    const { container } = step();
    const get = (n: string) =>
      (container.querySelector(`input[name="${n}"]`) as HTMLInputElement).value;
    expect(get("first_name")).toBe("Sam");
    expect(get("consent")).toBe("on");
    expect(get("email")).toBe("a@b.com");
    expect(get("role")).toBe("parent");
    expect(container.querySelector('input[name="password"]')).toBeNull();
  });

  it("runs a 60s resend cooldown, then resends with purpose and role", async () => {
    step();
    const btn = screen.getByRole("button", { name: /resend code/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Resend code in 60s");
    for (let i = 0; i < 60; i++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(btn).toBeEnabled();
    expect(btn).toHaveTextContent("Resend code");
    await act(async () => {
      fireEvent.click(btn);
    });
    const fd = resendMock.mock.calls[0]![1] as FormData;
    expect(fd.get("email")).toBe("a@b.com");
    expect(fd.get("purpose")).toBe("signup");
    expect(fd.get("role")).toBe("parent");
    expect(btn).toBeDisabled();
    expect(screen.getByText(/sent a new code/i)).toBeInTheDocument();
  });

  it("calls onChangeEmail", () => {
    const onChange = vi.fn();
    step({ onChangeEmail: onChange });
    fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));
    expect(onChange).toHaveBeenCalled();
  });
});

describe("forms", () => {
  it("parent form: guardian attestation is present and role is posted", () => {
    const { container } = render(<SignUpForm />);
    expect(
      screen.getByLabelText(/parent or guardian, 18 or older/i),
    ).toBeRequired();
    expect(container.querySelector('input[name="role"]')).toHaveValue("parent");
  });

  it("sign-in form stays on the sign-in form with no code step initially", () => {
    render(<SignInForm />);
    expect(screen.queryByTestId("verify-code-step")).toBeNull();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
