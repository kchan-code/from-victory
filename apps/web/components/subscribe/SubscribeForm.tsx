"use client";
// client: interactive plan selection (radio group state, useState) +
// useFormState for the createCheckoutSession server action +
// useFormStatus for pending submit button state.

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { createCheckoutSession } from "@/lib/actions/subscription";

// Mirror the discriminated-union from lib/actions/subscription.ts.
// We import the action as a value; its return-type is typed via the
// SubscriptionActionState alias here so this file has no "server-only" dep.
type SubscriptionActionState = { ok: false; error: string } | null;

const initialState: SubscriptionActionState = null;

// ---------------------------------------------------------------------------
// Plan data
// ---------------------------------------------------------------------------
type Plan = "monthly" | "annual";

interface PlanOption {
  id: Plan;
  label: string;
  price: string;
  period: string;
  badge?: string;
  detail: string;
}

const PLANS: PlanOption[] = [
  {
    id: "annual",
    label: "Annual",
    price: "$79",
    period: "per year",
    badge: "Best value",
    detail: "Save 27% vs monthly — about $6.58/mo",
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "$8.99",
    period: "per month",
    detail: "Flexible — cancel any time",
  },
];

// ---------------------------------------------------------------------------
// Submit button — isolated so useFormStatus sees the enclosing <form>
// ---------------------------------------------------------------------------
function CheckoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="subscribe-submit"
      className="w-full bg-gold text-onyx border border-gold font-heading font-semibold text-[16px] rounded-pill px-6 min-h-[56px] transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
    >
      {pending ? "Redirecting to checkout…" : "Continue to checkout"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Plan card — visually represents one option in the radiogroup
// ---------------------------------------------------------------------------
interface PlanCardProps {
  plan: PlanOption;
  selected: boolean;
  onSelect: (id: Plan) => void;
}

function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(plan.id);
    }
    // Arrow-key navigation within the radiogroup is handled by the
    // parent radiogroup via arrow-key delegation (see SubscribeForm).
  };

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      id={`plan-${plan.id}`}
      data-testid={`plan-card-${plan.id}`}
      onClick={() => onSelect(plan.id)}
      onKeyDown={handleKeyDown}
      className={[
        "relative cursor-pointer rounded-2xl border px-5 py-5 transition-all duration-base ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
        selected
          ? "bg-charcoal border-gold shadow-glow-gold"
          : "bg-charcoal border-hairline hover:border-hairline-strong",
      ].join(" ")}
    >
      {/* Best-value badge */}
      {plan.badge != null ? (
        <span className="absolute -top-3 left-4 font-mono font-semibold uppercase tracking-[0.14em] text-[10px] text-onyx bg-gold rounded-pill px-3 py-1">
          {plan.badge}
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        {/* Label + detail */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold uppercase tracking-[0.06em] text-cream text-[17px] leading-tight mb-1">
            {plan.label}
          </p>
          <p className="font-body text-cream/60 text-[13px] leading-snug">
            {plan.detail}
          </p>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <span className="font-display font-extrabold text-cream text-[26px] leading-none">
            {plan.price}
          </span>
          <br />
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-cream/50">
            {plan.period}
          </span>
        </div>
      </div>

      {/* Radio indicator dot (decorative; role="radio" + aria-checked is the a11y layer) */}
      <div
        className={[
          "mt-4 ml-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-fast ease-out",
          selected
            ? "border-gold bg-gold"
            : "border-hairline-strong bg-transparent",
        ].join(" ")}
        aria-hidden
      >
        {selected ? <div className="w-2 h-2 rounded-full bg-onyx" /> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------
export function SubscribeForm() {
  const [selected, setSelected] = useState<Plan>("annual");
  const [actionState, formAction] = useFormState(
    createCheckoutSession,
    initialState,
  );

  // Arrow-key navigation within the radiogroup (ARIA radiogroup pattern).
  const handleGroupKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const planIds: Plan[] = ["annual", "monthly"];
    const currentIndex = planIds.indexOf(selected);
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = planIds[(currentIndex + 1) % planIds.length];
      if (next != null) setSelected(next);
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = planIds[(currentIndex - 1 + planIds.length) % planIds.length];
      if (prev != null) setSelected(prev);
    }
  };

  return (
    <form action={formAction}>
      {/* Hidden plan input bound to selection */}
      <input type="hidden" name="plan" value={selected} />

      {/* Plan radiogroup */}
      <div
        role="radiogroup"
        aria-label="Subscription plan"
        aria-required="true"
        onKeyDown={handleGroupKeyDown}
        className="flex flex-col gap-5 mb-7"
      >
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selected === plan.id}
            onSelect={setSelected}
          />
        ))}
      </div>

      {/* Value prop reminder */}
      <p className="font-body text-cream/50 text-[13px] leading-relaxed mb-7">
        One subscription covers all your athletes.
      </p>

      {/* Inline error */}
      {actionState != null && !actionState.ok ? (
        <p
          role="alert"
          className="mb-5 font-body text-[14px] text-danger leading-snug"
        >
          {actionState.error}
        </p>
      ) : null}

      {/* Submit */}
      <CheckoutButton />
    </form>
  );
}
