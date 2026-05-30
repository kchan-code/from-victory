import { FlameMark } from "@/components/ui";
import { PhoneStatusBar } from "./PhoneStatusBar";
import { Reveal } from "./Reveal";
import { SvgIcon } from "./SvgIcon";

export function Hero() {
  return (
    <section className="relative pt-[168px] md:pt-[132px] pb-24 overflow-hidden isolate">
      {/* Background washes + watermark */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 fv-hero-bg" />
        <div className="fv-hero-watermark" aria-hidden />
      </div>

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-16 lg:gap-[72px] items-center grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* Left column: copy */}
          <Reveal>
            <div className="inline-flex items-center gap-3 mb-7">
              <span className="fv-pulse-dot" />
              <span className="fv-eyebrow">
                Athlete Mindset Training · Built on Scripture
              </span>
            </div>

            <h1 className="fv-h-hero mb-[26px]">
              Your identity is&nbsp;secure.
              <br />
              Compete <em>from victory.</em>
            </h1>

            <p className="max-w-[52ch] mb-9 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              A Christian athlete mindset app that helps you build daily
              discipline, reset after mistakes, and compete with confidence —
              rooted in Christ, not performance.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
              >
                Join the waitlist
                <SvgIcon name="arrow" size={16} />
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-charcoal active:scale-[0.97]"
              >
                <SvgIcon name="play" size={14} />
                See how it works
              </a>
            </div>

          </Reveal>

          {/* Right column: stacked phone mockups */}
          <Reveal>
            <div className="fv-hero-phones" aria-hidden>
              {/* Back phone — verse */}
              <div className="fv-phone fv-phone-back">
                <div className="fv-phone-screen">
                  <div className="fv-phone-notch" />
                  <PhoneStatusBar />
                  <div className="px-5 pt-2 pb-5 flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mt-2 mb-[18px]">
                      <div>
                        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
                          Tuesday · Mar 12
                        </div>
                        <div className="font-heading font-semibold text-[19px] text-cream mt-1 tracking-[-0.01em]">
                          Truth of the day
                        </div>
                      </div>
                    </div>

                    <div className="fv-card-verse border border-hairline rounded-lg p-[18px]">
                      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-gold font-semibold">
                        HEBREWS 12:1-2
                      </div>
                      <div className="font-scripture text-[16px] leading-[1.5] text-cream mt-2.5">
                        &ldquo;Run with perseverance the race marked out for
                        us, fixing our eyes on Jesus.&rdquo;
                      </div>
                    </div>

                    <div className="mt-[18px]">
                      <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-cream/50 font-semibold mb-2">
                        Identity statement
                      </div>
                      <div className="font-heading font-medium text-[15px] leading-[1.35] text-cream">
                        I&apos;m not what I did last shift.
                        <br />
                        I&apos;m secure. I show up again.
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-cream/50 font-semibold mb-2.5">
                        Carry it
                      </div>
                      <div className="bg-charcoal border border-hairline rounded-xl px-3.5 py-3 font-body text-[12.5px] text-cream/70 leading-[1.5]">
                        Three breaths before each shift. Body language stays
                        steady.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Front phone — Today dashboard */}
              <div className="fv-phone fv-phone-front">
                <div className="fv-phone-screen">
                  <div className="fv-phone-notch" />
                  <PhoneStatusBar />
                  <div className="px-5 pt-2 pb-5 flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mt-2 mb-[18px]">
                      <div>
                        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
                          Tuesday · Mar 12
                        </div>
                        <div className="font-heading font-semibold text-[19px] text-cream mt-1 tracking-[-0.01em]">
                          Good morning, Jordan
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-pill border border-hairline inline-flex items-center justify-center text-cream relative">
                        <SvgIcon name="bell" size={15} />
                        <span className="absolute top-[7px] right-[8px] w-[5px] h-[5px] rounded-pill bg-gold" />
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.20em] uppercase font-semibold text-gold">
                      <FlameMark size={11} />
                      From Victory
                    </div>
                    <div className="font-heading font-semibold text-[22px] leading-[1.15] text-cream tracking-[-0.01em] mt-2.5 mb-2">
                      Your worth is not
                      <br />
                      on the scoreboard.
                    </div>
                    <div className="font-body text-[12.5px] leading-[1.5] text-cream/70 mb-[18px]">
                      Today&apos;s game does not define you. Reset, breathe, and
                      take the next faithful step.
                    </div>

                    <div className="fv-rhythm-card rounded-[18px] p-4 mb-2.5">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-16 h-16 rounded-[18px] flex items-center justify-center flex-none"
                          style={{
                            background:
                              "linear-gradient(180deg,rgba(223,175,55,0.18),rgba(223,175,55,0.04))",
                            border: "1px solid rgba(223,175,55,0.32)",
                          }}
                        >
                          <FlameMark
                            size={36}
                            className="text-gold"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-cream/50 font-semibold">
                            Today&apos;s rhythm · Up next
                          </div>
                          <div className="font-heading font-semibold text-[15px] text-cream mt-[3px]">
                            Receive — anchor in truth
                          </div>
                          <div className="font-body text-[11.5px] text-cream/70 mt-0.5">
                            A short Scripture to sit with. About two minutes.
                          </div>
                        </div>
                      </div>
                      <div className="h-px bg-hairline my-3.5" />
                      <div className="w-full bg-gold text-onyx font-heading font-semibold text-[13px] rounded-pill px-3.5 py-2.5 flex items-center justify-center gap-1.5">
                        Continue training
                        <SvgIcon name="arrow" size={13} />
                      </div>
                    </div>

                    <div className="bg-charcoal border border-hairline rounded-[14px] px-3.5 py-3 flex items-center gap-3 mb-[18px]">
                      <div className="w-9 h-9 rounded-[10px] bg-cobalt/[0.18] flex items-center justify-center text-cobalt-bright">
                        <SvgIcon name="zap" size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="font-heading font-semibold text-[13px] text-cream">
                          Three-minute check-in
                        </div>
                        <div className="font-body text-[11px] text-cream/50">
                          Mood, one truth, one step.
                        </div>
                      </div>
                      <SvgIcon
                        name="chev"
                        size={14}
                        className="text-cream/50"
                      />
                    </div>

                    <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-cream/50 font-semibold mb-2">
                      Today&apos;s reps
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-charcoal border border-hairline rounded-[14px] p-3 min-h-[88px] flex flex-col justify-between">
                        <div
                          className="w-7 h-7 rounded-[8px] flex items-center justify-center text-gold"
                          style={{
                            background: "var(--fv-gold-soft)",
                            border: "1px solid rgba(223,175,55,0.28)",
                          }}
                        >
                          <SvgIcon name="wind" size={16} />
                        </div>
                        <div className="flex justify-between items-end mt-3 gap-1.5">
                          <div className="font-heading font-semibold text-[13px] text-cream">
                            Center
                          </div>
                          <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-gold font-semibold">
                            Done
                          </div>
                        </div>
                      </div>
                      <div className="bg-charcoal border border-hairline rounded-[14px] p-3 min-h-[88px] flex flex-col justify-between">
                        <div className="w-7 h-7 rounded-[8px] bg-cream/[0.04] flex items-center justify-center text-cream/70">
                          <SvgIcon name="book" size={16} />
                        </div>
                        <div className="flex justify-between items-end mt-3 gap-1.5">
                          <div className="font-heading font-semibold text-[13px] text-cream">
                            Truth
                          </div>
                          <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-cream/50 font-semibold">
                            2 min
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
