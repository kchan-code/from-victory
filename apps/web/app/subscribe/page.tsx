import Image from "next/image";
import Link from "next/link";

import { requireParent } from "@/lib/auth/guards";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";

export const metadata = {
  title: "Subscribe · From Victory",
};

type Props = {
  searchParams: { status?: string };
};

export default async function SubscribePage({ searchParams }: Props) {
  await requireParent();

  const wasCanceled = searchParams.status === "canceled";

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[560px]">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <Link href="/dashboard" aria-label="Back to dashboard">
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
            href="/dashboard"
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
            One subscription covers all your athletes. Daily mental-toughness
            training with faith built in&nbsp;&mdash; one session per day
            combining a mental skill, scripture, and a private journal
            reflection.
          </p>
        </section>

        {/* Plan selector form */}
        <SubscribeForm />

        {/* Footer trust note */}
        <p className="mt-8 font-body text-cream/40 text-[13px] text-center leading-relaxed">
          Billed securely through Stripe. Cancel any time from your account
          settings.
        </p>
      </div>
    </main>
  );
}
