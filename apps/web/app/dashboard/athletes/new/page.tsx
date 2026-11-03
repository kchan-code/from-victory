import { AuthShell } from "@/components/auth/AuthShell";
import { AthleteForm, type TrialConversionInfo } from "@/components/dashboard/AthleteForm";
import { requireParent } from "@/lib/auth/guards";
import { createServiceClient } from "@/lib/supabase/service";
import { capacityForAppleProduct } from "@/lib/subscriptions/apple-capacity";
import { getActiveAppleProductId } from "@/lib/subscriptions/apple";
import {
  getTrialConversionQuote,
  getTrialConversionState,
} from "@/lib/subscriptions/trial-conversion";

export const metadata = {
  title: "Add an athlete",
};

/**
 * Formats a cents amount as a locale-aware currency string ("$54.00"). Never
 * throws — an unrecognized/odd currency code (shouldn't happen for a Stripe
 * Price, but this copy must never crash the page) falls back to a plain `$`
 * prefix rather than propagating an Intl error.
 */
function formatTotalDueToday(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export default async function NewAthletePage() {
  const { userId: parentId } = await requireParent();
  const service = createServiceClient();

  // FV-586 (KC decision D3, 2026-09-17): adding a second (or later) athlete
  // while the parent's Stripe subscription is mid-trial requires EXPLICIT
  // confirmation that ends the trial and starts the paid family plan
  // immediately — the confirming control below carries the live numbers.
  // "unknown" (a read failure) renders no confirmation block here; the
  // action itself still fail-closed-refuses the add server-side.
  const trialState = await getTrialConversionState(service, parentId);

  let trialConversion: TrialConversionInfo | undefined;
  if (
    trialState.kind === "stripe_trial" &&
    trialState.currentAthleteCount >= 1
  ) {
    const nextQuantity = trialState.currentAthleteCount + 1;
    const quote = await getTrialConversionQuote(service, parentId);

    if (quote.quoteUnavailable) {
      trialConversion = { quoteUnavailable: true, nextQuantity };
    } else {
      // `taxMayApply` = subscription.automatic_tax.enabled (trial-conversion.ts)
      // — only then does the confirm block append "plus applicable tax".
      const taxMayApply = quote.taxMayApply;

      trialConversion = {
        quoteUnavailable: false,
        nextQuantity: quote.nextQuantity,
        interval: quote.interval,
        nextRenewalLabel: quote.nextRenewalLabel,
        totalDueTodayLabel: formatTotalDueToday(
          quote.totalDueTodayCents,
          quote.currency,
        ),
        taxMayApply,
      };
    }
  }

  // FV-586: word a capacity_reached refusal specifically when this payer is
  // on the Apple provider and we know their product's ceiling. `null` (not
  // an Apple payer, or an unmapped product id) falls back to the form's
  // generic phrasing.
  let appleCapacity: number | null = null;
  const appleProductId = await getActiveAppleProductId(service, parentId);
  if (appleProductId) {
    appleCapacity = capacityForAppleProduct(appleProductId);
  }

  return (
    <AuthShell
      title="Add an athlete"
      subtitle="We only need a first name and a birthdate. No email, no last name, no photos."
    >
      <AthleteForm
        trialConversion={trialConversion}
        appleCapacity={appleCapacity}
      />
    </AuthShell>
  );
}
