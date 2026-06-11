// Journey view — completed-session history (FV-190).
//
// Server Component: auth-gated, sport-aware, read-only.
// Lists all completed sessions newest first, links to /athlete/journey/[day].
// Rhythm framing only — no gap highlighting, no missed-day copy, no shame.

import Link from "next/link";
import { redirect } from "next/navigation";

import { AthleteBottomNav } from "@/components/athlete/BottomNav";
import { Icon } from "@/components/ui";
import { requireAthlete } from "@/lib/auth/guards";
import { getJourney } from "@/lib/athlete/journey-entry";

export const metadata = {
  title: "Your Journey · From Victory",
};

/** Format a completed_at ISO timestamp as a readable date (no time). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function JourneyPage() {
  // Auth guard — redirects to /signin if not authenticated or not an athlete.
  const { profile } = await requireAthlete();

  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  // Load history. Wrap in try/catch: degrade to empty rather than crashing.
  let entries: Awaited<ReturnType<typeof getJourney>> = [];
  let loadError = false;

  try {
    entries = await getJourney();
  } catch {
    loadError = true;
  }

  const hasEntries = entries.length > 0;

  return (
    <main className="min-h-screen bg-onyx pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 pt-10 pb-6 sm:px-8 max-w-[640px] mx-auto">
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
      </header>

      <div className="px-5 sm:px-8 max-w-[640px] mx-auto">
        {/* sr-only h1 — accessible heading anchor */}
        <h1 className="sr-only">Your Journey</h1>

        {/* ── Page title ── */}
        <div className="mb-7">
          <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold mb-1">
            {profile.first_name}&rsquo;s Journey
          </p>
          <p className="font-display font-extrabold uppercase tracking-[0.03em] text-cream text-[30px] sm:text-[36px] leading-[1.05]">
            The Road Behind You
          </p>
          {hasEntries && (
            <p className="font-body text-cream/55 text-[14px] leading-snug mt-2">
              {entries.length === 1
                ? "1 session complete."
                : `${entries.length} sessions complete.`}{" "}
              Each one is yours.
            </p>
          )}
        </div>

        {/* ── Content ── */}
        {loadError ? (
          /* Error fallback — stay calm, give an out */
          <div className="bg-charcoal border border-hairline rounded-2xl p-8 text-center">
            <p className="font-display font-bold uppercase tracking-[0.04em] text-cream text-[20px] mb-3">
              Couldn&rsquo;t load right now
            </p>
            <p className="font-body text-cream/60 text-[14px] leading-relaxed">
              Your sessions are saved. Try again in a moment.
            </p>
          </div>
        ) : !hasEntries ? (
          /* Empty state — forward-looking, zero shame */
          <div
            className="bg-charcoal border border-hairline rounded-2xl p-8 text-center"
            data-testid="journey-empty-state"
          >
            <span
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 mx-auto mb-5"
              aria-hidden="true"
            >
              <Icon name="map" size={22} color="var(--fv-gold)" />
            </span>
            <p className="font-display font-bold uppercase tracking-[0.04em] text-cream text-[22px] mb-3">
              Your journey starts today
            </p>
            <p className="font-body text-cream/60 text-[15px] leading-relaxed mb-6">
              Complete your first daily training session and it will appear
              here — a record of the road you&rsquo;re building.
            </p>
            <Link
              href="/athlete/daily"
              className="inline-flex items-center gap-2 bg-gold text-onyx font-heading font-bold text-[15px] rounded-pill px-7 py-3.5 transition-[opacity,transform] duration-fast ease-out hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              data-testid="journey-start-cta"
            >
              Start Day 1
              <Icon name="arrowRight" size={16} color="currentColor" />
            </Link>
          </div>
        ) : (
          /* Completed sessions list — newest first */
          <ol
            className="space-y-3"
            aria-label="Completed training sessions"
            data-testid="journey-list"
          >
            {entries.map((entry) => {
              // A missing catalog row (dayNumber 0) has no detail page to open —
              // render it as a quiet non-link row instead of a tappable 404.
              const isLinkable = entry.dayNumber > 0;
              const dayLabel = isLinkable ? `Day ${entry.dayNumber}` : "Session";
              const title = entry.content?.title ?? "Session";
              const scriptureRef = entry.content?.scriptureRef;
              const dateLabel = formatDate(entry.completedAt);

              const rowInner = (
                <>
                  {/* Day badge */}
                  <span
                    className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-gold/10 border border-gold/20"
                    aria-hidden="true"
                  >
                    <span className="font-mono font-bold text-[12px] text-gold leading-none">
                      {isLinkable ? entry.dayNumber : "—"}
                    </span>
                  </span>

                  {/* Session info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.16em] text-gold/70 mb-0.5">
                      {dayLabel} &middot; {dateLabel}
                    </p>
                    <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[16px] leading-[1.2] truncate">
                      {title}
                    </p>
                    {scriptureRef && (
                      <p className="font-mono text-[11px] text-cream/45 mt-0.5 truncate">
                        {scriptureRef}
                      </p>
                    )}
                  </div>

                  {/* Chevron — linkable rows only */}
                  {isLinkable && (
                    <span
                      aria-hidden="true"
                      className="flex-none text-gold/50 group-hover:text-gold/80 transition-colors duration-fast ease-out"
                    >
                      <Icon name="arrowRight" size={18} color="currentColor" />
                    </span>
                  )}
                </>
              );

              return (
                <li key={entry.sessionId}>
                  {isLinkable ? (
                    <Link
                      href={`/athlete/journey/${entry.dayNumber}`}
                      className="group flex items-center gap-4 rounded-2xl border border-hairline bg-charcoal px-5 py-4 no-underline transition-[border-color,transform] duration-fast ease-out hover:border-[rgba(223,175,55,0.35)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
                      aria-label={`${dayLabel}: ${title}, completed ${dateLabel}`}
                      data-testid={`journey-entry-day-${entry.dayNumber}`}
                    >
                      {rowInner}
                    </Link>
                  ) : (
                    <div
                      className="flex items-center gap-4 rounded-2xl border border-hairline bg-charcoal px-5 py-4"
                      aria-label={`${dayLabel}: ${title}, completed ${dateLabel}`}
                      data-testid="journey-entry-no-detail"
                    >
                      {rowInner}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* ── Bottom nav — no tab active on this route ── */}
      <AthleteBottomNav />
    </main>
  );
}
