/**
 * FV-710: every string the payer sees about a failed payment, in one place so
 * the copy can be reviewed (and changed) without touching any page. Pure data;
 * not `server-only`. Voice: docs/gtm/voice-and-guardrails.md (plain, calm, no
 * urgency, no exclamation marks). Payer-facing only (parent / adult athlete).
 */
export const BILLING_ISSUE_COPY = {
  heading: "Payment",
  grace:
    "Your last payment didn't go through. Update your payment method to keep training going.",
  lapsed:
    "Training is paused because your last payment didn't go through. Update your payment method and it comes back on by itself, or subscribe again below.",
  fixApple:
    "On your iPhone, open Settings, tap your name, then Payment & Shipping (or Subscriptions).",
  fixStripeLink: "Update payment method",
  fixStripeBelow: "Use Manage subscription below to update your payment method.",
  fixStripeNative:
    "Update your payment method from a web browser at fromvictoryapp.com.",
} as const;
