// client: audio playback (HTMLAudioElement), play/pause state, progress tracking
"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

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
// Swap the SAMPLE_SRC constant to use B or C per KC's by-ear call.
// ---------------------------------------------------------------------------

const SAMPLE_SRC =
  "/audio/pregame/clips/opener-confidence.5307daf0.mp3"; // candidate A — defaulted
const SAMPLE_DURATION_SEC = 41.368;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PregameSample() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [currentSec, setCurrentSec] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Lazy-wire the audio element only on first interaction, not on mount.
  // preload="none" keeps landing LCP untouched.
  function ensureAudio() {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = "none";
    audio.src = SAMPLE_SRC;
    audio.addEventListener("canplaythrough", () => setLoaded(true));
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setProgress(0);
      setCurrentSec(0);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    });
    audioRef.current = audio;
    return audio;
  }

  function tick() {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration || SAMPLE_DURATION_SEC;
    setCurrentSec(audio.currentTime);
    setProgress(audio.currentTime / dur);
    rafRef.current = requestAnimationFrame(tick);
  }

  async function handleToggle() {
    const audio = ensureAudio();
    if (playing) {
      audio.pause();
      setPlaying(false);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    } else {
      try {
        await audio.play();
        setPlaying(true);
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        // Autoplay policy rejected — no-op (user tapped, so this shouldn't fire)
      }
    }
  }

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const ratio = Number(e.target.value) / 1000;
    const dur = audio.duration || SAMPLE_DURATION_SEC;
    audio.currentTime = ratio * dur;
    setProgress(ratio);
    setCurrentSec(audio.currentTime);
  }

  // Keyboard: Space / Enter on progress bar container (handled via input range natively).
  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const elapsed = formatTime(currentSec);
  const remaining = formatTime(
    Math.max(0, (audioRef.current?.duration ?? SAMPLE_DURATION_SEC) - currentSec),
  );

  return (
    <section
      aria-label="Hear a pregame session"
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

              {/* Player card */}
              <div
                className="rounded-[14px] p-4 sm:p-5 flex flex-col gap-3"
                style={{
                  background:
                    "linear-gradient(160deg,rgba(223,175,55,0.07),rgba(223,175,55,0.02))",
                  border: "1px solid rgba(223,175,55,0.22)",
                }}
              >
                {/* Top row: play/pause + title */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleToggle}
                    aria-label={playing ? "Pause pregame session sample" : "Play pregame session sample"}
                    data-testid="pregame-sample-play-btn"
                    className="w-12 h-12 flex-none flex items-center justify-center rounded-full transition-transform duration-[140ms] ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
                    style={{
                      background: "var(--fv-gold)",
                    }}
                  >
                    {playing ? (
                      // Pause icon (two bars)
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <rect x="3" y="2" width="3.5" height="12" rx="1.5" fill="#050505" />
                        <rect x="9.5" y="2" width="3.5" height="12" rx="1.5" fill="#050505" />
                      </svg>
                    ) : (
                      // Play icon (triangle)
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M5 3.27L13 8 5 12.73V3.27Z"
                          fill="#050505"
                        />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-[15px] sm:text-[16px] text-cream tracking-[-0.005em] truncate">
                      Hear a pregame session
                    </div>
                    <div className="font-body text-[12px] text-cream/50 mt-0.5">
                      {loaded || playing ? (
                        <span>
                          {elapsed}
                          <span aria-hidden> / </span>
                          <span className="sr-only">&nbsp;of&nbsp;</span>
                          {formatTime(SAMPLE_DURATION_SEC)}
                        </span>
                      ) : (
                        "~41 seconds"
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative flex items-center gap-3">
                  {/* Track + fill */}
                  <div
                    className="relative flex-1 h-1 rounded-full overflow-hidden"
                    style={{ background: "rgba(247,247,247,0.10)" }}
                    aria-hidden="true"
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-none"
                      style={{
                        width: `${progress * 100}%`,
                        background: "var(--fv-gold)",
                      }}
                    />
                  </div>

                  {/* Accessible range input overlaid on the visual track */}
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={1}
                    value={Math.round(progress * 1000)}
                    onChange={handleScrub}
                    aria-label="Seek pregame sample"
                    data-testid="pregame-sample-progress"
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    style={{ margin: 0 }}
                  />

                  {/* Time remaining */}
                  <div
                    className="flex-none font-mono text-[10px] tracking-[0.10em] text-cream/40 tabular-nums"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    -{remaining}
                  </div>
                </div>
              </div>

              {/* Caption */}
              <p className="mt-3 font-body text-[13px] text-cream/50 leading-[1.5]">
                Every session is built around your position, your hard moment,
                your cue word.
              </p>
            </div>

            {/* Right: context blurb (hidden on mobile to keep it slim) */}
            <div className="hidden lg:block flex-none max-w-[320px]">
              <p className="font-body text-[14px] leading-[1.6] text-cream/60">
                Before every game, athletes choose their need, their reset
                anchor, and a cue word. The session builds around those
                choices — narrated by Ash, ~5 minutes.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
