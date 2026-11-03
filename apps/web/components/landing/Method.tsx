import Link from "next/link";
import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import {
  PREGAME_RITUAL_HREF,
} from "@/lib/gtm/page-titles";

// FV-539 — the Method section, restructured to KC's three phases
// (2026-09-01, copy verbatim): REHEARSE / RESET / RELEASE. Supersedes the
// FV-538 four-step SET/HEAR/RESET/PRAY layout; the setup facts fold into
// phase 01 and the lede. Every phase stays true to the shipped session
// (components/pregame/audio/segments.ts): up to 3 plays + hard moment
// selection, guided audio with real pauses, the reset right after the
// mistake, and a real spoken closing prayer. The pointer link goes to the
// Pregame Ritual guide — the standalone GTM page that walks these same
// phases — mirroring the Visualization section's article-link pattern.
// Not a conversion CTA; the 4-CTA /signup cadence is unaffected.

const parts = [
  {
    num: "01 · REHEARSE",
    name: "Choose it. Hear it.",
    body: "Select up to three plays. With your eyes closed and your phone down, guided audio runs each one with sport-specific cues and real pauses.",
  },
  {
    num: "02 · RESET",
    name: "Practice the way back.",
    body: "The hard moment you selected enters the picture. Take the long exhale, remember what is true, and rehearse the next action you can control.",
  },
  {
    num: "03 · RELEASE",
    name: "Leave it with God.",
    body: "Close in prayer. Ask for Christ’s strength, remember that your identity is secure in Him, and release the result you cannot control.",
  },
];

export function Method() {
  return (
    <section
      id="how"
      className="py-16 sm:py-20 md:py-28 bg-charcoal border-y border-hairline scroll-mt-20"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="02" label="The method" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            {/* KC's stacked headline (2026-09-01) — same sentence as the
                FV-538 H2, now displayed as three lines to mirror the
                Visualization headline triple. Trailing spaces inside the
                first two spans keep textContent readable as one run. */}
            <h2 className="fv-h-section">
              <span className="block">Rehearse it. </span>
              <span className="block">Reset from it. </span>
              <span className="block">Leave it with God.</span>
            </h2>
            <p className="fv-lede">
              Three phases. About five minutes. Built from the plays you
              choose, the pressure you expect, and the truth you need before
              you compete.
            </p>
          </div>
        </Reveal>

        <Reveal>
          {/* Three phases: single column below sm, one row at sm+. Every
              non-last cell gets a bottom hairline below sm and a right
              hairline at sm+. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-b border-hairline mb-8 sm:mb-12">
            {parts.map((part, i) => (
              <div
                key={part.num}
                className={`px-5 py-6 sm:px-7 sm:py-9 transition-colors duration-base ease-out hover:bg-onyx ${
                  i < parts.length - 1
                    ? "sm:border-r border-hairline max-sm:border-b max-sm:border-hairline"
                    : ""
                }`}
              >
                <div className="font-display font-extrabold text-[13px] tracking-[0.12em] text-gold mb-5">
                  {part.num}
                </div>
                <h3 className="font-heading font-semibold text-[22px] tracking-[-0.01em] text-cream m-0 mb-2.5">
                  {part.name}
                </h3>
                <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                  {part.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* The section's one link — the full ritual walk-through lives on
            the Pregame Ritual guide page (FV-539). */}
        <Reveal>
          <p className="font-body text-[15px] leading-[1.6] text-center m-0 mb-16">
            <Link
              href={PREGAME_RITUAL_HREF}
              className="text-gold underline underline-offset-2 hover:text-gold-bright transition-colors duration-fast"
            >
              Read: A pregame ritual for the Christian athlete &rarr;
            </Link>
          </p>
        </Reveal>

        {/* Verbatim: Faith.tsx quote callout — the one spine verse on the
            homepage (Hebrews 12:1-2, per CLAUDE.md canonical). */}
        <Reveal>
          <div
            id="faith"
            className="fv-faith-callout border border-hairline rounded-[20px] px-8 sm:px-9 py-8 max-w-[620px] mx-auto text-left scroll-mt-20"
          >
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-3.5">
              Hebrews 12:1–2
            </div>
            <div className="font-scripture italic text-[clamp(20px,2vw,26px)] leading-[1.5] text-cream text-pretty">
              &ldquo;Let us run with perseverance the race marked out for us,
              fixing our eyes on Jesus.&rdquo;
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
