import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

const steps = [
  {
    num: "01 · TRAIN",
    name: "Read the mental skill.",
    body: "A short, direct lesson in mental toughness — grounded in sport, not theory. Built for the 13-21 athlete.",
  },
  {
    num: "02 · ANCHOR",
    name: "Anchor in Scripture.",
    body: "One verse tied to the skill. Short enough to carry with you. Identity before performance.",
  },
  {
    num: "03 · COMPLETE",
    name: "Mark it done.",
    body: "Tap complete. Your rhythm grows. No streak pressure — just consistent return to the work.",
  },
  {
    num: "04 · CARRY",
    name: "Take one cue.",
    body: "One focus cue into practice, school, training, or game day. One thing inside your control.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-20 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="03" label="How the app works" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              A daily rhythm for the athlete&apos;s mind and spirit.
            </h2>
            <p className="fv-lede">
              Read the mental skill. Anchor in Scripture. Mark it done. Each
              daily session follows the same shape — so it builds a rhythm, not
              a reaction.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-hairline">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`px-7 py-9 transition-colors duration-base ease-out hover:bg-charcoal ${
                  i < steps.length - 1
                    ? "lg:border-r border-hairline"
                    : ""
                } ${
                  i % 2 === 0
                    ? "sm:max-lg:border-r sm:max-lg:border-hairline"
                    : ""
                } ${
                  i < steps.length - 2
                    ? "sm:max-lg:border-b sm:max-lg:border-hairline"
                    : ""
                } ${
                  i < steps.length - 1 ? "max-sm:border-b max-sm:border-hairline" : ""
                }`}
              >
                <div className="font-display font-extrabold text-[14px] tracking-[0.12em] text-gold mb-5 flex items-center gap-2.5">
                  <span>{step.num}</span>
                  <span className="flex-1 h-px bg-[color:var(--fv-hairline)]" />
                </div>
                <h3 className="font-heading font-semibold text-[24px] tracking-[-0.01em] text-cream m-0 mb-2.5">
                  {step.name}
                </h3>
                <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
