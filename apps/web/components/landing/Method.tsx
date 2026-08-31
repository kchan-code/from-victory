import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

// FV-514 homepage IA restructure — one "three-part method" section replaces
// the four consecutive thesis restatements (Problem, Framework, HowItWorks,
// Faith). Every sentence below is reused verbatim from those four retired
// components (see the build notes for the source map) — no new marketing
// prose was written. The retired components' remaining copy (Problem's
// pressure cards, Framework's pyramid framing, Faith's theme pills) was
// retired with them, not relocated - recoverable from git history via this
// PR's deletions; relocation is tracked in FV-528. The files themselves are
// removed since nothing else imports them.

const parts = [
  {
    // Verbatim: HowItWorks steps[0] ("01 · TRAIN" relabeled "01" for the
    // three-part sequence — see build notes).
    num: "01 · TRAIN",
    name: "Read the mental skill.",
    body: "A short, direct lesson in mental toughness — grounded in sport, not theory. Built for athletes 13 and above.",
  },
  {
    // Verbatim: HowItWorks steps[1].
    num: "02 · ANCHOR",
    name: "Anchor in Scripture.",
    body: "One verse tied to the skill. Short enough to carry with you. Identity before performance.",
  },
  {
    // Verbatim: HowItWorks steps[3] (was "04 · CARRY", relabeled "03" here).
    num: "03 · CARRY",
    name: "Take one cue.",
    body: "One focus cue into practice, school, training, or game day. One thing inside your control.",
  },
];

export function Method() {
  return (
    <section
      id="how"
      className="py-16 sm:py-20 md:py-28 bg-charcoal border-y border-hairline scroll-mt-20"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="01" label="The method" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Verbatim: HowItWorks h2. */}
            <h2 className="fv-h-section">
              A daily rhythm for the athlete&apos;s mind and spirit.
            </h2>
            {/* Verbatim: Framework lede, first sentence. */}
            <p className="fv-lede">
              From Victory is built on a simple truth: identity comes before
              performance.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-b border-hairline mb-16">
            {parts.map((part, i) => (
              <div
                key={part.num}
                className={`px-7 py-9 transition-colors duration-base ease-out hover:bg-onyx ${
                  i < parts.length - 1
                    ? "sm:border-r border-hairline max-sm:border-b max-sm:border-hairline"
                    : ""
                }`}
              >
                <div className="font-display font-extrabold text-[13px] tracking-[0.12em] text-gold mb-5">
                  {part.num}
                </div>
                <h3 className="font-heading font-semibold text-[22px] tracking-[-0.01em] text-cream m-0 mb-2.5">
                  {part.name}
                </h3>
                <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                  {part.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Verbatim: Faith.tsx quote callout — the one spine verse on the
            homepage (Hebrews 12:1-2, per CLAUDE.md canonical). */}
        <Reveal>
          <div
            id="faith"
            className="fv-faith-callout border border-hairline rounded-[20px] px-8 sm:px-9 py-8 max-w-[620px] mx-auto text-left scroll-mt-20"
          >
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-3.5">
              Hebrews 12:1–2
            </div>
            <div className="font-scripture italic text-[clamp(20px,2vw,26px)] leading-[1.5] text-cream text-pretty">
              &ldquo;Let us run with perseverance the race marked out for us,
              fixing our eyes on Jesus.&rdquo;
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
