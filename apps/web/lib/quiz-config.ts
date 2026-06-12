/**
 * FV-228 — Athlete personalization quiz configuration.
 *
 * Defines the 5 focus-area options, their DB-stored keys, and the Daily hub
 * card subtitle variants shown after the quiz is set.
 *
 * Design principles:
 *   - Enum keys stored in DB (CHECK constraint in 20260613010000 migration).
 *   - Subtitles are Mentor voice: affirming participation, never shame.
 *     They describe what the app is built FOR, not what is broken IN the athlete.
 *   - No gamification framing — no streaks, no scores, no identity statements
 *     beyond the brand spine.
 */

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
// Display labels — sport-neutral; all sports use the same quiz labels.
// ---------------------------------------------------------------------------

export const FOCUS_AREA_LABELS: Record<FocusAreaKey, string> = {
  "nerves":        "Nerves before games",
  "bouncing-back": "Bouncing back from mistakes",
  "confidence":    "Confidence",
  "focus":         "Staying focused",
  "faith":         "Faith feels far away",
};

/**
 * Returns the display label for a focus area key.
 * All labels are sport-neutral — the quiz reads correctly across hockey,
 * basketball, and future sports without per-sport branching.
 * (FV-228 review: the original per-sport switch returned identical strings
 * for every branch — the scaffolding was dead code and has been removed.)
 */
export function focusAreaLabel(key: FocusAreaKey): string {
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
 *
 * TODO FV-253: consumed by the pregame Today's Focus default — wire this into
 * the pregame setup flow to pre-select the athlete's mapped need on first open.
 */
export function pregameNeedDefault(focusArea: string | null | undefined): string | null {
  if (!focusArea || !isFocusAreaKey(focusArea)) return null;
  return FOCUS_AREA_TO_NEED[focusArea];
}
