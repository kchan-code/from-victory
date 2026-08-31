import Link from "next/link";
import { FlameMark } from "@/components/ui";
import { PhoneStatusBar } from "./PhoneStatusBar";
import { SvgIcon } from "./SvgIcon";

export function Hero() {
  return (
    <section className="relative pt-[112px] md:pt-[132px] pb-8 sm:pb-16 md:pb-24 overflow-hidden isolate">
      {/* Background washes + watermark */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 fv-hero-bg" />
        <div className="fv-hero-watermark" aria-hidden />
      </div>

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-10 lg:gap-[72px] items-center grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* Left column: copy — FV-511: no Reveal wrapper. The hero is
              the LCP element; it must render fully visible in SSR HTML
              with or without JS, not depend on IntersectionObserver. */}
          <div>
            <div className="inline-flex items-center gap-3 mb-7">
              <span className="fv-pulse-dot" />
              <span className="fv-eyebrow">
                Guided visualization · Seven sports
              </span>
            </div>

            <h1 className="fv-h-hero mb-[26px]">
              Visualize and compete
              <br />
              <em>from victory.</em>
            </h1>

            {/* FV-514: trimmed one sentence (the surface list, now covered
                by the three-part method section below) to cut hero height —
                meaning preserved, duplication cut. */}
            <p className="max-w-[52ch] mb-9 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              Guided visualization for athletes 13+. You run the first moment
              — a goalie tracks the first shot, a guard sees the first
              possession, a golfer stands over the first tee — not a quiet-room
              highlight. Identity in Christ is the ground under that picture.
            </p>

            <div className="flex flex-wrap gap-3 mb-5">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
              >
                Start your athlete&apos;s 14-day free trial
                <SvgIcon name="arrow" size={16} />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-charcoal active:scale-[0.97]"
              >
                <SvgIcon name="play" size={14} />
                See how it works
              </a>
            </div>
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-cream/40 font-semibold mb-0">
              14 days free for first-time subscribers &mdash; then $5/mo or $49/yr &mdash; cancel anytime
            </p>

          </div>

          {/* Right column: single phone mockup (FV-514 — the back "verse"
              phone was cut; its Hebrews 12:1-2 duplicate now lives once, in
              the method section). Gold accents inside are dimmed so the
              hero CTA above stays the one dominant gold in this viewport.
              Hidden below `sm`: on the smallest phones the decorative
              mockup was still the single biggest contributor to hero
              height — dropping it there keeps the athlete's thumb on
              copy + CTA instead of scrolling past chrome; the app preview
              carousel (real screenshots) arrives two sections later. */}
          <div className="hidden sm:block">
            <div className="fv-hero-phones fv-hero-phones--single" aria-hidden>
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
                      {/* FV-514: dimmed from solid bg-gold to an outline —
                          the hero's real CTA is the only solid gold in this
                          viewport now. */}
                      <div className="w-full border border-gold/40 text-gold/80 font-heading font-semibold text-[13px] rounded-pill px-3.5 py-2.5 flex items-center justify-center gap-1.5">
                        Continue training
                        <SvgIcon name="arrow" size={13} />
                      </div>
                    </div>

                    <div className="bg-charcoal border border-hairline rounded-[14px] px-3.5 py-3 flex items-center gap-3 mb-[18px]">
                      <div className="w-9 h-9 rounded-[10px] bg-gold/[0.08] flex items-center justify-center text-gold">
                        <SvgIcon name="wind" size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="font-heading font-semibold text-[13px] text-cream">
                          Pre-practice lock in
                        </div>
                        <div className="font-body text-[11px] text-cream/50">
                          How you practice is how you play.
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
          </div>
        </div>
      </div>
    </section>
  );
}
