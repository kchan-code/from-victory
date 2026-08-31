import Link from "next/link";
import { Reveal } from "./Reveal";

// DRAFT FOR KC — this copy is verbatim from fv236-faq-copy.md.
// KC approves or rewrites the founder voice at merge. Do not edit the copy here.

export function Founder() {
  return (
    <section className="py-16 sm:py-20 border-t border-hairline">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <div className="max-w-[620px]">
            {/* Eyebrow */}
            <h2 className="font-mono text-[11px] tracking-[0.20em] uppercase font-semibold text-gold mb-6">
              Built by a hockey dad
            </h2>

            {/* Body copy — verbatim from content-curator, DRAFT FOR KC */}
            <p
              className="font-body text-[clamp(16px,1.4vw,18px)] leading-[1.65] mb-6"
              style={{ color: "var(--fv-mute-1)" }}
            >
              I&apos;m a hockey dad. I&apos;ve sat in enough rinks to watch what
              pressure does to young athletes — how quietly they start tying their
              worth to the last shift, the depth chart, the scoreboard. I built
              From Victory for my own kids, and for athletes like them: so
              they&apos;d learn to compete from a settled identity instead of
              chasing one. Not to win their value. To play from value already
              given.
            </p>

            {/* Tagline — italic / scripture-style per design system */}
            <p className="font-scripture italic text-[clamp(16px,1.5vw,19px)] leading-[1.5] text-cream/80 m-0 mb-6">
              Your Identity Is Secure. Compete From Victory.
            </p>
            <p className="m-0 mb-10">
              <Link
                href="/hockey"
                className="font-body text-[15px] text-gold underline underline-offset-2 hover:text-gold-bright transition-colors duration-fast"
              >
                Hockey families: see the first shot before the puck drops →
              </Link>
            </p>

            {/* FV-514: one approved beta-athlete quote, labeled as beta
                feedback. Amended into docs/gtm/voice-and-guardrails.md
                guardrail 5 in the same change — athlete permission confirmed
                by KC (audit doc §7 decision 1). Restrained treatment: no
                carousel, no stars, no performance-outcome framing. */}
            <figure
              className="rounded-[18px] px-7 py-7 m-0"
              style={{
                background: "var(--bg-elev-1)",
                border: "1px solid var(--fv-hairline)",
              }}
            >
              <div className="font-mono text-[10px] tracking-[0.20em] uppercase font-semibold text-cream/55 mb-4">
                Beta feedback
              </div>
              <blockquote className="font-scripture italic text-[clamp(16px,1.5vw,19px)] leading-[1.55] text-cream/90 m-0 mb-4">
                &ldquo;The pregame session helped me picture my first shift
                and gave me one thing to focus on. I started using it before
                games to dial in.&rdquo;
              </blockquote>
              <figcaption className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-gold">
                Beta hockey athlete
              </figcaption>
            </figure>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
