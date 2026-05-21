import Image from "next/image";

import { signOut } from "@/lib/actions/auth";
import { requireAthlete } from "@/lib/auth/guards";

export const metadata = {
  title: "Today · From Victory",
};

export default async function AthleteHomePage() {
  const { profile } = await requireAthlete();

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[640px]">
        <header className="flex items-center justify-between mb-12">
          <Image
            src="/logo-stacked.svg"
            alt="From Victory"
            width={105}
            height={60}
            className="h-14 w-auto"
            priority
          />
          <form action={signOut}>
            <button
              type="submit"
              className="font-heading font-semibold text-[14px] text-cream/70 hover:text-cream bg-charcoal border border-hairline rounded-pill px-5 py-2.5 transition-colors duration-fast ease-out"
            >
              Sign out
            </button>
          </form>
        </header>

        <section>
          <p className="font-display font-semibold uppercase tracking-[0.18em] text-[12px] text-gold mb-3">
            From Victory
          </p>
          <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[40px] sm:text-[48px] leading-[1.05] mb-6">
            Welcome back, {profile.first_name}.
          </h1>
          <p className="font-body text-cream/70 text-[17px] leading-relaxed mb-8">
            Your account is set up. Today&rsquo;s training, your daily
            scripture, and your private journal land in the next release.
          </p>

          <div className="bg-charcoal border border-hairline rounded-2xl p-7">
            <p className="font-display font-semibold uppercase tracking-[0.16em] text-[11px] text-gold mb-3">
              Identity precedes performance
            </p>
            <p className="font-scripture text-cream text-[19px] leading-relaxed">
              &ldquo;In all these things we are more than conquerors through him
              who loved us.&rdquo;
            </p>
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-gold mt-3">
              Romans 8:37 · NIV
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
