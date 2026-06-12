/**
 * FV-228 — Athlete personalization quiz configuration.
 *
 * Defines the 5 focus-area options, their DB-stored keys, sport-aware display
 * labels, and the Daily hub card subtitle variants shown after the quiz is set.
 *
 * Design principles:
 *   - Enum keys stored in DB (CHECK constraint in 20260613010000 migration).
 *   - Sport-aware labels: "nerves" reads differently before a game vs. before a
 *     practice — but the stored key is always the same, so sport-switches don't
 *     invalidate stored data.
 *   - Subtitles are Mentor voice: affirming participation, never shame.
 *     They describe what the app is built FOR, not what is broken IN the athlete.
 *   - No gamification framing — no streaks, no scores, no identity statements
 *     beyond the brand spine.
 */

import type { Sport } from "@/lib/sports";

// ---------------------------------------------------------------------------
// Focus area enum
// ---------------------------------------------------------------------------

export const FOCUS_AREA_KEYS = [
  "nerves",
  "bouncing-back",
  "confidence",
  "focus",
  "faith",
] as const;

export type FocusAreaKey = (typeof FOCUS_AREA_KEYS)[number];

export function isFocusAreaKey(value: string | null | undefined): value is FocusAreaKey {
  return FOCUS_AREA_KEYS.includes(value as FocusAreaKey);
}

// ---------------------------------------------------------------------------
// Display labels — sport-neutral for settings; the quiz uses sport-specific labels.
// ---------------------------------------------------------------------------

export const FOCUS_AREA_LABELS: Record<FocusAreaKey, string> = {
  "nerves":        "Nerves before games",
  "bouncing-back": "Bouncing back from mistakes",
  "confidence":    "Confidence",
  "focus":         "Staying focused",
  "faith":         "Faith feels far away",
};

/**
 * Sport-specific display labels for the quiz screen. Most labels are
 * sport-neutral; "nerves" and "bouncing-back" get sport-specific wording
 * so hockey and basketball athletes see their own language.
 */
export function focusAreaLabelForSport(key: FocusAreaKey, sport: Sport): string {
  if (key === "nerves") {
    switch (sport) {
      case "hockey":     return "Nerves before games";
      case "basketball": return "Nerves before games";
      default:           return "Nerves before games";
    }
  }
  if (key === "bouncing-back") {
    switch (sport) {
      case "hockey":     return "Bouncing back from mistakes";
      case "basketball": return "Bouncing back from mistakes";
      default:           return "Bouncing back from mistakes";
    }
  }
  return FOCUS_AREA_LABELS[key];
}

// ---------------------------------------------------------------------------
// Daily hub card subtitle variants (Mentor voice, FV-228 AC §3)
//
// These appear as the subtitle on the "Daily Training" card on /athlete.
// Shown when the athlete has a stored focus_area; falls back to the default
// "Read today's session — reset your mind." when focus_area is null.
//
// Voice rules:
//   - Affirming action ("Built for X", "Here when you need X")
//   - One short clause — fits on two lines max at 13px on a 375px viewport
//   - No shame, no identity-diminishment, no streak framing
//   - Mentor voice: steady, confident, alongside — not cheering or lecturing
// ---------------------------------------------------------------------------

export const FOCUS_AREA_SUBTITLES: Record<FocusAreaKey, string> = {
  "nerves":        "Built for the moment nerves try to take over.",
  "bouncing-back": "Built for bouncing back, every single time.",
  "confidence":    "Built to remind you who you already are.",
  "focus":         "Built to sharpen your mind when it wanders.",
  "faith":         "Built to bring faith back into the room.",
};

/**
 * Returns the Daily hub subtitle for a given focus_area.
 * Falls back to the default subtitle when focus_area is null/unknown.
 */
export function dailyCardSubtitle(focusArea: string | null | undefined): string {
  if (!focusArea || !isFocusAreaKey(focusArea)) {
    return "Read today’s session — reset your mind.";
  }
  return FOCUS_AREA_SUBTITLES[focusArea];
}

// ---------------------------------------------------------------------------
// Pregame "Today's Focus" default mapping (FV-228 AC §3)
//
// Maps a stored focus_area to the closest NeedToday value that exists in
// both sport registries. Used as the initial pre-selection in the pregame
// Today's Focus picker — the athlete can always change it.
// ---------------------------------------------------------------------------

export const FOCUS_AREA_TO_NEED: Record<FocusAreaKey, string> = {
  "nerves":        "Calm",
  "bouncing-back": "Reset after mistakes",
  "confidence":    "Confidence",
  "focus":         "Compete level",
  "faith":         "Hope",
};

/**
 * Returns the pregame NeedToday default for a given focus_area, or null
 * (no pre-selection) if the focus area is not set or not mappable.
 */
export function pregameNeedDefault(focusArea: string | null | undefined): string | null {
  if (!focusArea || !isFocusAreaKey(focusArea)) return null;
  return FOCUS_AREA_TO_NEED[focusArea];
}
