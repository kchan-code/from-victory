import { FlameMark } from "@/components/ui";
import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

export function Framework() {
  return (
    <section
      id="framework"
      className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="02" label="The framework" />
        </Reveal>

        <div className="grid gap-14 lg:gap-20 items-center grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Reveal>
            <h2 className="fv-h-section wide">
              Train from the foundation that cannot be taken away.
            </h2>
            <p className="fv-lede mb-8">
              From Victory is built on a simple truth: identity comes before
              performance. Daily discipline trains athletes to live from that
              truth. Over time, that rhythm produces mental toughness,
              confidence under pressure, and resilience after mistakes.
            </p>
            <div className="flex gap-2.5 items-center font-mono text-[11px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
              <FlameMark size={18} />
              Rooted in the Word · Fueled by the Spirit · Built for Victory
            </div>
          </Reveal>

          <Reveal>
            <div className="fv-pyramid">
              <svg
                className="fv-pyramid-svg"
                viewBox="0 0 600 500"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden
              >
                <defs>
                  <linearGradient
                    id="foundationFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="rgba(223,175,55,0.18)" />
                    <stop offset="100%" stopColor="rgba(223,175,55,0.06)" />
                  </linearGradient>
                  <linearGradient id="formationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(247,247,247,0.05)" />
                    <stop offset="100%" stopColor="rgba(247,247,247,0.02)" />
                  </linearGradient>
                  <linearGradient
                    id="expressionFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="rgba(247,247,247,0.025)" />
                    <stop offset="100%" stopColor="rgba(247,247,247,0.01)" />
                  </linearGradient>
                  <radialGradient id="footWash" cx="50%" cy="100%" r="60%">
                    <stop offset="0%" stopColor="rgba(223,175,55,0.10)" />
                    <stop offset="100%" stopColor="rgba(223,175,55,0)" />
                  </radialGradient>
                </defs>

                <polygon
                  points="40,460 560,460 494,322 106,322"
                  fill="url(#foundationFill)"
                  stroke="rgba(223,175,55,0.55)"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <polygon
                  points="40,460 560,460 494,322 106,322"
                  fill="url(#footWash)"
                />
                <polygon
                  points="102,316 498,316 430,180 170,180"
                  fill="url(#formationFill)"
                  stroke="rgba(247,247,247,0.20)"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <polygon
                  points="166,174 434,174 368,40 232,40"
                  fill="url(#expressionFill)"
                  stroke="rgba(247,247,247,0.14)"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />

                <circle cx="106" cy="322" r="3" fill="var(--fv-gold)" />
                <circle cx="494" cy="322" r="3" fill="var(--fv-gold)" />
                <circle
                  cx="170"
                  cy="180"
                  r="2"
                  fill="rgba(223,175,55,0.55)"
                />
                <circle
                  cx="430"
                  cy="180"
                  r="2"
                  fill="rgba(223,175,55,0.55)"
                />
              </svg>

              {/* Foundation tier */}
              <div className="fv-ptier fv-ptier-foundation">
                <div className="font-mono uppercase tracking-[0.22em] font-semibold text-gold text-[clamp(9px,1vw,11px)] mb-2.5">
                  Foundation
                </div>
                <div className="font-heading font-semibold text-cream tracking-[-0.015em] leading-[1.1] text-[clamp(22px,3.2vw,34px)] text-balance">
                  Secure identity in Christ
                </div>
                <div className="font-body text-cream/70 leading-[1.45] mt-1.5 max-w-[38ch] mx-auto text-[clamp(12.5px,1.2vw,14.5px)] text-balance">
                  Your worth is not earned by performance. Every path starts
                  here.
                </div>
              </div>

              {/* Formation tier */}
              <div className="fv-ptier fv-ptier-formation">
                <div className="font-mono uppercase tracking-[0.22em] font-semibold text-cream/50 text-[clamp(9px,1vw,11px)] mb-2.5">
                  Formation
                </div>
                <div className="font-heading font-semibold text-cream tracking-[-0.01em] leading-[1.1] text-[clamp(18px,2.4vw,26px)] text-balance">
                  Daily discipline
                </div>
                <div className="font-body text-cream/50 leading-[1.45] mt-1.5 text-[clamp(11px,1vw,12.5px)] tracking-[0.04em] text-balance">
                  Breath · Truth · Reflection · Prayer · Focus
                </div>
              </div>

              {/* Expression tier */}
              <div className="fv-ptier fv-ptier-expression">
                <div className="font-mono uppercase tracking-[0.20em] font-semibold text-cream/50 text-[clamp(8px,0.85vw,10px)] mb-1.5">
                  Expression
                </div>
                <div className="font-heading font-semibold text-cream tracking-[-0.005em] leading-[1.05] text-[clamp(14px,1.8vw,19px)] text-balance">
                  Spirit-formed character
                </div>
                <div className="font-body text-cream/50 leading-[1.45] mt-1 text-[clamp(9.5px,0.9vw,11px)] tracking-[0.02em]">
                  Mental toughness · Quiet confidence · Reset after mistakes
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-7 font-mono text-[11px] tracking-[0.18em] uppercase text-cream/50 font-semibold justify-center">
              <FlameMark size={16} className="opacity-85" />
              <span>
                Identity supports discipline. Discipline forms character.
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
