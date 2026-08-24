import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import CoachmarkTour from "@/components/athlete/CoachmarkTour";
import InstallPrompt from "@/components/athlete/InstallPrompt";
import { Icon, RhythmRing, type IconName } from "@/components/ui";
import { recordAppOpen } from "@/lib/activity/record";
import { requireAthlete } from "@/lib/auth/guards";
import { requireActiveAccess } from "@/lib/subscriptions/enforce";
import { createClient } from "@/lib/supabase/server";
import { loadDailySession, TOTAL_TRAINING_DAYS, DailySessionNotFoundError } from "@/lib/daily/progression";
import { modulesForSport } from "@/lib/postgame/modules";

export const metadata = {
  title: "Today",
};

export default async function AthleteHomePage() {
  const { userId, profile } = await requireAthlete();

  // Subscription enforcement gate (FV-62). No-op when flag is off.
  // Must run after requireAthlete() so the role is confirmed server-side.
  await requireActiveAccess({ role: profile.role });

  // First-run gate: athlete has not yet affirmatively chosen their sport.
  // (sport_selected_at is NULL until the picker writes it — see FV-33 spec §1.)
  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  // Record an app-open — the true-DAU signal that athlete_sessions alone can't
  // give. Fire-and-forget: deduped to one row per athlete per UTC day, never
  // throws, so it can never affect the hub render. (FV activity_events.)
  await recordAppOpen(userId, "hub", profile.sport);

  // Load session data for the rhythm ring. requireAthlete() already ran above,
  // so we call loadDailySession directly — no redundant auth round-trip and
  // no risk of swallowing a redirect() control-flow error.
  //
  // Catch ONLY DailySessionNotFoundError (content not yet seeded — expected for
  // new sports). Any other error is an infra failure; re-throw so it surfaces to
  // app/athlete/error.tsx (observable). Do NOT widen the catch.
  let dayNumber = 1;
  let completedCount = 0;
  let sessionLoaded = false;

  try {
    const supabase = createClient();
    const data = await loadDailySession(supabase, userId, profile.sport);
    dayNumber = data.dayNumber;
    completedCount = data.completedCount;
    sessionLoaded = true;
  } catch (err) {
    if (err instanceof DailySessionNotFoundError) {
      // No catalog row for this athlete's (day, sport) — degrade gracefully.
      sessionLoaded = false;
    } else {
      // Infra failure (DB down, RLS misconfig, network error) — surface to the
      // error boundary, not silently swallowed as "content coming soon".
      throw err;
    }
  }

  const progressPct = sessionLoaded
    ? Math.round((completedCount / TOTAL_TRAINING_DAYS) * 100)
    : 0;

  // "After the game" hub card — only show when the athlete's sport has
  // postgame modules in the registry. Pure code check, no DB call.
  const hasPostgameModules = modulesForSport(profile.sport).length > 0;

  // Sport watermark — ICONS keys match the Sport union, so this assignment is
  // the exhaustiveness check: a new sport without a glyph fails typecheck here.
  const sportIcon: IconName = profile.sport;

  return (
    <main className="relative min-h-screen overflow-hidden bg-onyx pb-[calc(40px+env(safe-area-inset-bottom,0px))]">
      {/* ── Sport watermark — faint, decorative, behind all content. ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-24 top-16 opacity-[0.05]"
      >
        <Icon name={sportIcon} size={420} color="var(--fv-gold)" strokeWidth={0.9} />
      </div>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-8 pb-6 sm:px-8 max-w-[640px] mx-auto">
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
        {/* Sign-out lives in Settings — the hub header stays minimal (beta
            feedback: too many things on the page). */}
        <Link
          href="/athlete/settings"
          aria-label="Settings"
          className="flex h-[44px] w-[44px] items-center justify-center rounded-pill text-cream/70 transition-colors duration-fast ease-out hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          <span className="flex h-[40px] w-[40px] items-center justify-center rounded-pill bg-charcoal border border-hairline">
            <Icon name="settings" size={19} />
          </span>
        </Link>
      </header>

      <div className="px-5 sm:px-8 max-w-[640px] mx-auto">
        {/* sr-only page h1 */}
        <h1 className="sr-only">Athlete Home</h1>

        {/* ── Greeting + rhythm ring ── */}
        <section className="flex items-center gap-5 mb-6" aria-label="Your rhythm" data-coachmark="hub-rhythm-ring">
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

        {/* ── Hub: hero + tile grid ──
            Beta-tester feedback (2026-08-24): too many words, tiles too small.
            One hero (Daily Training) + a grid of large icon-first tiles. No
            subtitle/body copy on any card — context lives in the destination
            screens and the first-run coachmark tour (FV-313).
            Fold rule (FV-190) still holds: Daily, Pregame, and Pre-Practice
            land above a 375px fold; Journey / Ride Home may scroll.
            a11y: card titles are intentionally <p>, not headings — each card is
            a full <Link> so AT users navigate them by link, and the page's single
            sr-only <h1> anchors heading order. Do NOT promote these to <h2> (it
            would collide with the daily screen's h1→h2 hierarchy).
        ── */}
        <section aria-label="Training sections" className="space-y-3">
          {/* 1. Daily Training — hero / gold accent */}
          <Link
            href="/athlete/daily"
            data-coachmark="hub-daily-card"
            className="group block rounded-2xl border border-[rgba(223,175,55,0.40)] no-underline transition-[border-color,transform] duration-base ease-out hover:border-gold active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            style={{
              background:
                "linear-gradient(180deg,rgba(223,175,55,0.10),rgba(223,175,55,0)),var(--bg-elev-1)",
            }}
          >
            <div className="px-5 py-5 flex items-center gap-4">
              <span
                className="flex-none flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20"
                aria-hidden="true"
              >
                <Icon name="book" size={28} color="var(--fv-gold)" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold mb-1">
                  Today
                </p>
                <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[22px] leading-[1.1]">
                  Daily Training
                </p>
              </div>
              <span aria-hidden="true" className="flex-none text-gold text-[22px] font-display">
                →
              </span>
            </div>
          </Link>

          {/* Tile grid — big icon, one short title, nothing else. */}
          <div className="grid grid-cols-2 gap-3">
            {/* 2. Pregame */}
            <Link
              href="/athlete/pregame"
              data-coachmark="hub-pregame-card"
              className="group flex flex-col items-center justify-center gap-3 py-6 px-3 rounded-2xl border border-[rgba(223,175,55,0.22)] no-underline transition-[border-color,transform] duration-base ease-out hover:border-[rgba(223,175,55,0.45)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              style={{
                background:
                  "linear-gradient(180deg,rgba(223,175,55,0.06),rgba(223,175,55,0)),var(--bg-elev-1)",
              }}
            >
              <span
                className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/[0.08] border border-gold/[0.15]"
                aria-hidden="true"
              >
                <Icon name="flame" size={32} color="var(--fv-gold)" />
              </span>
              <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[17px] leading-[1.15] text-center">
                Pregame Visualization
              </p>
            </Link>

            {/* 3. Pre-practice */}
            <Link
              href="/athlete/practice"
              className="group flex flex-col items-center justify-center gap-3 py-6 px-3 rounded-2xl border border-[rgba(223,175,55,0.16)] no-underline transition-[border-color,transform] duration-base ease-out hover:border-[rgba(223,175,55,0.35)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              style={{
                background:
                  "linear-gradient(180deg,rgba(223,175,55,0.04),rgba(223,175,55,0)),var(--bg-elev-1)",
              }}
            >
              <span
                className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/[0.05] border border-gold/[0.10]"
                aria-hidden="true"
              >
                <Icon name="whistle" size={32} color="var(--fv-gold)" />
              </span>
              <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[17px] leading-[1.15] text-center">
                Pre-Practice Visualization
              </p>
            </Link>

            {/* 4. Journey — FV-190. Spans the row when the sport has no
                postgame modules, so the grid never ends on a lone half tile. */}
            <Link
              href="/athlete/journey"
              className={`group flex flex-col items-center justify-center gap-3 py-6 px-3 rounded-2xl border border-[rgba(223,175,55,0.12)] no-underline transition-[border-color,transform] duration-base ease-out hover:border-[rgba(223,175,55,0.28)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx${hasPostgameModules ? "" : " col-span-2"}`}
              style={{
                background:
                  "linear-gradient(180deg,rgba(223,175,55,0.03),rgba(223,175,55,0)),var(--bg-elev-1)",
              }}
            >
              <span
                className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/[0.04] border border-gold/[0.08]"
                aria-hidden="true"
              >
                <Icon name="map" size={32} color="var(--fv-gold)" />
              </span>
              <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[17px] leading-[1.15] text-center">
                Journey
              </p>
            </Link>

            {/* 5. After the game — FV-225. Shown only when the athlete's sport
                has postgame modules. Muted — a low-moment surface, not a daily
                CTA. */}
            {hasPostgameModules && (
              <Link
                href="/athlete/postgame"
                className="group flex flex-col items-center justify-center gap-3 py-6 px-3 rounded-2xl border border-[rgba(223,175,55,0.09)] no-underline transition-[border-color,transform] duration-base ease-out motion-reduce:transition-none hover:border-[rgba(223,175,55,0.22)] motion-safe:active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
                style={{
                  background:
                    "linear-gradient(180deg,rgba(223,175,55,0.02),rgba(223,175,55,0)),var(--bg-elev-1)",
                }}
                data-testid="hub-postgame-card"
              >
                <span
                  className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/[0.03] border border-gold/[0.07]"
                  aria-hidden="true"
                >
                  <Icon name="journal" size={32} color="var(--fv-gold)" />
                </span>
                <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[17px] leading-[1.15] text-center">
                  Ride Home
                </p>
              </Link>
            )}
          </div>
        </section>

        {/* ── Install nudge (FV-258) — below cards so the Daily/Pregame/
            Pre-Practice CTAs are never displaced from the 375px fold.
            The mb-4 gap lives on the card's own root, so dismissed/installed
            users see no phantom whitespace here. ── */}
        <InstallPrompt />
      </div>

      {/* No bottom nav on the hub — every destination is a tile (KC decision
          2026-08-24, declutter pass). Inner screens keep AthleteBottomNav. */}

      {/* ── First-run coachmark tour (FV-313) ── */}
      <CoachmarkTour surface="hub" />
    </main>
  );
}
