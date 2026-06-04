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

// Bumped whenever any audio binary changes. Appended as ?v= to every
// MP3 + sidecar JSON URL so Vercel's CDN + browsers can't serve a
// stale cached version after a regen. Bump this when you rerun
// `npm run audio:generate`.
export const AUDIO_CACHE_BUST = "11";

export function audioAssetUrl(slug: string, ext: "mp3" | "json"): string {
  return `/audio/pregame/${slug}.${ext}?v=${AUDIO_CACHE_BUST}`;
}

export const NEED_OPENER_SLUGS: Record<NeedToday, string> = {
  Confidence: "opener-confidence",
  Calm: "opener-calm",
  "Compete level": "opener-compete-level",
  "Reset after mistakes": "opener-reset",
  "Physical courage": "opener-courage",
  "Better puck decisions": "opener-decisions",
  Leadership: "opener-leadership",
  Joy: "opener-joy",
  Hope: "opener-hope",
};

// ADVERSITY_SLUG_FRAGMENTS and cellSlugFor have moved to sport-registry.ts
// (HOCKEY_CONFIG.adversitySlugFragments / HOCKEY_CONFIG.cellSlugFor).
// They are no longer exported from this module.

export function openerSrcFor(need: NeedToday | null): string | null {
  if (!need) return null;
  return audioAssetUrl(NEED_OPENER_SLUGS[need], "mp3");
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
