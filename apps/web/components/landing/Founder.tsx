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
            <div className="font-mono text-[11px] tracking-[0.20em] uppercase font-semibold text-gold mb-6">
              Built by a hockey dad
            </div>

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
            <p className="font-scripture italic text-[clamp(16px,1.5vw,19px)] leading-[1.5] text-cream/80 m-0">
              Your Identity Is Secure. Compete From Victory.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
