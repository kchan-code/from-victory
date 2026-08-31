import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

// FV-534 — the visualization differentiator section. KC direction
// 2026-08-31: the homepage needs to say why visualization matters and how
// the app delivers it (audio-guided, eyes closed, phone down). Copy
// produced by the content trio: sports-psychologist raw material
// (claims held to public-safe confidence levels — no percentages, no
// "proven", no clinical register) integrated by content-curator; KC
// approves at merge. Sits directly after the playable pregame sample so
// "real pauses, game speed" is demonstrable one scroll up. Deliberately
// carries NO /signup CTA: the homepage's 4-CTA cadence is test-pinned
// (homepage-ia) and the after-sample CTA sits immediately above.

const blocks = [
  {
    name: "Why the rep matters",
    body: "Imagery is one of the most studied tools in sport, and athletes at the top level consistently say they use it. Run the opening moments ahead of time and the first minute of the game feels familiar instead of brand new. It does not replace training. It gets you ready to use what training already built.",
  },
  {
    name: "Not a highlight reel",
    body: "A rep that transfers is the first shift, the first possession, the first tee shot, not a montage of your best plays. You pick up to three plays from your position's library and the hard moment you want to rehearse, so the turnover and the reset after it get a rep too. Sight, sound, and feel, at the speed the game actually moves.",
  },
  {
    name: "Eyes closed, phone down",
    body: "Guided narration is the form this training has always taken. On your own before a game the picture drifts toward the thing you do not want to happen; a voice keeps it on the play and puts the reset right after the mistake. Real pauses, so the rep runs at game speed in the last few minutes before it counts, with the phone in your pocket instead of your hand.",
  },
];

export function Visualization() {
  return (
    <section
      id="visualization"
      className="py-12 sm:py-20 md:py-28 scroll-mt-20"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="01" label="The mental rep" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-6 sm:gap-y-10 items-end mb-10 sm:mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            {/* H2 switched to the curator's alternate after KC's hero
                thesis (FV-534) took the "Everyone..." framing — two
                near-identical openers within two scrolls read as a tic.
                The primary ("Everyone says visualize. Almost nobody helps
                you do it.") remains the approved fallback if the hero
                line changes again. */}
            <h2 className="fv-h-section">
              The picture only helps if someone runs it with you.
            </h2>
            <p className="fv-lede">
              So we built the guided version, about five minutes of audio
              before you compete, eyes closed, phone down.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-b border-hairline mb-8 sm:mb-12">
            {blocks.map((block, i) => (
              <div
                key={block.name}
                className={`px-5 py-6 sm:px-7 sm:py-9 transition-colors duration-base ease-out hover:bg-onyx ${
                  i < blocks.length - 1
                    ? "sm:border-r border-hairline max-sm:border-b max-sm:border-hairline"
                    : ""
                }`}
              >
                <h3 className="font-heading font-semibold text-[22px] tracking-[-0.01em] text-cream m-0 mb-2.5">
                  {block.name}
                </h3>
                <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                  {block.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Quiet identity kicker — second beat, never the headline. The
            page's one verse quote stays in Method (test-pinned). */}
        <Reveal>
          <p className="font-body text-[15px] leading-[1.6] text-cream/70 text-center max-w-[560px] mx-auto m-0">
            You rehearse the play. Your worth was settled by Christ long
            before the first whistle.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
