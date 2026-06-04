// Phase 0 clip-playlist runtime — pure, well-typed, no side effects.
//
// This module is the assembly layer for the compositional clip architecture.
// It deliberately has no React, no browser APIs, and no imports outside
// the project's own types — making it fully unit-testable offline.
//
// Architecture overview:
//   manifest.json (audio-engineer writes) → resolvePlaylist() → ResolvedClip[]
//   ResolvedClip[] → buildAssembledTimeline() → AssembledTimeline
//   AssembledTimeline drives useClipPlayer's scheduler + pip/phase detection.
//
// The PHASE_TO_SECTION mapping and findActivePhaseFromTimeline logic in
// screens-b.tsx are intentionally LEFT INTACT for the legacy path. The clip
// path calls a parallel helper here that reads from AssembledTimeline instead
// of two separate AudioTimeline sidecars.

import type { Phase } from "./audio/types";
import type { PracticeState } from "./types";
import {
  ANCHOR_OPTION_SLUGS,
  AUDIO_CACHE_BUST,
  CUEWORD_OPTION_SLUGS,
  NEED_OPENER_SLUGS,
  SELFTALK_OPTION_SLUGS,
} from "./audio-mapping";
import { HOCKEY_CONFIG, type SportConfig } from "./sport-registry";

// ---------------------------------------------------------------------------
// Manifest types (locked contract — matches the audio-engineer's schema)
// ---------------------------------------------------------------------------

export type ClipPhaseEntry = {
  phase: Phase;
  offsetSec: number;
  round?: number;
};

export type ClipCatalogEntry = {
  url: string;
  durationSec: number;
  phases: ClipPhaseEntry[];
};

export type PlaylistTemplate = {
  /** Present in p1 manifests (need × position × adversity keyed).
   *  Absent in p2 manifests where the opener is resolved from the need
   *  separately and templates are keyed by (position × adversity) only. */
  need?: string;
  position: string;
  adversity: string;
  clips: string[]; // ordered slug list; p2 does NOT include the opener slug
};

export type ClipManifest = {
  version: string;
  clips: Record<string, ClipCatalogEntry>;
  templates: PlaylistTemplate[];
  /**
   * Fixed-order playlists that are not session-personalization templates.
   * Added in p4 as a flat clip list for the old single-opener "Get To" session.
   * Updated in p5 (FRO-22) to a state-keyed structure per sport.
   *
   * Schema evolution:
   *   - p4: flat `practice.clips` list (legacy, state/sport ignored)
   *   - p5: `practiceState` keyed by state — sport-neutral hockey-only tails
   *   - p6 (FV-30): `practiceState` keyed by sport, then by state:
   *       practiceState: {
   *         hockey:     { "dialed-in": string[]; "not-feeling-it": string[] }
   *         basketball: { "dialed-in": string[]; "not-feeling-it": string[] }
   *       }
   *     Each string[] is the shared-tail slug list (Beats 2–6, no opener/focus).
   *     The opener and focus clip are resolved at runtime by resolvePracticePlaylist.
   *
   * Backward compat: p5 manifests carry a flat state-keyed practiceState
   * (no sport nesting); resolvePracticePlaylist treats a missing sport key as a
   * fallback to "hockey" so p5 consumers are not broken.
   */
  practice?: {
    clips: string[]; // legacy flat list (p4)
  };
  practiceState?: {
    /** p6+: sport-keyed outer map. Each sport maps state → shared-tail slugs. */
    [sport: string]: {
      /** Ordered shared-tail slugs for each state (Beats 2–6, no opener/focus). */
      "dialed-in": string[];
      "not-feeling-it": string[];
    } | string[]; // string[] accommodates p5 manifests where the value was the tail array
  };
};

// ---------------------------------------------------------------------------
// Runtime types — what the player works with after resolution
// ---------------------------------------------------------------------------

export type ResolvedClip = {
  slug: string;
  url: string; // already cache-busted
  durationSec: number;
  phases: ClipPhaseEntry[];
};

export type AssembledTimeline = {
  totalDurationSec: number;
  // Phases are relative to the WHOLE session start (0 = session start),
  // not to individual clip starts. Same shape as AudioTimeline.phases so
  // findActivePhaseFromTimeline works without modification.
  phases: Array<{
    phase: Phase;
    startSec: number;
    round?: number;
  }>;
};

// ---------------------------------------------------------------------------
// URL helper — apply the same ?v= discipline as audioAssetUrl()
// ---------------------------------------------------------------------------

/**
 * Append the cache-bust query param to any audio asset URL.
 * If the URL already carries a query string it is appended with &; otherwise
 * with ?. This ensures CDN + browser caches are busted on asset regeneration
 * without duplicating version strings.
 */
export function bustUrl(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${AUDIO_CACHE_BUST}`;
}

/** Cache-busted URL for the clip manifest itself. */
export function manifestUrl(): string {
  return bustUrl("/audio/pregame/clips/manifest.json");
}

// ---------------------------------------------------------------------------
// resolvePlaylist
// ---------------------------------------------------------------------------

/**
 * Resolve the ordered clip list for a given (need, position, adversity,
 * anchor, selfTalk, cueWord) combination and map each slug to a ResolvedClip
 * with a cache-busted URL.
 *
 * Supports three manifest versions:
 *
 * - p1 (and earlier): templates are keyed by (need × position × adversity).
 *   The opener slug is already in the template's `clips` list. Resolution
 *   finds the exact three-way match and maps it directly.
 *
 * - p2: templates are keyed by (position × adversity) only. The opener is
 *   NOT in the template's `clips` list. Resolution:
 *     1. Look up the opener slug from NEED_OPENER_SLUGS[need].
 *     2. Find the template by (position × adversity).
 *     3. Build slugs = [openerSlug, ...template.clips].
 *   This makes all 9 needs × 3 positions × 10 adversities work from
 *   30 templates + 9 openers instead of 270 enumerated templates.
 *
 * - p3: same dimensional resolution as p2, but the template's `clips` list
 *   contains personalization sentinels ({{anchor}}, {{selfTalk}},
 *   {{cueReset}}, {{cueSendoff}}) that are substituted at resolve time using
 *   the athlete's chosen anchor, self-talk, and cue word.
 *
 *   Sentinel resolution rules:
 *   - {{anchor}}: looks up anchor in ANCHOR_OPTION_SLUGS. If the chosen
 *     anchor has no clip ("Say cue word" is intentionally absent), the
 *     sentinel is dropped — no gap, no error.
 *   - {{selfTalk}}: looks up selfTalk in SELFTALK_OPTION_SLUGS. If absent,
 *     sentinel is dropped.
 *   - {{cueReset}}: looks up cueWord in CUEWORD_OPTION_SLUGS, appends
 *     "-reset". If absent, sentinel is dropped.
 *   - {{cueSendoff}}: same as above with "-sendoff".
 *
 *   Drop semantics mean the session plays slightly shorter if no matching
 *   personalization clip exists, rather than failing the whole resolution.
 *
 * Returns null when no matching template exists, the opener slug is unknown,
 * or any non-sentinel slug in the assembled list is absent from the catalog.
 * Fail-closed: the caller falls back to the legacy two-<audio> path or text mode.
 */
export function resolvePlaylist(
  need: string,
  position: string,
  adversity: string,
  manifest: ClipManifest,
  anchor?: string | null,
  selfTalk?: string | null,
  cueWord?: string | null,
): ResolvedClip[] | null {
  let slugs: string[];

  if (manifest.version === "p3" || manifest.version === "p2") {
    // ── p2/p3: dimensional resolution ───────────────────────────────────────
    // 1. Resolve the opener slug for this need.
    //    NEED_OPENER_SLUGS is keyed by the NeedToday union; `need` arrives as
    //    a string from the hook. We cast via `as` and treat a missing key as a
    //    resolution failure (fail closed).
    // reason: NEED_OPENER_SLUGS is Record<NeedToday, string> and `need` is a
    //   narrowed string from PregameState — the cast is safe in practice; an
    //   unknown string returns undefined which we guard below.
    const openerSlug =
      NEED_OPENER_SLUGS[need as keyof typeof NEED_OPENER_SLUGS] ?? null;
    if (!openerSlug) return null;

    // 2. Find the template by (position × adversity) only — no need field.
    const template = manifest.templates.find(
      (t) => t.position === position && t.adversity === adversity,
    );
    if (!template) return null;

    // 3. Prepend opener to the template's clip list.
    const rawSlugs = [openerSlug, ...template.clips];

    // 4. For p3: substitute sentinels with athlete-personalized slugs.
    //    For p2: no sentinels, pass through unchanged.
    if (manifest.version === "p3") {
      slugs = [];
      for (const raw of rawSlugs) {
        if (raw === "{{anchor}}") {
          const resolved = anchor ? (ANCHOR_OPTION_SLUGS[anchor] ?? null) : null;
          if (resolved) slugs.push(resolved);
          // else: drop the sentinel — "Say cue word" and unknowns produce no clip
        } else if (raw === "{{selfTalk}}") {
          const resolved = selfTalk ? (SELFTALK_OPTION_SLUGS[selfTalk] ?? null) : null;
          if (resolved) slugs.push(resolved);
        } else if (raw === "{{cueReset}}") {
          const base = cueWord ? (CUEWORD_OPTION_SLUGS[cueWord] ?? null) : null;
          if (base) slugs.push(`${base}-reset`);
        } else if (raw === "{{cueSendoff}}") {
          const base = cueWord ? (CUEWORD_OPTION_SLUGS[cueWord] ?? null) : null;
          if (base) slugs.push(`${base}-sendoff`);
        } else {
          slugs.push(raw);
        }
      }
    } else {
      slugs = rawSlugs;
    }
  } else {
    // ── p1 / legacy: exact three-way match ──────────────────────────────────
    const template = manifest.templates.find(
      (t) =>
        t.need === need &&
        t.position === position &&
        t.adversity === adversity,
    );
    if (!template) return null;

    slugs = template.clips;
  }

  // ── Map each slug → ResolvedClip ─────────────────────────────────────────
  const resolved: ResolvedClip[] = [];
  for (const slug of slugs) {
    const entry = manifest.clips[slug];
    if (!entry) {
      // Missing slug in catalog — fail the whole resolution rather than
      // silently omitting a clip, which would produce a shorter session.
      return null;
    }
    resolved.push({
      slug,
      url: bustUrl(entry.url),
      durationSec: entry.durationSec,
      phases: entry.phases,
    });
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// resolvePracticePlaylist
// ---------------------------------------------------------------------------

/**
 * Resolve the ordered clip list for the state-aware pre-practice "Lock In"
 * session (FRO-22 / FV-30). Returns the full playlist for the given athlete
 * state and chosen focus, with each slug mapped to a cache-busted ResolvedClip.
 *
 * Playlist order:
 *   [state opener] → [Beat 2] → [Beat 3] →
 *   pp-choose-focus-lead → [pp-{bb-}focus-<slug>?] → pp-choose-focus-tail →
 *   [Beat 5] → [Beat 6]
 *
 * The specific Beat 2–6 slugs come from the manifest's sport-keyed tail:
 *   manifest.practiceState[sport][state]
 *
 * State resolution:
 *   - "dialed-in" → sport opener for "dialed-in" (DEFAULT; unknown states fall back here)
 *   - "not-feeling-it" → sport opener for "not-feeling-it"
 *
 * Focus resolution:
 *   - Known focus string → inject pp-{bb-}focus-<slug> between lead and tail.
 *   - Unknown/missing focus → omit the focus clip; lead+tail still flow.
 *
 * Sport-keyed tail lookup (p6+):
 *   manifest.practiceState[sportConfig.sportKey][state]
 *   Fallback: if the sport key is absent from the manifest (e.g. basketball clips
 *   not yet rendered, FV-31 pending), returns null — caller falls back to text timer.
 *
 * Backward compat:
 *   - p5 manifests: practiceState is keyed by state directly (no sport nesting).
 *     Detected by checking if practiceState["dialed-in"] is an array — treated
 *     as hockey (the only p5 sport) for uninterrupted existing sessions.
 *   - p4 manifests: flat manifest.practice.clips list (state/focus/sport ignored).
 *
 * Returns null when:
 *   - Neither manifest.practiceState nor manifest.practice is present.
 *   - The sport's tail is absent from manifest.practiceState (clips not yet rendered).
 *   - Any required slug in the assembled list is absent from the catalog.
 *
 * Fail-closed: the caller should fall back to a text timer on null.
 */
export function resolvePracticePlaylist(
  manifest: ClipManifest,
  state?: PracticeState | null,
  focus?: string | null,
  /**
   * Sport config for opener slug resolution and focus slug lookup.
   * Defaults to HOCKEY_CONFIG so existing call sites (tests, PracticeFlow)
   * stay green without changes.
   */
  sportConfig: SportConfig = HOCKEY_CONFIG,
): ResolvedClip[] | null {
  // ── p5/p6 state-aware path ───────────────────────────────────────────────
  if (manifest.practiceState) {
    // Fail-safe: unknown or missing state defaults to "dialed-in".
    const resolvedState: PracticeState =
      state === "not-feeling-it" ? "not-feeling-it" : "dialed-in";

    const openerSlug = sportConfig.practiceOpenerSlugs[resolvedState];

    // ── Tail resolution: p6 sport-keyed vs p5 legacy ─────────────────────
    // p5 manifest: practiceState["dialed-in"] is a string[] (tail directly).
    // p6 manifest: practiceState[sport] is { "dialed-in": string[], ... }.
    // Detect by checking if practiceState["dialed-in"] is an array.
    let tailSlugs: string[];
    const p5DialedinValue = manifest.practiceState["dialed-in"];
    if (Array.isArray(p5DialedinValue)) {
      // p5 shape — treat as hockey regardless of sportConfig.sportKey.
      // The tail is shared (sport-neutral hockey tail) for backward compat.
      tailSlugs = manifest.practiceState[resolvedState] as string[];
    } else {
      // p6 shape — look up the sport's tail by sportKey.
      const sportEntry = manifest.practiceState[sportConfig.sportKey];
      if (!sportEntry || Array.isArray(sportEntry)) {
        // Sport not present in manifest (clips not yet rendered — FV-31 pending).
        // Fail closed so the caller falls back to text timer.
        return null;
      }
      tailSlugs = sportEntry[resolvedState];
    }

    // Focus clip: resolve from sport config's slug map; drop cleanly if unknown/missing.
    const focusSlug =
      focus ? (sportConfig.practiceFocusSlugs[focus] ?? null) : null;

    // Assemble: opener → shared-tail with focus injected between lead/tail.
    // The shared-tail array from the manifest already contains lead+tail slugs;
    // focus is injected at the pp-choose-focus-lead / pp-choose-focus-tail seam.
    const slugs: string[] = [openerSlug];
    for (const s of tailSlugs) {
      slugs.push(s);
      if (s === "pp-choose-focus-lead" && focusSlug) {
        slugs.push(focusSlug);
      }
    }

    return mapSlugsToClips(slugs, manifest);
  }

  // ── p4 legacy flat path ──────────────────────────────────────────────────
  if (!manifest.practice) return null;
  return mapSlugsToClips(manifest.practice.clips, manifest);
}

/** Map an ordered slug list → ResolvedClip[]. Returns null on any missing slug. */
function mapSlugsToClips(
  slugs: string[],
  manifest: ClipManifest,
): ResolvedClip[] | null {
  const resolved: ResolvedClip[] = [];
  for (const slug of slugs) {
    const entry = manifest.clips[slug];
    if (!entry) return null; // missing slug — fail closed
    resolved.push({
      slug,
      url: bustUrl(entry.url),
      durationSec: entry.durationSec,
      phases: entry.phases,
    });
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// buildAssembledTimeline
// ---------------------------------------------------------------------------

/**
 * Walk the ordered clip list and produce a flat timeline where every phase
 * mark is expressed as an offset from session-start (second 0).
 *
 * This REPLACES the two-sidecar `elapsed - openerDuration` arithmetic in the
 * legacy path. With an assembled timeline the phase-detection call is a single
 * findActivePhaseFromTimeline(assembledTimeline, ctx.currentTime) with no
 * conditional branching on "which segment am I in."
 *
 * Invariant: output phases are sorted ascending by startSec (they inherit
 * the ordering from the clip list × phases-within-clip ordering).
 */
export function buildAssembledTimeline(clips: ResolvedClip[]): AssembledTimeline {
  let cursor = 0; // running offset into the session
  const phases: AssembledTimeline["phases"] = [];

  for (const clip of clips) {
    for (const mark of clip.phases) {
      const entry: AssembledTimeline["phases"][number] = {
        phase: mark.phase,
        startSec: cursor + mark.offsetSec,
      };
      if (mark.round !== undefined) {
        entry.round = mark.round;
      }
      phases.push(entry);
    }
    cursor += clip.durationSec;
  }

  return {
    totalDurationSec: cursor,
    phases,
  };
}

// ---------------------------------------------------------------------------
// findActivePhaseFromAssembledTimeline
// ---------------------------------------------------------------------------

/**
 * Binary-search equivalent (linear scan — timeline is short, < ~20 entries)
 * for the phase active at `currentSec`.
 *
 * Identical semantics to findActivePhaseFromTimeline in screens-b.tsx but
 * operates on AssembledTimeline rather than AudioTimeline. Exposed here so
 * useClipPlayer doesn't need to import from screens-b.
 */
export function findActivePhase(
  timeline: AssembledTimeline,
  currentSec: number,
): Phase | null {
  let active: Phase | null = null;
  for (let i = 0; i < timeline.phases.length; i++) {
    const entry = timeline.phases[i];
    if (!entry) break;
    if (entry.startSec <= currentSec) {
      active = entry.phase;
    } else {
      break;
    }
  }
  return active;
}
