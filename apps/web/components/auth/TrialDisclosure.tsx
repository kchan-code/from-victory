/**
 * Price and trial lines under a signup submit button.
 *
 * Web and PWA only. Native shells omit this block: ios-iap prices and the
 * trial come from StoreKit on /subscribe, and restricted shells do not show
 * a price. The card-required auto-charge sentence stays on SubscribeForm,
 * next to checkout.
 */
type Props = {
  /** Smaller line under the price and cancel lines. */
  detail: string;
};

export function TrialDisclosure({ detail }: Props) {
  return (
    <div data-testid="signup-trial-note" className="mt-4 text-center">
      <p className="font-body text-cream/80 text-[14px] leading-relaxed m-0">
        7 days free, then $5/mo or $49/yr.
      </p>
      <p className="font-body text-cream/80 text-[14px] leading-relaxed m-0">
        Cancel anytime.
      </p>
      <p className="mt-2 font-body text-cream/50 text-[12px] leading-relaxed m-0">
        {detail}
      </p>
    </div>
  );
}

/**
 * iOS shell only (FV-719). No web price, no trial length, no card line.
 * StoreKit shows Apple's price and terms on the subscription step.
 */
export function IosSignupSubscriptionNote() {
  return (
    <p
      data-testid="signup-ios-subscription-note"
      className="mt-4 text-center font-body text-cream/80 text-[14px] leading-relaxed m-0"
    >
      After you create your account, you choose a subscription in the app.
    </p>
  );
}
