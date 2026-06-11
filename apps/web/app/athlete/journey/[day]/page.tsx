// Journey detail — read-only view of a single completed session (FV-190).
//
// Server Component: resolves the signed-in athlete, then loads the specific
// day's completed session. No write paths, no re-completion, no journal.
// If the athlete hasn't completed that day (or the day param is invalid),
// renders a 404-style "not found" state rather than throwing.

import Link from "next/link";
import { notFound } from "next/navigation";

import { AthleteBottomNav } from "@/components/athlete/BottomNav";
import { SessionBody } from "@/components/daily/SessionBody";
import { Icon } from "@/components/ui";
import { requireAthlete } from "@/lib/auth/guards";
import { getJourneyEntry } from "@/lib/athlete/journey-entry";
import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";

interface JourneyDayPageProps {
  params: { day: string };
}

/** Format a completed_at ISO timestamp as a readable date. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: JourneyDayPageProps) {
  const dayNum = parseInt(params.day, 10);
  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > TOTAL_TRAINING_DAYS) {
    return { title: "Session Not Found · From Victory" };
  }
  return { title: `Day ${dayNum} · Journey · From Victory` };
}

export default async function JourneyDayPage({ params }: JourneyDayPageProps) {
  // Auth guard — redirects to /signin if not authenticated.
  await requireAthlete();

  const dayNum = parseInt(params.day, 10);

  // Validate param before hitting the DB.
  if (
    isNaN(dayNum) ||
    !Number.isInteger(dayNum) ||
    dayNum < 1 ||
    dayNum > TOTAL_TRAINING_DAYS
  ) {
    notFound();
  }

  let entry: Awaited<ReturnType<typeof getJourneyEntry>> = null;
  let loadError = false;

  try {
    entry = await getJourneyEntry(dayNum);
  } catch {
    loadError = true;
  }

  // Not found: athlete hasn't completed this day, or day doesn't exist.
  if (!loadError && !entry) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-onyx pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-10 pb-6 sm:px-8 max-w-[640px] mx-auto">
        <Link
          href="/athlete/journey"
          className="flex items-center gap-1.5 rounded-md text-cream/60 hover:text-cream transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          aria-label="Back to journey"
        >
          <Icon name="arrowLeft" size={18} color="currentColor" />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Journey
          </span>
        </Link>

        {/* Read-only badge */}
        <span
          className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-cream/35 bg-charcoal border border-hairline rounded-pill px-3 py-1.5"
          aria-label="This session is read-only"
        >
          Read only
        </span>
      </header>

      <div className="px-5 sm:px-8 max-w-[640px] mx-auto">
        {/* sr-only heading */}
        <h1 className="sr-only">
          Day {dayNum} — Completed Training Session
        </h1>

        {loadError || !entry ? (
          /* Error / unexpected missing state */
          <div className="bg-charcoal border border-hairline rounded-2xl p-8 text-center mt-4">
            <p className="font-display font-bold uppercase tracking-[0.04em] text-cream text-[20px] mb-3">
              Couldn&rsquo;t load right now
            </p>
            <p className="font-body text-cream/60 text-[14px] leading-relaxed">
              Your session is saved. Try again in a moment.
            </p>
          </div>
        ) : (
          <>
            {/* Completion timestamp */}
            <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-cream/35 mb-6">
              Completed {formatDate(entry.completedAt)}
            </p>

            {/* ── Session article ── */}
            <article
              className="bg-charcoal border border-hairline rounded-2xl p-7 sm:p-9 mb-6"
              data-testid="journey-detail-article"
            >
              {/* Eyebrow */}
              <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-4">
                Daily Training &middot; Day {entry.dayNumber}
              </p>

              {/* Session title */}
              <h2 className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[26px] sm:text-[30px] leading-[1.1] mb-7">
                {entry.content?.title ?? `Day ${entry.dayNumber}`}
              </h2>

              {/* Mental skill body */}
              {entry.content?.mentalSkillMd && (
                <div className="mb-7" data-testid="journey-detail-mental-skill">
                  <SessionBody markdown={entry.content.mentalSkillMd} />
                </div>
              )}

              {/* Scripture block */}
              {entry.content?.scriptureText && (
                <div className="border-l-2 border-gold/50 pl-4 mb-0">
                  <p className="font-scripture text-cream text-[18px] leading-relaxed italic">
                    &ldquo;{entry.content.scriptureText}&rdquo;
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold mt-2">
                    {entry.content.scriptureRef} &middot; NIV
                  </p>
                </div>
              )}
            </article>

            {/* ── Navigate to adjacent days ── */}
            <div
              className="flex items-center justify-between gap-3 mb-6"
              aria-label="Navigate between sessions"
            >
              {entry.dayNumber > 1 ? (
                <Link
                  href={`/athlete/journey/${entry.dayNumber - 1}`}
                  className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-cream/50 hover:text-cream/90 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx rounded-md py-3 px-2"
                  aria-label={`Go to day ${entry.dayNumber - 1}`}
                >
                  <Icon name="arrowLeft" size={15} color="currentColor" />
                  Day {entry.dayNumber - 1}
                </Link>
              ) : (
                <span />
              )}

              {entry.dayNumber < TOTAL_TRAINING_DAYS ? (
                <Link
                  href={`/athlete/journey/${entry.dayNumber + 1}`}
                  className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-cream/50 hover:text-cream/90 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx rounded-md py-3 px-2"
                  aria-label={`Go to day ${entry.dayNumber + 1}`}
                >
                  Day {entry.dayNumber + 1}
                  <Icon name="arrowRight" size={15} color="currentColor" />
                </Link>
              ) : (
                <span />
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Bottom nav — no tab active on this route ── */}
      <AthleteBottomNav />
    </main>
  );
}
