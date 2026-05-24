"use client";

import { useEffect, useRef, useState } from "react";

import {
  Button,
  CustomInputRow,
  Eyebrow,
  Icon,
  ScreenBody,
  SectionLabel,
  SelectCard,
  VerseRef,
} from "./shared";
import {
  AUDIO_SCRIPT,
  AUDIO_SESSION_DURATION_S,
  AUDIO_SESSION_SRC,
  CUE_WORDS,
  DEFAULTS,
  RESET_ANCHORS,
  ROLE_CONTENT,
  SCRIPTURE_REF,
  SCRIPTURE_SHORT,
  SELF_TALK_OPTIONS,
  type AudioSegment,
  type PregameState,
} from "./types";

type SetFn = <K extends keyof PregameState>(k: K, v: PregameState[K]) => void;

// ─── SCREEN 5 ─── Reset Anchor (split from old Reset)
export function ResetAnchorScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  const isCustomAnchor = !!state.anchor && !RESET_ANCHORS.includes(state.anchor);

  return (
    <ScreenBody>
      <SectionLabel>Step 05 · Reset Anchor</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Choose your reset anchor.
      </h1>
      <p className="mb-3.5 font-body text-[14px] text-cream/50">
        When pressure hits, what physical cue brings you back?
      </p>

      <div className="grid grid-cols-2 gap-2">
        {RESET_ANCHORS.map((a) => {
          const selected = state.anchor === a;
          return (
            <button
              key={a}
              type="button"
              onClick={() => set("anchor", a)}
              aria-pressed={selected}
              className={`rounded-[12px] border px-3.5 py-3.5 text-left font-heading text-[14px] font-medium text-cream transition-colors duration-fast ${
                selected
                  ? "border-gold/55 bg-gold/[0.06]"
                  : "border-hairline bg-charcoal"
              }`}
            >
              {a}
            </button>
          );
        })}
      </div>
      <div className="mt-2">
        <CustomInputRow
          value={isCustomAnchor ? state.anchor ?? "" : ""}
          selected={isCustomAnchor}
          onChange={(v) => set("anchor", v)}
          placeholder="Custom anchor"
          ariaLabel="Custom reset anchor"
        />
      </div>
    </ScreenBody>
  );
}

// ─── SCREEN 6 ─── Self-Talk Phrase
export function SelfTalkScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  const isCustom = !!state.selfTalk && !SELF_TALK_OPTIONS.includes(state.selfTalk);

  return (
    <ScreenBody>
      <SectionLabel>Step 06 · Self-Talk</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Coach yourself like someone you trust would coach you.
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        What do you need to hear when pressure hits?
      </p>

      <div className="flex flex-col gap-2">
        {SELF_TALK_OPTIONS.map((p) => (
          <SelectCard
            key={p}
            label={p}
            selected={state.selfTalk === p}
            onClick={() => set("selfTalk", p)}
            compact
          />
        ))}
        <CustomInputRow
          value={isCustom ? state.selfTalk ?? "" : ""}
          selected={isCustom}
          onChange={(v) => set("selfTalk", v)}
          placeholder="Write your own coaching line"
          ariaLabel="Write your own coaching line"
        />
      </div>

      {state.selfTalk && (
        <div
          className="relative mt-5 rounded-[14px] border border-gold/35 p-5"
          style={{
            background:
              "linear-gradient(180deg, rgba(223,175,55,0.08), rgba(36,91,255,0.04)), var(--fv-charcoal)",
          }}
        >
          <div className="absolute left-3.5 top-2.5 font-scripture text-[36px] leading-none text-gold/70">
            &ldquo;
          </div>
          <p className="ml-[22px] mt-1.5 font-heading text-[19px] font-semibold leading-[1.35] text-cream">
            {state.selfTalk}
          </p>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 7 ─── Cue Word (split from old Reset)
export function CueWordScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  return (
    <ScreenBody>
      <SectionLabel>Step 07 · Cue Word</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Choose your cue word.
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        One word. The one you&rsquo;d say to yourself between shifts.{" "}
        <span className="text-cream/70">Default: Faithful.</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {CUE_WORDS.map((w) => {
          const selected = state.cueWord === w;
          return (
            <button
              key={w}
              type="button"
              onClick={() => set("cueWord", w)}
              aria-pressed={selected}
              className={`rounded-pill border px-4 py-2.5 font-display text-[13px] font-extrabold uppercase tracking-[0.10em] transition-colors duration-fast ${
                selected
                  ? "border-gold bg-gold text-onyx"
                  : "border-hairline bg-transparent text-cream"
              }`}
            >
              {w}
            </button>
          );
        })}
      </div>

      {state.cueWord && (
        <div className="mt-6 rounded-[14px] border border-hairline bg-surface-1 px-5 py-5 text-center">
          <Eyebrow className="!text-gold">Your Cue Word</Eyebrow>
          <div className="mt-2 font-display text-[44px] font-extrabold uppercase leading-none tracking-[0.06em] text-gold">
            {state.cueWord}
          </div>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 8 ─── Review / Begin Audio
// Read-only summary before the 5-min guided session. Lets the athlete
// confirm they like the setup or go back and edit. CTA "BEGIN GUIDED
// SESSION" lives in the BottomBar (set via FLOW step.cta).
export function ReviewScreen({ state }: { state: PregameState }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Today's focus", value: state.need ?? "—" },
    { label: "Position", value: state.role ?? "—" },
    { label: "Hard moment", value: state.adversity ?? "—" },
    { label: "Reset anchor", value: state.anchor ?? "—" },
    { label: "Self-talk", value: state.selfTalk ?? "—" },
    { label: "Cue word", value: state.cueWord || DEFAULTS.cueWord },
  ];

  return (
    <ScreenBody>
      <SectionLabel>Step 08 · Review</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Here&rsquo;s what we&rsquo;ll work with.
      </h1>
      <p className="mb-5 font-body text-[14px] text-cream/50">
        Five minutes of guided audio. You can close your eyes the whole way.
      </p>

      <div className="overflow-hidden rounded-[14px] border border-hairline bg-charcoal">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={`flex items-baseline justify-between px-4 py-3.5 ${
              i > 0 ? "border-t border-hairline" : ""
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/50">
              {r.label}
            </span>
            <span
              className={`text-right font-heading text-[15px] font-medium text-cream ${
                r.label === "Cue word"
                  ? "font-display !text-[18px] !font-extrabold uppercase tracking-[0.06em] text-gold"
                  : ""
              }`}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center font-scripture text-[15px] italic leading-[1.5] text-cream/70">
        {SCRIPTURE_SHORT}
      </p>
    </ScreenBody>
  );
}

// ─── SCREEN 9 ─── 5-Minute Guided Audio Session
// Tries to play a real audio file at AUDIO_SESSION_SRC. If the file is
// missing or fails (404, autoplay block recovery, etc.), falls back to a
// text-mode timer that walks through AUDIO_SCRIPT segments at the same
// total duration. Brand-spine moments (Romans 8:37 opener, coping plan,
// send-off prayer) live inside that script.
//
// Sets state.audioCompleted = true on natural finish so the BottomBar
// CTA on the next FLOW step can unlock "Show my Pre-Game Card."
function substituteSegment(seg: AudioSegment, state: PregameState): { eyebrow: string; body: string } {
  const role = state.role;
  const roleScenes = role
    ? ROLE_CONTENT[role].scenes.join(" ")
    : "Win the next puck race. Make the next read. Recover and go again.";

  const replace = (s: string) =>
    s
      .replace(/\{\{cueWord\}\}/g, state.cueWord || DEFAULTS.cueWord)
      .replace(/\{\{role\}\}/g, role ?? "Player")
      .replace(/\{\{roleScenes\}\}/g, roleScenes)
      .replace(/\{\{adversity\}\}/g, state.adversity ?? "the hard moment")
      .replace(/\{\{anchor\}\}/g, state.anchor || DEFAULTS.anchor)
      .replace(/\{\{selfTalk\}\}/g, state.selfTalk || DEFAULTS.selfTalk);

  return { eyebrow: replace(seg.eyebrow), body: replace(seg.body) };
}

export function AudioSessionScreen({
  state,
  set,
  onContinue,
}: {
  state: PregameState;
  set: SetFn;
  onContinue: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioMode, setAudioMode] = useState<"audio" | "text">("text");
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const total = AUDIO_SESSION_DURATION_S;
  const completed = state.audioCompleted;

  // Probe for audio availability once on mount. We use a HEAD request to
  // avoid loading the full file just to test for 404.
  useEffect(() => {
    let cancelled = false;
    fetch(AUDIO_SESSION_SRC, { method: "HEAD" })
      .then((res) => {
        if (!cancelled && res.ok) setAudioMode("audio");
      })
      .catch(() => {
        // network error / file missing — stay in text mode
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Text-mode timer: ticks elapsed forward while playing.
  useEffect(() => {
    if (audioMode !== "text" || !playing || completed) return;
    const id = window.setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= total) {
          setPlaying(false);
          set("audioCompleted", true);
          return total;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [audioMode, playing, completed, total, set]);

  // Audio-mode wiring
  useEffect(() => {
    if (audioMode !== "audio") return;
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setElapsed(Math.floor(el.currentTime));
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      set("audioCompleted", true);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [audioMode, set]);

  const togglePlay = () => {
    if (audioMode === "audio") {
      const el = audioRef.current;
      if (!el) return;
      if (el.paused) {
        el.play().catch(() => {
          // autoplay block / decode error — drop to text mode so the
          // session is still usable
          setAudioMode("text");
          setPlaying(true);
        });
      } else {
        el.pause();
      }
    } else {
      setPlaying((p) => !p);
    }
  };

  // Pick the current segment by startSec ≤ elapsed
  const segments = AUDIO_SCRIPT;
  let currentIdx = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg && seg.startSec <= elapsed) currentIdx = i;
  }
  const seg = segments[currentIdx];
  const view = seg
    ? substituteSegment(seg, state)
    : { eyebrow: "Identity", body: SCRIPTURE_SHORT };

  const remaining = Math.max(0, total - elapsed);
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const remainingLabel = `${mm}:${String(ss).padStart(2, "0")}`;
  const pct = Math.min(100, (elapsed / total) * 100);

  return (
    <div
      className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-5"
      style={{
        background:
          "radial-gradient(80% 50% at 50% 20%, rgba(36,91,255,0.12), transparent 65%), radial-gradient(60% 40% at 50% 100%, rgba(223,175,55,0.08), transparent 70%), var(--fv-onyx)",
      }}
    >
      <SectionLabel>Step 09 · Guided Session</SectionLabel>

      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="font-heading text-[24px] font-bold leading-[1.15] text-cream">
          Five minutes. Eyes closed.
        </h1>
        <span className="font-mono text-[12px] tracking-[0.14em] text-cream/70">
          {remainingLabel}
        </span>
      </div>

      <div className="mb-5 h-1 overflow-hidden rounded-full bg-cream/[0.08]">
        <div
          className="h-full bg-gold transition-[width] duration-fast"
          style={{ width: `${pct}%` }}
        />
      </div>

      {audioMode === "audio" && (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- transcript
        // is rendered visually below; native track support skipped for MVP.
        <audio
          ref={audioRef}
          src={AUDIO_SESSION_SRC}
          preload="auto"
          onError={() => setAudioMode("text")}
        />
      )}

      <div
        className="mb-5 flex-1 rounded-[18px] border border-hairline px-6 py-8"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 0%, rgba(223,175,55,0.07), transparent 60%), var(--fv-charcoal)",
        }}
      >
        <Eyebrow className="!text-gold">{view.eyebrow}</Eyebrow>
        <p className="mt-4 font-scripture text-[19px] italic leading-[1.55] text-cream">
          {view.body}
        </p>
        {audioMode === "text" && (
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40">
            Reading mode · audio coming soon
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          disabled={completed}
          aria-label={playing ? "Pause guided session" : "Play guided session"}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-gold text-onyx transition-transform duration-fast active:scale-95 disabled:opacity-50"
        >
          <Icon name={playing ? "pause" : "play"} size={26} />
        </button>

        {completed ? (
          <Button variant="coach" full onClick={onContinue}>
            SHOW MY PRE-GAME CARD
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setElapsed(total);
              set("audioCompleted", true);
              if (audioMode === "audio" && audioRef.current) {
                audioRef.current.pause();
              }
            }}
            className="self-center font-mono text-[10px] uppercase tracking-[0.18em] text-cream/50 hover:text-cream"
          >
            Skip to the card
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 10 ─── Pregame Card
function CardRow({
  label,
  value,
  italic,
  bold,
}: {
  label: string;
  value: string;
  italic?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/50">
        {label}
      </div>
      <div
        className={`text-[15px] leading-[1.35] text-cream ${
          italic ? "font-scripture italic" : "font-heading"
        } ${bold ? "font-bold" : "font-medium"}`}
      >
        {value}
      </div>
    </div>
  );
}

export function PregameCardScreen({
  state,
  onQuick,
  onDone,
}: {
  state: PregameState;
  onQuick: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-onyx px-5 pb-8 pt-5">
      <div className="mb-4 text-center">
        <Eyebrow className="!tracking-[0.26em] !text-gold">
          Your Pre-Game Card
        </Eyebrow>
        <p className="mt-1.5 font-body text-[13px] text-cream/50">
          Screenshot it. Open it before puck drop.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-[22px] border border-gold/30 px-5 pb-5 pt-6"
        style={{
          background:
            "radial-gradient(100% 60% at 50% 0%, rgba(223,175,55,0.10), transparent 65%), radial-gradient(80% 50% at 50% 100%, rgba(36,91,255,0.08), transparent 70%), linear-gradient(180deg, #0d0d0d, #060606)",
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(247,247,247,0.04)",
        }}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.22em] text-cream/50">
              From Victory
            </div>
            <div className="mt-px font-display text-[14px] font-extrabold uppercase tracking-[0.10em] text-cream">
              Pre-Game
            </div>
          </div>
          {state.need && (
            <div className="text-right">
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-cream/50">
                Today
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-gold">{state.need}</div>
            </div>
          )}
        </div>

        <div className="mb-5">
          <VerseRef>{SCRIPTURE_REF.toUpperCase()}</VerseRef>
          <p className="mt-2 font-scripture text-[15px] italic leading-[1.5] text-cream/70">
            {SCRIPTURE_SHORT}
          </p>
        </div>

        <div className="mb-5 border-y border-hairline py-4">
          <div className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/50">
            Cue Word
          </div>
          <div className="font-display text-[52px] font-extrabold uppercase leading-[0.95] tracking-[0.04em] text-gold">
            {state.cueWord || DEFAULTS.cueWord}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <CardRow label="Reset anchor" value={state.anchor || DEFAULTS.anchor} />
          <CardRow
            label="Self-talk"
            value={state.selfTalk || DEFAULTS.selfTalk}
            italic
          />
          {state.role && <CardRow label="Position" value={state.role} />}
          {state.adversity && <CardRow label="If it gets hard" value={state.adversity} bold />}
        </div>

        <div className="mt-5 border-t border-hairline pt-3.5 text-center">
          <p className="m-0 font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-cream">
            Play From <span className="text-gold">Victory</span>.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          full
          onClick={onQuick}
          leading={<Icon name="bolt" size={14} className="text-gold" />}
        >
          Quick reset
        </Button>
        <Button variant="coach" full onClick={onDone}>
          DONE
        </Button>
      </div>
    </div>
  );
}
