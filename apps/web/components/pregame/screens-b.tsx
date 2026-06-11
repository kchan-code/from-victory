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
  AUDIO_SESSION_DURATION_S,
  CUE_WORDS,
  DEFAULTS,
  NEED_VERSE,
  PRAYER_STYLE_OPTIONS,
  SCRIPTURE_REF,
  SCRIPTURE_SHORT,
  SCRIPTURE_TEXT,
  type AudioSegment,
  type NeedVerse,
  type PrayerStyle,
  type PregameState,
} from "./types";
import { audioAssetUrl, cellSrcFor, cellSlugFor, openerSrcFor } from "./audio-mapping";
import type { Sport, SportConfig } from "./sport-registry";
import { HOCKEY_CONFIG, adversityLabelFor } from "./sport-registry";
import { positivePlayTitle } from "./positive-plays";
import type { AudioTimeline, Phase } from "./audio/types";
import { findActivePhase, type AssembledTimeline } from "./audio-playlist";
import { useClipPlayer } from "./useClipPlayer";

type SetFn = <K extends keyof PregameState>(k: K, v: PregameState[K]) => void;

// ─── SCREEN 5 ─── Reset Anchor (split from old Reset)
// sportConfig.anchors is sport-keyed (FV-117): hockey shows stick-tap / glove
// options; basketball shows ball-bounce / floor-tap / rim-look options.
// "Long exhale", "Press thumb to palm", "Say cue word" are shared.
export function ResetAnchorScreen({
  state,
  set,
  sportConfig,
}: {
  state: PregameState;
  set: SetFn;
  sportConfig: SportConfig;
}) {
  const anchors = sportConfig.anchors;
  const isCustomAnchor = !!state.anchor && !anchors.includes(state.anchor);

  return (
    <ScreenBody>
      <SectionLabel>Step 06 · Reset Anchor</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Choose your reset anchor.
      </h1>
      <p className="mb-3.5 font-body text-[14px] text-cream/50">
        When pressure hits, what physical cue brings you back?
      </p>

      <div className="grid grid-cols-2 gap-2">
        {anchors.map((a) => {
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
// sportConfig.selfTalkOptions is sport-keyed (FV-117): hockey shows
// "You're okay. Next shift."; basketball shows "You're okay. Next possession."
// The other 6 phrases are sport-neutral and shared.
export function SelfTalkScreen({
  state,
  set,
  sportConfig,
}: {
  state: PregameState;
  set: SetFn;
  sportConfig: SportConfig;
}) {
  const selfTalkOptions = sportConfig.selfTalkOptions;
  const isCustom = !!state.selfTalk && !selfTalkOptions.includes(state.selfTalk);

  return (
    <ScreenBody>
      <SectionLabel>Step 07 · Self-Talk</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Coach yourself like someone you trust would coach you.
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        What do you need to hear when pressure hits?
      </p>

      <div className="flex flex-col gap-2">
        {selfTalkOptions.map((p) => (
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
// FV-175: sportConfig.cueWordHelper replaces the hockey-specific literal so
// basketball athletes see "at the line" instead of "between shifts".
export function CueWordScreen({
  state,
  set,
  sportConfig = HOCKEY_CONFIG,
}: {
  state: PregameState;
  set: SetFn;
  sportConfig?: SportConfig;
}) {
  return (
    <ScreenBody>
      <SectionLabel>Step 08 · Cue Word</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Choose your cue word.
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        One word. {sportConfig.cueWordHelper}{" "}
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

// ─── SCREEN 7b ─── Prayer Style selector
// Lets the athlete choose how the guided session closes:
//   "Pray with me"      → guided prayer narration (shared-prayer)
//   "I'll pray on my own" → invitation + ~18-20s held silence (shared-prayer-selfguided)
// Default is "guided" so it's one tap to continue for athletes who want company.
// Self-guided is opt-in — the clip already contains the silence; no audio change needed.
export function PrayerStyleScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  return (
    <ScreenBody>
      <SectionLabel>Step 09 · Closing Prayer</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        How do you want to close?
      </h1>
      <p className="mb-5 font-body text-[14px] text-cream/50">
        Both end in prayer. You choose how.
      </p>

      <div
        className="flex flex-col gap-2"
        role="radiogroup"
        aria-label="Closing prayer style"
      >
        {PRAYER_STYLE_OPTIONS.map(({ value, label, sub }) => (
          <SelectCard
            key={value}
            label={label}
            sub={sub}
            selected={state.prayerStyle === value}
            onClick={() => set("prayerStyle", value as PrayerStyle)}
          />
        ))}
      </div>
    </ScreenBody>
  );
}

// ─── SCREEN 8 (formerly 8) ─── Review / Begin Audio
// Read-only summary before the 5-min guided session. Lets the athlete
// confirm they like the setup or go back and edit. CTA "BEGIN GUIDED
// SESSION" lives in the BottomBar (set via FLOW step.cta).
//
// FV-129 (Option B): offline download is OPT-IN via explicit tap. The auto-
// precache trigger has been removed. On mount we still run a network-free cache
// check — if the athlete already downloaded on a prior visit the "Ready offline"
// badge appears immediately with no action and no network call. If not cached,
// a secondary "Download for offline" button is shown; tapping it starts the
// precache. The guided session streams fine online; offline is a bonus, not
// an assumption, and the athlete controls when data is spent.
export function ReviewScreen({
  state,
  sportConfig = HOCKEY_CONFIG,
  sport = "hockey",
}: {
  state: PregameState;
  sportConfig?: SportConfig;
  sport?: Sport;
}) {
  // ── FV-129: offline readiness indicator ─────────────────────────────────
  // "idle"     → haven't checked yet (SSR / caches API absent) or not cached
  // "loading"  → explicit-tap download in progress
  // "ready"    → all reachable clips confirmed in cache (no network needed)
  // "partial"  → download finished but incomplete; show retry button
  // "retrying" → retry tap in progress (same UI as "loading")
  type OfflineState = "idle" | "loading" | "ready" | "partial" | "retrying";
  const [offlineState, setOfflineState] = useState<OfflineState>("idle");
  const [cacheProgress, setCacheProgress] = useState<{ cached: number; total: number }>({
    cached: 0,
    total: 0,
  });
  // Ref so the in-flight download can be cancelled if the component unmounts.
  const downloadCancelledRef = useRef(false);

  // ── Mount-time cache check (network-free) ────────────────────────────────
  // Only checks; never fetches. If already complete, shows "Ready offline"
  // immediately. This covers athletes who downloaded on a previous visit.
  useEffect(() => {
    if (typeof caches === "undefined") return;
    if (!state.need || !state.adversity) return;

    let cancelled = false;

    async function check() {
      const { checkPregameAudioCached } = await import("./audio-precache");
      if (cancelled) return;

      const status = await checkPregameAudioCached({
        sport,
        need: state.need!,
        position: state.role ?? null,
        adversity: state.adversity!,
        anchor: state.anchor ?? null,
        selfTalk: state.selfTalk ?? null,
        cueWord: state.cueWord || null,
        prayerStyle: state.prayerStyle,
        positivePlays: state.positivePlays,
      });

      if (cancelled) return;

      if (status.done) {
        setOfflineState("ready");
        setCacheProgress({ cached: status.cached, total: status.total });
      }
      // Not done → stay "idle"; the opt-in button is shown.
    }

    check().catch(() => {
      // Non-fatal: button stays visible, athlete can still tap to download.
    });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Re-run only when the key setup fields change. Sport config changes never
    // happen mid-flow so sportConfig is intentionally excluded to avoid an extra
    // run if the parent re-renders with a stable but re-created config object.
    sport,
    state.need,
    state.role,
    state.positivePlays,
    state.adversity,
    state.anchor,
    state.selfTalk,
    state.cueWord,
    state.prayerStyle,
  ]);

  const closeLabel = state.prayerStyle === "self-guided"
    ? "Pray on my own"
    : "Pray with me";

  // ── Explicit-tap download handler ─────────────────────────────────────────
  // Called when the athlete taps "Download for offline" (or the retry button).
  // Sets loading state, runs precachePregameAudio with live progress, then
  // resolves to "ready", "partial" (show retry), or back to "idle" on total
  // failure — never leaves a stuck spinner, never shows a false "ready."
  async function handleDownloadTap() {
    if (typeof caches === "undefined") return;
    if (!state.need || !state.adversity) return;

    const isRetry = offlineState === "partial";
    setOfflineState(isRetry ? "retrying" : "loading");
    setCacheProgress({ cached: 0, total: 0 });
    downloadCancelledRef.current = false;

    try {
      const { precachePregameAudio } = await import("./audio-precache");

      const finalStatus = await precachePregameAudio(
        {
          sport,
          need: state.need,
          position: state.role ?? null,
          adversity: state.adversity,
          anchor: state.anchor ?? null,
          selfTalk: state.selfTalk ?? null,
          cueWord: state.cueWord || null,
          prayerStyle: state.prayerStyle,
          positivePlays: state.positivePlays,
        },
        (status) => {
          if (downloadCancelledRef.current) return;
          setCacheProgress({ cached: status.cached, total: status.total });
        },
      );

      if (downloadCancelledRef.current) return;

      if (finalStatus.done) {
        setOfflineState("ready");
        setCacheProgress({ cached: finalStatus.cached, total: finalStatus.total });
      } else if (finalStatus.cached > 0) {
        // Partial: some clips cached but not all. Show retry so the athlete
        // knows something happened — never silent failure, never false "ready."
        setOfflineState("partial");
        setCacheProgress({ cached: finalStatus.cached, total: finalStatus.total });
      } else {
        // Zero clips cached: lie-fi, captive portal, cellular block, hard error.
        // Return to idle (tappable) — no stuck spinner, no false promise.
        setOfflineState("idle");
      }
    } catch {
      // Unexpected error (dynamic import failure, etc.) — return to tappable.
      if (!downloadCancelledRef.current) setOfflineState("idle");
    }
  }

  // Cancel any in-flight download on unmount.
  useEffect(() => {
    return () => {
      downloadCancelledRef.current = true;
    };
  }, []);

  const rows: Array<{ label: string; value: string }> = [
    { label: "Today's focus", value: state.need ?? "—" },
    { label: "Position", value: state.role ?? "—" },
    {
      // FV-144 — the picked positive plays, by title, in rehearsal order.
      label: "Positive plays",
      value:
        state.positivePlays.length > 0
          ? state.positivePlays.map(positivePlayTitle).join(" · ")
          : "—",
    },
    {
      label: "Hard moment",
      value: adversityLabelFor(sportConfig, state.role, state.adversity) ?? "—",
    },
    { label: "Reset anchor", value: state.anchor ?? "—" },
    { label: "Self-talk", value: state.selfTalk ?? "—" },
    { label: "Cue word", value: state.cueWord || DEFAULTS.cueWord },
    { label: "Close", value: closeLabel },
  ];

  return (
    <ScreenBody>
      <SectionLabel>Step 10 · Review</SectionLabel>
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

      {/* FV-129 a11y: one persistent live region, always mounted, so VoiceOver /
          NVDA reliably announce state changes from a stable element. The
          visual control below is presentational/interactive only. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {offlineState === "loading" || offlineState === "retrying"
          ? cacheProgress.total > 0
            ? `Downloading audio, ${cacheProgress.cached} of ${cacheProgress.total}`
            : "Downloading audio"
          : offlineState === "ready"
            ? "Audio ready for offline play"
            : offlineState === "partial"
              ? `Download didn’t finish, ${cacheProgress.cached} of ${cacheProgress.total} clips saved. Tap to retry.`
              : ""}
      </div>

      {/* FV-129: opt-in offline download control — keyed to actual cache state */}
      <OfflineDownloadControl
        state={offlineState}
        cached={cacheProgress.cached}
        total={cacheProgress.total}
        onTap={handleDownloadTap}
      />
    </ScreenBody>
  );
}

// ── FV-129 offline download control ──────────────────────────────────────────
// Rendered at the bottom of the Review screen below the scripture quote.
// Replaces the FV-106 auto-triggered badge with an opt-in tap control.
//
// "idle"     → tappable "Download for offline" button (primary offer).
// "loading"  → same button, aria-busy, showing "Downloading… X / Y" + pulse dot.
// "retrying" → same as "loading" (athlete tapped retry after partial).
// "ready"    → gold "Ready offline" badge (confirmed by cache, not onLine).
// "partial"  → same button, "Couldn't finish — tap to retry".
//
// The control is calm and secondary — it must not dominate the pre-game moment.
// a11y (FV-129 qa): idle/loading/retrying/partial all render the SAME <button>
// at the same tree position, so keyboard/SR focus is preserved across the
// tap→download transition. During download it is marked aria-busy + aria-disabled
// (NOT the native `disabled` attribute, which would blur it and drop focus) and
// onTap is detached so it can't double-fire. The ≥44px tap target is kept. Only
// "ready" is a non-button badge (terminal success, announced via the live region).
function OfflineDownloadControl({
  state,
  cached,
  total,
  onTap,
}: {
  state: "idle" | "loading" | "ready" | "partial" | "retrying";
  cached: number;
  total: number;
  onTap: () => void;
}) {
  // "ready" — confirmed cached. Gold badge, no action needed.
  if (state === "ready") {
    return (
      <div className="mt-4 flex items-center justify-center gap-1.5">
        {/* Checkmark circle — inline SVG, no icon dependency */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="6.5" stroke="#DFAF37" strokeWidth="1" />
          <path
            d="M4.5 7l1.8 1.8L9.5 5.5"
            stroke="#DFAF37"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
          Ready offline
        </span>
      </div>
    );
  }

  // idle / loading / retrying / partial all render the SAME <button> at the same
  // tree position so React preserves the element — and thus keyboard/SR focus —
  // across the tap→download transition. (Only "ready" above is a non-button badge.)
  const busy = state === "loading" || state === "retrying";

  let primary: string;
  let subtext: string | null;
  let ariaLabel: string;
  if (busy) {
    primary = total > 0 ? `Downloading… ${cached} / ${total}` : "Downloading…";
    subtext = null;
    ariaLabel = "Downloading audio for offline play";
  } else if (state === "partial") {
    primary = "Couldn’t finish — tap to retry";
    subtext = null;
    ariaLabel = "Retry offline audio download";
  } else {
    primary = "Download for offline";
    subtext = "Plays with no signal at the rink. Uses a few MB.";
    ariaLabel = "Download audio for offline play";
  }

  return (
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        // Detach the handler while busy so a second tap can't start a parallel
        // download. aria-disabled (not the native `disabled`) keeps it focusable.
        onClick={busy ? undefined : onTap}
        aria-busy={busy}
        aria-disabled={busy}
        aria-label={ariaLabel}
        data-testid="offline-download-btn"
        className={`flex min-h-[44px] flex-col items-center gap-0.5 rounded-sm px-3 py-1 text-center transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx ${
          busy ? "cursor-default" : "hover:opacity-80 active:scale-95"
        }`}
      >
        <span className="flex items-center gap-1.5">
          {busy && (
            <span
              className="block h-1.5 w-1.5 animate-pulse rounded-full bg-cream/30"
              aria-hidden="true"
            />
          )}
          <span
            className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
              state === "idle" ? "text-cream/50" : "text-cream/40"
            }`}
          >
            {primary}
          </span>
        </span>
        {subtext && (
          <span className="font-body text-[11px] text-cream/30">{subtext}</span>
        )}
      </button>
    </div>
  );
}

// ─── SCREEN 9 ─── 5-Minute Guided Audio Session
//
// Compositional architecture: a need-specific opener.mp3 plays first
// (~0:50-1:07 — identity + need-specific verse), then the
// (position × adversity) cell.mp3 plays (~4:00-4:30 — breath, rink,
// first shift, role rehearsal, hard moment, reset, prayer, send-off).
// Sequential playback: opener.ended → cell.play(). Total composed
// duration is opener.duration + cell.duration (typically 5:00-5:30).
//
// If either file is missing / fails (HEAD 404, autoplay block,
// decode error), falls back to the legacy text-mode timer that walks
// AUDIO_SCRIPT segments. The text-mode Identity segment renders the
// need-specific verse via NEED_VERSE[state.need]; the audio path
// is the primary experience.
//
// Sets state.audioCompleted = true on cell.ended so the FLOW's next
// step CTA can unlock "Show my Pre-Game Card."

// ---------------------------------------------------------------------------
// Section pip helpers
//
// Six sections map the ~39-phase timeline onto unlabeled position dots.
// The section grouping is intentional for "eyes closed" mode — we want
// ~6 equal-feeling beats, not 11 micro-phases. The pip lights gold as the
// athlete moves through the session; it never animates or pulses.
//
// OPENER contributes phase "intro".
// CELL contributes settle/inhale/exhale/rink/firstShift/roleRehearsal/
//   hardMoment/reset/prayer/done.
// ---------------------------------------------------------------------------

type PipSection = 0 | 1 | 2 | 3 | 4 | 5;

const PHASE_TO_SECTION: Record<Phase, PipSection> = {
  intro: 0,
  settle: 1,
  inhale: 1,
  exhale: 1,
  rink: 2,
  firstShift: 3,
  roleRehearsal: 3,
  hardMoment: 4,
  reset: 5,
  prayer: 5,
  done: 5,
};

function findActivePhaseFromTimeline(
  timeline: AudioTimeline,
  currentSec: number,
): Phase | null {
  let active: Phase | null = null;
  for (let i = 0; i < timeline.phases.length; i++) {
    const p = timeline.phases[i];
    if (p && p.startSec <= currentSec) active = p.phase;
    else break;
  }
  return active;
}

// ---------------------------------------------------------------------------
// Text-mode stage labels (reading mode — eyes open by definition)
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<string, string> = {
  Identity: "Receive",
  Settle: "Settle",
  "Breathe in": "Breathe in",
  "Long exhale": "Long exhale",
  "See the rink": "See the rink",
  "Your first shift": "First shift",
  "Play your role": "First shift",
  "If this happens": "The hard moment",
  "Coach yourself": "Reset and go again",
  "Send-off": "Send-off",
};

// Eyebrow text → athlete-facing stage label. Goalie-aware for firstShift.
// role is string | null (PregameState.role); "Goalie" check is still a string comparison.
function eyebrowToStageLabel(eyebrow: string, role: PregameState["role"]): string {
  // Strip the role suffix from "Play your role · Forward" etc.
  const base = eyebrow.split("·")[0]?.trim() ?? eyebrow;
  if (base === "Your first shift") {
    return role === "Goalie" ? "First save" : "First shift";
  }
  return (
    STAGE_LABELS[base] ??
    STAGE_LABELS[eyebrow] ??
    base
  );
}

function substituteSegment(
  seg: AudioSegment,
  state: PregameState,
  sportConfig: SportConfig = HOCKEY_CONFIG,
): { eyebrow: string; body: string } {
  const role = state.role;
  // Guard: roleContent may be absent for no-ask sports, or the selected role
  // may not be in the map (e.g. a custom string). Fall back to generic scenes.
  const roleContent = sportConfig.roleContent ?? {};
  const roleEntry = role ? (roleContent[role] ?? null) : null;
  const roleScenes = roleEntry
    ? roleEntry.scenes.join(" ")
    : "Win the next puck race. Make the next read. Recover and go again.";

  const replace = (s: string) =>
    s
      .replace(/\{\{cueWord\}\}/g, state.cueWord || DEFAULTS.cueWord)
      .replace(/\{\{role\}\}/g, role ?? "Player")
      .replace(/\{\{roleScenes\}\}/g, roleScenes)
      .replace(
        /\{\{adversity\}\}/g,
        adversityLabelFor(sportConfig, role, state.adversity) ?? "the hard moment",
      )
      .replace(/\{\{anchor\}\}/g, state.anchor || DEFAULTS.anchor)
      .replace(/\{\{selfTalk\}\}/g, state.selfTalk || DEFAULTS.selfTalk);

  return { eyebrow: replace(seg.eyebrow), body: replace(seg.body) };
}

// ---------------------------------------------------------------------------
// Clip-player flag  (Phase 4: DEFAULT ON)
// ---------------------------------------------------------------------------
//
// The clip player is now the default experience for all athletes.
// Append ?clipPlayer=0 to force the legacy two-<audio> path (A/B testing /
// debugging only — not a supported user-facing option).
//
// The flag is read once at component mount (via a ref) so it can't change
// mid-session and doesn't cause extra renders.
//
// When the flag is OFF (?clipPlayer=0), the existing two-<audio> path runs
// EXACTLY as before. No regressions on the fallback path.

function useClipPlayerFlag(): boolean {
  // Read from location.search on the client; SSR always returns false.
  if (typeof window === "undefined") return false;
  // Default ON: only disabled when explicitly set to "0".
  return new URLSearchParams(window.location.search).get("clipPlayer") !== "0";
}

// FV-112 diagnostic flag. Surfaces the active audio path + clip-player error
// on-screen so a beta tester can screenshot WHY a session truncated. Sticky via
// localStorage so it survives client-side navigation inside an installed PWA:
// append ?debug=1 once (it persists through the flow); ?debug=0 clears it.
// Off by default — invisible to normal users.
function readDebugFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const qp = new URLSearchParams(window.location.search).get("debug");
    if (qp === "1") {
      window.localStorage.setItem("fv_debug", "1");
      return true;
    }
    if (qp === "0") {
      window.localStorage.removeItem("fv_debug");
      return false;
    }
    return window.localStorage.getItem("fv_debug") === "1";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Clip-path active-pip + phase derivation
// Mirrors the existing legacy inline IIFE in AudioSessionScreen but reads from
// AssembledTimeline instead of two separate AudioTimeline sidecars.
// ---------------------------------------------------------------------------

function clipActivePipAndPhase(
  timeline: AssembledTimeline | null,
  elapsedSec: number,
): { activePip: PipSection | null; activePhase: Phase | null } {
  if (!timeline) return { activePip: null, activePhase: null };
  const phase = findActivePhase(timeline, elapsedSec);
  if (phase === null) return { activePip: null, activePhase: null };
  return { activePip: PHASE_TO_SECTION[phase] ?? null, activePhase: phase };
}

export function AudioSessionScreen({
  state,
  set,
  onContinue,
  sportConfig = HOCKEY_CONFIG,
  sport = "hockey",
}: {
  state: PregameState;
  set: SetFn;
  onContinue: () => void;
  sportConfig?: SportConfig;
  /**
   * The athlete's sport key. Threaded into cellSrcFor, cellSlugFor, and
   * useClipPlayer so the audio engine is sport-aware within the session.
   * Defaults to "hockey" so callers that haven't migrated yet stay green.
   */
  sport?: Sport;
}) {
  // ── Clip player flag — read once, stable for the session ──
  // useClipPlayerFlag reads window.location.search; calling it unconditionally
  // on every render is fine — it's a pure read with no side effects. We still
  // persist it to a ref so mid-session navigations (unlikely) can't change it.
  const flagValue = useClipPlayerFlag();
  const clipPlayerFlagRef = useRef(flagValue);
  const useClips = clipPlayerFlagRef.current;

  // ── Clip player hook (Phase 0 path) ──
  // Always called (hooks must not be conditional) but only active when flag is on.
  // When flag is off, need/position/adversity are passed as null so the hook
  // returns error="no template" immediately and the legacy path runs as normal.
  const clipPlayer = useClipPlayer({
    need: useClips ? (state.need ?? null) : null,
    position: useClips ? (state.role ?? null) : null,
    adversity: useClips ? (state.adversity ?? null) : null,
    anchor: useClips ? state.anchor : null,
    selfTalk: useClips ? state.selfTalk : null,
    cueWord: useClips ? (state.cueWord || null) : null,
    positivePlays: useClips ? state.positivePlays : null,
    prayerStyle: useClips ? state.prayerStyle : undefined,
    sport,
    onCompleted: useClips
      ? () => {
          set("audioCompleted", true);
        }
      : undefined,
  });

  const openerRef = useRef<HTMLAudioElement>(null);
  const cellRef = useRef<HTMLAudioElement>(null);

  // Derive MP3 sources from pregame state. openerSrcFor is sport-aware so
  // basketball gets the right opener slug (FV-117 / FV-116).
  const openerSrc = openerSrcFor(state.need, sport);
  const cellSrc = cellSrcFor(state.role, state.adversity, sport);

  // Default optimistically to audio: the assets exist in the normal path, so
  // we render the clean audio-mode card (and mount/preload the <audio>
  // elements) immediately. The HEAD probe below only DOWNGRADES to text if the
  // files are genuinely missing — starting in "text" caused a one-frame flash
  // of the long reading-mode paragraph before the probe flipped to audio.
  const [audioMode, setAudioMode] = useState<"audio" | "text">(
    openerSrc && cellSrc ? "audio" : "text",
  );
  const [playing, setPlaying] = useState(false);
  const [activeSegment, setActiveSegment] = useState<"opener" | "cell">("opener");
  const [openerDuration, setOpenerDuration] = useState(0);
  const [cellDuration, setCellDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const completed = state.audioCompleted;

  // ── Clip player error → fall back to text mode ──
  // Mirrors the `onError` handler on the legacy <audio> elements. Runs once
  // when clipPlayer.error becomes non-null and the flag is on.
  useEffect(() => {
    if (!useClips) return;
    if (clipPlayer.error) {
      // "no template" means the current combination has no matching manifest
      // entry — not a true error, just use the legacy path silently.
      if (clipPlayer.error !== "no template") {
        setAudioMode("text");
      }
    }
  }, [useClips, clipPlayer.error]);

  // Sidecar timelines for pip section detection.
  // Loaded in parallel with the HEAD probe; failure is graceful — pips
  // simply don't render rather than blocking playback.
  const [openerTimeline, setOpenerTimeline] = useState<AudioTimeline | null>(null);
  const [cellTimeline, setCellTimeline] = useState<AudioTimeline | null>(null);

  // Combined target duration. Falls back to the legacy constant until
  // metadata loads; once durations stream in, switches to the real sum.
  const total =
    audioMode === "audio" && openerDuration + cellDuration > 0
      ? openerDuration + cellDuration
      : AUDIO_SESSION_DURATION_S;

  // Probe both files. We start in audio mode (above) and only DOWNGRADE to
  // text-mode reading if a file is missing / unreachable, so the normal path
  // never flashes the reading paragraph.
  //
  // FV-106: skip the probe entirely when the clip player is active. The clip
  // path owns reachability — useClipPlayer fetches the manifest + each clip
  // ArrayBuffer and sets clipPlayer.error on failure, which the effect above
  // converts to setAudioMode("text"). This probe hits the LEGACY root URLs
  // (/audio/pregame/opener-*.mp3, /audio/pregame/session-*.mp3), which the SW
  // and precache never cache — only /audio/pregame/clips/* is cached. Offline
  // those HEAD fetches throw, so the unguarded probe was dropping a fully
  // cached clip session to text mode at the rink (the exact case FV-106 fixes).
  useEffect(() => {
    if (useClips) return;
    if (!openerSrc || !cellSrc) {
      setAudioMode("text");
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch(openerSrc, { method: "HEAD" }),
      fetch(cellSrc, { method: "HEAD" }),
    ])
      .then(([o, c]) => {
        if (!cancelled && (!o.ok || !c.ok)) setAudioMode("text");
      })
      .catch(() => {
        if (!cancelled) setAudioMode("text");
      });
    return () => {
      cancelled = true;
    };
  }, [useClips, openerSrc, cellSrc]);

  // Load sidecar JSON timelines for pip section detection.
  // Completely separate from the HEAD probe — failures are silent, pips
  // just don't render.
  //
  // FV-130: skip entirely when the clip player is active. In that path pips are
  // derived from clipPlayer.timeline (see the activePip derivation below), so
  // these LEGACY root sidecars (/audio/pregame/opener-*.json, session-*.json)
  // are unused — and they're never precached, so offline they 503 on every clip
  // session at the rink. The condition mirrors the pip-derivation guard so the
  // "no template" legacy fallback (useClips on, clipPlayer.error set) still
  // fetches its timelines.
  useEffect(() => {
    if (useClips && !clipPlayer.error) return;
    if (!state.need || audioMode !== "audio") return;
    let cancelled = false;

    // Re-use NEED_OPENER_SLUGS mapping from audio-mapping via the opener
    // src URL: derive the slug from openerSrc rather than duplicating the map.
    if (openerSrc) {
      // Slug is the path segment before ".mp3", e.g. "opener-confidence"
      const match = openerSrc.match(/\/([^/]+)\.mp3/);
      const openerSlug = match?.[1] ?? null;
      if (openerSlug) {
        fetch(audioAssetUrl(openerSlug, "json"))
          .then(async (res) => {
            if (cancelled || !res.ok) return;
            const json = (await res.json()) as AudioTimeline;
            setOpenerTimeline(json);
          })
          .catch(() => {/* graceful: pips just don't render */});
      }
    }

    if (state.role && state.adversity) {
      const cellSlug = cellSlugFor(state.role, state.adversity, sport);
      fetch(audioAssetUrl(cellSlug, "json"))
        .then(async (res) => {
          if (cancelled || !res.ok) return;
          const json = (await res.json()) as AudioTimeline;
          setCellTimeline(json);
        })
        .catch(() => {/* graceful: pips just don't render */});
    }

    return () => { cancelled = true; };
  }, [
    state.need,
    state.role,
    state.adversity,
    audioMode,
    openerSrc,
    sport,
    useClips,
    clipPlayer.error,
  ]);

  // Text-mode timer (fallback). Unchanged from prior behavior.
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

  // Audio-mode wiring: two elements, sequential playback.
  useEffect(() => {
    if (audioMode !== "audio") return;
    const o = openerRef.current;
    const c = cellRef.current;
    if (!o || !c) return;

    const onOpenerMeta = () => setOpenerDuration(o.duration || 0);
    const onCellMeta = () => setCellDuration(c.duration || 0);

    const onOpenerTime = () => {
      if (activeSegment === "opener") setElapsed(o.currentTime);
    };
    const onCellTime = () => {
      if (activeSegment === "cell") setElapsed(openerDuration + c.currentTime);
    };

    const onOpenerEnded = () => {
      // Auto-transition to the cell. Don't flip `playing` — we're still
      // playing, just from a different element.
      setActiveSegment("cell");
      c.play().catch(() => {
        // Cell failed to autoplay → drop to text mode so the session
        // still completes for the athlete.
        setAudioMode("text");
        setPlaying(true);
      });
    };
    const onCellEnded = () => {
      setPlaying(false);
      set("audioCompleted", true);
    };

    const onAnyPlay = () => setPlaying(true);
    const onAnyPause = (which: "opener" | "cell") => () => {
      // Don't flip to paused on the opener's natural end — the cell
      // takes over before this matters, but the `pause` event fires on
      // `ended` in some browsers. Filter that case.
      if (which === "opener" && o.ended) return;
      setPlaying(false);
    };

    o.addEventListener("loadedmetadata", onOpenerMeta);
    c.addEventListener("loadedmetadata", onCellMeta);
    o.addEventListener("timeupdate", onOpenerTime);
    c.addEventListener("timeupdate", onCellTime);
    o.addEventListener("ended", onOpenerEnded);
    c.addEventListener("ended", onCellEnded);
    o.addEventListener("play", onAnyPlay);
    c.addEventListener("play", onAnyPlay);
    const openerPauseHandler = onAnyPause("opener");
    const cellPauseHandler = onAnyPause("cell");
    o.addEventListener("pause", openerPauseHandler);
    c.addEventListener("pause", cellPauseHandler);

    // If metadata already loaded before listeners attached (cache hit),
    // pull durations immediately.
    if (o.duration && !openerDuration) setOpenerDuration(o.duration);
    if (c.duration && !cellDuration) setCellDuration(c.duration);

    return () => {
      o.removeEventListener("loadedmetadata", onOpenerMeta);
      c.removeEventListener("loadedmetadata", onCellMeta);
      o.removeEventListener("timeupdate", onOpenerTime);
      c.removeEventListener("timeupdate", onCellTime);
      o.removeEventListener("ended", onOpenerEnded);
      c.removeEventListener("ended", onCellEnded);
      o.removeEventListener("play", onAnyPlay);
      c.removeEventListener("play", onAnyPlay);
      o.removeEventListener("pause", openerPauseHandler);
      c.removeEventListener("pause", cellPauseHandler);
    };
  }, [audioMode, activeSegment, openerDuration, cellDuration, set]);

  const togglePlay = () => {
    // ── Clip player path ──
    if (useClips && audioMode === "audio" && !clipPlayer.error) {
      if (clipPlayer.playing) {
        clipPlayer.pause();
      } else {
        clipPlayer.play();
      }
      return;
    }
    // ── Legacy two-<audio> path ──
    if (audioMode === "audio") {
      const o = openerRef.current;
      const c = cellRef.current;
      if (!o || !c) return;
      const active = activeSegment === "opener" ? o : c;
      if (active.paused) {
        active.play().catch(() => {
          // Autoplay block / decode error → fall back to text mode.
          setAudioMode("text");
          setPlaying(true);
        });
      } else {
        active.pause();
      }
    } else {
      setPlaying((p) => !p);
    }
  };

  // ---------------------------------------------------------------------------
  // Verse for audio-mode card: need-specific from NEED_VERSE, fallback to spine.
  // The verse is fixed for the whole session — one focal point, no changes
  // mid-session — giving the athlete something to return to with their eyes closed.
  // ---------------------------------------------------------------------------
  const sessionVerse: NeedVerse =
    state.need != null
      ? NEED_VERSE[state.need]
      : { reference: SCRIPTURE_REF, displayText: SCRIPTURE_TEXT };

  // ---------------------------------------------------------------------------
  // Pip section detection + active phase (audio mode only).
  // Both are derived from the same sidecar timeline lookup — the phase is
  // surfaced here so card content can swap on phase boundaries.
  // If timelines haven't loaded, both are null — pips hide, card shows verse.
  // ---------------------------------------------------------------------------
  const { activePip, activePhase } = (() => {
    if (audioMode !== "audio") return { activePip: null, activePhase: null };
    // ── Clip path: assembled timeline covers the whole session ──
    if (useClips && !clipPlayer.error) {
      return clipActivePipAndPhase(clipPlayer.timeline, clipPlayer.elapsedSec);
    }
    // ── Legacy path: two sidecar timelines ──
    if (activeSegment === "opener") {
      if (!openerTimeline) return { activePip: null, activePhase: null };
      const phase = findActivePhaseFromTimeline(openerTimeline, elapsed);
      if (phase === null) return { activePip: null, activePhase: null };
      return { activePip: PHASE_TO_SECTION[phase] ?? null, activePhase: phase };
    } else {
      // Cell: elapsed is opener+cell combined; cell currentTime = elapsed - openerDuration
      if (!cellTimeline) return { activePip: null, activePhase: null };
      const cellTime = Math.max(0, elapsed - openerDuration);
      const phase = findActivePhaseFromTimeline(cellTimeline, cellTime);
      if (phase === null) return { activePip: null, activePhase: null };
      return { activePip: PHASE_TO_SECTION[phase] ?? null, activePhase: phase };
    }
  })() as { activePip: PipSection | null; activePhase: Phase | null };

  // ---------------------------------------------------------------------------
  // Card view: which content fills the focal card during audio mode.
  // Driven purely by phase — no extra state, no timers.
  //   "verse"     — the need-specific scripture (default / no-timeline fallback)
  //   "resetTrio" — anchor + self-talk + cue word (hardMoment + reset phases)
  //   "cueOnly"   — the cue word alone, carried out the door (prayer + done)
  // ---------------------------------------------------------------------------
  type CardView = "verse" | "resetTrio" | "cueOnly";
  const cardView: CardView = (() => {
    if (activePhase === "hardMoment" || activePhase === "reset") return "resetTrio";
    if (activePhase === "prayer" || activePhase === "done") return "cueOnly";
    return "verse";
  })();

  // ---------------------------------------------------------------------------
  // On-screen view text.
  // Audio mode: show the session verse (need-specific). Fixed the whole session.
  // Text mode: walk AUDIO_SCRIPT segments by elapsed time (legacy).
  // ---------------------------------------------------------------------------
  let view: { eyebrow: string; body: string };
  let textModeStageLabel: string | null = null;

  if (audioMode === "audio") {
    view = {
      eyebrow: "Identity",
      body: sessionVerse.displayText,
    };
  } else {
    // FV-175: use sport-specific audio script so basketball text-mode shows
    // "See the gym" / "Your first possession" instead of hockey equivalents.
    const segments = sportConfig.audioScript;
    let currentIdx = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg && seg.startSec <= elapsed) currentIdx = i;
    }
    const seg = segments[currentIdx];
    view = seg
      ? substituteSegment(seg, state, sportConfig)
      : { eyebrow: "Identity", body: SCRIPTURE_SHORT };
    textModeStageLabel = eyebrowToStageLabel(view.eyebrow, state.role);
  }

  // ── Render-time aliases: clip path overrides legacy values ──
  // When the clip player is active (flag on, no error), use its values for the
  // progress bar, timer, and play-button state. Legacy variables (`elapsed`,
  // `total`, `playing`, `completed`) remain in scope for the legacy path.
  const isClipActive = useClips && audioMode === "audio" && !clipPlayer.error;
  const renderElapsed = isClipActive ? clipPlayer.elapsedSec : elapsed;
  const renderTotal = isClipActive
    ? (clipPlayer.totalSec > 0 ? clipPlayer.totalSec : AUDIO_SESSION_DURATION_S)
    : total;
  const renderPlaying = isClipActive ? clipPlayer.playing : playing;
  const renderCompleted = isClipActive ? clipPlayer.completed : completed;

  const remaining = Math.max(0, renderTotal - renderElapsed);
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);
  const remainingLabel = `${mm}:${String(ss).padStart(2, "0")}`;
  const pct = renderTotal > 0 ? Math.min(100, (renderElapsed / renderTotal) * 100) : 0;

  // F3: derive the loading state for the clip path only.
  // While isClipActive and not yet ready (and not completed), the play button
  // should be disabled so the affordance matches the silent no-op guard in the
  // hook. Decoding starts on mount so this window is brief — no layout shift
  // since disabled:opacity-50 is already wired on the button (no size change).
  const clipLoading = isClipActive && !clipPlayer.ready && !renderCompleted;

  // FV-112 diagnostic readout. Enabled by ?debug=1 (desktop) OR by tapping the
  // step label 5× (the only way to reach it inside an installed iOS PWA, where
  // there's no address bar and PWA storage is isolated from Safari). Sticky via
  // localStorage; effect-set to avoid an SSR/hydration mismatch.
  const [debug, setDebug] = useState(false);
  useEffect(() => setDebug(readDebugFlag()), []);
  const debugTapRef = useRef<{ n: number; t: number }>({ n: 0, t: 0 });
  const onDebugTap = () => {
    const now = Date.now();
    const tap = debugTapRef.current;
    // Generous 5s window so 5 deliberate taps register even on a slow tapper.
    if (now - tap.t > 5000) tap.n = 0;
    tap.n += 1;
    tap.t = now;
    if (tap.n >= 5) {
      tap.n = 0;
      setDebug((d) => {
        const next = !d;
        try {
          if (next) window.localStorage.setItem("fv_debug", "1");
          else window.localStorage.removeItem("fv_debug");
        } catch {
          /* private mode — non-fatal */
        }
        return next;
      });
    }
  };

  return (
    <div
      className="relative flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-5"
      aria-busy={clipLoading}
      style={{
        background:
          "radial-gradient(80% 50% at 50% 20%, rgba(36,91,255,0.12), transparent 65%), radial-gradient(60% 40% at 50% 100%, rgba(223,175,55,0.08), transparent 70%), var(--fv-onyx)",
      }}
    >
      {/* FV-222: Ambient cobalt radial-gradient overlay that pulses while audio
          plays. Absolutely positioned so it never shifts content. The keyframe
          breathes the overlay's opacity 12%→18%→12% on a 6s cycle, giving the
          background a slow, calm "breathing" feel during the guided session.
          Conditional on renderPlaying so it stops when paused or completed. */}
      {renderPlaying && (
        <div
          aria-hidden="true"
          className="animate-audio-pulse pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(80% 50% at 50% 20%, rgba(36,91,255,1), transparent 65%)",
          }}
        />
      )}
      {/* FV-112: tap 5× to toggle the debug overlay (installed-PWA-usable).
          touch-action:manipulation stops iOS double-tap-zoom from eating the
          rapid taps; select-none avoids a text-selection on multi-tap. */}
      <div
        onClick={onDebugTap}
        className="select-none"
        style={{ touchAction: "manipulation" }}
      >
        <SectionLabel>Step 11 · Guided Session</SectionLabel>
      </div>

      {debug && (
        <div className="mb-3 rounded-[8px] border border-gold/50 bg-onyx/95 p-2.5 font-mono text-[10px] leading-[1.5] text-cream/85">
          <div className="mb-1 font-semibold uppercase tracking-[0.14em] text-gold">
            FV-112 debug
          </div>
          <div>
            path:{" "}
            {isClipActive
              ? "clip (stitched blob)"
              : audioMode === "text"
                ? "TEXT — fallback (no audio)"
                : "legacy two-audio"}
          </div>
          <div>
            useClips: {String(useClips)} · audioMode: {audioMode} · segment:{" "}
            {activeSegment}
          </div>
          <div>
            clip.ready: {String(clipPlayer.ready)} · clip.dur:{" "}
            {clipPlayer.totalSec.toFixed(1)}s
          </div>
          <div className={clipPlayer.error ? "text-gold" : undefined}>
            clip.error: {clipPlayer.error ?? "none"}
          </div>
          <div>
            pos: {state.role ?? "—"} · adv: {state.adversity ?? "—"}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="font-heading text-[24px] font-bold leading-[1.15] text-cream">
          {audioMode === "text" ? "Five minutes. Read along." : "Five minutes. Eyes closed."}
        </h1>
        <span className="font-mono text-[12px] tracking-[0.14em] text-cream/70">
          {remainingLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-1 overflow-hidden rounded-full bg-cream/[0.08]">
        <div
          className="h-full bg-gold transition-[width] duration-fast"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Section pips — audio mode only, only when timelines have loaded.
          Unlabeled dots; gold = current section, no animation/pulse. */}
      {audioMode === "audio" && activePip !== null && (
        <div
          className="mb-5 flex items-center justify-center gap-[7px]"
          role="presentation"
          aria-label={`Session progress: section ${activePip + 1} of 6`}
        >
          {([0, 1, 2, 3, 4, 5] as const).map((i) => (
            <span
              key={i}
              className={`block h-[5px] w-[5px] rounded-full transition-colors duration-300 ${
                i === activePip ? "bg-gold" : "bg-cream/[0.18]"
              }`}
            />
          ))}
        </div>
      )}
      {/* Reserve the pip row height when not shown so layout doesn't shift
          between audio and text modes or before timelines load. */}
      {(audioMode !== "audio" || activePip === null) && (
        <div className="mb-5 h-[5px]" aria-hidden />
      )}

      {/* Legacy <audio> elements — only rendered when the clip player is NOT active.
          Clip path pre-decodes via Web Audio API; no HTMLAudioElements needed. */}
      {audioMode === "audio" && openerSrc && cellSrc && !isClipActive && (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio
            ref={openerRef}
            src={openerSrc}
            preload="auto"
            onError={() => setAudioMode("text")}
          />
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio
            ref={cellRef}
            src={cellSrc}
            preload="auto"
            onError={() => setAudioMode("text")}
          />
        </>
      )}

      <div
        className="mb-5 flex-1 rounded-[18px] border border-hairline px-6 py-8"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 0%, rgba(223,175,55,0.07), transparent 60%), var(--fv-charcoal)",
        }}
      >
        {/* ── TEXT MODE ── stage label + script body + choice strip ── */}
        {audioMode === "text" && (
          <>
            {textModeStageLabel && (
              <div className="mb-3 font-display text-[28px] font-extrabold uppercase leading-none tracking-[0.04em] text-cream">
                {textModeStageLabel}
              </div>
            )}

            <Eyebrow className="!text-gold">{view.eyebrow}</Eyebrow>
            <p className="mt-4 font-scripture text-[20px] italic leading-[1.55] text-cream">
              {view.body}
            </p>

            {/* Persistent choice strip — reading mode; athlete can glance at their
                three choices without phase-gating since eyes are open. */}
            <div className="mt-6 flex flex-col gap-3 border-t border-hairline pt-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">
                  Your Anchor
                </p>
                <p className="mt-0.5 line-clamp-2 font-heading text-[14px] font-medium leading-[1.35] text-cream/80">
                  {state.anchor || DEFAULTS.anchor}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">
                  Cue Word
                </p>
                <p className="mt-0.5 font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-gold">
                  {state.cueWord || DEFAULTS.cueWord}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">
                  Coach Yourself
                </p>
                <p className="mt-0.5 line-clamp-2 font-heading text-[14px] font-medium leading-[1.35] text-cream/80">
                  {state.selfTalk || DEFAULTS.selfTalk}
                </p>
              </div>
            </div>

            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40">
              Reading mode · audio coming soon
            </p>
          </>
        )}

        {/* ── AUDIO MODE ── phase-synced card with ~300ms opacity fade on swap ── */}
        {audioMode === "audio" && (
          // key={cardView} causes React to unmount+remount the element on view
          // change, triggering the animate-in CSS class from globals.css. This is
          // the simplest phase-boundary fade without adding timers or extra state.
          <div key={cardView} className="animate-card-fade-in">
            {/* VIEW: verse (default + intro/settle/breath/rink/firstShift phases) */}
            {cardView === "verse" && (
              <>
                <Eyebrow className="!text-gold">{view.eyebrow}</Eyebrow>
                {sessionVerse.eyebrow && (
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-gold/70">
                    {sessionVerse.eyebrow}
                  </p>
                )}
                <p className="mt-4 font-scripture text-[20px] italic leading-[1.55] text-cream">
                  {view.body}
                </p>
                <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-gold/70">
                  {sessionVerse.reference}
                </p>
              </>
            )}

            {/* VIEW: resetTrio (hardMoment + reset phases)
                Audio says: "Return to your anchor. Speak the truth. This is the move."
                Screen carries the athlete's specific choices. */}
            {cardView === "resetTrio" && (
              <>
                <div className="mb-5 flex flex-col gap-4">
                  {/* Anchor */}
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">
                      Your Anchor
                    </p>
                    <p className="mt-1 line-clamp-2 font-heading text-[18px] font-semibold leading-[1.3] text-cream">
                      {state.anchor || DEFAULTS.anchor}
                    </p>
                  </div>

                  {/* Self-talk */}
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">
                      Coach Yourself
                    </p>
                    <p className="mt-1 line-clamp-2 font-scripture text-[16px] italic leading-[1.45] text-cream/90">
                      {state.selfTalk || DEFAULTS.selfTalk}
                    </p>
                  </div>

                  {/* Divider before cue word prominence */}
                  <div className="border-t border-hairline" />

                  {/* Cue word — prominent focal element */}
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">
                      Cue Word
                    </p>
                    <p className="mt-1.5 font-display text-[44px] font-extrabold uppercase leading-[0.95] tracking-[0.05em] text-gold">
                      {state.cueWord || DEFAULTS.cueWord}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* VIEW: cueOnly (prayer + done phases)
                The one word carried out the door — large, gold, nothing competing.
                When self-guided and in the prayer phase, a calm "Take your time."
                affordance reassures the athlete the silence is intentional — they
                prayed as long as they needed. No audio change; the clip already
                carries the silence. */}
            {cardView === "cueOnly" && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                {state.prayerStyle === "self-guided" && activePhase === "prayer" ? (
                  <>
                    <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">
                      Quiet moment
                    </p>
                    <p className="font-heading text-[32px] font-semibold leading-[1.1] text-cream">
                      Take your time.
                    </p>
                    <p className="mt-4 font-body text-[13px] leading-[1.5] text-cream/45">
                      Pray as long as you need. Tap done when you&rsquo;re ready.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">
                      Cue Word
                    </p>
                    <p className="font-display text-[56px] font-extrabold uppercase leading-[0.9] tracking-[0.05em] text-gold">
                      {state.cueWord || DEFAULTS.cueWord}
                    </p>
                    <p className="mt-5 font-body text-[13px] leading-[1.5] text-cream/50">
                      Play from victory.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* F3: polite live region announces when the clip player finishes
          decoding. Screen readers pick this up without interrupting the
          athlete; sighted users see the button enabled. This element is
          always mounted (zero height, no layout shift) — content is empty
          until loading resolves. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {clipLoading ? "Preparing your session…" : ""}
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          // F3: disable while clip player is active but not yet decoded.
          // Also disabled once session is completed (CTA replaces it).
          // Legacy path: only disabled on completion (its own readiness
          // is handled by the HEAD probe + audioMode state).
          disabled={renderCompleted || clipLoading}
          aria-label={
            clipLoading
              ? "Preparing your session"
              : renderPlaying
                ? "Pause guided session"
                : "Play guided session"
          }
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-gold text-onyx transition-transform duration-fast active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          <Icon name={renderPlaying ? "pause" : "play"} size={26} />
        </button>

        {/* Accessible alternative for deaf/HoH athletes or loud environments.
            Only shown in audio mode — once switched to text mode this row
            disappears (text mode is already active). */}
        {audioMode === "audio" && !renderCompleted && (
          <button
            type="button"
            onClick={() => setAudioMode("text")}
            className="mx-auto font-body text-[12px] text-cream/40 underline underline-offset-2 hover:text-cream/70 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx rounded-sm py-1 px-2"
          >
            Read instead
          </button>
        )}

        {renderCompleted && (
          <Button variant="coach" full onClick={onContinue}>
            SHOW MY PRE-GAME CARD
          </Button>
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
  sportConfig = HOCKEY_CONFIG,
}: {
  state: PregameState;
  onQuick: () => void;
  onDone: () => void;
  sportConfig?: SportConfig;
}) {
  // Mirror the same verse the athlete heard in the audio session.
  // Fallback: spine Hebrews 12:1-2 if need is null.
  const cardVerse: NeedVerse =
    state.need != null
      ? NEED_VERSE[state.need]
      : { reference: SCRIPTURE_REF, displayText: SCRIPTURE_SHORT };

  return (
    // FV-222: animate-card-bloom fades + scales the card from 0.98→1 on mount (~400ms).
    <div className="animate-card-bloom flex-1 overflow-y-auto bg-onyx px-5 pb-8 pt-5">
      <div className="mb-4 text-center">
        <Eyebrow className="!tracking-[0.26em] !text-gold">
          Your Pre-Game Card
        </Eyebrow>
        {/* FV-175: sport-specific share hint from sportConfig.cardShareHint */}
        <p className="mt-1.5 font-body text-[13px] text-cream/50">
          {sportConfig.cardShareHint}
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

        {/* Verse block — mirrors what the athlete heard in the audio session.
            Eyebrow framing line (e.g. Hope) shown if present; this card gets
            screenshotted so the framing matters for teammates reading it. */}
        <div className="mb-5">
          <VerseRef>{cardVerse.reference.toUpperCase()}</VerseRef>
          {cardVerse.eyebrow && (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold/70">
              {cardVerse.eyebrow}
            </p>
          )}
          <p className="mt-2 font-scripture text-[15px] italic leading-[1.5] text-cream/70">
            {cardVerse.displayText}
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
          {state.adversity && (
            <CardRow
              label="If it gets hard"
              value={adversityLabelFor(sportConfig, state.role, state.adversity) ?? state.adversity}
              bold
            />
          )}
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

      {/* ─── Crisis resource footer ─────────────────────────────────────────
          Shown on every completion card. Display-only. No logging, no
          keyword detection, no parent alert. A quiet door — not a signal.
          Copy replicates the exact strings from ResourceScreen.tsx so the
          privacy review stays clean. (Future: extract shared constant.) */}
      <div
        className="mt-8 border-t border-hairline pt-6"
        role="complementary"
        aria-label="Crisis resources"
      >
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
          You&rsquo;re not alone
        </p>

        <ul className="flex flex-col gap-3" role="list">
          <li>
            <p className="font-heading text-[13px] font-semibold text-cream/70">
              988 Suicide &amp; Crisis Lifeline
            </p>
            <p className="mt-0.5 font-body text-[12px] text-cream/40">
              Free, confidential support for anyone in crisis. 24/7.
            </p>
            <a
              href="tel:988"
              className="mt-1.5 inline-block font-heading text-[13px] font-medium text-gold/80 underline underline-offset-2 active:opacity-70"
            >
              Call or text 988
            </a>
          </li>

          <li>
            <p className="font-heading text-[13px] font-semibold text-cream/70">
              Crisis Text Line
            </p>
            <p className="mt-0.5 font-body text-[12px] text-cream/40">
              Free, 24/7, text-based crisis support.
            </p>
            <a
              href="sms:741741?body=HOME"
              className="mt-1.5 inline-block font-heading text-[13px] font-medium text-gold/80 underline underline-offset-2 active:opacity-70"
            >
              Text HOME to 741741
            </a>
          </li>

          <li>
            <p className="font-heading text-[13px] font-semibold text-cream/70">
              Talk to a trusted adult
            </p>
            <p className="mt-0.5 font-body text-[12px] text-cream/40">
              A parent, coach, teacher, pastor, or counselor. You don&rsquo;t
              have to carry this alone.
            </p>
          </li>
        </ul>

        <p className="mt-5 font-body text-[11px] leading-relaxed text-cream/30">
          Nothing here is shared with your parent. From Victory is not a
          mental-health service. In an immediate emergency, call 911.
        </p>
      </div>
    </div>
  );
}
