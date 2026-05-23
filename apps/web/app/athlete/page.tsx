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
            From Victory, Not Toward It
          </h2>

          <div className="border-l-2 border-gold/50 pl-4 mb-7">
            <p className="font-scripture text-cream text-[18px] leading-relaxed italic">
              &ldquo;No, in all these things we are more than conquerors through
              him who loved us.&rdquo;
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold mt-2">
              Romans 8:37 · NIV
            </p>
          </div>

          <div className="font-body text-cream/85 text-[15.5px] leading-relaxed space-y-4">
            <p className="text-cream font-display font-semibold uppercase tracking-[0.02em] text-[18px] not-italic">
              A bad day should tell you what happened. It should not tell you
              who you are.
            </p>

            <p>
              Paul wrote Romans 8:37 to believers in Rome facing real loss —
              trouble, hardship, persecution, danger, sword. &ldquo;More than
              conquerors&rdquo; is the line he reaches for in the middle of
              suffering, not after a winning streak. The verse does not mean
              Christians never lose. It means loss does not get the final word.
              Nothing on that list — nothing — can separate you from the love
              of God in Christ.
            </p>

            <p>
              Every serious athlete knows the voice that takes one mistake and
              turns it into a verdict. The missed shot becomes &ldquo;I&rsquo;m
              not a real player.&rdquo; The benched practice becomes
              &ldquo;Coach doesn&rsquo;t see me anymore.&rdquo; The lost game
              becomes &ldquo;I let everyone down.&rdquo; That voice is fast,
              and it sounds like the truth. Most of the time it isn&rsquo;t.
            </p>

            <p>When it starts, say it back in two sentences:</p>

            <p className="font-scripture text-cream text-[17px] italic text-center my-5">
              That is what happened. That is not who I am.
            </p>

            <p>
              The performance is on tape. The verdict isn&rsquo;t real. Take a
              breath. Look at the next play.
            </p>

            <p>
              The world says: perform, then belong. The gospel says: in Christ
              you already belong, and effort flows from there. The worst game
              you play does not lower your standing with God. The best game you
              play does not raise it.
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
            When did a single mistake last start rewriting how you see
            yourself — and what changes if you read it back through &ldquo;more
            than conquerors through him who loved us&rdquo;?
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
