import Image from "next/image";
import Link from "next/link";

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
            className="h-[84px] w-auto"
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

        <section className="mb-10">
          <p className="font-display font-semibold uppercase tracking-[0.18em] text-[12px] text-gold mb-3">
            Welcome to From Victory
          </p>
          <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[36px] sm:text-[44px] leading-[1.05] mb-4">
            Hi {profile.first_name}.
          </h1>
          <p className="font-body text-cream/70 text-[16px] leading-relaxed">
            Your account is paired. The full daily-training experience opens
            soon. Below is a preview of Day 1 — what every session will look
            like.
          </p>
        </section>

        <Link
          href="/athlete/pregame"
          className="block mb-8 rounded-2xl border border-[rgba(223,175,55,0.4)] no-underline transition-colors duration-base ease-out hover:border-gold"
          style={{
            background:
              "linear-gradient(180deg,rgba(223,175,55,0.10),rgba(223,175,55,0)),var(--bg-elev-1)",
          }}
        >
          <div className="p-6 sm:p-7 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
                Game day
              </p>
              <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[20px] sm:text-[22px] leading-[1.15] mb-1.5">
                Start pregame
              </p>
              <p className="font-body text-cream/65 text-[14px] leading-relaxed">
                A short guided flow — visualization, breath, and a settled
                identity — before you step on.
              </p>
            </div>
            <span
              aria-hidden="true"
              className="font-display text-gold text-[28px] leading-none flex-none"
            >
              →
            </span>
          </div>
        </Link>

        <Link
          href="/athlete/practice"
          className="block mb-8 rounded-2xl border border-[rgba(223,175,55,0.25)] no-underline transition-colors duration-base ease-out hover:border-[rgba(223,175,55,0.5)]"
          style={{
            background:
              "linear-gradient(180deg,rgba(223,175,55,0.06),rgba(223,175,55,0)),var(--bg-elev-1)",
          }}
        >
          <div className="p-6 sm:p-7 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold/70 mb-2">
                Practice day
              </p>
              <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[20px] sm:text-[22px] leading-[1.15] mb-1.5">
                Start pre-practice
              </p>
              <p className="font-body text-cream/65 text-[14px] leading-relaxed">
                Two minutes to lock in before you hit the ice — how you practice is how you play.
              </p>
            </div>
            <span
              aria-hidden="true"
              className="font-display text-gold/70 text-[28px] leading-none flex-none"
            >
              →
            </span>
          </div>
        </Link>

        <article className="bg-charcoal border border-hairline rounded-2xl p-7 sm:p-9 mb-8">
          <div className="flex items-center justify-between mb-6">
            <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold">
              Day 1 · Preview
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream/50 bg-onyx border border-hairline rounded-pill px-2.5 py-1">
              Coming soon
            </span>
          </div>

          <h2 className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[28px] sm:text-[32px] leading-[1.1] mb-6">
            Run Your Race. Eyes on Jesus.
          </h2>

          <div className="border-l-2 border-gold/50 pl-4 mb-7">
            <p className="font-scripture text-cream text-[18px] leading-relaxed italic">
              &ldquo;Let us run with perseverance the race marked out for us,
              fixing our eyes on Jesus, the pioneer and perfecter of faith.&rdquo;
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold mt-2">
              Hebrews 12:1-2 · NIV
            </p>
          </div>

          <div className="font-body text-cream/85 text-[15.5px] leading-relaxed space-y-4">
            <p className="text-cream font-display font-semibold uppercase tracking-[0.02em] text-[18px] not-italic">
              Your race is your race. Run it with your eyes on Jesus.
            </p>

            <p>
              The writer of Hebrews wrote chapter 12 to believers who were worn
              down — suffering, tempted to quit. There&rsquo;s a great cloud of
              witnesses surrounding you, the writer says. Throw off everything
              that hinders. Run with perseverance the race marked out for you.
              And — this is the key — fix your eyes on Jesus, who already ran
              his race and is now at the right hand of God.
            </p>

            <p>
              Every serious athlete knows the voice that pulls your eyes off
              your race. Onto the teammate getting more ice time. Onto the
              coach&rsquo;s clipboard. Onto the parents in the stands. Onto
              your own stat line. The voice is constant. It tells you where to
              look. Most of the time it&rsquo;s the wrong place.
            </p>

            <p>When the voice starts, say it back:</p>

            <p className="font-scripture text-cream text-[17px] italic text-center my-5">
              This is my race. My eyes are on Jesus.
            </p>

            <p>
              Fixed eyes don&rsquo;t mean ignoring the score or your teammates.
              They mean Christ — the One who already finished his race — is
              where you look for what you need. He&rsquo;s not waiting for you
              to earn it. He gave it before you laced up.
            </p>

            <p>
              The world says: prove yourself, then belong. The gospel says: in
              Christ you already belong, so run from there. Run from
              already-finished work. Run with your eyes on the Person who
              finished it.
            </p>

            <p className="font-display font-semibold uppercase tracking-[0.02em] text-cream text-[16px] not-italic pt-2">
              You don&rsquo;t compete tonight to earn an identity. You compete
              from one.
            </p>
          </div>
        </article>

        <section className="bg-onyx border border-hairline rounded-2xl p-6 mb-8">
          <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-cream/50 mb-3">
            Journal prompt
          </p>
          <p className="font-body text-cream/85 text-[15px] leading-relaxed">
            When did comparison or fatigue last pull your eyes off your race —
            and what changes when you fix them back on Jesus, who already ran
            his for you?
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream/40 mt-4 leading-relaxed">
            When the full app launches, you&rsquo;ll write your reflection
            privately here — only you can read it.
          </p>
        </section>

        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cream/40 text-center">
          Preview only · Daily training opens at launch
        </p>
      </div>
    </main>
  );
}
