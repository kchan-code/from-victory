import { FlameMark } from "@/components/ui";
import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import { SvgIcon } from "./SvgIcon";

const pairs = [
  { from: "Streak broken", to: "Welcome back" },
  { from: "Faith score", to: "Secure identity" },
  { from: "Lost progress", to: "Next faithful step" },
  { from: "Guilt reminders", to: "Grace-filled prompts" },
];

export function Posture() {
  return (
    <section id="rhythm" className="py-20 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="06" label="Rhythm, not shame" />
        </Reveal>

        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-6 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              Rhythm over shame. Return over perfection.
            </h2>
            <p className="fv-lede">
              From Victory uses rhythm-based progress, not guilt-based streaks.
              Missing a day does not break your identity. It becomes an
              invitation to return. The app encourages daily discipline without
              turning faith or performance into a score.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-14 items-stretch">
            <div className="fv-posture-card border border-hairline rounded-[22px] p-10 flex flex-col gap-[22px]">
              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-gold font-semibold">
                Our posture
              </div>
              <h4 className="font-heading font-semibold text-[clamp(24px,2.8vw,32px)] leading-[1.1] tracking-[-0.015em] m-0 text-cream max-w-[18ch]">
                Because Jesus takes away shame, we don&apos;t train with it.
              </h4>
              <p className="font-body text-[15.5px] leading-[1.6] text-cream/70 m-0">
                From Victory is built on grace, not guilt. Missing a day, having
                a bad game, or struggling with confidence does not change who
                you are in Christ. The app helps athletes return to truth, reset
                with prayer, and take the next faithful step.
              </p>
              <div className="mt-auto pt-[22px] border-t border-hairline flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
                <FlameMark size={16} className="opacity-85" />
                <span>Grace before performance</span>
              </div>
            </div>

            <div className="bg-charcoal border border-hairline rounded-[22px] px-8 py-2 flex flex-col justify-center">
              {pairs.map((p, i) => (
                <div
                  key={p.from}
                  className={`grid items-center py-[22px] gap-4 sm:gap-4 grid-cols-1 sm:grid-cols-[1fr_28px_1fr] ${
                    i === 0 ? "" : "border-t border-hairline"
                  }`}
                >
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.20em] uppercase font-semibold text-cream/50 mb-1.5">
                      Instead of
                    </div>
                    <div className="font-body text-[15px] text-cream/50 leading-[1.3]">
                      {p.from}
                    </div>
                  </div>
                  <div className="hidden sm:flex text-gold items-center justify-center">
                    <SvgIcon name="arrow" size={20} />
                  </div>
                  <div className="sm:pt-0 pt-1">
                    <div className="font-mono text-[10px] tracking-[0.20em] uppercase font-semibold text-gold mb-1.5">
                      We use
                    </div>
                    <div className="font-heading font-semibold text-[17px] text-cream leading-[1.2] tracking-[-0.005em]">
                      {p.to}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
