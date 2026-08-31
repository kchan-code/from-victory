import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

// FV-538 — the Method section presents the PREGAME VISUALIZATION METHOD
// (KC direction 2026-08-31: "focused, not on the daily training but the
// pregame visualizations... customize it, hear it to rehearse the mental
// skill, good and bad, practice the reset, and end with prayer and leave
// it all to God. Fearless and free."). Copy by content-curator on KC's
// skeleton; every step verified against the shipped session
// (components/pregame/audio/segments.ts): setup = position + up to 3
// plays + hard moment + focus; the audio rehearses plays AND the hard
// moment; a reset plan follows the mistake; the session closes with a
// real spoken prayer, then the send-off "You are secure. Now play from
// victory." Step 4's "compete fearless and free" is a DELIBERATE verbatim
// callback to KC's hero thesis, once. The page's one "Compete From
// Victory" tagline use stays in Founder.tsx, so the send-off line itself
// is not quoted here. The FV-514/FV-534 TRAIN/ANCHOR/CARRY daily-rhythm
// copy is retired to git history (its read-plus-Scripture fact survives
// in the lede and the FAQ).

const parts = [
  {
    num: "01 · SET",
    name: "Set your session.",
    body: "You start by telling the session who you are and what tonight actually asks of you: your position, the plays you want to see, the hard moment you expect, one focus to hold. Nothing about it is generic. The five minutes you hear are the five minutes you built.",
  },
  {
    num: "02 · HEAR",
    name: "Hear the rep.",
    body: "A voice runs the plays you picked, one at a time, with room to actually see them. Then it takes you into the moment you would rather skip: the turnover, the missed assignment, the shift that gets away from you. You rehearse the mistake on purpose, before it can surprise you.",
  },
  {
    num: "03 · RESET",
    name: "Practice the reset.",
    body: "Right after the mistake, the audio gives you the way back. Breathe, let it be finished, take the next rep. That is the part most athletes never actually train, and here you get reps at it while the stakes are still zero.",
  },
  {
    num: "04 · PRAY",
    name: "Leave it with God.",
    body: "The session ends in prayer, spoken out loud, and it is a real one. You thank God that your worth is already secure, ask for freedom to play brave and loose, and hand him what you cannot control. Then you go compete fearless and free.",
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
          <SectionMeta num="02" label="The method" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              Rehearse it. Reset from it. Leave it with God.
            </h2>
            {/* First sentence verbatim from the retired Framework lede;
                the read/hear sentences are FV-534 copy, reworded per
                qa-reviewer: each sentence names its own object so "hear"
                can only bind to the pregame session, never to the daily
                training (which is text-only per FV-135 — the one product
                fact this lede must not blur). */}
            <p className="fv-lede">
              From Victory is built on a simple truth: identity comes before
              performance. You read the daily training. You hear the pregame
              session.
            </p>
          </div>
        </Reveal>

        <Reveal>
          {/* Four steps: single column below sm, 2x2 at sm, one row at lg.
              Border logic per breakpoint — below sm every non-last cell
              gets a bottom hairline; in the 2x2, the left column gets a
              right hairline and the first row a bottom one; at lg the
              first three cells get right hairlines. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-hairline mb-16">
            {parts.map((part, i) => (
              <div
                key={part.num}
                className={[
                  "px-5 py-6 sm:px-7 sm:py-9 transition-colors duration-base ease-out hover:bg-onyx border-hairline",
                  i < parts.length - 1 ? "max-sm:border-b" : "",
                  i % 2 === 0 ? "sm:border-r" : "",
                  i === 1 ? "lg:border-r" : "",
                  i < 2 ? "sm:max-lg:border-b" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
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
