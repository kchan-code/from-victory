// Post-game module detail — /athlete/postgame/[slug] (FV-225).
//
// Server Component. Auth-gated. Renders a single specialist-approved module:
// markdown body + scripture block + forward-action zone + crisis footer.
//
// Zero athlete-data writes: no "opened" events, no completion stamps.
// The fifth re-open gets the same steady welcome as the first.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AthleteBottomNav } from "@/components/athlete/BottomNav";
import { CrisisFooter } from "@/components/postgame/CrisisFooter";
import { SessionBody } from "@/components/daily/SessionBody";
import { Icon } from "@/components/ui";
import { requireAthlete } from "@/lib/auth/guards";
import { bibleLink } from "@/lib/daily/bible-link";
import {
  moduleBySlug,
  type PostgameScenario,
} from "@/lib/postgame/modules";

export const dynamicParams = true;

// Static metadata for the shell; actual title injected inline per module.
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const mod = moduleBySlug(params.slug);
  return {
    title: mod ? `${mod.title} · From Victory` : "After the Game · From Victory",
  };
}

const SCENARIO_EYEBROW: Record<PostgameScenario, string> = {
  loss: "The Loss",
  benching: "The Bench",
  "bad-game": "The Bad Game",
};

export default async function PostgameModulePage({
  params,
}: {
  params: { slug: string };
}) {
  // Auth guard first — unauthorized users should never see module content.
  const { profile } = await requireAthlete();

  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  const mod = moduleBySlug(params.slug);

  // Unknown slug — 404.
  if (!mod) {
    notFound();
  }

  // Sport guard: athlete can only access modules for their own sport.
  // Prevents URL-guessing across sport variants without any DB writes.
  if (mod.sport !== profile.sport) {
    notFound();
  }

  const scriptureLink = bibleLink(mod.scriptureRef);

  return (
    <main className="min-h-screen bg-onyx pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 pt-10 pb-6 sm:px-8 max-w-[640px] mx-auto">
        <Link
          href="/athlete/postgame"
          className="flex items-center gap-1.5 rounded-md text-cream/60 hover:text-cream transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          aria-label="Back to after the game"
        >
          <Icon name="arrowLeft" size={18} color="currentColor" />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Back
          </span>
        </Link>
      </header>

      <div className="px-5 sm:px-8 max-w-[640px] mx-auto">
        {/* sr-only h1 */}
        <h1 className="sr-only">{mod.title}</h1>

        {/* ── Module article ── */}
        <article
          className="bg-charcoal border border-hairline rounded-2xl p-7 sm:p-9 mb-6"
          data-testid="postgame-module-article"
        >
          {/* Eyebrow */}
          <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold/70 mb-4">
            {SCENARIO_EYEBROW[mod.scenario]}
          </p>

          {/* Module title — h2 under sr-only h1 */}
          <h2 className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[28px] sm:text-[32px] leading-[1.1] mb-7">
            {mod.title}
          </h2>

          {/* Markdown body — verbatim specialist-approved copy via FV-83
              SessionBody renderer (### / paragraphs / > blockquote /
              *italic* / **bold**; no dangerouslySetInnerHTML). */}
          <div className="mb-7" data-testid="postgame-body">
            <SessionBody markdown={mod.bodyMd} />
          </div>

          {/* ── Scripture block — verse + ref + YouVersion link ── */}
          <div data-testid="postgame-scripture-block">
            <div className="border-t border-gold/25 mb-5" />

            {/* Reference */}
            <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold text-center mb-4">
              {mod.scriptureRef} &middot; NIV
            </p>

            {/* Verse text — scripture font, centered, italic */}
            <p className="font-scripture text-cream text-[23px] leading-[1.55] italic text-center px-2">
              &ldquo;{mod.scriptureText}&rdquo;
            </p>

            {/* YouVersion deep-link */}
            {scriptureLink && (
              <a
                href={scriptureLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gold/70 hover:text-gold transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
                data-testid="postgame-youversion-link"
              >
                Read the full passage ↗
              </a>
            )}

            <div className="border-t border-gold/25 mt-5" />
          </div>
        </article>

        {/* ── Forward-action zone ──
            One quiet affordance area at the foot of every module.
            Per FV-225 spec: "When you're ready: tomorrow's reset" + "Talk
            to someone". Converts consolation library → recovery tool.
            No urgency, no pressure — "when you're ready" is the key phrase.
        ── */}
        <section
          className="bg-charcoal border border-hairline rounded-2xl p-7 mb-6"
          aria-label="When you're ready"
          data-testid="postgame-forward-action"
        >
          <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-cream/55 mb-4">
            When you&rsquo;re ready
          </p>

          {/* Tomorrow's reset — daily session link */}
          <Link
            href="/athlete/daily"
            className="group flex items-center gap-3 rounded-xl border border-hairline bg-onyx px-4 py-3.5 no-underline transition-[border-color,transform] duration-fast ease-out motion-reduce:transition-none hover:border-[rgba(223,175,55,0.35)] motion-safe:active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal mb-3"
            data-testid="postgame-daily-link"
          >
            <span
              className="flex-none flex items-center justify-center w-9 h-9 rounded-lg bg-gold/[0.07] border border-gold/[0.12]"
              aria-hidden="true"
            >
              <Icon name="book" size={17} color="var(--fv-gold)" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-[14px] text-cream leading-snug">
                Tomorrow&rsquo;s reset
              </p>
              <p className="font-body text-[12px] text-cream/55 leading-snug mt-0.5">
                Daily training — read today&rsquo;s session.
              </p>
            </div>
            <span
              aria-hidden="true"
              className="flex-none text-cream/25 group-hover:text-cream/50 transition-colors duration-fast ease-out"
            >
              <Icon name="arrowRight" size={16} color="currentColor" />
            </span>
          </Link>

          {/* Talk to someone — jumps to the crisis-resource footer below
              (988 call/text + Crisis Text Line); a direct tel: link would
              dead-end on non-phone devices. */}
          <a
            href="#crisis-footer"
            className="group flex items-center gap-3 rounded-xl border border-hairline bg-onyx px-4 py-3.5 no-underline transition-[border-color,transform] duration-fast ease-out motion-reduce:transition-none hover:border-[rgba(223,175,55,0.20)] motion-safe:active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
            data-testid="postgame-talk-link"
          >
            <span
              className="flex-none flex items-center justify-center w-9 h-9 rounded-lg bg-cream/[0.04] border border-cream/[0.08]"
              aria-hidden="true"
            >
              <Icon name="bell" size={17} color="currentColor" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-[14px] text-cream/80 leading-snug">
                Talk to someone
              </p>
              <p className="font-body text-[12px] text-cream/55 leading-snug mt-0.5">
                988 &mdash; free, confidential, 24/7.
              </p>
            </div>
          </a>
        </section>

        {/* ── Crisis footer — passive, always-present ── */}
        <CrisisFooter />
      </div>

      <AthleteBottomNav />
    </main>
  );
}
