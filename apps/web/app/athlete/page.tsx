import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SessionBody } from "@/components/daily/SessionBody";
import { RhythmRing } from "@/components/ui/RhythmRing";
import { signOut } from "@/lib/actions/auth";
import { requireAthlete } from "@/lib/auth/guards";
import { getDailySession } from "@/lib/daily/session";
import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";

export const metadata = {
  title: "Today · From Victory",
};

// ---------------------------------------------------------------------------
// Daily session content — fetched server-side, falls back gracefully when no
// catalog row exists (e.g. basketball before FV-32 content lands).
// ---------------------------------------------------------------------------

async function DailySession({ athleteFirstName }: { athleteFirstName: string }) {
  try {
    const { dayNumber, completedCount, session } = await getDailySession();

    const rhythmPct = Math.round((completedCount / TOTAL_TRAINING_DAYS) * 100);
    // Label: "Day N of 30" — accurate and rhythm-forward, not streak language.
    const rhythmLabel = `Day ${dayNumber} of ${TOTAL_TRAINING_DAYS}`;

    return (
      <>
        {/* Rhythm ring (RhythmRing carries its own role="img" + aria-label) */}
        <div className="flex items-center gap-5 mb-10">
          <RhythmRing
            pct={rhythmPct}
            size={80}
            stroke={7}
            label={rhythmLabel}
          />
          <div>
            <p className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[28px] sm:text-[32px] leading-none mb-1">
              {athleteFirstName}.
            </p>
            <p className="font-body text-cream/60 text-[14px] leading-snug">
              Your daily training is ready.
            </p>
          </div>
        </div>

        {/* Session article */}
        <article
          className="bg-charcoal border border-hairline rounded-2xl p-7 sm:p-9 mb-8"
          aria-label={`Day ${dayNumber} training session`}
          data-testid="daily-session-article"
        >
          {/* Eyebrow */}
          <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-5">
            Day {dayNumber} · Daily Training
          </p>

          {/* Title */}
          <h2 className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[28px] sm:text-[32px] leading-[1.1] mb-7">
            {session.title}
          </h2>

          {/* Mental skill body */}
          <div className="mb-8" data-testid="mental-skill-body">
            <SessionBody markdown={session.mental_skill_md} />
          </div>

          {/* Scripture */}
          <div
            className="border-t border-hairline pt-7 mb-7"
            data-testid="scripture-block"
          >
            <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold/70 mb-4">
              Foundation
            </p>
            <div className="border-l-2 border-gold/50 pl-4">
              <p className="font-scripture text-cream text-[18px] leading-relaxed italic mb-3">
                &ldquo;{session.scripture_text}&rdquo;
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
                {session.scripture_ref} &middot; NIV
              </p>
            </div>
          </div>

          {/* Journal prompt — display only (FV-84 adds the entry textarea) */}
          <div
            className="bg-onyx border border-hairline rounded-xl p-5"
            data-testid="journal-prompt"
          >
            <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-cream/50 mb-3">
              Reflect
            </p>
            <p className="font-body text-cream/85 text-[15px] leading-relaxed">
              {session.journal_prompt}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream/35 mt-4">
              Your reflection is private — only you can read it.
            </p>
          </div>
        </article>
      </>
    );
  } catch {
    // No catalog row for this athlete's (day, sport). Calm on-brand fallback.
    // The header + pregame/practice cards stay visible — this is inline only.
    return (
      <div
        className="bg-charcoal border border-hairline rounded-2xl p-7 mb-8"
        data-testid="session-unavailable"
        role="region"
        aria-label="Daily training unavailable"
      >
        <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
          Daily Training
        </p>
        <h2 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[22px] leading-snug mb-3">
          {athleteFirstName}, your training is on its way.
        </h2>
        <p className="font-body text-cream/70 text-[15px] leading-relaxed">
          The full session for your sport will be here shortly. In the
          meantime, the pregame and pre-practice flows are ready.
        </p>
      </div>
    );
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AthleteHomePage() {
  const { profile } = await requireAthlete();

  // First-run gate: athlete has not yet affirmatively chosen their sport.
  // (sport_selected_at is NULL until the picker writes it — see FV-33 spec §1.)
  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[640px]">
        {/* ---- Header ---- */}
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

        {/* Single page-level heading; the session title is its h2 child.
            sr-only so it doesn't compete with the brand logo + rhythm header. */}
        <h1 className="sr-only">Today&rsquo;s training</h1>

        {/* ---- Daily session (rhythm ring + article) ---- */}
        <DailySession athleteFirstName={profile.first_name} />

        {/* ---- Session entry cards ---- */}
        <Link
          href="/athlete/pregame"
          className="block mb-5 rounded-2xl border border-[rgba(223,175,55,0.4)] no-underline transition-colors duration-base ease-out hover:border-gold active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(180deg,rgba(223,175,55,0.10),rgba(223,175,55,0)),var(--bg-elev-1)",
          }}
          data-testid="pregame-card"
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
          className="block mb-8 rounded-2xl border border-[rgba(223,175,55,0.25)] no-underline transition-colors duration-base ease-out hover:border-[rgba(223,175,55,0.5)] active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(180deg,rgba(223,175,55,0.06),rgba(223,175,55,0)),var(--bg-elev-1)",
          }}
          data-testid="practice-card"
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
                Two minutes to lock in before practice — how you practice is
                how you play.
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
      </div>
    </main>
  );
}
