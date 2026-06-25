"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  Button,
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
import { verseForCueWord } from "./cue-word-verses";
import type { AudioTimeline, Phase } from "./audio/types";
import { findActivePhase, type AssembledTimeline } from "./audio-playlist";
import { useClipPlayer } from "./useClipPlayer";

type SetFn = <K extends keyof PregameState>(k: K, v: PregameState[K]) => void;

// ─── SCREEN 5 ─── Reset Anchor (split from old Reset)
// sportConfig.anchors is sport-keyed (FV-117): hockey shows stick-tap / glove
// options; basketball shows ball-bounce / floor-tap / rim-look options.
// "Long exhale", "Press thumb to palm", "Say cue word" are shared.
// Preset-only (FV-343): no free-text entry — the athlete picks one anchor.
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
  // FV-344: a returning athlete may carry a pre-FV-343 free-text anchor that no
  // longer matches any preset chip. Without this, the grid shows nothing
  // selected and reads as data loss. Surface the saved value (read-only) so the
  // athlete can keep it (Continue is already enabled — `required` is `!!anchor`)
  // or tap a preset to replace it. No free-text re-entry is reintroduced.
  const hasLegacyCustomAnchor =
    !!state.anchor && !anchors.includes(state.anchor);

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

      {hasLegacyCustomAnchor && (
        <div className="mt-3 rounded-[12px] border border-gold/30 bg-gold/[0.05] px-4 py-3.5">
          <Eyebrow className="!text-gold">Your current anchor</Eyebrow>
          <p className="mt-1.5 font-heading text-[14px] font-medium leading-[1.4] text-cream">
            &ldquo;{state.anchor}&rdquo;
          </p>
          <p className="mt-1 font-body text-[12px] leading-snug text-cream/60">
            Still set from a past session — pick a new one above, or keep it.
          </p>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 6 ─── Self-Talk Phrase
// sportConfig.selfTalkOptions is sport-keyed (FV-117): hockey shows
// "You're okay. Next shift."; basketball shows "You're okay. Next possession."
// The other 6 phrases are sport-neutral and shared.
// Preset-only (FV-343): no free-text entry — the athlete picks one phrase.
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
        bedId: state.bedId,
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
    state.bedId,
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
          bedId: state.bedId,
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
    bedId: useClips ? (state.bedId ?? null) : null,
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
      className="isolate relative flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-5"
      aria-busy={clipLoading}
      style={{
        background:
          "radial-gradient(80% 50% at 50% 20%, rgba(36,91,255,0.12), transparent 65%), radial-gradient(60% 40% at 50% 100%, rgba(223,175,55,0.08), transparent 70%), var(--fv-onyx)",
      }}
    >
      {/* FV-222: Ambient cobalt radial-gradient overlay that pulses while audio
          plays. Always mounted so play↔pause is a smooth opacity fade, not a
          hard cut; the keyframe breathes opacity 12%→18%→12% on a 6s cycle
          while playing. `isolate` on the container + -z-10 here keep the wash
          BEHIND the in-flow content (heading, timer, verse card) but above the
          container's own background. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700 ${
          renderPlaying ? "animate-audio-pulse" : "opacity-0"
        }`}
        style={{
          background: "radial-gradient(80% 50% at 50% 20%, rgba(36,91,255,1), transparent 65%)",
        }}
      />
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

// ─── CUE-WORD VERSE ROW ─── (FV-229) ─────────────────────────────────────
// Say-it-then-reveal memory loop: verse starts hidden behind the prompt;
// one tap reveals the reference and verbatim NIV text. No scoring, no
// tracking, no localStorage write — stateless tap-reveal only. The athlete
// carries this verse every time they use this cue word.
//
// prefers-reduced-motion: the reveal drops the cross-fade and applies an
// instant show so the transition never causes discomfort.
function CueWordVerseRow({ cueWord }: { cueWord: string }) {
  const [revealed, setReveal] = useState(false);
  const verse = verseForCueWord(cueWord);

  // When the reveal button unmounts, focus would drop to <body> and the
  // verse would never be announced (PR #195 qa + review finding). Move
  // focus to the revealed container so SR/keyboard users land on the verse.
  const revealedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (revealed) revealedRef.current?.focus();
  }, [revealed]);

  return (
    <div
      className="mt-5 border-t border-hairline pt-4"
      data-testid="cue-word-verse-row"
    >
      {/* Row label */}
      <div className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/50">
        Your word, and the verse under it.
      </div>

      {!revealed ? (
        /* Before-reveal: training prompt + tap-to-reveal button */
        <button
          type="button"
          onClick={() => setReveal(true)}
          data-testid="verse-reveal-btn"
          aria-label="Reveal verse"
          className="w-full rounded-[12px] border border-hairline bg-charcoal px-4 py-4 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx active:scale-[0.98]"
        >
          {/* Two-context prompt (sports-psych REVISE): recall is the calm-
              context behavior; the pre-walkout moment stays read-and-go —
              never a quiz seconds before competing. */}
          <p className="font-body text-[13px] leading-[1.55] text-cream/60">
            Walking out now? Read it and go. Reviewing later? Try saying it first, then reveal.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-gold/70">
            Tap to reveal
          </p>
        </button>
      ) : (
        /* After-reveal: reference + verbatim text + follow-through line.
           motion:safe cross-fade; prefers-reduced-motion gets instant show. */
        <div
          ref={revealedRef}
          tabIndex={-1}
          className="motion-safe:animate-card-fade-in rounded-[12px] border border-gold/20 bg-charcoal px-4 py-4 outline-none"
          data-testid="verse-revealed"
        >
          {/* Reference — gold mono, matching VerseRef pattern */}
          <div className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
            {verse.reference}
          </div>
          {/* Verbatim NIV text — scripture serif, italic */}
          <p className="font-scripture text-[15px] italic leading-[1.55] text-cream">
            {verse.text}
          </p>
          {/* After-reveal coaching line — outcome-NEUTRAL by design (sports-
              psych REVISE): never presupposes a miss; rewards the return,
              not the recall. */}
          <p className="mt-3.5 font-body text-[12px] leading-[1.5] text-cream/50">
            Said it or read it, you ran the rep. The Word goes in by repetition — come back to it tomorrow.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── PREGAME CARD IMAGE BUILDER ──────────────────────────────────────────
//
// Renders a faithful recreation of the Pregame Card to a PNG Blob using the
// Canvas 2D API. No new npm dependencies — built-in browser API only.
//
// Privacy: mirrors exactly what the visible card shows (cue word, verse,
// anchor, self-talk, role). adversity / hard-moment NEVER included.
//
// Two-pass approach:
//   Pass 1 — draw on a 1×1px scratch canvas to measure final Y
//   Pass 2 — draw on a properly-sized canvas at 2× scale (retina)

interface CardImageData {
  cueWord: string;
  cueVerse: { reference: string; text: string };
  cardVerse: { reference: string; displayText: string; eyebrow?: string };
  anchor: string;
  selfTalk: string;
  need: string | null | undefined;
  role?: string | null;
}

/** Wraps text onto multiple lines within maxWidth, returns array of lines. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Builds a PNG Blob of the pregame card at 390×(dynamic)px, 2× DPR.
 * Resolves font families from CSS custom properties so Next.js font-variable
 * names are used (not hardcoded strings that get mangled).
 */
async function buildPregameCardPng(data: CardImageData): Promise<Blob> {
  await document.fonts.ready;

  // ── Resolve font families from CSS custom properties ──────────────────
  const cs = getComputedStyle(document.documentElement);
  const displayFont =
    cs.getPropertyValue("--font-big-shoulders").trim() ||
    "'Saira Condensed', Impact, sans-serif";
  const monoFont =
    cs.getPropertyValue("--font-jetbrains-mono").trim() ||
    "ui-monospace, monospace";
  const serifFont =
    cs.getPropertyValue("--font-source-serif").trim() || "Georgia, serif";

  // ── Card layout constants ──────────────────────────────────────────────
  const CARD_W = 390;
  const PAD = 22;
  const CONTENT_W = CARD_W - PAD * 2;
  const HAIRLINE = "rgba(247,247,247,0.08)";
  const GOLD = "#DFAF37";
  const CREAM = "#f7f7f7";
  const CREAM_50 = "rgba(247,247,247,0.50)";
  const CREAM_40 = "rgba(247,247,247,0.40)";
  const CREAM_70 = "rgba(247,247,247,0.70)";

  /**
   * Core draw routine. When `measure` is true we draw on a 1px scratch
   * canvas and return the final Y without producing a real image. When
   * false we draw at 2× DPR onto `targetCanvas`.
   */
  function draw(
    ctx: CanvasRenderingContext2D,
    dpr: number,
    measure: boolean,
  ): number {
    const s = dpr; // scale factor
    ctx.scale(s, s);

    // ── Background ────────────────────────────────────────────────────
    if (!measure) {
      // Dark linear gradient base
      const linGrad = ctx.createLinearGradient(0, 0, 0, 1000);
      linGrad.addColorStop(0, "#0d0d0d");
      linGrad.addColorStop(1, "#060606");
      ctx.fillStyle = linGrad;
      ctx.roundRect(0, 0, CARD_W, 2000, 22);
      ctx.fill();

      // Gold radial top
      const goldRad = ctx.createRadialGradient(
        CARD_W / 2, 0, 0,
        CARD_W / 2, 0, CARD_W * 0.6,
      );
      goldRad.addColorStop(0, "rgba(223,175,55,0.10)");
      goldRad.addColorStop(1, "transparent");
      ctx.fillStyle = goldRad;
      ctx.roundRect(0, 0, CARD_W, 2000, 22);
      ctx.fill();

      // Cobalt radial bottom
      const cobaltRad = ctx.createRadialGradient(
        CARD_W / 2, 1000, 0,
        CARD_W / 2, 1000, CARD_W * 0.55,
      );
      cobaltRad.addColorStop(0, "rgba(36,91,255,0.08)");
      cobaltRad.addColorStop(1, "transparent");
      ctx.fillStyle = cobaltRad;
      ctx.roundRect(0, 0, CARD_W, 2000, 22);
      ctx.fill();
    }

    let y = PAD;

    // ── "FROM VICTORY" eyebrow ────────────────────────────────────────
    y += 22;
    if (!measure) {
      ctx.font = `600 8px ${monoFont}`;
      ctx.letterSpacing = "2px";
      ctx.fillStyle = CREAM_40;
      ctx.fillText("FROM VICTORY", PAD, y);
      ctx.letterSpacing = "0px";
    }

    // ── PRE-GAME heading + TODAY/need ─────────────────────────────────
    y += 13;
    if (!measure) {
      ctx.font = `800 15px ${displayFont}`;
      ctx.fillStyle = CREAM;
      ctx.fillText("PRE-GAME", PAD, y);

      if (data.need) {
        ctx.font = `600 10px ${monoFont}`;
        ctx.letterSpacing = "1px";
        ctx.fillStyle = CREAM_50;
        const todayW = ctx.measureText("TODAY").width;
        ctx.fillText("TODAY", CARD_W - PAD - todayW, y - 9);
        ctx.letterSpacing = "0px";

        ctx.font = `600 10px ${monoFont}`;
        ctx.fillStyle = GOLD;
        const needW = ctx.measureText(data.need).width;
        ctx.fillText(data.need, CARD_W - PAD - needW, y + 4);
      }
    }

    // ── Hairline ──────────────────────────────────────────────────────
    y += 22;
    if (!measure) {
      ctx.fillStyle = HAIRLINE;
      ctx.fillRect(PAD, y, CONTENT_W, 1);
    }

    // ── Card verse reference ───────────────────────────────────────────
    y += 16;
    if (!measure) {
      ctx.font = `600 9px ${monoFont}`;
      ctx.letterSpacing = "1px";
      ctx.fillStyle = CREAM_50;
      ctx.fillText(data.cardVerse.reference.toUpperCase(), PAD, y);
      ctx.letterSpacing = "0px";
    }

    // Optional eyebrow
    if (data.cardVerse.eyebrow) {
      y += 14;
      if (!measure) {
        ctx.font = `600 9px ${monoFont}`;
        ctx.fillStyle = "rgba(223,175,55,0.70)";
        ctx.fillText(data.cardVerse.eyebrow, PAD, y);
      }
    }

    // Card verse text (wrapped)
    y += 14;
    if (!measure) {
      ctx.font = `italic 400 14px ${serifFont}`;
    } else {
      ctx.font = `italic 400 14px Georgia, serif`;
    }
    const verseLines = wrapText(ctx, data.cardVerse.displayText, CONTENT_W);
    const LINE_H_VERSE = 20;
    for (const line of verseLines) {
      if (!measure) {
        ctx.fillStyle = CREAM_70;
        ctx.fillText(line, PAD, y);
      }
      y += LINE_H_VERSE;
    }
    // Back off one extra line advance (last line already moved y down)
    y -= LINE_H_VERSE;

    // ── Hairline ──────────────────────────────────────────────────────
    y += 6;
    if (!measure) {
      ctx.fillStyle = HAIRLINE;
      ctx.fillRect(PAD, y, CONTENT_W, 1);
    }

    // ── CUE WORD label ────────────────────────────────────────────────
    y += 14;
    if (!measure) {
      ctx.font = `600 9px ${monoFont}`;
      ctx.letterSpacing = "1px";
      ctx.fillStyle = CREAM_50;
      ctx.fillText("CUE WORD", PAD, y);
      ctx.letterSpacing = "0px";
    }

    // ── Cue word (big) ────────────────────────────────────────────────
    y += 16;
    if (!measure) {
      ctx.font = `800 52px ${displayFont}`;
      ctx.fillStyle = GOLD;
      ctx.fillText(data.cueWord.toUpperCase(), PAD, y);
    }

    // ── Cue verse reference ───────────────────────────────────────────
    y += 56;
    if (!measure) {
      ctx.font = `600 9px ${monoFont}`;
      ctx.letterSpacing = "1px";
      ctx.fillStyle = CREAM_50;
      ctx.fillText(data.cueVerse.reference.toUpperCase(), PAD, y);
      ctx.letterSpacing = "0px";
    }

    // Cue verse text (wrapped)
    y += 14;
    if (!measure) {
      ctx.font = `italic 400 12px ${serifFont}`;
    } else {
      ctx.font = `italic 400 12px Georgia, serif`;
    }
    const cueLines = wrapText(ctx, data.cueVerse.text, CONTENT_W);
    const LINE_H_CUE = 18;
    for (const line of cueLines) {
      if (!measure) {
        ctx.fillStyle = CREAM_50;
        ctx.fillText(line, PAD, y);
      }
      y += LINE_H_CUE;
    }
    y -= LINE_H_CUE;

    // ── Hairline ──────────────────────────────────────────────────────
    y += 8;
    if (!measure) {
      ctx.fillStyle = HAIRLINE;
      ctx.fillRect(PAD, y, CONTENT_W, 1);
    }

    // ── RESET ANCHOR ─────────────────────────────────────────────────
    y += 14;
    if (!measure) {
      ctx.font = `600 9px ${monoFont}`;
      ctx.letterSpacing = "1px";
      ctx.fillStyle = CREAM_50;
      ctx.fillText("RESET ANCHOR", PAD, y);
      ctx.letterSpacing = "0px";
    }
    y += 16;
    if (!measure) {
      ctx.font = `600 13px ${monoFont}`;
      ctx.fillStyle = CREAM;
      ctx.fillText(data.anchor, PAD, y);
    }

    // ── SELF-TALK ─────────────────────────────────────────────────────
    y += 16;
    if (!measure) {
      ctx.font = `600 9px ${monoFont}`;
      ctx.letterSpacing = "1px";
      ctx.fillStyle = CREAM_50;
      ctx.fillText("SELF-TALK", PAD, y);
      ctx.letterSpacing = "0px";
    }

    y += 16;
    if (!measure) {
      ctx.font = `italic 14px ${serifFont}`;
    } else {
      ctx.font = `italic 14px Georgia, serif`;
    }
    const selfTalkLines = wrapText(ctx, data.selfTalk, CONTENT_W);
    const LINE_H_ST = 20;
    for (const line of selfTalkLines) {
      if (!measure) {
        ctx.fillStyle = CREAM_70;
        ctx.fillText(line, PAD, y);
      }
      y += LINE_H_ST;
    }
    y -= LINE_H_ST;

    // ── POSITION (optional) ───────────────────────────────────────────
    if (data.role) {
      y += 14;
      if (!measure) {
        ctx.font = `600 9px ${monoFont}`;
        ctx.letterSpacing = "1px";
        ctx.fillStyle = CREAM_50;
        ctx.fillText("POSITION", PAD, y);
        ctx.letterSpacing = "0px";
      }
      y += 16;
      if (!measure) {
        ctx.font = `600 13px ${monoFont}`;
        ctx.fillStyle = CREAM;
        ctx.fillText(data.role, PAD, y);
      }
    }

    // ── Hairline ──────────────────────────────────────────────────────
    y += 4;
    if (!measure) {
      ctx.fillStyle = HAIRLINE;
      ctx.fillRect(PAD, y, CONTENT_W, 1);
    }

    // ── "PLAY FROM VICTORY." close line ───────────────────────────────
    y += 16;
    if (!measure) {
      ctx.font = `800 22px ${displayFont}`;
      const closeText = "PLAY FROM VICTORY.";
      const totalW = ctx.measureText(closeText).width;
      const startX = (CARD_W - totalW) / 2;
      const playFromW = ctx.measureText("PLAY FROM ").width;
      ctx.fillStyle = CREAM;
      ctx.fillText("PLAY FROM ", startX, y);
      ctx.fillStyle = GOLD;
      ctx.fillText("VICTORY.", startX + playFromW, y);
    }

    // ── Watermark ─────────────────────────────────────────────────────
    y += 30;
    if (!measure) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.font = `600 8px ${monoFont}`;
      ctx.letterSpacing = "1px";
      ctx.fillStyle = CREAM_40;
      const wmText = "FROM VICTORY";
      const wmW = ctx.measureText(wmText).width;
      ctx.fillText(wmText, CARD_W - PAD - wmW, y);
      ctx.letterSpacing = "0px";
      ctx.restore();
    }

    y += 20;
    return y; // final height
  }

  // ── Pass 1: measure ───────────────────────────────────────────────────────
  const scratch = document.createElement("canvas");
  scratch.width = 1;
  scratch.height = 1;
  const scratchCtx = scratch.getContext("2d");
  if (!scratchCtx) throw new Error("Canvas 2D not available");
  const finalH = draw(scratchCtx, 1, true);

  // ── Pass 2: render at 2× DPR ─────────────────────────────────────────────
  const DPR = 2;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W * DPR;
  canvas.height = finalH * DPR;
  const ctx2 = canvas.getContext("2d");
  if (!ctx2) throw new Error("Canvas 2D not available");

  // Draw border/clipping path so roundRect masks the background fills
  ctx2.save();
  ctx2.scale(DPR, DPR);
  ctx2.beginPath();
  ctx2.roundRect(0, 0, CARD_W, finalH, 22);
  ctx2.clip();
  ctx2.restore();

  draw(ctx2, DPR, false);

  // Draw the border overlay (inset 1px, gold/30)
  ctx2.save();
  ctx2.scale(DPR, DPR);
  ctx2.strokeStyle = "rgba(223,175,55,0.30)";
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.roundRect(0.5, 0.5, CARD_W - 1, finalH - 1, 21.5);
  ctx2.stroke();
  ctx2.restore();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob returned null"));
      },
      "image/png",
    );
  });
}

// ─── SHARE CARD ROW ─── (FV-239) ─────────────────────────────────────────
//
// Privacy-safe athlete-initiated share affordance for the Pregame Card.
//
// Share payload (text only — no image, no canvas):
//   {CUE_WORD}
//   "{verse reference} — {verbatim NIV verse text}"
//   "Your Identity Is Secure. Compete From Victory."
//   https://www.fromvictoryapp.com
//   (optionally) — {firstName}   ← only when the athlete explicitly toggles this ON
//
// What is NEVER in the payload:
//   - adversity / hard-moment selection (private mental-prep detail)
//   - anchor, self-talk, need/focus choices (private session personalisation)
//   - age, team, location, any account metadata
//
// Feature-detection: navigator.share is checked at render (the file is
// "use client", so navigator is always defined post-hydration). Where
// navigator.share is unavailable the affordance collapses to the quiet
// sport-specific cardShareHint — the SINGLE place that copy renders — so
// the athlete never sees a broken or disabled button.
//
// prefers-reduced-motion: the toggle uses a CSS transition (opacity + scale);
// the `motion-safe:` variant limits it to devices where motion is acceptable.
//
// The component is intentionally NOT exported — it is only used by
// PregameCardScreen below and the test suite imports via PregameCardScreen.
function ShareCardRow({
  cueWord,
  firstName,
  shareHint,
  verse,
  saveImageData,
}: {
  cueWord: string;
  firstName?: string;
  shareHint: string;
  verse: { reference: string; text: string };
  /** When present, renders the "Save to Photos" button. adversity never included. */
  saveImageData?: CardImageData;
}) {
  // client: Web Share API + toggle state
  const [nameIncluded, setNameIncluded] = useState(false);
  // "idle" | "shared" (brief success feedback) | "error"
  const [shareState, setShareState] = useState<"idle" | "shared" | "error">("idle");
  // "idle" | "saving" | "saved" | "error"
  const [savePhotoState, setSavePhotoState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Reset share feedback after 2 s so the button is ready for another tap.
  useEffect(() => {
    if (shareState === "idle") return;
    const id = window.setTimeout(() => setShareState("idle"), 2000);
    return () => window.clearTimeout(id);
  }, [shareState]);

  // Reset save-photo feedback after 2 s.
  useEffect(() => {
    if (savePhotoState !== "saved" && savePhotoState !== "error") return;
    const id = window.setTimeout(() => setSavePhotoState("idle"), 2000);
    return () => window.clearTimeout(id);
  }, [savePhotoState]);

  // Build the share text from the privacy-safe fields only.
  // Called at tap time so it always reflects the latest toggle state.
  function buildShareText(includeName: boolean): string {
    const lines: string[] = [
      cueWord.toUpperCase(),
      `"${verse.reference} — ${verse.text}"`,
      "",
      "Your Identity Is Secure. Compete From Victory.",
      "https://www.fromvictoryapp.com",
    ];
    if (includeName && firstName) {
      lines.push(`— ${firstName}`);
    }
    return lines.join("\n");
  }

  async function handleShare() {
    // Inert during the brief "Shared" feedback window — aria-disabled keeps
    // focus on the button (a disabled swap drops SR/keyboard focus to body).
    if (shareState === "shared") return;
    const text = buildShareText(nameIncluded);
    try {
      // The button only renders when navigator.share exists (supportsShare
      // gates it below), so this call is always within the user gesture.
      await navigator.share({ text });
      setShareState("shared");
    } catch (err) {
      // AbortError = athlete dismissed the share sheet — not a real error.
      if (err instanceof Error && err.name === "AbortError") {
        setShareState("idle");
      } else {
        setShareState("error");
      }
    }
  }

  async function handleSavePhoto() {
    // Guard: inert while saving or already confirmed saved.
    if (savePhotoState === "saving" || savePhotoState === "saved") return;
    setSavePhotoState("saving");
    try {
      const blob = await buildPregameCardPng(saveImageData!);
      const file = new File([blob], "pregame-card.png", { type: "image/png" });

      // navigator.canShare is not in the TypeScript DOM lib yet — cast carefully.
      type NavWithCanShare = Navigator & {
        canShare: (data: ShareData) => boolean;
      };
      const nav = navigator as NavWithCanShare;
      if (
        typeof navigator !== "undefined" &&
        "canShare" in navigator &&
        typeof nav.canShare === "function" &&
        nav.canShare({ files: [file] })
      ) {
        // Mobile path: OS share sheet surfaces "Save Image" to photo library.
        await navigator.share({ files: [file] } as ShareData);
      } else {
        // Desktop / no-file-share fallback: trigger a download.
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), {
          href: url,
          download: "pregame-card.png",
          style: "display:none",
        });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setSavePhotoState("saved");
    } catch (err) {
      // AbortError = athlete dismissed the share sheet — not a failure.
      if (err instanceof Error && err.name === "AbortError") {
        setSavePhotoState("idle");
      } else {
        setSavePhotoState("error");
      }
    }
  }

  const supportsShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div
      className="mt-5 border-t border-hairline pt-4"
      data-testid="share-card-row"
    >
      {/* ── First-name toggle ────────────────────────────────────────────────
          Default OFF so no personal data is shared without explicit opt-in.
          Uses a <button> toggle (aria-pressed) so keyboard users can activate
          it without reaching for a checkbox. The button itself is the 44px
          tap zone; the visible 24px pill is a styled inner span. */}
      {firstName && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/50">
            Include my name
          </span>
          <button
            type="button"
            aria-pressed={nameIncluded}
            aria-label={nameIncluded ? "Remove name from share" : "Add name to share"}
            data-testid="share-name-toggle"
            onClick={() => setNameIncluded((v) => !v)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-end rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            <span
              aria-hidden="true"
              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-fast ${
                nameIncluded
                  ? "border-gold/60 bg-gold/20"
                  : "border-hairline bg-transparent"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full transition-[transform,background-color] duration-fast motion-safe:transition-all ${
                  nameIncluded
                    ? "translate-x-6 bg-gold"
                    : "translate-x-1 bg-cream/30"
                }`}
              />
            </span>
          </button>
        </div>
      )}

      {/* SR-only share-state announcements — the visual label swap on the
          (aria-disabled) button is never announced on its own (WCAG 4.1.3). */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {shareState === "shared"
          ? "Card shared."
          : shareState === "error"
            ? "Share failed — try a screenshot instead."
            : ""}
      </div>

      {supportsShare ? (
        /* navigator.share available — show the share button */
        <button
          type="button"
          onClick={handleShare}
          aria-disabled={shareState === "shared"}
          aria-label="Share your pre-game card"
          data-testid="share-card-btn"
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[12px] border border-gold/30 bg-gold/[0.06] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-gold transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx active:scale-[0.98] aria-disabled:opacity-60"
        >
          {/* Inline share icon — no external dep */}
          {shareState !== "shared" && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          )}
          {shareState === "shared"
            ? "Shared"
            : shareState === "error"
              ? "Couldn't share — try a screenshot"
              : "Save card"}
        </button>
      ) : (
        /* No native share — show the screenshot hint from sport config */
        <p
          className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-cream/40"
          data-testid="share-screenshot-hint"
        >
          {shareHint}
        </p>
      )}

      {/* SR-only photo-save state announcements (WCAG 4.1.3 live region). */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {savePhotoState === "saved"
          ? "Card saved to photos."
          : savePhotoState === "error"
            ? "Couldn't save — try a screenshot instead."
            : ""}
      </div>

      {/* ── Save to Photos button ─────────────────────────────────────────────
          Only rendered when the caller passes saveImageData. Tap → Canvas PNG
          → Web Share (files) on mobile → OS "Save Image"; download fallback
          on desktop. adversity is never in the image — same fields as the
          visible card. */}
      {saveImageData && (
        <button
          type="button"
          onClick={handleSavePhoto}
          aria-disabled={savePhotoState === "saving" || savePhotoState === "saved"}
          aria-label="Save your pre-game card as a photo"
          data-testid="save-photo-btn"
          className="mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[12px] border border-gold/30 bg-gold/[0.06] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-gold transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx active:scale-[0.98] aria-disabled:opacity-60"
        >
          {savePhotoState !== "saved" && savePhotoState !== "saving" && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
          {savePhotoState === "saving"
            ? "Saving…"
            : savePhotoState === "saved"
              ? "Saved"
              : savePhotoState === "error"
                ? "Couldn’t save — try a screenshot"
                : "Save to Photos"}
        </button>
      )}
    </div>
  );
}

export function PregameCardScreen({
  state,
  onQuick,
  onDone,
  sportConfig = HOCKEY_CONFIG,
  athleteFirstName,
}: {
  state: PregameState;
  onQuick: () => void;
  onDone: () => void;
  sportConfig?: SportConfig;
  /**
   * FV-239: athlete's first name, threaded from PregameFlow.
   * Optional — when present, an explicit "Include my name" toggle
   * (default OFF) lets the athlete opt into adding it to the share payload.
   * Never included in any share output automatically.
   */
  athleteFirstName?: string;
}) {
  // Mirror the same verse the athlete heard in the audio session.
  // Fallback: spine Hebrews 12:1-2 if need is null.
  const cardVerse: NeedVerse =
    state.need != null
      ? NEED_VERSE[state.need]
      : { reference: SCRIPTURE_REF, displayText: SCRIPTURE_SHORT };

  // FV-239: the cue-word verse (from the FV-229 registry) drives the share payload.
  // It's the verse under the word the athlete carries out the door.
  const cueVerse = verseForCueWord(state.cueWord || DEFAULTS.cueWord);

  return (
    // FV-222: animate-card-bloom fades + scales the card from 0.98→1 on mount (~400ms).
    <div className="animate-card-bloom flex-1 overflow-y-auto bg-onyx px-5 pb-8 pt-5">
      <div className="mb-4 text-center">
        <Eyebrow className="!tracking-[0.26em] !text-gold">
          Your Pre-Game Card
        </Eyebrow>
        {/* The FV-175 sport-specific share hint now renders ONCE, inside the
            card via ShareCardRow's no-native-share fallback — a duplicate
            here broke the FV-175 verbatim tests and repeated the same line
            twice on every non-share browser (PR #201 review 1a). */}
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

        <div className="mb-5 border-t border-hairline pt-4">
          <div className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/50">
            Cue Word
          </div>
          <div className="font-display text-[52px] font-extrabold uppercase leading-[0.95] tracking-[0.04em] text-gold">
            {state.cueWord || DEFAULTS.cueWord}
          </div>
          {/* FV-229: say-it-then-reveal verse loop, nested inside the cue-word
              section so it reads as the verse UNDER the word. */}
          <CueWordVerseRow cueWord={state.cueWord || DEFAULTS.cueWord} />
        </div>

        <div className="flex flex-col gap-3">
          <CardRow label="Reset anchor" value={state.anchor || DEFAULTS.anchor} />
          <CardRow
            label="Self-talk"
            value={state.selfTalk || DEFAULTS.selfTalk}
            italic
          />
          {state.role && <CardRow label="Position" value={state.role} />}
          {/* FV-239 AC: the adversity/hard-moment selection NEVER renders on
              this card — the sanctioned share path is a screenshot of this
              exact surface, and the hard moment is the athlete's private
              mental-prep detail. The reset plan (anchor + self-talk) stays;
              the named adversity does not (PR #201 review 1b). */}
        </div>

        <div className="mt-5 border-t border-hairline pt-3.5 text-center">
          <p className="m-0 font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-cream">
            Play From <span className="text-gold">Victory</span>.
          </p>
        </div>

        {/* FV-239: Brand watermark — flame + wordmark, IN FLOW under the
            closing line (an absolute bottom-right placement collided with
            the centered closing line at 375px). aria-hidden — decorative. */}
        <div
          aria-hidden="true"
          className="pointer-events-none mt-2.5 flex items-center justify-end gap-1.5 opacity-[0.18]"
          data-testid="card-brand-watermark"
        >
          <svg
            width="16"
            height="22"
            viewBox="175 20 80 146"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M211.5,120c.68.86.9-.29,1.12-.64.73-1.13,1.21-2.77,1.98-4.01,9.42-15.33,27.5-24,32.41-42.35.67.09.88.68.97,1.27,1.88,11.35-.33,23.21-5.72,33.24-8.92,16.59-24.1,23.85-22.75,45.73.06,1.04,1.2,6.01.99,6.25-.72.84-.95-.42-1.14-.64-17.72-19.95-39.65-40.78-24.95-69.7,9.8-19.27,37-33.7,36.62-57.42-.02-1.17-1.28-6.04-1.03-6.24s1.09-.06,1.52.33c.71.64,3.91,6.11,4.56,7.33,7.21,13.59,7.32,27.02-.18,40.49-5.64,10.12-24.4,25.44-24.4,36.6,0,1.39-.3,9.37,0,9.75Z"
              fill="#DFAF37"
            />
          </svg>
          <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.18em] text-gold">
            From Victory
          </span>
        </div>
      </div>

      {/* FV-288: share/save affordance moved outside the card box so buttons
          don't interrupt the card content (they previously sat between the cue
          word section and anchor/self-talk rows). The PNG generated by "Save to
          Photos" uses the canvas path — not a screenshot — so placement here
          doesn't affect the exported image. */}
      <ShareCardRow
        cueWord={state.cueWord || DEFAULTS.cueWord}
        firstName={athleteFirstName}
        shareHint={sportConfig.cardShareHint}
        verse={cueVerse}
        saveImageData={{
          cueWord: state.cueWord || DEFAULTS.cueWord,
          cueVerse,
          cardVerse,
          anchor: state.anchor || DEFAULTS.anchor,
          selfTalk: state.selfTalk || DEFAULTS.selfTalk,
          need: state.need,
          role: state.role,
        }}
      />

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
