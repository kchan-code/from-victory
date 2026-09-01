// client: audio playback (HTMLAudioElement), play/pause state, progress tracking
"use client";

import { useEffect, useRef, useState } from "react";

// FV-545 — the audio-sample player card, extracted verbatim from
// PregameSample so the homepage sample and the /athletes sample share one
// implementation (the rAF-race, pending-play, and bfcache handling below
// were hard-won in PR #199 review; duplicating them invites drift bugs).
// PregameSample keeps its section chrome (eyebrow, caption, CTA, blurb)
// and renders this card; /athletes renders it with the labeled hockey
// first-shift flagship clip. Props only parameterize clip + labels —
// behavior is unchanged.

export interface SamplePlayerProps {
  src: string;
  durationSec: number;
  /** Card title (the accessible heading text). */
  title: string;
  /** Optional mono label line above the title (e.g. the clip's identity). */
  label?: string;
  /** id for the heading element so callers can aria-labelledby it. */
  headingId: string;
  /** aria-label subject, e.g. "pregame session sample". */
  ariaSubject: string;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SamplePlayer({
  src,
  durationSec,
  title,
  label,
  headingId,
  ariaSubject,
}: SamplePlayerProps) {
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
  // aria-live: dozens of polite announcements per playthrough is SR chatter.
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
    audio.src = src;
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
    const dur = audio.duration || durationSec;
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
        `Playing — ${Math.round(audio.duration || durationSec)} second sample.`,
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
    const dur = audio.duration || durationSec;
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

  const duration = audioRef.current?.duration ?? durationSec;
  const elapsed = formatTime(currentSec);
  const remaining = formatTime(Math.max(0, duration - currentSec));
  const scrubReady = loaded || playing;

  return (
    <div>
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
        {label ? (
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase font-semibold text-cream/55">
            {label}
          </div>
        ) : null}

        {/* Top row: play/pause + title */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleToggle}
            aria-label={
              playing ? `Pause ${ariaSubject}` : `Play ${ariaSubject}`
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
                <path d="M5 3.27L13 8 5 12.73V3.27Z" fill="#050505" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h2
              id={headingId}
              className="font-heading font-semibold text-[15px] sm:text-[16px] text-cream tracking-[-0.005em] truncate m-0"
            >
              {title}
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
                `~${Math.round(durationSec)} seconds`
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
              aria-label={`Seek ${ariaSubject}`}
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
    </div>
  );
}
