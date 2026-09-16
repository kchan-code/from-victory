import { type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { requireSubscriber } from "@/lib/auth/guards";
import { createCheckoutSession, createAdultCheckoutSession } from "@/lib/actions/subscription";
import { getRequestShellCapability } from "@/lib/native-shell";
import { getParentAccessLevel } from "@/lib/subscriptions/access";
import { isSubscriptionEnforcementEnabled } from "@/lib/subscriptions/enforce";
import { getSubscribeEntitlementState } from "@/lib/subscriptions/subscribe-guard";
import { createClient } from "@/lib/supabase/server";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";
import { AppleSubscribeSection } from "@/components/subscribe/AppleSubscribeSection";

export const metadata = {
  title: "Subscribe",
};

type Props = {
  searchParams: { status?: string };
};

/**
 * Shared "calm status card" shell (role="status", charcoal/hairline card —
 * the same pattern already used by the legacy-native notice and the Apple
 * "unavailable" state) for the FV-581 entitled/unknown branches below.
 */
function StatusCard({
  testId,
  children,
}: {
  testId: string;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      data-testid={testId}
      className="bg-charcoal border border-hairline rounded-xl px-5 py-5"
    >
      {children}
    </div>
  );
}

export default async function SubscribePage({ searchParams }: Props) {
  const { userId, profile } = await requireSubscriber();

  // FV-442: reused below for the trial gate (FV-574), the price paragraph,
  // and the SubscribeForm prop so the adult_athlete check isn't recomputed.
  const isAdult = profile.role === "adult_athlete";

  // FV-581 (decision record §4.4 "duplicate-billing guard"): a payer already
  // entitled through ANY provider must never see a fresh buy button — this
  // single server-computed state branches the whole content region below
  // into the purchase flow (not_entitled), management/status copy
  // (entitled), or a neutral fail-safe (unknown — an underlying read
  // errored; never treated as "go ahead and buy").
  const entitlementState = await getSubscribeEntitlementState(userId);

  // Trial-eligibility reads are a purchase-flow-only concern — an entitled
  // or unknown-status payer never reaches the trial banner or SubscribeForm,
  // so skip these reads entirely rather than run them for no reason.
  let trialEligible = false;
  if (entitlementState.status === "not_entitled") {
    // Derive trial eligibility server-side: no existing subscriptions row →
    // first-time subscriber → eligible. Reuses the same RLS-scoped client pattern
    // as the checkout action. We only need to know whether the row exists — we
    // don't need any column values — so select a minimal field.
    const supabase = createClient();
    const { data: existingSub, error: subReadError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("parent_id", userId)
      .maybeSingle();

    // FV-574: the 7-day trial applies only to one-athlete checkouts, so the
    // banner (a consumer-protection disclosure — see SubscribeForm) must not
    // promise it to a multi-athlete family. Mirror the checkout action's
    // condition: parents qualify with at most one linked athlete (0 athletes
    // floors to a 1-seat checkout); adults are always quantity 1. Fail closed
    // on a count read error — never promise a trial the action (the
    // authoritative gate) might not grant.
    let trialQuantityEligible: boolean;
    if (isAdult) {
      trialQuantityEligible = true;
    } else if (existingSub !== null || subReadError !== null) {
      // Returning subscriber (or unreadable sub row): the banner is hidden
      // regardless, so skip the count read entirely (qa perf note, PR #513).
      trialQuantityEligible = false;
    } else {
      const athleteCountResult = await supabase
        .from("parent_athlete_links")
        .select("athlete_id", { count: "exact", head: true })
        .eq("parent_id", userId);
      trialQuantityEligible =
        athleteCountResult.error === null &&
        (athleteCountResult.count ?? 0) <= 1;
    }

    // Fail closed on a read error: never promise a trial the action (the
    // authoritative gate) might not grant.
    trialEligible =
      subReadError === null && existingSub === null && trialQuantityEligible;
  }

  const wasCanceled = searchParams.status === "canceled";

  // Google Play "no in-app purchase" compliance: inside the Capacitor shell,
  // checkout.stripe.com has no reachable path (it's deliberately not in
  // allowNavigation — see apps/native/capacitor.config.ts), so this page
  // must not show a price, a checkout button, or a link toward Stripe. FV-572
  // additionally distinguishes an iOS build capable of a native StoreKit
  // purchase surface ("ios-iap") from every other/older native shell
  // ("legacy-native", restricted, unchanged) — see getRequestShellCapability().
  const shellCapability = getRequestShellCapability();
  const nativeShell = shellCapability !== null;

  // FV-464: when subscription enforcement would bounce this user straight
  // back here, the app targets below are a dead loop — send them to the
  // public home instead. Mirrors the exact condition requireActiveAccess uses.
  const wouldBounce =
    isSubscriptionEnforcementEnabled() &&
    (await getParentAccessLevel(userId)) === "blocked";

  // Role-aware navigation targets.
  const dashboardHref = wouldBounce ? "/" : isAdult ? "/athlete" : "/dashboard";
  // FV-328: the aria-label must match the destination (the href is role-aware).
  const backLabel = wouldBounce
    ? "Back to home"
    : isAdult
      ? "Back to training"
      : "Back to dashboard";

  // Role-aware checkout action.
  const checkoutAction = isAdult
    ? createAdultCheckoutSession
    : createCheckoutSession;

  return (
    <main id="main-content" className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[560px]">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <Link href={dashboardHref} aria-label={backLabel}>
            <Image
              src="/logo-stacked.svg"
              alt="From Victory"
              width={105}
              height={60}
              className="h-14 w-auto"
              priority
            />
          </Link>
          <Link
            href={dashboardHref}
            className="font-heading font-semibold text-[14px] text-cream/70 hover:text-cream bg-charcoal border border-hairline rounded-pill px-5 py-2.5 transition-colors duration-fast ease-out no-underline"
          >
            Back
          </Link>
        </header>

        {/* Canceled note */}
        {wasCanceled ? (
          <div
            role="status"
            className="mb-8 bg-charcoal border border-hairline rounded-xl px-5 py-4"
          >
            <p className="font-body text-cream/70 text-[14px] leading-relaxed">
              Checkout canceled&nbsp;&mdash; no charge was made. Pick a plan
              when you&rsquo;re ready.
            </p>
          </div>
        ) : null}

        {/* Heading block */}
        <section className="mb-10">
          <p className="font-mono font-semibold uppercase tracking-[0.18em] text-[11px] text-gold mb-3">
            Subscription
          </p>
          <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[36px] sm:text-[44px] leading-[1.05] mb-4">
            Train every day.
          </h1>
          <p className="font-body text-cream/70 text-[15px] leading-relaxed max-w-[42ch]">
            {/* FV-581 price-leak guard: an already-entitled (or
                unknown-status) payer must never see a dollar figure here —
                same price-free copy the native shells already use. Only the
                not_entitled purchase flow keeps today's priced copy. */}
            {nativeShell || entitlementState.status !== "not_entitled" ? (
              <>
                Daily mental-toughness training with faith built
                in&nbsp;&mdash; one session per day combining a mental skill
                and a scripture foundation.
              </>
            ) : isAdult ? (
              <>
                $5/mo or $49/yr. Cancel any time. Daily mental-toughness
                training with faith built in&nbsp;&mdash; one session per day
                combining a mental skill and a scripture foundation.
              </>
            ) : (
              <>
                $5/mo or $49/yr for your first athlete; $3/mo or $29/yr for
                each additional athlete. Daily mental-toughness training with
                faith built in&nbsp;&mdash; one session per day combining a
                mental skill and a scripture foundation.
              </>
            )}
          </p>
        </section>

        {/* FV-581 (decision record §4.4 "duplicate-billing guard"): the main
            content region below is keyed FIRST on server-computed
            entitlement status, THEN (within not_entitled and entitled) on
            shell capability. "unknown" (an underlying read errored) is
            fail-safe: same neutral status on every shell, never a buy
            affordance, never a false "you're subscribed." */}
        {entitlementState.status === "unknown" ? (
          <StatusCard testId="subscribe-status-unknown">
            <p className="font-body text-cream/70 text-[15px] leading-relaxed">
              We couldn&rsquo;t load your subscription status. Please try
              again.
            </p>
          </StatusCard>
        ) : entitlementState.status === "not_entitled" ? (
          /* Capability-based branch (FV-572, record §4.8) — BYTE-IDENTICAL
             to the pre-FV-581 purchase flow:
               - "legacy-native": today's Capacitor compliance notice — no
                 price, no button, no link toward Stripe Checkout. BYTE-
                 IDENTICAL to the prior single-branch copy (pinned by test).
               - "ios-iap": an iOS build capable of the native StoreKit
                 purchase surface — render AppleSubscribeSection.
               - null: ordinary web/PWA flow — completely unchanged. */
          shellCapability === "legacy-native" ? (
            <div
              role="status"
              data-testid="native-shell-subscribe-notice"
              className="bg-charcoal border border-hairline rounded-xl px-5 py-5"
            >
              <p className="font-body text-cream/70 text-[15px] leading-relaxed">
                Subscribe to From Victory from a web browser at
                fromvictoryapp.com.
              </p>
            </div>
          ) : shellCapability === "ios-iap" ? (
            <AppleSubscribeSection />
          ) : (
            <>
              {/* Plan selector form — trialEligible controls the trial banner */}
              <SubscribeForm
                trialEligible={trialEligible}
                action={checkoutAction}
                isAdult={isAdult}
              />

              {/* Footer trust note */}
              <p className="mt-8 font-body text-cream/55 text-[13px] text-center leading-relaxed">
                Billed securely through Stripe. Cancel any time from your
                account settings.
              </p>
            </>
          )
        ) : /* entitlementState.status === "entitled" */
        shellCapability === "legacy-native" ? (
          /* An entitled legacy-native payer sees the SAME compliance notice
             as a not_entitled one, for every provider — no in-shell link is
             added (record §4.4 + Google Play "no in-app purchase" scope). */
          <div
            role="status"
            data-testid="native-shell-subscribe-notice"
            className="bg-charcoal border border-hairline rounded-xl px-5 py-5"
          >
            <p className="font-body text-cream/70 text-[15px] leading-relaxed">
              Subscribe to From Victory from a web browser at
              fromvictoryapp.com.
            </p>
          </div>
        ) : shellCapability === "ios-iap" ? (
          entitlementState.provider === "apple" ? (
            <AppleSubscribeSection mode="manage" />
          ) : entitlementState.provider === "stripe" ? (
            <StatusCard testId="subscribe-status-entitled">
              <p className="font-body text-cream/70 text-[15px] leading-relaxed">
                You&rsquo;re already subscribed. Manage your subscription
                from a web browser at fromvictoryapp.com.
              </p>
            </StatusCard>
          ) : (
            <StatusCard testId="subscribe-status-entitled">
              <p className="font-body text-cream/70 text-[15px] leading-relaxed">
                You&rsquo;re subscribed to From Victory.
              </p>
            </StatusCard>
          )
        ) : entitlementState.provider === "apple" ? (
          <StatusCard testId="subscribe-status-entitled">
            <p className="font-body text-cream/70 text-[15px] leading-relaxed">
              You&rsquo;re subscribed through the App Store&nbsp;&mdash;
              manage it on your iPhone.
            </p>
          </StatusCard>
        ) : entitlementState.provider === "stripe" ? (
          <StatusCard testId="subscribe-status-entitled">
            <p className="font-body text-cream/70 text-[15px] leading-relaxed mb-4">
              You&rsquo;re already subscribed.
            </p>
            <Link
              href={isAdult ? "/athlete/settings" : "/dashboard/settings"}
              className="inline-flex items-center justify-center font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 min-h-[44px] no-underline hover:bg-gold-bright transition-colors duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            >
              Manage subscription
            </Link>
          </StatusCard>
        ) : (
          <StatusCard testId="subscribe-status-entitled">
            <p className="font-body text-cream/70 text-[15px] leading-relaxed">
              You&rsquo;re subscribed to From Victory.
            </p>
          </StatusCard>
        )}
      </div>
    </main>
  );
}
