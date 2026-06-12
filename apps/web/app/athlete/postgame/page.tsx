// Post-game debrief picker — /athlete/postgame (FV-225).
//
// Server Component. Auth-gated (requireAthlete). Sport-resolved from the
// athlete's profile. Shows the athlete's sport's three modules as quiet
// tap-target cards. No sequencing, no gating, no tracking.
//
// If the athlete's sport has no modules (future sports not yet in the
// registry), 404s rather than rendering an empty page — the hub card is
// hidden for those sports, so there is no in-app path here.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AthleteBottomNav } from "@/components/athlete/BottomNav";
import { CrisisFooter } from "@/components/postgame/CrisisFooter";
import { Icon } from "@/components/ui";
import { requireAthlete } from "@/lib/auth/guards";
import { modulesForSport, type PostgameScenario } from "@/lib/postgame/modules";

export const metadata = {
  title: "After the Game · From Victory",
};

const SCENARIO_EYEBROW: Record<PostgameScenario, string> = {
  win: "The Win",
  loss: "The Loss",
  benching: "The Bench",
  "bad-game": "The Bad Game",
};

export default async function PostgamePickerPage() {
  const { profile } = await requireAthlete();

  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  const modules = modulesForSport(profile.sport);

  // Future sport with no modules yet — 404 rather than a blank page.
  if (modules.length === 0) {
    notFound();
  }

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
        {/* sr-only h1 */}
        <h1 className="sr-only">After the Game</h1>

        {/* ── Page title ── */}
        {/*
         * "After the game" — author-written framing for the picker surface.
         * Teammate register: calm, non-judgmental, no hype, no shame.
         * The subtitle is the one line I (frontend-engineer) authored;
         * all module titles and body copy below are verbatim from the
         * specialist-approved doc.
         */}
        <div className="mb-7">
          <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold/70 mb-1">
            After the game
          </p>
          <p className="font-display font-extrabold uppercase tracking-[0.03em] text-cream text-[30px] sm:text-[36px] leading-[1.05]">
            For the Ride Home
          </p>
          <p className="font-body text-cream/55 text-[14px] leading-snug mt-2">
            {/* AUTHOR: frontend-engineer — one framing line */}
            Open any of these whenever you need them. No order, no tracking.
          </p>
        </div>

        {/* ── Module card list ── */}
        <nav aria-label="Post-game modules">
          <ul className="space-y-3" role="list" data-testid="postgame-picker-list">
            {modules.map((mod) => (
              <li key={mod.slug}>
                <Link
                  href={`/athlete/postgame/${mod.slug}`}
                  className="group block rounded-2xl border border-hairline bg-charcoal no-underline transition-[border-color,transform] duration-base ease-out motion-reduce:transition-none hover:border-[rgba(223,175,55,0.35)] motion-safe:active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
                  data-testid={`postgame-module-card-${mod.slug}`}
                >
                  <div className="px-5 py-4 flex items-center gap-4">
                    <span
                      className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-gold/[0.05] border border-gold/[0.10]"
                      aria-hidden="true"
                    >
                      <Icon name="book" size={20} color="var(--fv-gold)" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.16em] text-gold/70 mb-0.5">
                        {SCENARIO_EYEBROW[mod.scenario]}
                      </p>
                      <p className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[18px] leading-[1.15]">
                        {mod.title}
                      </p>
                      <p className="font-mono text-[11px] text-cream/50 mt-0.5">
                        {mod.scriptureRef}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="flex-none text-cream/30 group-hover:text-cream/60 transition-colors duration-fast ease-out"
                    >
                      <Icon name="arrowRight" size={18} color="currentColor" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Crisis footer — passive, always-present ── */}
        <CrisisFooter />
      </div>

      <AthleteBottomNav />
    </main>
  );
}
