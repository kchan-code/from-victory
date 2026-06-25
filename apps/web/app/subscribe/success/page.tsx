import Image from "next/image";
import Link from "next/link";

import { requireSubscriber } from "@/lib/auth/guards";
import { FlameMark } from "@/components/ui";

export const metadata = {
  title: "Subscription active · From Victory",
};

export default async function SubscribeSuccessPage() {
  const { profile } = await requireSubscriber();

  const isAdult = profile.role === "adult_athlete";

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8 flex flex-col">
      <div className="mx-auto max-w-[560px] w-full flex-1 flex flex-col">
        {/* Header */}
        <header className="mb-12">
          <Image
            src="/logo-stacked.svg"
            alt="From Victory"
            width={105}
            height={60}
            className="h-14 w-auto"
            priority
          />
        </header>

        {/* Confirmation block */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-6 flex items-center gap-3">
            <FlameMark size={28} />
            <p className="font-mono font-semibold uppercase tracking-[0.18em] text-[11px] text-gold">
              Subscription
            </p>
          </div>

          <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[36px] sm:text-[44px] leading-[1.05] mb-4">
            You&rsquo;re all set, {profile.first_name}.
          </h1>

          <p className="font-body text-cream/70 text-[15px] leading-relaxed mb-3 max-w-[40ch]">
            Your subscription is activating&nbsp;&mdash; it may take a moment
            to confirm.{" "}
            {isAdult
              ? "Your training is ready."
              : "Your athletes are ready to train."}
          </p>

          <p className="font-body text-cream/50 text-[13px] leading-relaxed mb-10 max-w-[40ch]">
            A receipt will arrive at your email address. If you have questions,
            reach out any time.
          </p>

          {/* CTAs — primary action bottom-reachable on mobile */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {isAdult ? (
              <Link
                href="/athlete"
                data-testid="success-to-athlete"
                className="flex-1 flex items-center justify-center font-heading font-semibold text-[15px] text-onyx bg-gold border border-gold rounded-pill px-6 min-h-[52px] no-underline hover:bg-gold-bright transition-colors duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              >
                Start training
              </Link>
            ) : (
              <Link
                href="/dashboard"
                data-testid="success-to-dashboard"
                className="flex-1 flex items-center justify-center font-heading font-semibold text-[15px] text-onyx bg-gold border border-gold rounded-pill px-6 min-h-[52px] no-underline hover:bg-gold-bright transition-colors duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              >
                Go to dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
