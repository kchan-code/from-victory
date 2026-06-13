import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAthlete } from "@/lib/auth/guards";

export const metadata = {
  title: "Training Paused · From Victory",
  robots: { index: false, follow: false },
};

/**
 * /athlete/paused — shown when subscription enforcement is ON and the
 * parent's access has lapsed. The enforcement guard redirects here.
 *
 * Design contract (brand spine):
 * - Identity precedes performance. Access being paused NEVER equals worth
 *   being paused. The copy must hold space, not close a door.
 * - No pricing, no Stripe links, no billing details. Athletes cannot buy;
 *   surfaces like this are also a kids-privacy boundary.
 * - Tone: Mentor voice — steady, warm, plainly true.
 * - Dark-mode-first, mobile-first (375px). Thumb-reach: sign-out in the
 *   bottom area, settings link in the body — both reachable one-handed.
 *
 * DO NOT add requireActiveAccess() here — it would redirect back here,
 * creating an infinite loop. requireAthlete() is sufficient to ensure the
 * visitor is authenticated; unauthenticated visitors hit the redirect
 * to /signin before they reach this page.
 *
 * NOTE: The copy below may receive a content-curator polish pass before
 * launch. It is intentionally in Mentor voice (warm, direct, no shame).
 */

export default async function AthletePausedPage() {
  // Confirm the visitor is a signed-in athlete. If not signed in,
  // requireAthlete() redirects to /signin — no risk of sign-out loop.
  await requireAthlete();

  return (
    <main className="min-h-screen bg-onyx flex flex-col px-5 pb-[calc(48px+env(safe-area-inset-bottom,0px))]">
      {/* ── Logo lockup — top anchor ── */}
      <header className="flex items-center gap-2 pt-[52px] pb-0">
        <Image
          src="/logo-icon.svg"
          alt=""
          width={64}
          height={36}
          className="block h-9 w-auto"
          priority
        />
        <Image
          src="/logo-wordmark.svg"
          alt="From Victory"
          width={100}
          height={32}
          className="block h-7 w-auto translate-y-[2px]"
          priority
        />
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col justify-center max-w-[420px] mx-auto w-full pt-8 pb-10">
        {/* Eyebrow */}
        <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.22em] text-gold mb-4">
          Training paused
        </p>

        {/* Heading — identity-first framing */}
        <h1 className="font-display font-extrabold uppercase tracking-[0.03em] text-cream text-[32px] sm:text-[36px] leading-[1.05] mb-5">
          Your identity
          <br />
          never pauses.
        </h1>

        {/* Body — warm, plain, no shame, no pricing */}
        <p className="font-body text-cream/75 text-[16px] leading-relaxed mb-3">
          Your training is on hold right now. To get back in, ask your parent
          to reactivate access from their dashboard.
        </p>
        <p className="font-body text-cream/50 text-[14px] leading-relaxed mb-10">
          Your data is safe. Nothing has been removed.
        </p>

        {/* Settings link — secondary action, in-body, thumb-reachable */}
        <Link
          href="/athlete/settings"
          className="inline-flex items-center justify-center rounded-[12px] border border-hairline bg-charcoal px-5 py-4 font-heading text-[15px] font-semibold text-cream/80 transition-colors duration-fast ease-out hover:text-cream hover:border-cream/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx active:scale-[0.99] w-full mb-3"
          data-testid="paused-settings-link"
        >
          Go to settings
        </Link>

        {/* Sign out — bottom of the action stack, still in thumb reach */}
        <SignOutButton className="inline-flex items-center justify-center w-full rounded-[12px] border border-hairline bg-charcoal px-5 py-4 font-heading text-[14px] font-semibold text-cream/60 transition-colors duration-fast ease-out hover:text-cream hover:border-cream/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx active:scale-[0.99]" />
      </div>
    </main>
  );
}
