import Link from "next/link";
import { notFound } from "next/navigation";

import { RhythmRing } from "@/components/ui";
import { requireParent } from "@/lib/auth/guards";
import { getAthleteDetail } from "@/lib/dashboard/athlete-detail";
import { shapeAthleteRhythm } from "@/lib/dashboard/rhythm-core";
import { ageFromBirthdate } from "@/lib/age";
import { sportLabel } from "@/lib/sports";
import type { Sport } from "@/lib/sports";
import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  return {
    title: "Athlete detail · From Victory",
    // Override with athlete name once the data loads. Next.js calls this
    // before the page function, so we use a generic title here.
  };
}

type Props = {
  params: { id: string };
};

export default async function AthleteDetailPage({ params }: Props) {
  // requireParent() redirects to /signin if the caller is not a parent.
  await requireParent();

  // loadAthleteDetail returns null for unlinked / nonexistent athlete ids.
  // The RLS policy "profiles_parent_select_linked_athlete" enforces this —
  // no row comes back for an id not linked to the calling parent.
  const detail = await getAthleteDetail(params.id);
  if (!detail) notFound();

  // Shape rhythm metadata from the session counts we already have.
  const rhythm = shapeAthleteRhythm({
    sessions_completed: detail.sessionsCompleted,
    sessions_started: detail.sessionsStarted,
    last_completed_at: detail.lastActiveAt,
  });

  const age =
    detail.birthdate != null ? ageFromBirthdate(detail.birthdate) : null;

  // Build a Set of completed day numbers for O(1) lookup in the calendar.
  const completedDayNumbers = new Set(
    detail.completedDays.map((d) => d.dayNumber),
  );

  // Format last-active date for display.
  const lastActiveDisplay = detail.lastActiveAt
    ? new Date(detail.lastActiveAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[640px]">

        {/* Back link */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            href="/dashboard"
            data-testid="athlete-detail-back"
            className="font-mono font-semibold text-[12px] uppercase tracking-[0.16em] text-cream/50 hover:text-cream no-underline transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            ← Dashboard
          </Link>
        </nav>

        {/* Athlete header */}
        <header className="mb-8">
          <p className="font-mono font-semibold uppercase tracking-[0.18em] text-[11px] text-gold mb-2">
            Athlete profile
          </p>
          <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[36px] sm:text-[44px] leading-[1.05] mb-1">
            {detail.firstName}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            {detail.sport != null ? (
              <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-cream/50">
                {sportLabel(detail.sport as Sport)}
              </span>
            ) : null}
            {age !== null ? (
              <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-cream/40">
                Age {age}
              </span>
            ) : null}
          </div>
        </header>

        {/* Rhythm overview card */}
        <section
          aria-label={`${detail.firstName}'s training rhythm`}
          className="bg-charcoal border border-hairline rounded-2xl px-5 py-6 mb-5"
        >
          <p className="font-mono font-semibold uppercase tracking-[0.18em] text-[11px] text-gold mb-5">
            Training rhythm
          </p>

          <div className="flex items-center gap-5 mb-6">
            <RhythmRing
              pct={rhythm.progressPct}
              size={80}
              stroke={6}
            />
            <div className="min-w-0">
              <p className="font-display font-bold text-cream text-[20px] leading-tight mb-1">
                {rhythm.ringLabel}
              </p>
              {rhythm.sessionsStarted > 0 &&
              rhythm.sessionsStarted !== rhythm.sessionsCompleted ? (
                <p className="font-body text-cream/50 text-[13px]">
                  {rhythm.sessionsStarted} session
                  {rhythm.sessionsStarted !== 1 ? "s" : ""} started
                </p>
              ) : null}
              {lastActiveDisplay !== null ? (
                <p
                  className="font-body text-cream/50 text-[13px] mt-0.5"
                  data-testid="athlete-detail-last-active"
                >
                  Last trained {lastActiveDisplay}
                </p>
              ) : null}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 pt-5 border-t border-hairline">
            <div className="flex flex-col gap-1">
              <p className="font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-gold">
                Sessions complete
              </p>
              <p
                className="font-display font-bold text-cream text-[26px] leading-none"
                data-testid="athlete-detail-sessions-completed"
              >
                {detail.sessionsCompleted}
                <span className="font-mono text-cream/40 text-[14px] ml-1.5">
                  / {TOTAL_TRAINING_DAYS}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-gold">
                Sessions started
              </p>
              <p className="font-display font-bold text-cream text-[26px] leading-none">
                {detail.sessionsStarted}
              </p>
            </div>
          </div>
        </section>

        {/* Training calendar — presence only, no missed-day markers */}
        <section
          aria-label={`${detail.firstName}'s training calendar`}
          className="bg-charcoal border border-hairline rounded-2xl px-5 py-6 mb-5"
        >
          <p className="font-mono font-semibold uppercase tracking-[0.18em] text-[11px] text-gold mb-1">
            Days trained
          </p>
          <p className="font-body text-cream/50 text-[13px] mb-5">
            Days {detail.firstName} has completed a training session.
          </p>

          {detail.sessionsCompleted === 0 ? (
            <p className="font-body text-cream/50 text-[14px] leading-relaxed py-2">
              No sessions completed yet — the first one is a big step.
            </p>
          ) : (
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
              role="list"
              aria-label="Training days"
            >
              {Array.from({ length: TOTAL_TRAINING_DAYS }, (_, i) => {
                const day = i + 1;
                const done = completedDayNumbers.has(day);
                return (
                  <div
                    key={day}
                    role="listitem"
                    // Rhythm framing: completed days are announced as trained;
                    // other days stay neutral — absence is never called out.
                    aria-label={done ? `Day ${day} — trained` : `Day ${day}`}
                    className={[
                      "flex flex-col items-center justify-center rounded-lg aspect-square",
                      done
                        ? "bg-gold/15 border border-gold/40"
                        : "bg-onyx border border-hairline",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "font-mono font-semibold text-[11px] leading-none",
                        done ? "text-gold" : "text-cream/25",
                      ].join(" ")}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Privacy reassurance — stated as a feature, not a disclaimer */}
        <section
          aria-label="What you can see"
          className="bg-charcoal border border-hairline rounded-2xl px-5 py-5 mb-5"
        >
          <p className="font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-gold mb-3">
            Your view
          </p>
          <p className="font-body text-cream/70 text-[14px] leading-relaxed">
            You see rhythm and dates — how often {detail.firstName} trains and
            when they last showed up. The training itself is{" "}
            {detail.firstName}&rsquo;s space: what they work through in a
            session stays theirs. That&rsquo;s by design.
          </p>
        </section>

        {/* Actions */}
        <section
          aria-label="Athlete actions"
          className="bg-charcoal border border-hairline rounded-2xl px-5 py-5 mb-8"
        >
          <p className="font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-gold mb-4">
            Actions
          </p>

          <div className="flex flex-col gap-4">
            {/* Pair device */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-body text-cream text-[14px] leading-snug">
                  Pair a device
                </p>
                <p className="font-body text-cream/50 text-[12px] leading-snug mt-0.5">
                  Let {detail.firstName} sign in on their phone or tablet.
                </p>
              </div>
              <Link
                href={`/dashboard/athletes/${detail.athleteId}/pair`}
                data-testid="athlete-detail-pair-link"
                className="flex-shrink-0 font-heading font-semibold text-[13px] text-cream/80 hover:text-cream bg-onyx border border-hairline hover:border-cream/30 rounded-pill px-4 min-h-[44px] flex items-center no-underline transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              >
                Pair device
              </Link>
            </div>

            {/* Removal happens on the dashboard, where the list re-renders
                after the action — running it here would leave the parent on a
                deleted athlete's URL (qa finding FV-191-A). */}
            <div className="pt-4 border-t border-hairline">
              <p className="font-body text-cream/50 text-[12px] leading-snug">
                To remove {detail.firstName}&rsquo;s account and training data,
                use the{" "}
                <Link
                  href="/dashboard"
                  className="text-cream/80 underline underline-offset-2 hover:text-cream transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal rounded-sm"
                >
                  dashboard
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
