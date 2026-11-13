import Link from "next/link";

import { BILLING_ISSUE_COPY } from "@/lib/subscriptions/billing-issue-copy";
import type { PayerBillingIssue } from "@/lib/subscriptions/billing-issue";

interface PaymentIssueNoticeProps {
  issue: NonNullable<PayerBillingIssue>;
  /** Any native store shell. Stripe-bound UI (link, price) must not render. */
  nativeShell: boolean;
  /**
   * Where the Stripe "update payment method" link goes (web only). Omit on a
   * surface that already shows the billing-portal button; the notice then
   * points at it in text instead of linking.
   */
  manageHref?: string;
  testId?: string;
  className?: string;
}

/**
 * FV-710: tells the PAYER (parent / adult athlete) a payment failed and how to
 * fix it. Presentational Server Component. The stage is spelled out in the
 * label, so meaning never rides on colour alone. Never rendered for a minor
 * athlete (callers are payer-only surfaces).
 */
export function PaymentIssueNotice({
  issue,
  nativeShell,
  manageHref,
  testId = "payment-issue-notice",
  className = "mb-10",
}: PaymentIssueNoticeProps) {
  const body =
    issue.stage === "lapsed"
      ? BILLING_ISSUE_COPY.lapsed
      : BILLING_ISSUE_COPY.grace;

  return (
    <section
      aria-label="Payment"
      role="status"
      data-testid={testId}
      data-stage={issue.stage}
      data-provider={issue.provider}
      className={`${className} bg-charcoal border border-hairline rounded-2xl px-5 py-5`}
    >
      <p className="font-mono font-semibold uppercase tracking-[0.18em] text-[10px] text-gold mb-2">
        {BILLING_ISSUE_COPY.heading}
      </p>
      <p className="font-body text-cream text-[14px] leading-relaxed mb-3">
        {body}
      </p>
      {issue.provider === "apple" ? (
        <p className="font-body text-cream/70 text-[13px] leading-relaxed">
          {BILLING_ISSUE_COPY.fixApple}
        </p>
      ) : nativeShell ? (
        <p
          data-testid={`${testId}-native`}
          className="font-body text-cream/70 text-[13px] leading-relaxed"
        >
          {BILLING_ISSUE_COPY.fixStripeNative}
        </p>
      ) : manageHref ? (
        <Link
          href={manageHref}
          data-testid={`${testId}-fix`}
          className="inline-flex items-center justify-center font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 min-h-[44px] no-underline hover:bg-gold-bright transition-colors duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx active:scale-[0.98]"
        >
          {BILLING_ISSUE_COPY.fixStripeLink}
        </Link>
      ) : (
        <p className="font-body text-cream/70 text-[13px] leading-relaxed">
          {BILLING_ISSUE_COPY.fixStripeBelow}
        </p>
      )}
    </section>
  );
}
