import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AthleteBottomNav } from "@/components/athlete/BottomNav";
import { CompletionCTA } from "@/components/daily/CompletionCTA";
import { SessionBody } from "@/components/daily/SessionBody";
import { Icon, RhythmRingAnimated } from "@/components/ui";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAthlete } from "@/lib/auth/guards";
import { requireActiveAccess } from "@/lib/subscriptions/enforce";
import { bibleLink } from "@/lib/daily/bible-link";
import { createClient } from "@/lib/supabase/server";
import {
  loadDailySession,
  TOTAL_TRAINING_DAYS,
  DailySessionNotFoundError,
  type DailySessionView,
} from "@/lib/daily/progression";

export const metadata = {
  title: "Today's Training · From Victory",
};

export default async function DailyPage() {
  const { userId, profile } = await requireAthlete();

  // Subscription enforcement gate (FV-62). No-op when flag is off.
  await requireActiveAccess({ role: profile.role });

  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  // Load the session. requireAthlete() already ran above, so we call
  // loadDailySession directly — no redundant auth round-trip and no risk of
  // swallowing a redirect() control-flow error.
  //
  // Catch ONLY DailySessionNotFoundError (content not yet seeded — the expected
  // "coming soon" case). Any other error is an infra failure; re-throw so it
  // surfaces to app/athlete/error.tsx (observable, not silently "coming soon").
  let sessionData: DailySessionView | null = null;
  let sessionError = false;

  try {
    const supabase = createClient();
    sessionData = await loadDailySession(supabase, userId, profile.sport);
  } catch (err) {
    if (err instanceof DailySessionNotFoundError) {
      sessionError = true;
    } else {
      throw err;
    }
  }

  const progressPct = sessionData
    ? Math.round((sessionData.completedCount / TOTAL_TRAINING_DAYS) * 100)
    : 0;

  const scriptureLink = sessionData?.session.scripture_ref
    ? bibleLink(sessionData.session.scripture_ref)
    : null;

  return (
    <main className="min-h-screen bg-onyx pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-10 pb-6 sm:px-8 max-w-[640px] mx-auto">
        {/* Back to hub */}
        <Link
          href="/athlete"
          className="flex items-center gap-1.5 rounded-md text-cream/60 hover:text-cream transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          aria-label="Back to home"
        >
          <Icon name="arrowLeft" size={18} color="currentColor" />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Home
          </span>
        </Link>

        <Image
          src="/logo-stacked.svg"
          alt="From Victory"
          width={72}
          height={41}
          className="h-[52px] w-auto"
          priority
        />

        <SignOutButton className="font-heading font-semibold text-[13px] text-cream/70 hover:text-cream bg-charcoal border border-hairline rounded-pill px-4 py-2 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx" />
      </header>

      {/* ── Content ── */}
      <div className="px-5 sm:px-8 max-w-[640px] mx-auto">
        {/* sr-only page h1 — heading order: h1 (sr-only) then h2 for session title */}
        <h1 className="sr-only">Today&apos;s Training</h1>

        {sessionError || !sessionData ? (
          /* ── No-content fallback ── */
          <div className="bg-charcoal border border-hairline rounded-2xl p-8 text-center mt-4">
            <p className="font-display font-bold uppercase tracking-[0.04em] text-cream text-[22px] mb-3">
              Content loading soon
            </p>
            <p className="font-body text-cream/65 text-[15px] leading-relaxed">
              Your next session is being prepared. Check back shortly.
            </p>
          </div>
        ) : (
          <>
            {/* ── Rhythm ring + day label ── */}
            <div className="flex items-center gap-5 mb-8 mt-2">
              {/* Animated on every page mount — arc sweeps from 0 to current pct */}
              <RhythmRingAnimated
                pct={progressPct}
                size={80}
                stroke={6}
                label={`Day ${sessionData.dayNumber} of ${TOTAL_TRAINING_DAYS}`}
              />
              <div>
                <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-1">
                  Day {sessionData.dayNumber} of {TOTAL_TRAINING_DAYS}
                </p>
                <p className="font-body text-cream/65 text-[14px] leading-snug">
                  {sessionData.completedCount === 0
                    ? "Your rhythm starts today."
                    : `${sessionData.completedCount} session${sessionData.completedCount === 1 ? "" : "s"} complete.`}
                </p>
              </div>
            </div>

            {/* ── Session article ── */}
            <article className="bg-charcoal border border-hairline rounded-2xl p-7 sm:p-9 mb-6">
              {/* Session eyebrow */}
              <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-4">
                Daily Training · Day {sessionData.dayNumber}
              </p>

              {/* Session title — h2 under the sr-only h1 */}
              <h2 className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[28px] sm:text-[32px] leading-[1.1] mb-7">
                {sessionData.session.title}
              </h2>

              {/* Mental skill body — trusted authored markdown via the FV-83
                  SessionBody renderer (### / paragraphs / > blockquote /
                  *italic* / **bold**; no dangerouslySetInnerHTML). */}
              {sessionData.session.mental_skill_md && (
                <div className="mb-7" data-testid="mental-skill-body">
                  <SessionBody markdown={sessionData.session.mental_skill_md} />
                </div>
              )}

              {/* ── Scripture block — full-width centered verse with YouVersion link ── */}
              {sessionData.session.scripture_text && (
                <div data-testid="scripture-block">
                  <div className="border-t border-gold/25 mb-5" />

                  {/* Reference above — font-mono gold, per AC */}
                  <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold text-center mb-4">
                    {sessionData.session.scripture_ref} · NIV
                  </p>

                  {/* Verse text — 22–24px font-scripture, centered */}
                  <p className="font-scripture text-cream text-[23px] leading-[1.55] italic text-center px-2">
                    &ldquo;{sessionData.session.scripture_text}&rdquo;
                  </p>

                  {/* YouVersion deep-link — plain URL, new tab, no SDK */}
                  {scriptureLink && (
                    <a
                      href={scriptureLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gold/60 hover:text-gold transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
                    >
                      Read the full passage ↗
                    </a>
                  )}

                  <div className="border-t border-gold/25 mt-5" />
                </div>
              )}
            </article>

            {/* ── Complete CTA / All-complete state ── */}
            {sessionData.allComplete ? (
              /* All 30 days done — closure copy, now with milestone celebration */
              <div className="fv-milestone-bg border border-gold/30 rounded-2xl p-7 text-center mb-6">
                <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
                  30 Days Complete
                </p>
                <p className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[22px] leading-[1.15] mb-3">
                  Your rhythm is built.
                </p>
                <p className="font-body text-cream/65 text-[15px] leading-relaxed">
                  You finished all 30 sessions. The work you put in is yours —
                  keep showing up.
                </p>
              </div>
            ) : (
              /* Normal state — client completion moment handles the overlay */
              <CompletionCTA
                dayNumber={sessionData.dayNumber}
                completedCount={sessionData.completedCount}
              />
            )}
          </>
        )}
      </div>

      {/* ── Bottom nav (Daily tab active) ── */}
      <AthleteBottomNav activeHref="/athlete/daily" />
    </main>
  );
}
