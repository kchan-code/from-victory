import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AthleteBottomNav } from "@/components/athlete/BottomNav";
import { CompleteSessionButton } from "@/components/daily/CompleteSessionButton";
import { SessionBody } from "@/components/daily/SessionBody";
import { Icon, RhythmRing } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { completeDailySession } from "@/lib/actions/daily-session";
import { requireAthlete } from "@/lib/auth/guards";
import { getDailySession } from "@/lib/daily/session";
import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";

export const metadata = {
  title: "Today's Training · From Victory",
};

export default async function DailyPage() {
  const { profile } = await requireAthlete();

  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  // Load the session — throws if no catalog row for this athlete's (day, sport).
  // The try/catch below catches that and renders a calm fallback instead of a 500.
  let sessionData: Awaited<ReturnType<typeof getDailySession>> | null = null;
  let sessionError = false;

  try {
    sessionData = await getDailySession();
  } catch {
    sessionError = true;
  }

  const progressPct = sessionData
    ? Math.round((sessionData.completedCount / TOTAL_TRAINING_DAYS) * 100)
    : 0;

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

        <form action={signOut}>
          <button
            type="submit"
            className="font-heading font-semibold text-[13px] text-cream/70 hover:text-cream bg-charcoal border border-hairline rounded-pill px-4 py-2 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            Sign out
          </button>
        </form>
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
              <RhythmRing
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

              {/* Scripture block — mb-0: article padding handles trailing space */}
              {sessionData.session.scripture_text && (
                <div className="border-l-2 border-gold/50 pl-4 mb-0">
                  <p className="font-scripture text-cream text-[18px] leading-relaxed italic">
                    &ldquo;{sessionData.session.scripture_text}&rdquo;
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold mt-2">
                    {sessionData.session.scripture_ref} · NIV
                  </p>
                </div>
              )}
            </article>

            {/* ── Complete CTA / All-complete state ── */}
            {sessionData.allComplete ? (
              /* All 30 days done — calm closing, no trophy blast */
              <div className="bg-charcoal border border-hairline rounded-2xl p-7 text-center mb-6">
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
              /* Normal state — primary CTA in the thumb zone */
              <div className="mb-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40 text-center mb-3">
                  Ready to move forward?
                </p>
                <form action={completeDailySession}>
                  <CompleteSessionButton dayNumber={sessionData.dayNumber} />
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Bottom nav (Daily tab active) ── */}
      <AthleteBottomNav activeHref="/athlete/daily" />
    </main>
  );
}
