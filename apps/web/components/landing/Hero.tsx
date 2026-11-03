import Image from "next/image";
import Link from "next/link";
import { isAdultSignupEnabled } from "@/lib/flags";
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

            {/* FV-534: KC-authored hero thesis (2026-08-31), applied
                verbatim after efficacy review. The concrete sport imagery
                the old paragraph carried (goalie/first shot, golfer/first
                tee) now lives in the Visualization section one scroll
                down and on the sport pages; the hero states the thesis.
                Note: the hero no longer carries the "13+" age signal —
                KC's call to restore is a one-word add. */}
            <p className="max-w-[52ch] mb-9 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              Everyone knows visualization matters. From Victory gives
              athletes sport-specific audio guides, grounded in
              Christ&rsquo;s victory, so they can compete fearless and free.
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
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-cream/55 font-semibold mb-0">
              14 days free for first-time subscribers, then $5/mo or $49/yr, cancel anytime
            </p>

            {/* FV-515: 18+ athlete path, flag-gated server-side — quiet
                text-link treatment, not a second competing CTA. Copy reused
                verbatim from the /signup entry link. Renders nothing when
                ENABLE_ADULT_SIGNUP is off, so the hero stays byte-identical
                to today. */}
            {isAdultSignupEnabled() ? (
              <p className="mt-4 font-body text-[13px] text-cream/50">
                Are you the athlete, and 18 or older?{" "}
                <Link
                  href="/signup/athlete"
                  className="text-gold hover:text-gold-bright no-underline"
                >
                  Create your own account
                </Link>
              </p>
            ) : null}

          </div>

          {/* Right column: real product screenshot — the Positive Plays
              pregame capture (FV-533, KC decision: the hero visual should
              show the visualization differentiator itself), also used by
              the app-preview carousel (FV-513), framed in the phone
              chrome the old JSX mockup used (FV-531). Alt text reused
              verbatim from the carousel's positive-plays slide. Hidden
              below `sm` (FV-514): on the smallest phones the phone frame
              was the single biggest contributor to hero height; the
              carousel arrives two sections later. */}
          <div className="hidden sm:block">
            <div className="fv-hero-phones fv-hero-phones--single">
              <div className="fv-phone fv-phone-front">
                <div className="fv-phone-screen">
                  {/* The 1206x2622 capture is a hair taller than the
                      296x632 screen cutout (0.460 vs 0.468 aspect), so
                      object-cover trims ~5px off the top and bottom
                      edges instead of letterboxing. No `priority`: it
                      would emit an unconditional head preload, and this
                      image never renders below `sm` — mobile would pay
                      ~100-200KB for nothing. In-viewport desktop loads
                      start immediately after layout regardless. */}
                  <Image
                    src="/images/screens/screen-pregame-positive-plays.png"
                    width={1206}
                    height={2622}
                    alt="Pregame step 4 of 11, Positive Plays: Picture the plays you'll make, with soccer play chips to pick one to three."
                    sizes="296px"
                    className="block w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
