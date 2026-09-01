import Link from "next/link";
import { Reveal } from "./Reveal";
import { SvgIcon } from "./SvgIcon";
import { SamplePlayer } from "./SamplePlayer";

// ---------------------------------------------------------------------------
// Clip selection — content-addressed URL from the clip manifest.
//
// Candidates (all existing, no new mp3s, no MANIFEST_VERSION change):
//
//   A) opener-confidence  /audio/pregame/clips/opener-confidence.5307daf0.mp3  41.4s
//      The confidence identity opener — "who you are" framing, scripture-
//      anchored, hits the emotional core without requiring sport context.
//      DEFAULTED: best standalone for a landing visitor (no sport/position
//      context needed, pure identity + faith tone in ~41s).
//
//   B) shared-opening     /audio/pregame/clips/shared-opening.3f675837.mp3     48.6s
//      The universal breath/settle opening every session starts with —
//      shows the mindfulness/breath mechanic. Good alternative if KC wants
//      to demonstrate the breath UX.
//
//   C) opener-courage     /audio/pregame/clips/opener-courage.d86c2ec1.mp3     52.2s
//      Physical courage / fear-to-performance arc. The most narratively
//      dramatic opener. Good alternative if KC prefers the "courage under
//      pressure" angle (closer to the Problem section framing).
//
// Swap is genuinely two constants: SAMPLE_SRC + SAMPLE_DURATION_SEC (the
// pre-load placeholder derives from the constant). A unit test asserts the
// SAMPLE_SRC file exists on disk so a clip regen that re-hashes the filename
// fails CI instead of silently 404ing the play button on prod.
//
// FV-545: the player card + audio logic moved verbatim to SamplePlayer.tsx
// so the /athletes page can reuse one implementation. This component keeps
// the homepage section chrome (eyebrow, caption, CTA, context blurb) and is
// now a Server Component wrapping the client player.
// ---------------------------------------------------------------------------

export const SAMPLE_SRC =
  "/audio/pregame/clips/opener-reset.15e12b57.mp3"; // FV-305 de-corn re-render (MANIFEST_VERSION e68cc2db) — was opener-confidence, now 61s (>60s cap), swapped to opener-reset (58.4s)
export const SAMPLE_DURATION_SEC = 58.432;

export function PregameSample() {
  return (
    <section
      aria-labelledby="pregame-sample-heading"
      className="py-10 sm:py-12 border-b border-hairline"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
            {/* Left: label + player */}
            <div className="flex-1 min-w-0">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.20em] uppercase font-semibold text-gold"
                  aria-hidden
                >
                  <span className="w-[5px] h-[5px] rounded-full bg-gold" />
                  Sample · Pregame audio
                </span>
              </div>

              <SamplePlayer
                src={SAMPLE_SRC}
                durationSec={SAMPLE_DURATION_SEC}
                title="Hear a pregame session"
                headingId="pregame-sample-heading"
                ariaSubject="pregame session sample"
              />

              {/* Caption */}
              <p className="mt-3 font-body text-[13px] text-cream/50 leading-[1.5]">
                Every session is built around your position, your hard moment,
                your cue word.
              </p>

              {/* Contextual CTA (FV-514 cadence #2) — compact, thumb-reachable
                  right after the player. */}
              <Link
                href="/signup"
                className="mt-4 inline-flex items-center justify-center gap-2 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-5 py-3 min-h-[44px] text-[13.5px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
              >
                Start your athlete&apos;s 14-day free trial
                <SvgIcon name="arrow" size={14} />
              </Link>
            </div>

            {/* Right: context blurb — visible at all widths (FV-514; was
                hidden below lg). */}
            <div className="flex-none max-w-[320px]">
              <p className="font-body text-[14px] leading-[1.6] text-cream/60">
                Before every game, athletes choose their need, their reset
                anchor, and a cue word. The session builds around those
                choices — guided narration, about five minutes.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
