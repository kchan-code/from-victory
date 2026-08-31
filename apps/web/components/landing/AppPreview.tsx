// client: tracks the active slide (scroll position via IntersectionObserver)
// for the visible + aria-live "N of 5" progress readout, and drives the
// prev/next buttons' programmatic scroll. Slides themselves are plain
// next/image elements rendered in the initial (server) HTML — only the
// progress/controls state is client-side.
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import { SvgIcon } from "./SvgIcon";

interface Slide {
  id: string;
  src: string;
  /** Short, factual surface name shown under the phone. */
  label: string;
  /** Alt text carries the description — no fake UI is rendered for it. */
  alt: string;
}

// Real product screenshots (1206x2622), reviewed and cleared for public use.
// Order mirrors the athlete's actual path: home -> pregame setup -> guided
// session -> pre-practice lock in.
const SLIDES: Slide[] = [
  {
    id: "home",
    src: "/images/screens/screen-home-dashboard.png",
    label: "Home",
    alt: "App home screen: daily training card, tiles for pregame visualization, pre-practice visualization, journey, and ride home, and a rhythm ring at day 1 of 30. Hebrews 12:2 at the bottom.",
  },
  {
    id: "pregame-intro",
    src: "/images/screens/screen-pregame-intro.png",
    label: "Pre-Game Reset",
    alt: "Pre-Game Reset intro screen reading Breathe. Focus. Compete. with a Begin button and an offline Set up for later option.",
  },
  {
    id: "positive-plays",
    src: "/images/screens/screen-pregame-positive-plays.png",
    label: "Positive Plays",
    alt: "Pregame step 4 of 11, Positive Plays: Picture the plays you'll make, with soccer play chips to pick one to three.",
  },
  {
    id: "guided-session",
    src: "/images/screens/screen-pregame-guided-session.png",
    label: "Guided Session",
    alt: "Pregame step 11 of 11 reading Five minutes. Eyes closed. An Isaiah 41:10 identity card with a gold play button.",
  },
  {
    id: "pre-practice",
    src: "/images/screens/screen-pre-practice-lockin.png",
    label: "Pre-Practice Lock In",
    alt: "Pre-Practice Lock In screen asking how you are showing up today, with Dialed in and Not feeling it options.",
  },
];

export function AppPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Sync the progress readout to whatever slide is actually most visible —
  // covers swipe/scroll as well as the buttons below.
  useEffect(() => {
    const container = containerRef.current;
    if (
      !container ||
      typeof window === "undefined" ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const ratios = new Array<number>(SLIDES.length).fill(0);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.slideIndex);
          if (!Number.isNaN(idx)) ratios[idx] = entry.intersectionRatio;
        }
        let bestIdx = 0;
        let bestRatio = 0;
        ratios.forEach((ratio, idx) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = idx;
          }
        });
        if (bestRatio > 0.1) {
          setActiveIndex((prev) => (prev === bestIdx ? prev : bestIdx));
        }
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
    setActiveIndex(clamped);
    const target = slideRefs.current[clamped];
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView?.({
      behavior: reducedMotion ? "auto" : "smooth",
      inline: "start",
      block: "nearest",
    });
  }

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <section
      id="app"
      className="relative overflow-hidden bg-charcoal py-20 sm:py-24 md:py-32"
    >
      <div className="fv-preview-bg absolute inset-0 pointer-events-none" />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="02" label="The app" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-6 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              Built for the moments athletes actually face.
            </h2>
            <p className="fv-lede">
              Before the game, between games, and every day in between. From
              Victory gives athletes a daily training session, a guided pregame
              reset, and a pre-practice lock-in — all rooted in secure identity.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <div
            ref={containerRef}
            role="group"
            aria-roledescription="carousel"
            aria-label="From Victory app screens"
            className="fv-preview-scroll"
          >
            {SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                ref={(el) => {
                  slideRefs.current[index] = el;
                }}
                data-slide-index={index}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${SLIDES.length}: ${slide.label}`}
                className="flex-none flex flex-col gap-3 w-[268px] sm:w-[300px]"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="rounded-[28px] border border-hairline-strong shadow-elev-3 overflow-hidden bg-onyx">
                  <Image
                    src={slide.src}
                    width={1206}
                    height={2622}
                    alt={slide.alt}
                    loading="lazy"
                    sizes="(min-width: 640px) 300px, 268px"
                    className="block w-full h-auto"
                  />
                </div>
                <p className="font-mono text-[11px] tracking-[0.20em] uppercase text-gold font-semibold text-center m-0">
                  {slide.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 mt-2">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              disabled={isFirst}
              aria-label="Previous screen"
              data-testid="app-preview-prev"
              className="w-11 h-11 flex-none rounded-full border border-hairline-strong flex items-center justify-center text-cream transition-transform duration-fast ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              <SvgIcon name="chev" size={16} className="rotate-180" />
            </button>

            <p
              aria-live="polite"
              data-testid="app-preview-progress"
              className="font-mono text-[12px] tracking-[0.14em] text-cream/60 tabular-nums min-w-[68px] text-center m-0"
            >
              {activeIndex + 1} of {SLIDES.length}
            </p>

            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              disabled={isLast}
              aria-label="Next screen"
              data-testid="app-preview-next"
              className="w-11 h-11 flex-none rounded-full border border-hairline-strong flex items-center justify-center text-cream transition-transform duration-fast ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              <SvgIcon name="chev" size={16} />
            </button>
          </div>

          {/* Contextual CTA (FV-514 cadence #3) — compact, after the preview. */}
          <div className="flex justify-center mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-6 py-3.5 min-h-[44px] text-[14px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
            >
              Start your athlete&apos;s 14-day free trial
              <SvgIcon name="arrow" size={14} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
