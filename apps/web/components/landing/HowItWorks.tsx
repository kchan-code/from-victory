import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import { SvgIcon } from "./SvgIcon";

const steps = [
  {
    num: "01 · CENTER",
    name: "Breathe.",
    body: "Slow down for sixty seconds. Box breath — four in, two hold, six out. Quiet the noise.",
  },
  {
    num: "02 · RECEIVE",
    name: "Anchor in truth.",
    body: "A short Scripture prompt anchors your identity in Christ — short enough to actually sit with.",
  },
  {
    num: "03 · RESPOND",
    name: "Pray and reflect.",
    body: "A guided prayer, then honest journaling on pressure, mistakes, confidence, and discipline. Private to you.",
  },
  {
    num: "04 · CARRY",
    name: "Take one cue.",
    body: "One focus cue into practice, school, training, or game day. One thing inside your control.",
  },
];

const features = [
  {
    icon: "zap" as const,
    name: "Quick check-in",
    desc: "Three minutes. Mood, one truth, one controllable.",
  },
  {
    icon: "flame" as const,
    name: "Full daily training",
    desc: "Center, truth, reflect, train, carry.",
  },
  {
    icon: "target" as const,
    name: "Pre-game mindset",
    desc: "Breathwork, identity, one controllable goal.",
  },
  {
    icon: "anchor" as const,
    name: "Post-game reset",
    desc: "Reflection for wins, losses, mistakes, tough games.",
  },
  {
    icon: "book" as const,
    name: "Scripture reflection",
    desc: "Short verses, real time to sit with them.",
  },
  {
    icon: "wind" as const,
    name: "Prayer & breathwork",
    desc: "Guided rhythms for stillness and focus.",
  },
  {
    icon: "pulse" as const,
    name: "Weekly rhythm review",
    desc: "Consistency and growth — never shame-based.",
  },
  {
    icon: "link" as const,
    name: "Sport-specific paths",
    desc: "Hockey first. More sports added over time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-20 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="04" label="How the app works" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              A daily rhythm for the athlete&apos;s mind and spirit.
            </h2>
            <p className="fv-lede">
              Breathe. Receive truth. Respond in prayer and reflection. Then
              carry one cue into practice or game day. The same shape every day,
              so it becomes a rhythm — not a reaction.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-hairline mb-16">
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

        <Reveal>
          <div className="flex justify-between items-end gap-8 mb-6 flex-wrap">
            <div>
              <div className="fv-eyebrow gold mb-2.5">
                Eight surfaces, one rhythm
              </div>
              <h3 className="font-heading font-semibold text-[clamp(24px,2.6vw,32px)] leading-[1.1] tracking-[-0.01em] m-0 text-cream max-w-[24ch]">
                Built for the moments athletes actually face.
              </h3>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-hairline border border-hairline rounded-[18px] overflow-hidden">
            {features.map((f) => (
              <div
                key={f.name}
                className="bg-onyx p-6 flex flex-col gap-3 min-h-[144px] transition-colors duration-base ease-out hover:bg-charcoal"
              >
                <div className="w-9 h-9 rounded-[10px] bg-cream/[0.04] flex items-center justify-center text-cream/70">
                  <SvgIcon name={f.icon} size={18} />
                </div>
                <div className="font-heading font-semibold text-[15px] text-cream">
                  {f.name}
                </div>
                <div className="font-body text-[13px] text-cream/50 leading-[1.5]">
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
