"use client";
// client: interactive annual/monthly segmented control (useState). SSR
// renders with "annual" selected — matching the initial client state — so
// there is no hydration mismatch; the control only swaps the displayed
// price after a tap (FV-516).

import Link from "next/link";
import { FlameMark } from "@/components/ui";
import { SvgIcon } from "@/components/landing/SvgIcon";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Billing interval data
// ---------------------------------------------------------------------------
type Interval = "annual" | "monthly";
const INTERVAL_IDS: Interval[] = ["annual", "monthly"];

interface IntervalOption {
  id: Interval;
  label: string;
  price: string;
  period: string;
}

const INTERVALS: IntervalOption[] = [
  { id: "annual", label: "Annual", price: "$49", period: "/yr" },
  { id: "monthly", label: "Monthly", price: "$5", period: "/mo" },
];

// Shared feature list — existing copy, verbatim, stated once regardless of
// the selected billing interval (both intervals include everything).
const FEATURES = [
  "Daily training session (hockey, basketball, golf, football, baseball, lacrosse & soccer)",
  "Pregame guided audio (~5 min)",
  "Pre-practice lock-in",
  "Journey view — 30-day session map",
  "Rhythm visualization (not a streak counter)",
  "Parent dashboard — rhythm + session count",
  "14-day free trial",
  "Cancel anytime",
];

export function PricingPlanCard() {
  const [interval, setInterval] = useState<Interval>("annual");
  const isAnnual = interval === "annual";

  // Arrow-key navigation within the radiogroup (ARIA radiogroup pattern —
  // mirrors SubscribeForm.tsx:186-223, plus moving DOM focus to the newly
  // selected radio so the roving tabIndex and the focus ring stay in sync).
  const selectAndFocus = (id: Interval) => {
    setInterval(id);
    document.getElementById(`interval-${id}`)?.focus();
  };
  const handleGroupKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = INTERVAL_IDS.indexOf(interval);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = INTERVAL_IDS[(currentIndex + 1) % INTERVAL_IDS.length];
      if (next != null) selectAndFocus(next);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev =
        INTERVAL_IDS[(currentIndex - 1 + INTERVAL_IDS.length) % INTERVAL_IDS.length];
      if (prev != null) selectAndFocus(prev);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto">
      {/* Billing-interval segmented control. Both prices are always visible
          on the control itself, so monthly is never hidden or hard to find. */}
      <div
        role="radiogroup"
        aria-label="Billing interval"
        onKeyDown={handleGroupKeyDown}
        data-testid="interval-radiogroup"
        className="grid grid-cols-2 gap-1 p-1 rounded-pill mb-7"
        style={{
          background: "var(--bg-elev-1)",
          border: "1px solid var(--fv-hairline-2)",
        }}
      >
        {INTERVALS.map((opt) => {
          const selected = opt.id === interval;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              id={`interval-${opt.id}`}
              data-testid={`interval-${opt.id}`}
              onClick={() => setInterval(opt.id)}
              className={[
                "flex items-center justify-center gap-1.5 rounded-pill min-h-[48px] px-4 font-heading font-semibold text-[14px] transition-colors duration-base ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
                selected
                  ? "bg-cobalt text-cream"
                  : "bg-transparent text-cream/55 hover:text-cream/80",
              ].join(" ")}
            >
              {opt.label}
              <span
                className={selected ? "text-cream/85" : "text-cream/55"}
                aria-hidden={false}
              >
                {opt.price}
                {opt.period}
              </span>
            </button>
          );
        })}
      </div>

      {/* Plan card */}
      <div
        className="rounded-[24px] p-8 flex flex-col relative"
        style={{
          background:
            "linear-gradient(180deg,rgba(223,175,55,0.10),rgba(223,175,55,0)),var(--bg-elev-1)",
          border: "1px solid rgba(223,175,55,0.4)",
          boxShadow: "0 0 0 1px rgba(223,175,55,0.15)",
        }}
      >
        {/* Best-value badge — annual only */}
        {isAnnual ? (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div className="bg-gold text-onyx font-mono font-semibold text-[10px] tracking-[0.18em] uppercase px-3 py-1 rounded-pill whitespace-nowrap">
              Best value
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2.5 mb-5 pt-2">
          <FlameMark size={16} />
          <span className="fv-eyebrow gold">
            {isAnnual ? "Annual plan" : "Monthly plan"}
          </span>
        </div>

        <div className="mb-1">
          <span
            data-testid="plan-price"
            className="font-display font-extrabold text-[52px] leading-none text-cream tracking-[-0.02em]"
          >
            {isAnnual ? "$49" : "$5"}
          </span>
          <span className="font-body text-[15px] text-cream/50 ml-1.5">
            {isAnnual ? "/ year" : "/ month"}
          </span>
        </div>

        {isAnnual ? (
          <div
            data-testid="plan-additional"
            className="font-body text-[13px] text-cream/55 mb-2"
          >
            $49/yr for your first athlete &mdash; $29/yr each additional
            athlete
          </div>
        ) : (
          <>
            <div className="font-body text-[13px] text-cream/50 mb-1">
              Billed monthly, $60 per year
            </div>
            <div
              data-testid="plan-additional"
              className="font-body text-[13px] text-cream/55 mb-2"
            >
              $3/mo each additional athlete
            </div>
          </>
        )}

        <div className="h-px bg-hairline mt-2 mb-7" />

        <ul className="flex flex-col gap-3 m-0 p-0 list-none flex-1 mb-8">
          {FEATURES.map((feat) => (
            <li key={feat} className="flex items-start gap-3">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-gold flex-none mt-0.5"
                style={{ background: "var(--fv-gold-soft)" }}
                aria-hidden
              >
                <SvgIcon name="check" size={8} />
              </div>
              <span className="font-body text-[13.5px] text-cream/80 leading-[1.45]">
                {feat}
              </span>
            </li>
          ))}
        </ul>

        {/* One primary CTA, with trial + cancel-anytime terms directly
            adjacent — thumb-reachable, single dominant gold element. */}
        <Link
          href="/signup"
          data-testid="plan-cta"
          className="w-full inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
        >
          Start your athlete&apos;s free trial
          <SvgIcon name="arrow" size={16} />
        </Link>
        <p
          data-testid="plan-cta-terms"
          className="text-center font-mono text-[10px] tracking-[0.12em] uppercase text-cream/55 font-semibold mt-3"
        >
          14 days free &mdash; cancel anytime
        </p>
      </div>
    </div>
  );
}
