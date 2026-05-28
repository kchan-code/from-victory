// Mapping helpers between athlete pregame state and the audio assets.
//
// The compositional audio architecture: a need-specific opener.mp3 plays
// first (~50-65s), then the (position × adversity) cell.mp3 plays (~4:00-
// 4:30). Both are pre-rendered MP3s in public/audio/pregame/.
//
// Cell slug pattern: session-{position}-{adversity-fragment}.
// Special case: Goalie × "I get benched." → session-goalie-pulled
// (a goalie isn't "benched," they're "pulled").

import type { NeedToday, Role } from "./types";

// Bumped whenever any audio binary changes. Appended as ?v= to every
// MP3 + sidecar JSON URL so Vercel's CDN + browsers can't serve a
// stale cached version after a regen. Bump this when you rerun
// `npm run audio:generate`.
export const AUDIO_CACHE_BUST = "3";

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

export const ADVERSITY_SLUG_FRAGMENTS: Record<string, string> = {
  "I turn the puck over.": "turnover",
  "I miss a scoring chance.": "missed-chance",
  "I get beaten wide.": "beaten-wide",
  "I take a bad penalty.": "bad-penalty",
  "Coach yells.": "coach-yells",
  "I get benched.": "benched",
  "I feel nervous.": "nervous",
  "I get hit.": "get-hit",
  "I start slow.": "start-slow",
  "We give up the first goal.": "first-goal-against",
};

export function cellSlugFor(role: Role, adversity: string): string {
  const roleStr = role.toLowerCase();
  const advFrag = ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "missed-chance";
  // Goalie × benched → pulled (goalies don't get "benched," they get pulled)
  if (role === "Goalie" && advFrag === "benched") return "session-goalie-pulled";
  return `session-${roleStr}-${advFrag}`;
}

export function openerSrcFor(need: NeedToday | null): string | null {
  if (!need) return null;
  return audioAssetUrl(NEED_OPENER_SLUGS[need], "mp3");
}

export function cellSrcFor(
  role: Role | null,
  adversity: string | null,
): string | null {
  if (!role || !adversity) return null;
  return audioAssetUrl(cellSlugFor(role, adversity), "mp3");
}
