import type { ReactNode } from "react";

/**
 * What-happens-next + billing-expectation line, placed adjacent to a signup
 * submit button. Reuses the FTC-compliant auto-charge disclosure verbatim
 * from SubscribeForm (`components/subscribe/SubscribeForm.tsx`,
 * data-testid="trial-autocharge-disclosure") — a card is always required
 * to start the trial (`lib/actions/subscription.ts`); never claim
 * otherwise. Pure presentation: no eligibility check, no redirect, no
 * sequence enforcement.
 */
type Props = {
  children: ReactNode;
};

export function TrialDisclosure({ children }: Props) {
  return (
    <p
      data-testid="trial-autocharge-disclosure"
      className="mt-4 font-body text-cream/50 text-[12px] leading-relaxed"
    >
      {children}
    </p>
  );
}
