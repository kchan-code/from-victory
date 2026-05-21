import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

const cards = [
  {
    num: "01 · Fear",
    title: "Fear of mistakes",
    body: "Athletes play tight when one mistake feels like it defines them.",
  },
  {
    num: "02 · Pressure",
    title: "Pressure to perform",
    body: "Confidence rises and falls with the scoreboard, coach feedback, and playing time.",
  },
  {
    num: "03 · Drift",
    title: "Inconsistent discipline",
    body: "Talent grows when daily habits become a rhythm, not a reaction.",
  },
  {
    num: "04 · Disconnect",
    title: "Faith disconnected from sport",
    body: "Many athletes believe in Christ but do not know how to bring that identity into competition.",
  },
];

export function Problem() {
  return (
    <section id="problem" className="py-20 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="01" label="The problem" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              The scoreboard was never meant to define you.
            </h2>
            <p className="fv-lede">
              Athletes face pressure every day — bad shifts, missed shots, coach
              criticism, comparison, fear of mistakes, the constant need to
              prove themselves. From Victory trains the inner life behind
              performance: identity, discipline, focus, confidence, and
              resilience.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {cards.map((card) => (
            <Reveal key={card.num}>
              <article className="bg-charcoal border border-hairline rounded-lg p-7 transition-colors duration-base ease-out hover:border-hairline-strong hover:bg-surface-1 h-full">
                <div className="font-mono text-[11px] tracking-[0.20em] uppercase text-gold font-semibold mb-7">
                  {card.num}
                </div>
                <h3 className="font-heading font-semibold text-[20px] leading-[1.2] text-cream tracking-[-0.005em] mb-2.5">
                  {card.title}
                </h3>
                <p className="font-body text-[14.5px] leading-[1.55] text-cream/70 m-0">
                  {card.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
