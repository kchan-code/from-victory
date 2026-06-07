import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AthleteBottomNav } from "@/components/athlete/BottomNav";
import { Icon, RhythmRing } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { requireAthlete } from "@/lib/auth/guards";
import { getDailySession } from "@/lib/daily/session";
import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";

export const metadata = {
  title: "Today · From Victory",
};

export default async function AthleteHomePage() {
  const { profile } = await requireAthlete();

  // First-run gate: athlete has not yet affirmatively chosen their sport.
  // (sport_selected_at is NULL until the picker writes it — see FV-33 spec §1.)
  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  // Load session data for the rhythm ring. Wrap in try/catch: basketball
  // athletes (pre-FV-32 content) have no catalog rows and should NOT crash
  // the hub. On failure we render ring at 0 and still show the nav cards.
  // Note: this is a second getDailySession call vs the daily screen — FV-104
  // will dedupe the data layer. Do not refactor here.
  let dayNumber = 1;
  let completedCount = 0;
  let sessionLoaded = false;

  try {
    const data = await getDailySession();
    dayNumber = data.dayNumber;
    completedCount = data.completedCount;
    sessionLoaded = true;
  } catch {
    // No catalog row for this athlete's (day, sport) — degrade gracefully.
    sessionLoaded = false;
  }

  const progressPct = sessionLoaded
    ? Math.round((completedCount / TOTAL_TRAINING_DAYS) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-onyx pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-10 pb-8 sm:px-8 max-w-[640px] mx-auto">
        <Image
          src="/logo-stacked.svg"
          alt="From Victory"
          width={105}
          height={60}
          className="h-[64px] w-auto"
          priority
        />
        <form action={signOut}>
          <button
            type="submit"
            className="font-heading font-semibold text-[14px] text-cream/70 hover:text-cream bg-charcoal border border-hairline rounded-pill px-5 py-2.5 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="px-5 sm:px-8 max-w-[640px] mx-auto">
        {/* sr-only page h1 */}
        <h1 className="sr-only">Athlete Home</h1>

        {/* ── Greeting + rhythm ring ── */}
        <section className="flex items-center gap-5 mb-8" aria-label="Your rhythm">
          {/*
           * Day-position center: shows "N / 30" so day 1 reads as a beginning,
           * not "0%". dayNumber starts at 1 — always a positive, forward frame.
           * The subline on the right says "keep your rhythm" when sessionLoaded,
           * so context lives in the adjacent copy, not the ring interior.
           * Parent dashboard still uses pct-only (no dayNumber prop) — unchanged.
           */}
          <RhythmRing
            pct={progressPct}
            size={80}
            stroke={6}
            dayNumber={sessionLoaded ? dayNumber : 1}
            totalDays={TOTAL_TRAINING_DAYS}
            label={sessionLoaded ? undefined : "Start"}
          />
          <div>
            <p className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[28px] sm:text-[34px] leading-[1.05]">
              Hi {profile.first_name}.
            </p>
            {sessionLoaded ? (
              <p className="font-body text-cream/60 text-[14px] leading-snug mt-1">
                Keep your rhythm.
              </p>
            ) : (
              <p className="font-body text-cream/60 text-[14px] leading-snug mt-1">
                Ready when you are.
              </p>
            )}
          </div>
        </section>

        {/* ── 3-card hub ──
            All three cards must be visible near the top of a 375px viewport
            without scrolling. Cards are compact (no paragraph body copy
            eating vertical space) so they all land above the fold.
            Trade: less description copy vs. "athlete in the moment" wins.
            a11y: card titles are intentionally <p>, not headings — each card is
            a full <Link> so AT users navigate them by link, and the page's single
            sr-only <h1> anchors heading order. Do NOT promote these to <h2> (it
            would collide with the daily screen's h1→h2 hierarchy).
        ── */}
        <section aria-label="Training sections" className="space-y-3">
          {/* 1. Daily Training — primary / gold accent */}
          <Link
            href="/athlete/daily"
            className="group block rounded-2xl border border-[rgba(223,175,55,0.40)] no-underline transition-[border-color,transform] duration-base ease-out hover:border-gold active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            style={{
              background:
                "linear-gradient(180deg,rgba(223,175,55,0.10),rgba(223,175,55,0)),var(--bg-elev-1)",
            }}
          >
            <div className="px-5 py-4 flex items-center gap-4">
              <span
                className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-gold/10 border border-gold/20"
                aria-hidden="true"
              >
                <Icon name="book" size={20} color="var(--fv-gold)" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold mb-0.5">
                  Today
                </p>
                <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[18px] leading-[1.15]">
                  Daily Training
                </p>
                <p className="font-body text-cream/55 text-[13px] leading-snug mt-0.5">
                  Read today&apos;s session &mdash; reset your mind.
                </p>
              </div>
              <span aria-hidden="true" className="flex-none text-gold text-[20px] font-display">
                →
              </span>
            </div>
          </Link>

          {/* 2. Pregame */}
          <Link
            href="/athlete/pregame"
            className="group block rounded-2xl border border-[rgba(223,175,55,0.22)] no-underline transition-[border-color,transform] duration-base ease-out hover:border-[rgba(223,175,55,0.45)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            style={{
              background:
                "linear-gradient(180deg,rgba(223,175,55,0.06),rgba(223,175,55,0)),var(--bg-elev-1)",
            }}
          >
            <div className="px-5 py-4 flex items-center gap-4">
              <span
                className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-gold/[0.08] border border-gold/[0.15]"
                aria-hidden="true"
              >
                <Icon name="flame" size={20} color="var(--fv-gold)" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold/70 mb-0.5">
                  Game day
                </p>
                <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[18px] leading-[1.15]">
                  Start Pregame
                </p>
                <p className="font-body text-cream/55 text-[13px] leading-snug mt-0.5">
                  Visualization, breath, and a settled identity before you step on.
                </p>
              </div>
              <span aria-hidden="true" className="flex-none text-gold/70 text-[20px] font-display">
                →
              </span>
            </div>
          </Link>

          {/* 3. Pre-practice */}
          <Link
            href="/athlete/practice"
            className="group block rounded-2xl border border-[rgba(223,175,55,0.16)] no-underline transition-[border-color,transform] duration-base ease-out hover:border-[rgba(223,175,55,0.35)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            style={{
              background:
                "linear-gradient(180deg,rgba(223,175,55,0.04),rgba(223,175,55,0)),var(--bg-elev-1)",
            }}
          >
            <div className="px-5 py-4 flex items-center gap-4">
              <span
                className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-gold/[0.05] border border-gold/[0.10]"
                aria-hidden="true"
              >
                <Icon name="whistle" size={20} color="var(--fv-gold)" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold/60 mb-0.5">
                  Practice day
                </p>
                <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[18px] leading-[1.15]">
                  Start Pre-Practice
                </p>
                <p className="font-body text-cream/55 text-[13px] leading-snug mt-0.5">
                  Two minutes to lock in &mdash; how you practice is how you play.
                </p>
              </div>
              <span aria-hidden="true" className="flex-none text-gold/60 text-[20px] font-display">
                →
              </span>
            </div>
          </Link>
        </section>
      </div>

      {/* ── Bottom nav (no tab active on the hub) ── */}
      <AthleteBottomNav />
    </main>
  );
}
