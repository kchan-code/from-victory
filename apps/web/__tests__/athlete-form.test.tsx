/**
 * @vitest-environment jsdom
 *
 * RTL tests for AthleteForm's FV-586 (KC decision D3) trial-to-family
 * confirmation block, plus the pre-existing capacity/generic-error rendering
 * it now shares a code-switch with.
 *
 * `useFormState` is shimmed (same pattern as subscribe-form.test.tsx /
 * dashboard-seat-selection.test.tsx — Next aliases react-dom to a canary
 * build the plain npm package Vitest resolves doesn't export) with a
 * test-controllable override so each case can assert the render for a given
 * `CreateAthleteState` WITHOUT actually submitting a form through jsdom
 * (this codebase's established pattern — see the shim's own tests above for
 * precedent: they only ever assert pre-submission markup).
 */

import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import type { CreateAthleteState } from "@/lib/actions/athletes";

const { formStateOverride } = vi.hoisted(() => ({
  formStateOverride: { current: null as CreateAthleteState },
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

// The real module transitively imports Stripe/Supabase server modules —
// AthleteForm only needs the type + the (never-invoked, since useFormState
// is shimmed) function reference.
vi.mock("@/lib/actions/athletes", () => ({
  createAthlete: vi.fn(),
}));

import { AthleteForm } from "@/components/dashboard/AthleteForm";

afterEach(() => {
  cleanup();
  formStateOverride.current = null;
});

const QUOTED: NonNullable<
  ComponentProps<typeof AthleteForm>["trialConversion"]
> = {
  quoteUnavailable: false,
  nextQuantity: 2,
  interval: "month",
  nextRenewalLabel: "every month",
  totalDueTodayLabel: "$8.00",
  taxMayApply: false,
};

describe("AthleteForm — absent trialConversion (unchanged behavior)", () => {
  it("renders the base form with no confirmation block and the original submit label", () => {
    render(<AthleteForm />);

    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Birthdate")).toBeInTheDocument();
    expect(screen.queryByTestId("trial-conversion-confirm")).toBeNull();
    expect(screen.getByRole("button", { name: "Add athlete" })).toBeEnabled();
  });

  it("still renders a plain generic error exactly as before (no code)", () => {
    formStateOverride.current = {
      ok: false,
      error: "Could not create the athlete account. Please try again.",
    };
    render(<AthleteForm />);

    expect(
      screen.getByText(
        "Could not create the athlete account. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("athlete-form-error")).toBeNull();
  });

  it("still renders a field-scoped error on the matching field only", () => {
    formStateOverride.current = {
      ok: false,
      error: "Athletes must be 13 or older.",
      field: "birthdate",
    };
    render(<AthleteForm />);

    expect(screen.getByText("Athletes must be 13 or older.")).toBeInTheDocument();
  });
});

describe("AthleteForm — trial-to-family confirmation block (FV-586)", () => {
  it("hidden field is absent and submit disabled until the checkbox is checked", () => {
    render(<AthleteForm trialConversion={QUOTED} />);

    const checkbox = screen.getByTestId("trial-conversion-checkbox");
    const submit = screen.getByRole("button", {
      name: "End trial and add athlete",
    });

    expect(checkbox).not.toBeChecked();
    expect(submit).toBeDisabled();
    expect(
      document.querySelector('input[name="trialConversionConfirmed"]'),
    ).toBeNull();

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(submit).toBeEnabled();
    const hidden = document.querySelector(
      'input[name="trialConversionConfirmed"]',
    );
    expect(hidden).not.toBeNull();
    expect(hidden).toHaveAttribute("value", "true");

    // Unchecking removes the hidden field again — the confirmation must be
    // live, not "ever checked once."
    fireEvent.click(checkbox);
    expect(submit).toBeDisabled();
    expect(
      document.querySelector('input[name="trialConversionConfirmed"]'),
    ).toBeNull();
  });

  it("renders the plan, priced total, and renewal cadence from a resolved quote", () => {
    render(<AthleteForm trialConversion={QUOTED} />);

    const block = screen.getByTestId("trial-conversion-confirm");
    expect(block.textContent).toContain("Your free trial ends today.");
    expect(block.textContent).toContain("Family plan for 2 athletes (monthly)");
    expect(block.textContent).toContain("You’ll be charged $8.00 today.");
    expect(block.textContent).not.toContain("plus applicable tax");
    expect(block.textContent).toContain("Your plan renews every month at that rate.");
  });

  it("appends the tax-may-apply suffix when taxMayApply is true", () => {
    render(
      <AthleteForm
        trialConversion={{ ...QUOTED, taxMayApply: true }}
      />,
    );

    const block = screen.getByTestId("trial-conversion-confirm");
    expect(block.textContent).toContain(
      "You’ll be charged $8.00 today plus applicable tax.",
    );
  });

  it("falls back to non-numeric copy with a /subscribe link when the quote is unavailable", () => {
    render(
      <AthleteForm
        trialConversion={{ quoteUnavailable: true, nextQuantity: 3 }}
      />,
    );

    const block = screen.getByTestId("trial-conversion-confirm");
    expect(block.textContent).toContain(
      "You’ll be charged the family rate for 3 athletes today.",
    );
    expect(block.textContent).not.toMatch(/\$\d/);
    const link = block.querySelector('a[href="/subscribe"]');
    expect(link).not.toBeNull();
  });
});

describe("AthleteForm — error codes (FV-586 / FV-570)", () => {
  it("trial_conversion_required shows an inline prompt to check the box", () => {
    formStateOverride.current = {
      ok: false,
      error: "trial_conversion_required",
      code: "trial_conversion_required",
    };
    render(<AthleteForm trialConversion={QUOTED} />);

    expect(
      screen.getByText("Check the box to confirm before adding an athlete."),
    ).toBeInTheDocument();
    // Never the raw code string.
    expect(screen.queryByText("trial_conversion_required")).toBeNull();
  });

  it("trial_conversion_payment_failed shows a calm decline message with a billing control", () => {
    formStateOverride.current = {
      ok: false,
      error: "trial_conversion_payment_failed",
      code: "trial_conversion_payment_failed",
    };
    render(<AthleteForm trialConversion={QUOTED} />);

    expect(
      screen.getByText(
        "Your card was declined or needs extra verification. Update your card in Billing, then try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("billing-portal-btn")).toBeInTheDocument();
  });

  it("capacity_reached uses the specific Apple-tier copy when the capacity is known", () => {
    formStateOverride.current = {
      ok: false,
      error: "capacity_reached",
      code: "capacity_reached",
    };
    render(<AthleteForm appleCapacity={5} />);

    const err = screen.getByTestId("athlete-form-error");
    expect(err.textContent).toContain("Your plan covers 5 athletes.");
    expect(err.querySelector('a[href="/subscribe"]')).not.toBeNull();
  });

  it("capacity_reached falls back to generic phrasing when the capacity is unknown", () => {
    formStateOverride.current = {
      ok: false,
      error: "capacity_reached",
      code: "capacity_reached",
    };
    render(<AthleteForm appleCapacity={null} />);

    const err = screen.getByTestId("athlete-form-error");
    expect(err.textContent).toContain("You’ve reached your plan’s athlete limit.");
  });
});
