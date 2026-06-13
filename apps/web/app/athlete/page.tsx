import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AthleteBottomNav } from "@/components/athlete/BottomNav";
import InstallPrompt from "@/components/athlete/InstallPrompt";
import { Icon, RhythmRing } from "@/components/ui";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAthlete } from "@/lib/auth/guards";
import { requireActiveAccess } from "@/lib/subscriptions/enforce";
import { getDailySession } from "@/lib/daily/session";
import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";
import { modulesForSport } from "@/lib/postgame/modules";
import { dailyCardSubtitle } from "@/lib/quiz-config";

export const metadata = {
  title: "Today · From Victory",
};

export default async function AthleteHomePage() {
  const { profile } = await requireAthlete();

  // Subscription enforcement gate (FV-62). No-op when flag is off.
  // Must run after requireAthlete() so the role is confirmed server-side.
  await requireActiveAccess({ role: "athlete" });

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

  // "After the game" hub card — only show when the athlete's sport has
  // postgame modules in the registry. Pure code check, no DB call.
  const hasPostgameModules = modulesForSport(profile.sport).length > 0;

  return (
    <main className="min-h-screen bg-onyx pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-10 pb-8 sm:px-8 max-w-[640px] mx-auto">
        <div className="flex items-center gap-2">
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
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/athlete/settings"
            aria-label="Settings"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-pill text-cream/70 transition-colors duration-fast ease-out hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            <span className="flex h-[40px] w-[40px] items-center justify-center rounded-pill bg-charcoal border border-hairline">
              <Icon name="settings" size={19} />
            </span>
          </Link>
          <SignOutButton className="font-heading font-semibold text-[14px] text-cream/70 hover:text-cream bg-charcoal border border-hairline rounded-pill px-5 py-2.5 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx" />
        </div>
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

        {/* ── 4-card hub ──
            The three training CTAs (Daily, Pregame, Pre-Practice) must be
            visible near the top of a 375px viewport without scrolling. Cards
            are compact (no paragraph body copy eating vertical space) so they
            land above the fold. The 4th card (Journey — history, not a daily
            action) is deliberately last and may fall below the fold on short
            viewports; scrolling to it is an accepted trade (FV-190).
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
                  {dailyCardSubtitle(profile.focus_area)}
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

          {/* 4. Journey — FV-190 */}
          <Link
            href="/athlete/journey"
            className="group block rounded-2xl border border-[rgba(223,175,55,0.12)] no-underline transition-[border-color,transform] duration-base ease-out hover:border-[rgba(223,175,55,0.28)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            style={{
              background:
                "linear-gradient(180deg,rgba(223,175,55,0.03),rgba(223,175,55,0)),var(--bg-elev-1)",
            }}
          >
            <div className="px-5 py-4 flex items-center gap-4">
              <span
                className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-gold/[0.04] border border-gold/[0.08]"
                aria-hidden="true"
              >
                <Icon name="map" size={20} color="var(--fv-gold)" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold/50 mb-0.5">
                  History
                </p>
                <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[18px] leading-[1.15]">
                  Your Journey
                </p>
                <p className="font-body text-cream/55 text-[13px] leading-snug mt-0.5">
                  Every session you&apos;ve completed &mdash; re-read, revisit, remember.
                </p>
              </div>
              <span aria-hidden="true" className="flex-none text-gold/50 text-[20px] font-display">
                →
              </span>
            </div>
          </Link>

          {/* 5. After the game — FV-225. Shown only when the athlete's sport
              has postgame modules. Deliberately muted — this is a low-moment
              surface, not a daily CTA. Sits below Journey (always a scroll,
              never a fold — see comment on card 4).
              AUTHOR: hub card subtitle line is frontend-engineer copy. */}
          {hasPostgameModules && (
            <Link
              href="/athlete/postgame"
              className="group block rounded-2xl border border-[rgba(223,175,55,0.09)] no-underline transition-[border-color,transform] duration-base ease-out motion-reduce:transition-none hover:border-[rgba(223,175,55,0.22)] motion-safe:active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              style={{
                background:
                  "linear-gradient(180deg,rgba(223,175,55,0.02),rgba(223,175,55,0)),var(--bg-elev-1)",
              }}
              data-testid="hub-postgame-card"
            >
              <div className="px-5 py-4 flex items-center gap-4">
                <span
                  className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-gold/[0.03] border border-gold/[0.07]"
                  aria-hidden="true"
                >
                  <Icon name="journal" size={20} color="var(--fv-gold)" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold/70 mb-0.5">
                    After the game
                  </p>
                  <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[18px] leading-[1.15]">
                    For the Ride Home
                  </p>
                  {/* AUTHOR: frontend-engineer — subtitle line */}
                  <p className="font-body text-cream/50 text-[13px] leading-snug mt-0.5">
                    The win, the loss, the bad night &mdash; read when you need it.
                  </p>
                </div>
                <span aria-hidden="true" className="flex-none text-gold/40 text-[20px] font-display">
                  →
                </span>
              </div>
            </Link>
          )}
        </section>

        {/* ── Install nudge (FV-258) — below cards so the Daily/Pregame/
            Pre-Practice CTAs are never displaced from the 375px fold.
            The mb-4 gap lives on the card's own root, so dismissed/installed
            users see no phantom whitespace here. ── */}
        <InstallPrompt />
      </div>

      {/* ── Bottom nav (no tab active on the hub) ── */}
      <AthleteBottomNav />
    </main>
  );
}
