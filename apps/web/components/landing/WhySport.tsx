import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

const cards = [
  {
    num: "01 · Reveal",
    title: "Trials reveal trust",
    body: "Pressure shows what we are leaning on: performance, approval, control, or Christ.",
  },
  {
    num: "02 · Form",
    title: "Discipline forms character",
    body: "Small daily reps train athletes to respond instead of react.",
  },
  {
    num: "03 · Formation",
    title: "Sport becomes formation",
    body: "Mistakes, adversity, and pressure become places to practice faith, courage, humility, and perseverance.",
  },
];

export function WhySport() {
  return (
    <section id="why-sport" className="py-20 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="02" label="Why sport matters" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              Pressure is not wasted when it forms you.
            </h2>
            <p className="fv-lede">
              Sport puts athletes in moments where identity gets tested —
              mistakes, criticism, fatigue, comparison, pressure, and
              disappointment. From Victory helps athletes see those moments
              differently. They are not proof that you are failing. They are
              invitations to return to Christ, practice discipline, and grow in
              character. The goal is not to glorify hardship or pretend losing
              does not hurt. The goal is to learn how to meet pressure with
              truth, prayer, self-control, and one faithful next step.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
