import { AuthShell } from "@/components/auth/AuthShell";
import { AthleteForm, type TrialConversionInfo } from "@/components/dashboard/AthleteForm";
import { requireParent } from "@/lib/auth/guards";
import { getRequestShellCapability } from "@/lib/native-shell";
import { isRestrictedShell } from "@/lib/native-shell-restricted";
import {
  GOOGLE_PLAY_CATALOG,
  isGooglePlayCatalogActive,
} from "@/lib/subscriptions/google-product-catalog";
import { getSubscribeEntitlementState } from "@/lib/subscriptions/subscribe-guard";
import { getGoogleEntitlementSnapshotForPayer } from "@/lib/subscriptions/google";
import { googleSubscriptionAccessLevel } from "@/lib/subscriptions/google-access-level";
import { createServiceClient } from "@/lib/supabase/service";
import {
  capacityForAppleProduct,
  getCapacityAppleProductId,
} from "@/lib/subscriptions/apple-capacity";
import {
  getTrialConversionQuote,
  getTrialConversionState,
} from "@/lib/subscriptions/trial-conversion";
import type { GoogleSubscriptionStatus } from "@/lib/subscriptions/google-access-level";

export const metadata = {
  title: "Add an athlete",
};

function isGoogleTrialActive(
  offerId: string | null,
  createdAt: string | null | undefined,
  now: Date,
): boolean {
  if (offerId !== "trial-7d" || !createdAt) return false;
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return false;
  return now.getTime() - createdMs < 7 * 24 * 60 * 60 * 1000;
}

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

  // FV-622 (Android Path A): the legacy-native shell is consumption-only and
  // adding an athlete can change Stripe billing, so a deep link here renders
  // the plain, non-tappable website notice instead of the form — and skips the
  // trial-quote (Stripe) read entirely. ios-iap and web are unchanged.
  const shellCapability = await getRequestShellCapability();
  const androidPlayCatalogEnabled =
    shellCapability === "android-play" && isGooglePlayCatalogActive();
  let androidPlayPurchaseEligible = false;
  if (androidPlayCatalogEnabled) {
    const entitlement = await getSubscribeEntitlementState(parentId);
    androidPlayPurchaseEligible =
      entitlement.status === "not_entitled" ||
      (entitlement.status === "entitled" &&
        entitlement.provider === "google");
  }
  const googlePlayUiEnabled =
    androidPlayCatalogEnabled && androidPlayPurchaseEligible;
  if (isRestrictedShell(shellCapability) && !googlePlayUiEnabled) {
    return (
      <AuthShell title="Add an athlete">
        <div
          role="status"
          data-testid="add-athlete-native-shell-notice"
          className="bg-charcoal border border-hairline rounded-xl px-5 py-5"
        >
          <p className="font-body text-cream/70 text-[15px] leading-relaxed">
            Add athletes from a web browser at fromvictoryapp.com.
          </p>
        </div>
      </AuthShell>
    );
  }

  const service = createServiceClient();
  // Only the Google Play upgrade path reads this count.
  let currentAthleteCount: number | null = null;
  if (googlePlayUiEnabled) {
    const { count } = await service
      .from("parent_athlete_links")
      .select("athlete_id", { count: "exact", head: true })
      .eq("parent_id", parentId);
    currentAthleteCount = count;
  }

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
  const appleProductId = await getCapacityAppleProductId(service, parentId);
  if (appleProductId) {
    appleCapacity = capacityForAppleProduct(appleProductId);
  }

  let googleUpgrade:
    | {
        currentCapacity: number;
        nextCapacity: number | null;
        currentProductId: string;
        currentBasePlanId: string;
        nextProductId: string | null;
        nextBasePlanId: string | null;
        trialEndingToday: boolean;
        pricePeriodLabel: "per month" | "per year";
      }
    | undefined;

  if (googlePlayUiEnabled) {
    const now = new Date();
    const snapshot = await getGoogleEntitlementSnapshotForPayer(
      service,
      parentId,
      now,
    );
    const { data: googleRows } = await service
      .from("google_subscriptions")
      .select(
        "product_id, base_plan_id, offer_id, status, acknowledged, expires_at, created_at",
      )
      .eq("payer_id", parentId)
      .eq("is_test_purchase", false);
    const sorted =
      snapshot.activeProductId === null
        ? []
        : [...(googleRows ?? [])]
            .filter((row) => row.product_id === snapshot.activeProductId)
            .sort((a, b) => {
              const levelRank = { full: 2, degraded: 1, blocked: 0 } as const;
              const aLevel = googleSubscriptionAccessLevel(
                a.status as GoogleSubscriptionStatus,
                a.expires_at,
                now,
              );
              const bLevel = googleSubscriptionAccessLevel(
                b.status as GoogleSubscriptionStatus,
                b.expires_at,
                now,
              );
              const levelDelta = levelRank[bLevel] - levelRank[aLevel];
              if (levelDelta !== 0) return levelDelta;
              const expiryDelta =
                (b.expires_at ? new Date(b.expires_at).getTime() : 0) -
                (a.expires_at ? new Date(a.expires_at).getTime() : 0);
              if (expiryDelta !== 0) return expiryDelta;
              return Number(b.acknowledged) - Number(a.acknowledged);
            });
    const current = snapshot.level === "blocked" ? null : sorted[0];
    if (current && current.status !== "pending") {
      const entry = GOOGLE_PLAY_CATALOG.find(
        (catalogEntry) =>
          catalogEntry.productId === current.product_id &&
          catalogEntry.basePlanId === current.base_plan_id,
      );
      if (entry) {
        const nextCapacity = entry.athleteCapacity < 5 ? entry.athleteCapacity + 1 : null;
        const nextEntry =
          nextCapacity === null
            ? null
            : GOOGLE_PLAY_CATALOG.find(
                (catalogEntry) =>
                  catalogEntry.athleteCapacity === nextCapacity &&
                  catalogEntry.interval === entry.interval,
              );
        const count = currentAthleteCount ?? 0;
        if (count >= entry.athleteCapacity) {
          googleUpgrade = {
            currentCapacity: entry.athleteCapacity,
            nextCapacity,
            currentProductId: current.product_id,
            currentBasePlanId: current.base_plan_id,
            nextProductId: nextEntry?.productId ?? null,
            nextBasePlanId: nextEntry?.basePlanId ?? null,
            trialEndingToday: isGoogleTrialActive(
              current.offer_id,
              current.created_at,
              now,
            ),
            pricePeriodLabel: entry.interval === "month" ? "per month" : "per year",
          };
        }
      }
    }
  }

  return (
    <AuthShell
      title="Add an athlete"
      subtitle="We only need a first name and a birthdate. No email, no last name, no photos."
    >
      <AthleteForm
        trialConversion={trialConversion}
        appleCapacity={appleCapacity}
        googleUpgrade={googleUpgrade}
      />
    </AuthShell>
  );
}
