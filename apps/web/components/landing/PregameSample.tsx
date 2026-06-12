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
// Swap is genuinely two constants: SAMPLE_SRC + SAMPLE_DURATION_SEC (the
// pre-load placeholder derives from the constant). A unit test asserts the
// SAMPLE_SRC file exists on disk so a clip regen that re-hashes the filename
// fails CI instead of silently 404ing the play button on prod.
// ---------------------------------------------------------------------------

export const SAMPLE_SRC =
  "/audio/pregame/clips/opener-confidence.5307daf0.mp3"; // candidate A — defaulted
export const SAMPLE_DURATION_SEC = 41.368;

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
  const [failed, setFailed] = useState(false);
  const rafRef = useRef<number | null>(null);
  // True between a play-tap and play() resolving. A second tap during that
  // window is a pause request — without this guard, both continuations used
  // to schedule rAF loops and the orphan ran at 60fps forever (PR #199
  // review must-fix).
  const pendingPlayRef = useRef(false);
  // Screen-reader announcements fire ONLY on state changes (play / pause /
  // finished) — never per-second. The visible countdown deliberately has no
  // aria-live: 41 polite announcements per playthrough is SR chatter.
  const [announce, setAnnounce] = useState("");

  function stopRaf() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  // Lazy-wire the audio element only on first interaction, not on mount.
  // preload="none" keeps landing LCP untouched.
  function ensureAudio() {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = "none";
    audio.src = SAMPLE_SRC;
    audio.addEventListener("canplaythrough", () => setLoaded(true));
    audio.addEventListener("error", () => {
      // Network/decode failure — most likely a stale content hash after a
      // clip regen. Fail visibly instead of leaving a dead play button.
      setFailed(true);
      setPlaying(false);
      stopRaf();
    });
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setProgress(0);
      setCurrentSec(0);
      stopRaf();
      setAnnounce("Sample finished.");
    });
    audioRef.current = audio;
    return audio;
  }

  function tick() {
    const audio = audioRef.current;
    // Self-terminate when the audio is no longer playing — this is the
    // backstop that guarantees no orphaned 60fps loop can survive a
    // pause/ended race, regardless of how it was scheduled.
    if (!audio || audio.paused) {
      rafRef.current = null;
      return;
    }
    const dur = audio.duration || SAMPLE_DURATION_SEC;
    setCurrentSec(audio.currentTime);
    setProgress(audio.currentTime / dur);
    rafRef.current = requestAnimationFrame(tick);
  }

  function startRaf() {
    stopRaf(); // never two concurrent loops
    rafRef.current = requestAnimationFrame(tick);
  }

  async function handleToggle() {
    if (failed) return;
    const audio = ensureAudio();
    if (playing || pendingPlayRef.current) {
      // Pause — including a tap that lands while play() is still pending
      // (pausing rejects the pending play() with AbortError; caught below).
      pendingPlayRef.current = false;
      audio.pause();
      setPlaying(false);
      stopRaf();
      setAnnounce(`Paused at ${formatTime(audio.currentTime)}.`);
      return;
    }
    try {
      pendingPlayRef.current = true;
      await audio.play();
      if (!pendingPlayRef.current) {
        // A pause-tap raced the pending play() and won — honor it.
        audio.pause();
        return;
      }
      pendingPlayRef.current = false;
      setPlaying(true);
      setAnnounce(
        `Playing — ${Math.round(audio.duration || SAMPLE_DURATION_SEC)} second sample.`,
      );
      startRaf();
    } catch {
      // play() rejects on AbortError (paused while pending) and on
      // network/decode failures — real failures also fire the "error"
      // listener above, which surfaces the unavailable state.
      pendingPlayRef.current = false;
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

  // Cleanup on unmount + bfcache: iOS Safari restores the page from bfcache
  // without unmounting, so a pagehide listener stops ghost audio when the
  // visitor navigates away mid-sample.
  useEffect(() => {
    const onPageHide = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        audio.pause();
        setPlaying(false);
      }
      stopRaf();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      stopRaf();
    };
  }, []);

  const duration = audioRef.current?.duration ?? SAMPLE_DURATION_SEC;
  const elapsed = formatTime(currentSec);
  const remaining = formatTime(Math.max(0, duration - currentSec));
  const scrubReady = loaded || playing;

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

              {/* SR-only state announcements — play/pause/finished only. */}
              <span className="sr-only" role="status">
                {announce}
              </span>

              {/* Player card */}
              <div
                className="rounded-[14px] p-4 sm:p-5 flex flex-col gap-2"
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
                    aria-label={
                      playing
                        ? "Pause pregame session sample"
                        : "Play pregame session sample"
                    }
                    aria-disabled={failed}
                    data-testid="pregame-sample-play-btn"
                    className="w-12 h-12 flex-none flex items-center justify-center rounded-full transition-transform duration-[140ms] ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx aria-disabled:opacity-50"
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
                    <h2
                      id="pregame-sample-heading"
                      className="font-heading font-semibold text-[15px] sm:text-[16px] text-cream tracking-[-0.005em] truncate m-0"
                    >
                      Hear a pregame session
                    </h2>
                    <div className="font-body text-[12px] text-cream/50 mt-0.5">
                      {failed ? (
                        "Sample unavailable right now — try again later."
                      ) : scrubReady ? (
                        <span>
                          {elapsed}
                          <span aria-hidden> / </span>
                          <span className="sr-only">&nbsp;of&nbsp;</span>
                          {formatTime(duration)}
                        </span>
                      ) : (
                        `~${Math.round(SAMPLE_DURATION_SEC)} seconds`
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar — the row reserves a 44px touch target; the
                    range fills it (the 4px visual track is decorative). */}
                <div className="relative flex items-center gap-3 min-h-[44px]">
                  <div className="relative flex-1 self-stretch flex items-center rounded-full focus-within:ring-2 focus-within:ring-gold/60 focus-within:ring-offset-2 focus-within:ring-offset-onyx">
                    {/* Track + fill (decorative duplicate of the range) */}
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

                    {/* Accessible range input filling the 44px row */}
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      step={1}
                      value={Math.round(progress * 1000)}
                      onChange={handleScrub}
                      aria-label="Seek pregame sample"
                      aria-valuetext={`${elapsed} of ${formatTime(duration)}`}
                      aria-disabled={!scrubReady}
                      data-testid="pregame-sample-progress"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ margin: 0 }}
                    />
                  </div>

                  {/* Time remaining — visible countdown, deliberately NOT a
                      live region (see the announce state above). /65 clears
                      WCAG AA at this size on the card background. */}
                  <div className="flex-none font-mono text-[10px] tracking-[0.10em] text-cream/65 tabular-nums">
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
                choices — guided narration, about five minutes.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
