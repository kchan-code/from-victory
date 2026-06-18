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
            {/* Container-query clip-path pyramid: one layout at every width.
               Each tier is a trapezoid drawn behind the copy (so text never
               clips), sized in container-query units so the silhouette and
               type breathe down to phone width without a separate mobile
               treatment. DOM order is top→bottom: Expression, Formation,
               Foundation. */}
            <div className="fv-pyramid">
              <div className="fv-pyramid-stack">
                {/* Expression — pointed-top apex + trapezoid body */}
                <div className="fv-ptier fv-ptier-expression">
                  <div className="fv-ptier-cap" aria-hidden>
                    <span />
                  </div>
                  <div className="fv-ptier-body">
                    <span className="fv-ptier-shape" aria-hidden />
                    <div className="fv-ptier-content">
                      <div className="font-heading font-bold uppercase tracking-[0.22em] text-[#8c8a85] text-[clamp(8px,2cqw,11px)]">
                        Expression
                      </div>
                      <div className="font-heading font-semibold text-cream leading-[1.12] text-[clamp(17px,4.4cqw,25px)] mt-[0.4em]">
                        Spirit-formed character
                      </div>
                      <div className="font-body text-cream/60 leading-[1.4] text-[clamp(11px,2.5cqw,14px)] mt-[0.5em]">
                        Mental toughness · Quiet confidence · Reset after
                        mistakes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formation */}
                <div className="fv-ptier fv-ptier-formation">
                  <div className="fv-ptier-body">
                    <span className="fv-ptier-shape" aria-hidden />
                    <div className="fv-ptier-content">
                      <div className="font-heading font-bold uppercase tracking-[0.22em] text-[#8c8a85] text-[clamp(8px,2cqw,11px)]">
                        Formation
                      </div>
                      <div className="font-heading font-semibold text-cream leading-[1.1] text-[clamp(19px,5cqw,27px)] mt-[0.4em]">
                        Daily discipline
                      </div>
                      <div className="font-body text-cream/60 leading-[1.4] text-[clamp(11px,2.5cqw,14px)] mt-[0.5em]">
                        Breath · Truth · Reflection · Prayer · Focus
                      </div>
                    </div>
                  </div>
                  <span className="fv-ptier-dot" style={{ left: "12%" }} aria-hidden />
                  <span className="fv-ptier-dot" style={{ left: "88%" }} aria-hidden />
                </div>

                {/* Foundation — widest, gold-warm base */}
                <div className="fv-ptier fv-ptier-foundation">
                  <div className="fv-ptier-body">
                    <span className="fv-ptier-shape" aria-hidden />
                    <div className="fv-ptier-content">
                      <div className="font-heading font-bold uppercase tracking-[0.22em] text-gold text-[clamp(8px,2cqw,11px)]">
                        Foundation
                      </div>
                      <div className="font-heading font-bold text-cream leading-[1.06] text-[clamp(22px,6.4cqw,38px)] mt-[0.35em]">
                        Secure identity in Christ
                      </div>
                      <div className="font-body text-cream/[0.72] leading-[1.45] text-[clamp(11px,2.7cqw,15px)] mt-[0.5em] max-w-[32ch] mx-auto">
                        Your worth is not earned by performance. Every path
                        starts here.
                      </div>
                    </div>
                  </div>
                  <span className="fv-ptier-dot" style={{ left: "6%" }} aria-hidden />
                  <span className="fv-ptier-dot" style={{ left: "94%" }} aria-hidden />
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
