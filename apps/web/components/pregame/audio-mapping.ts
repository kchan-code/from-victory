// Mapping helpers between athlete pregame state and the audio assets.
//
// The compositional audio architecture: a need-specific opener.mp3 plays
// first (~50-65s), then the (position × adversity) cell.mp3 plays (~4:00-
// 4:30). Both are pre-rendered MP3s in public/audio/pregame/.
//
// Cell slug pattern: session-{position}-{adversity-fragment}.
// Special case: Goalie × "I get benched." → session-goalie-pulled
// (a goalie isn't "benched," they're "pulled").

import type { NeedToday } from "./types";
import { getSportConfig, type Sport } from "./sport-registry";

// ---------------------------------------------------------------------------
// Sport-aware opener slug resolution (FV-117, FV-466)
// ---------------------------------------------------------------------------
//
// Three tiers (FV-466):
//   1. Hockey → HOCKEY_OPENER_OVERRIDES (the original opener-* clips, which
//      are hockey-specific: "next shift", "loose puck", "the C, the A").
//   2. Basketball → BASKETBALL_OPENER_OVERRIDES (opener-bb-*, FV-116/120/124),
//      falling back to the shared clips for "Calm".
//   3. Everything else → NEED_OPENER_SLUGS, the sport-NEUTRAL opener-shared-*
//      clips. Any new sport gets a leak-free fallback by default.
//
// History: the original opener-* clips used to BE the shared fallback, which
// leaked hockey language into football/golf (and basketball "Calm") — see
// FV-466 and pregame-opener-sport-audit.md.

const BASKETBALL_OPENER_OVERRIDES: Partial<Record<NeedToday, string>> = {
  // FV-116 (courage + decisions rendered first)
  "Physical courage": "opener-bb-courage",
  "Better decisions with the ball": "opener-bb-decisions",
  // FV-120 (remaining 6 sport-specific variants)
  // NOTE: "Calm" is intentionally absent — it falls back to the sport-neutral
  // opener-shared-calm via NEED_OPENER_SLUGS (FV-466; the old opener-calm
  // fallback closed with "One puck. One shift.").
  "Confidence": "opener-bb-confidence",
  "Compete level": "opener-bb-compete-level",
  "Reset after mistakes": "opener-bb-reset",
  "Leadership": "opener-bb-leadership",
  "Joy": "opener-bb-joy",
  "Hope": "opener-bb-hope",
  // FV-124 (Be more Vocal — basketball-specific opener)
  "Be more Vocal": "opener-bb-be-vocal",
};

// FV-466: the original opener-* clips are hockey's sport-specific set.
// Keyed by hockey's 10 needs; MP3s are unchanged (byte-identical), only
// their resolution tier moved. The default sport is "hockey" everywhere,
// so legacy call sites keep hearing exactly these clips.
const HOCKEY_OPENER_OVERRIDES: Partial<Record<NeedToday, string>> = {
  Confidence: "opener-confidence",
  Calm: "opener-calm",
  "Compete level": "opener-compete-level",
  "Reset after mistakes": "opener-reset",
  "Physical courage": "opener-courage",
  "Better puck decisions": "opener-decisions",
  Leadership: "opener-leadership",
  Joy: "opener-joy",
  Hope: "opener-hope",
  "Be more Vocal": "opener-be-vocal",
};

/**
 * Resolve the opener slug for a given (need, sport) pair.
 * Hockey and basketball use sport-specific clips where available
 * (FV-466 / FV-116); all other combinations fall back to the
 * sport-neutral opener-shared-* clips in NEED_OPENER_SLUGS.
 * Returns null for unknown needs.
 */
export function resolveOpenerSlug(
  need: string,
  sport: Sport = "hockey",
): string | null {
  if (sport === "hockey") {
    const override = HOCKEY_OPENER_OVERRIDES[need as NeedToday] ?? null;
    if (override) return override;
  }
  if (sport === "basketball") {
    const override =
      BASKETBALL_OPENER_OVERRIDES[need as NeedToday] ?? null;
    if (override) return override;
  }
  return NEED_OPENER_SLUGS[need as keyof typeof NEED_OPENER_SLUGS] ?? null;
}

// ---------------------------------------------------------------------------
// Personalization clip slug maps — Phase 3b
// Keys are the EXACT option strings from types.ts (RESET_ANCHORS,
// SELF_TALK_OPTIONS, CUE_WORDS). Any mismatch silently breaks resolution.
// ---------------------------------------------------------------------------

// Anchor → slug. "Say cue word" intentionally absent — the resolver skips it
// (no audio clip produced; KC's call per Phase 3b approval).
export const ANCHOR_OPTION_SLUGS: Record<string, string> = {
  "Long exhale": "anc-long-exhale",
  "Tap stick twice": "anc-tap-stick-twice",
  "Touch glove": "anc-touch-glove",
  "Press thumb to palm": "anc-press-thumb-to-palm",
  "Look at tape": "anc-look-at-tape",
  "Take a drink": "anc-take-a-drink",
  // Basketball anchors (FV-116 — rendered + in manifest.clips)
  "Bounce ball twice": "anc-bounce-ball-twice",
  "Tap floor": "anc-tap-floor",
  "Look at rim": "anc-look-at-rim",
  // Golf anchors (FV-303 — rendered + in manifest.clips)
  "Re-grip the club": "anc-glf-regrip",
  "Glove tap": "anc-glf-glove-tap",
  "Step back, then step in": "anc-glf-step-back",
  // Football anchors (FV-468 — rendered + in manifest.clips)
  "Snap the chinstrap": "anc-ftb-chinstrap",
  "Tap the helmet": "anc-ftb-tap-helmet",
  "Clap and break the huddle": "anc-ftb-break-huddle",
};

// Self-talk phrase → slug. Exact strings from SELF_TALK_OPTIONS in types.ts,
// including straight apostrophes.
export const SELFTALK_OPTION_SLUGS: Record<string, string> = {
  "You're okay. Next shift.": "st-01",
  "Breathe. Do your job.": "st-02",
  "Stay steady. Make the next play.": "st-03",
  "You don't need to do too much.": "st-04",
  "Compete, recover, go again.": "st-05",
  "Your identity is secure. Play free.": "st-06",
  "You are secure. Take the next faithful action.": "st-07",
  // Basketball self-talk (FV-116 — rendered + in manifest.clips)
  "You're okay. Next possession.": "st-bb-01",
  // Golf self-talk (FV-303 — rendered + in manifest.clips)
  "You're okay. Next shot.": "st-glf-01",
  // Golf self-talk #2 (FV-294 — golf-correct replacement for "Stay steady. Make the next play.")
  "Stay steady. Play the next shot.": "st-glf-02",
  // Football self-talk (FV-468 — rendered + in manifest.clips)
  "You're okay. Next play.": "st-ftb-01",
};

// Cue word → base slug. Resolver appends "-reset" or "-sendoff".
export const CUEWORD_OPTION_SLUGS: Record<string, string> = {
  "Steady": "cw-steady",
  "Courage": "cw-courage",
  "Simple": "cw-simple",
  "Attack": "cw-attack",
  "Next": "cw-next",
  "Serve": "cw-serve",
  "Compete": "cw-compete",
  "Faithful": "cw-faithful",
  "Free": "cw-free",
  "Relentless": "cw-relentless",
};

// FV-142 — Per-clip content-addressed filenames.
//
// MANIFEST_VERSION is the content-hash of the current clip catalog.
// It is computed by the generator as the sha256 of the sorted
// { slug → hash8 } map and embedded in the committed manifest.json.
// It serves two purposes:
//
//   1. The manifest URL includes it as ?mv=<MANIFEST_VERSION> so CDN +
//      browsers fetch the new manifest whenever any clip changes.
//
//   2. The SW audio cache is named `fv-audio-<MANIFEST_VERSION>`. When
//      any clip changes and MANIFEST_VERSION is bumped, the activate
//      handler prunes the old `fv-audio-<old>` cache and the new cache
//      starts warm on next precache (same mechanism as AUDIO_CACHE_BUST).
//
// IMPORTANT — two-file sync: when the generator rewrites manifest.json
// with a new manifestVersion, also update the matching constant in
// apps/web/public/sw.js (const MANIFEST_VERSION = "...") to the SAME
// string in the same PR. A mismatch causes the window-side precache and
// the SW to open different cache instances. The `audio-cache-bust` CI
// job enforces this parity.
//
// How to update: run `npm run audio:generate -- --mode clips`, read the
// new manifestVersion printed to stdout, and update MANIFEST_VERSION here
// AND in sw.js to match. AUDIO_CACHE_BUST is NOT bumped for clip regens
// (see the retirement note below).
export const MANIFEST_VERSION = "ad594a80"; // sync with sw.js:MANIFEST_VERSION

// AUDIO_CACHE_BUST — RETIRED for per-clip URL versioning (FV-142).
// Clips are now content-addressed (<slug>.<hash8>.mp3) and need no ?v=.
// This constant is kept only for:
//   1. Backward-compat in bustUrl() for legacy non-hashed URL fixtures in tests.
//   2. The legacy non-clip audioAssetUrl() helper (breath-threshold, openers
//      served from the top-level /audio/pregame/ path, not /clips/).
// Do NOT bump this for new clip regens — bump MANIFEST_VERSION instead.
// When all legacy top-level MP3s are retired this constant can be removed.
export const AUDIO_CACHE_BUST = "17";

export function audioAssetUrl(slug: string, ext: "mp3" | "json"): string {
  return `/audio/pregame/${slug}.${ext}?v=${AUDIO_CACHE_BUST}`;
}

// NEED_OPENER_SLUGS is the sport-NEUTRAL fallback: the opener-shared-* clips
// (FV-466), safe for any sport. Hockey and basketball sport-specific overrides
// are handled by resolveOpenerSlug() above. All the decisions-family needs map
// to the same opener-shared-decisions clip (Proverbs 3:5-6).
export const NEED_OPENER_SLUGS: Record<NeedToday, string> = {
  Confidence: "opener-shared-confidence",
  Calm: "opener-shared-calm",
  "Compete level": "opener-shared-compete-level",
  "Reset after mistakes": "opener-shared-reset",
  "Physical courage": "opener-shared-courage",
  "Better puck decisions": "opener-shared-decisions",
  "Better decisions with the ball": "opener-shared-decisions",
  // Baseball (FV-94)
  "Better decisions at the plate": "opener-shared-decisions",
  // Golf (FV-265)
  "Better course management": "opener-shared-decisions",
  // Football
  "Better reads": "opener-shared-decisions",
  // Swimming + Track & Field (v2 dormant)
  "Better race execution": "opener-shared-decisions",
  // Golf "Trust my swing" (FV-294) — same Proverbs 3:5-6 family. A bespoke
  // opener-trust-swing is a later by-ear.
  "Trust my swing": "opener-shared-decisions",
  Leadership: "opener-shared-leadership",
  Joy: "opener-shared-joy",
  Hope: "opener-shared-hope",
  "Be more Vocal": "opener-shared-be-vocal",
};

// ADVERSITY_SLUG_FRAGMENTS and cellSlugFor have moved to sport-registry.ts
// (HOCKEY_CONFIG.adversitySlugFragments / HOCKEY_CONFIG.cellSlugFor).
// They are no longer exported from this module.

export function openerSrcFor(
  need: NeedToday | null,
  sport: Sport = "hockey",
): string | null {
  if (!need) return null;
  const slug = resolveOpenerSlug(need, sport);
  if (!slug) return null;
  return audioAssetUrl(slug, "mp3");
}

/**
 * Derive the cell MP3 URL for a given (role, adversity, sport) combination.
 * Delegates slug composition to the sport-specific registry entry so
 * hockey's goalie-pulled special case (and any future sport logic) is
 * encapsulated in one place.
 *
 * Defaults to "hockey" when sport is not supplied, keeping all existing
 * call sites green without changes.
 */
export function cellSrcFor(
  role: string | null,
  adversity: string | null,
  sport: Sport = "hockey",
): string | null {
  if (!adversity) return null;
  const config = getSportConfig(sport);
  const slug = config.cellSlugFor(adversity, role);
  return audioAssetUrl(slug, "mp3");
}

/**
 * Derive the cell clip slug for a given (role, adversity, sport) combination.
 * Exported so screens-b.tsx can derive the slug for sidecar JSON loading.
 * Defaults to "hockey".
 */
export function cellSlugFor(
  role: string | null,
  adversity: string,
  sport: Sport = "hockey",
): string {
  const config = getSportConfig(sport);
  return config.cellSlugFor(adversity, role);
}
