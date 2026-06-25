import Image from "next/image";
import Link from "next/link";

import { requireSubscriber } from "@/lib/auth/guards";
import { createCheckoutSession, createAdultCheckoutSession } from "@/lib/actions/subscription";
import { createClient } from "@/lib/supabase/server";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";

export const metadata = {
  title: "Subscribe · From Victory",
};

type Props = {
  searchParams: { status?: string };
};

export default async function SubscribePage({ searchParams }: Props) {
  const { userId, profile } = await requireSubscriber();

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
  // Fail closed on a read error: never promise a trial the action (the
  // authoritative gate) might not grant.
  const trialEligible = subReadError === null && existingSub === null;

  const wasCanceled = searchParams.status === "canceled";

  // Role-aware navigation targets.
  const dashboardHref = profile.role === "adult_athlete" ? "/athlete" : "/dashboard";
  // FV-328: the aria-label must match the destination (the href is role-aware).
  const backLabel =
    profile.role === "adult_athlete" ? "Back to training" : "Back to dashboard";

  // Role-aware checkout action.
  const checkoutAction =
    profile.role === "adult_athlete"
      ? createAdultCheckoutSession
      : createCheckoutSession;

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
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
            $5/mo or $49/yr for your first athlete; $3/mo or $29/yr for each
            additional athlete. Daily mental-toughness training with faith built
            in&nbsp;&mdash; one session per day combining a mental skill and a
            scripture foundation.
          </p>
        </section>

        {/* Plan selector form — trialEligible controls the trial banner */}
        <SubscribeForm trialEligible={trialEligible} action={checkoutAction} />

        {/* Footer trust note */}
        <p className="mt-8 font-body text-cream/40 text-[13px] text-center leading-relaxed">
          Billed securely through Stripe. Cancel any time from your account
          settings.
        </p>
      </div>
    </main>
  );
}
