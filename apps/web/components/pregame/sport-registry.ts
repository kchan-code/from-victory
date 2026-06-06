// Per-sport configuration registry for the pregame + pre-practice engines.
//
// Design principles:
//   - Sport is the registry key (athlete.sport from FV-27).
//   - The `roles` field is OPTIONAL — sports without it (tennis, swimming)
//     render no position-picker screen, and `state.role` stays null as a
//     valid terminal state. Hockey declares roles; future no-ask sports omit
//     the field entirely.
//   - `cellSlugFor` encapsulates all sport-specific slug logic including
//     hockey's goalie-pulled special case.
//   - BASKETBALL_CONFIG carries the full FV-30 pregame content (positions,
//     adversities, roleContent, slug scheme). Pre-practice focus presets are
//     still TODO (a follow-up chunk in the FV-30 lane); audio for the
//     basketball clips is rendered separately in FV-31.
//   - `needs`, `anchors`, `selfTalkOptions` are per-sport picker lists
//     (FV-117). Hockey keeps its original lists exactly; basketball swaps
//     sport-specific options so hockey-worded chips are never shown to a
//     basketball athlete.

import type { NeedToday } from "./types";

// ---------------------------------------------------------------------------
// Sport type
// ---------------------------------------------------------------------------

export type Sport = "hockey" | "basketball"; // extend as more sports land

/**
 * A Hard Moment option: the canonical `key` (drives `cellSlugFor` + the stored
 * `state.adversity`) and the `label` shown to the athlete. For most roles
 * key === label; a per-role override (see `SportConfig.roleAdversities`) lets a
 * position show truer language — e.g. a goalie sees "I get pulled" while the key
 * stays "I get benched", so the same audio cell resolves.
 */
export type AdversityOption = { key: string; label: string };

// ---------------------------------------------------------------------------
// SportConfig shape
// ---------------------------------------------------------------------------

export type SportConfig = {
  displayName: string;
  /**
   * Registry key for this sport — matches the `Sport` union and the key used in
   * `ClipManifest.practiceState` for sport-keyed tail lookup.
   * Set once per config; never changes after initial declaration.
   */
  sportKey: Sport;
  /**
   * OPTIONAL. When present, the pregame flow renders a position-picker screen
   * and `state.role` must be one of these values.
   * When absent, the position step is SKIPPED and `state.role` stays null.
   */
  roles?: readonly string[];
  /** Human label for the position axis (e.g. "Position"). */
  roleLabel?: string;
  /**
   * Role-specific display content surfaced in the position-picker card and
   * the text-mode script substitution.
   * Only present when `roles` is present.
   */
  roleContent?: Record<string, { title: string; scenes: string[] }>;
  /** Ordered list of adversity options shown in the Hard Moment screen. */
  adversities: readonly string[];
  /**
   * OPTIONAL per-role override for the Hard Moment options. When present for a
   * role, the screen shows these {key, label} items (in order) instead of the
   * flat `adversities` list. `key` is the CANONICAL adversity string — unchanged,
   * still drives `cellSlugFor` + `state.adversity` — while `label` is the
   * role-specific display. Lets a goalie see goalie-true labels mapped to the
   * same existing cells (no new audio). Roles without an entry fall back to the
   * flat list. (FV-101.)
   */
  roleAdversities?: Record<string, readonly AdversityOption[]>;
  /**
   * Maps each adversity option string to a URL-safe slug fragment.
   * Used by `cellSlugFor` to compose the final clip slug.
   */
  adversitySlugFragments: Record<string, string>;
  /**
   * Compose the cell clip slug for a (adversityFrag, role?) pair.
   * For sports with roles: role is required and included in the slug.
   * For no-ask sports: role is null/undefined; slug is role-less.
   * The adversityFrag is already resolved from adversitySlugFragments
   * by the caller (or can be resolved inside this function — see hockey impl).
   *
   * Receives the full adversity string (not the fragment) so it can do its own
   * fragment resolution and apply sport-specific special cases (e.g.
   * goalie-pulled).
   */
  cellSlugFor: (adversity: string, role?: string | null) => string;
  /**
   * Derive the visualization clip slug for a given role.
   * Optional — only needed if the sport has role-specific viz clips.
   */
  vizSlugFor?: (role?: string | null) => string;
  /** Practice focus options shown in the pre-practice focus picker. */
  practiceFocusOptions: readonly string[];
  /**
   * Maps practice focus option strings to their pp-focus-* clip slugs.
   * Keys must exactly match `practiceFocusOptions` entries.
   */
  practiceFocusSlugs: Record<string, string>;

  // ── Pregame personalization picker lists (FV-117) ─────────────────────────
  /**
   * Ordered list of "Today's Focus" need options shown in the picker.
   * Hockey uses the original NEEDS list; basketball swaps "Better puck
   * decisions" → "Better decisions with the ball".
   */
  needs: readonly NeedToday[];
  /**
   * Ordered list of reset anchor options shown in the picker.
   * Hockey: stick-tap / glove-touch variants; basketball: ball-bounce /
   * floor-tap / rim-look variants. "Long exhale", "Press thumb to palm",
   * and "Say cue word" are shared across sports.
   */
  anchors: readonly string[];
  /**
   * Ordered list of self-talk phrases shown in the picker.
   * Hockey: "You're okay. Next shift." Basketball: "You're okay. Next possession."
   * All other 6 phrases are sport-neutral and shared.
   */
  selfTalkOptions: readonly string[];

  /** Opener clip slugs for the two pre-practice states. */
  practiceOpenerSlugs: {
    "dialed-in": string;
    "not-feeling-it": string;
  };
};

// ---------------------------------------------------------------------------
// Hockey config
// ---------------------------------------------------------------------------

const HOCKEY_ADVERSITY_SLUG_FRAGMENTS: Record<string, string> = {
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

export const HOCKEY_CONFIG: SportConfig = {
  displayName: "Hockey",
  sportKey: "hockey",

  roles: ["Forward", "Defense", "Goalie"] as const,
  roleLabel: "Position",

  roleContent: {
    Forward: {
      title: "Play your role with courage.",
      scenes: [
        "Win a puck race.",
        "Protect the puck.",
        "Drive inside.",
        "Make the next play.",
        "Backcheck hard.",
      ],
    },
    Defense: {
      title: "Calm under pressure.",
      scenes: [
        "Shoulder check.",
        "Retrieve the puck.",
        "Make the first pass.",
        "Hold your gap.",
        "Box out.",
      ],
    },
    Goalie: {
      title: "The next shot.",
      scenes: [
        "Set your feet.",
        "Track the puck.",
        "Control the rebound.",
        "Reset after traffic.",
        "Next shot only.",
      ],
    },
  },

  adversities: [
    "I turn the puck over.",
    "I miss a scoring chance.",
    "I get beaten wide.",
    "I take a bad penalty.",
    "Coach yells.",
    "I get benched.",
    "I feel nervous.",
    "I get hit.",
    "I start slow.",
    "We give up the first goal.",
  ],

  // FV-101 — goalie-specific Hard Moment labels + order. Keys are the canonical
  // hockey adversities above, so cellSlugFor still resolves the existing goalie
  // cells (no new audio); labels are goalie-true (hockey-expert + content-curator
  // ratified). The skater list shows offense framing a goalie never lives; the
  // audio behind "beaten wide" / "missed chance" is actually a cross-crease beat
  // and a breakaway walk-around — so we re-label, not re-cut. "I take a bad
  // penalty" is intentionally dropped for goalies (KC: not a goalie issue; rare
  // for the position — the weakest of the ten).
  roleAdversities: {
    Goalie: [
      { key: "We give up the first goal.", label: "I let in the first goal." },
      { key: "I get benched.", label: "I get pulled." },
      { key: "I get beaten wide.", label: "I get beat post to post." },
      { key: "I miss a scoring chance.", label: "I get beat on a breakaway." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "I get hit.", label: "I get run in the crease." },
      { key: "I turn the puck over.", label: "I cough up a bad clear." },
      { key: "Coach yells.", label: "Coach yells." },
    ],
  },

  adversitySlugFragments: HOCKEY_ADVERSITY_SLUG_FRAGMENTS,

  cellSlugFor(adversity: string, role?: string | null): string {
    const advFrag =
      HOCKEY_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "missed-chance";
    // Goalie × benched → pulled (goalies don't get "benched," they get pulled)
    if (role === "Goalie" && advFrag === "benched") {
      return "session-goalie-pulled";
    }
    const roleStr = role ? role.toLowerCase() : "forward";
    return `session-${roleStr}-${advFrag}`;
  },

  practiceFocusOptions: [
    "Relentless",
    "Hungry",
    "Head up every breakout",
    "Feet always moving",
    "Hard first pass",
    "Win every race to the puck",
    "Full reps, no glide",
    "Talk every shift",
  ] as const,

  practiceFocusSlugs: {
    "Relentless": "pp-focus-relentless",
    "Hungry": "pp-focus-hungry",
    "Head up every breakout": "pp-focus-head-up-every-breakout",
    "Feet always moving": "pp-focus-feet-always-moving",
    "Hard first pass": "pp-focus-hard-first-pass",
    "Win every race to the puck": "pp-focus-win-every-race-to-the-puck",
    "Full reps, no glide": "pp-focus-full-reps-no-glide",
    "Talk every shift": "pp-focus-talk-every-shift",
  },

  // FV-117: per-sport picker lists. Hockey keeps its original lists exactly.
  needs: [
    "Confidence",
    "Calm",
    "Compete level",
    "Reset after mistakes",
    "Physical courage",
    "Better puck decisions",
    "Leadership",
    "Joy",
    "Hope",
  ] as const satisfies readonly NeedToday[],

  // Order preserved verbatim from the original RESET_ANCHORS (hockey is the live
  // beta sport — the registry refactor must not reorder its chips). FV-117.
  anchors: [
    "Tap stick twice",
    "Touch glove",
    "Press thumb to palm",
    "Long exhale",
    "Look at tape",
    "Say cue word",
  ] as const,

  selfTalkOptions: [
    "You're okay. Next shift.",
    "Breathe. Do your job.",
    "Stay steady. Make the next play.",
    "You don't need to do too much.",
    "Compete, recover, go again.",
    "Your identity is secure. Play free.",
    "You are secure. Take the next faithful action.",
  ] as const,

  practiceOpenerSlugs: {
    "dialed-in": "pp-opener-dialed-in",
    "not-feeling-it": "pp-opener-get-to",
  },
};

// ---------------------------------------------------------------------------
// Basketball config (FV-30)
// ---------------------------------------------------------------------------

const BASKETBALL_ADVERSITY_SLUG_FRAGMENTS: Record<string, string> = {
  "I turn the ball over.": "turnover",
  "I miss an open shot.": "missed-shot",
  "I get cooked off the dribble.": "got-cooked",
  "I get into foul trouble.": "foul-trouble",
  "Coach yells.": "coach-yells",
  "I get benched.": "benched",
  "I feel nervous.": "nervous",
  "I miss two free throws.": "missed-fts",
  "I start slow.": "start-slow",
  "We fall behind early.": "fall-behind-early",
};

export const BASKETBALL_CONFIG: SportConfig = {
  displayName: "Basketball",
  sportKey: "basketball",

  roles: ["Guard", "Wing", "Big"] as const,
  roleLabel: "Position",

  roleContent: {
    Guard: {
      title: "Run the team with poise.",
      scenes: [
        "Push the pace.",
        "See the floor.",
        "Take care of the rock.",
        "Get downhill.",
        "Talk on defense.",
      ],
    },
    Wing: {
      title: "Stay ready. Stay aggressive.",
      scenes: [
        "Feet set, shoot it.",
        "Sprint the lane.",
        "Take the next open shot.",
        "Lock up your man.",
        "Crash and close out.",
      ],
    },
    Big: {
      title: "Own the paint.",
      scenes: [
        "Seal and post strong.",
        "Hit the glass.",
        "Protect the rim.",
        "Roll hard, finish.",
        "Move your feet, stay vertical.",
      ],
    },
  },

  adversities: [
    "I turn the ball over.",
    "I miss an open shot.",
    "I get cooked off the dribble.",
    "I get into foul trouble.",
    "Coach yells.",
    "I get benched.",
    "I feel nervous.",
    "I miss two free throws.",
    "I start slow.",
    "We fall behind early.",
  ],

  adversitySlugFragments: BASKETBALL_ADVERSITY_SLUG_FRAGMENTS,

  cellSlugFor(adversity: string, role?: string | null): string {
    const frag =
      BASKETBALL_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "missed-shot";
    // Big × benched → fouled-out (Bigs foul out; there is no session-big-benched)
    if (role === "Big" && frag === "benched") {
      return "bb-big-fouled-out";
    }
    const roleStr = role ? role.toLowerCase() : "guard";
    return `bb-${roleStr}-${frag}`;
  },

  // Basketball pre-practice focus presets (FV-30 pre-practice chunk).
  // Audio rendering = FV-31 (12 pp-bb-* slugs + AUDIO_CACHE_BUST bump).
  practiceFocusOptions: [
    "Relentless",
    "Hungry",
    "Talk every possession",
    "Guard your yard",
    "Hit the glass",
    "Sprint every transition",
    "Box out every shot",
  ] as const,

  practiceFocusSlugs: {
    "Relentless": "pp-bb-focus-relentless",
    "Hungry": "pp-bb-focus-hungry",
    "Talk every possession": "pp-bb-focus-talk-every-possession",
    "Guard your yard": "pp-bb-focus-guard-your-yard",
    "Hit the glass": "pp-bb-focus-hit-the-glass",
    "Sprint every transition": "pp-bb-focus-sprint-every-transition",
    "Box out every shot": "pp-bb-focus-box-out-every-shot",
  },

  // FV-117: per-sport picker lists for basketball.
  // "Better puck decisions" → "Better decisions with the ball".
  // All other 8 needs are sport-neutral and shared with hockey.
  needs: [
    "Confidence",
    "Calm",
    "Compete level",
    "Reset after mistakes",
    "Physical courage",
    "Better decisions with the ball",
    "Leadership",
    "Joy",
    "Hope",
  ] as const satisfies readonly NeedToday[],

  // "Tap stick twice" and "Touch glove" are hockey-specific; replaced with
  // "Bounce ball twice", "Tap floor", and "Look at rim" for basketball.
  // "Long exhale", "Press thumb to palm", "Say cue word" are shared.
  anchors: [
    "Long exhale",
    "Press thumb to palm",
    "Bounce ball twice",
    "Tap floor",
    "Look at rim",
    "Say cue word",
  ] as const,

  // "You're okay. Next shift." → "You're okay. Next possession." for basketball.
  // The other 6 phrases are sport-neutral.
  selfTalkOptions: [
    "You're okay. Next possession.",
    "Breathe. Do your job.",
    "Stay steady. Make the next play.",
    "You don't need to do too much.",
    "Compete, recover, go again.",
    "Your identity is secure. Play free.",
    "You are secure. Take the next faithful action.",
  ] as const,

  practiceOpenerSlugs: {
    // pp-opener-dialed-in is sport-neutral and reused across both sports.
    "dialed-in": "pp-opener-dialed-in",
    // Basketball-specific not-feeling-it opener (FV-30).
    "not-feeling-it": "pp-bb-opener-get-to",
  },
};

// ---------------------------------------------------------------------------
// Registry + accessor
// ---------------------------------------------------------------------------

export const SPORT_REGISTRY: Record<Sport, SportConfig> = {
  hockey: HOCKEY_CONFIG,
  basketball: BASKETBALL_CONFIG,
};

/**
 * Look up the config for a given sport.
 * The `sport` parameter is typed as `Sport` (a discriminated union), so the
 * TypeScript compiler ensures only known keys are passed — there is no
 * runtime fallback. Callers must pass a valid Sport key; an unknown value
 * is a type error, not a silent hockey default.
 */
export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_REGISTRY[sport];
}

/**
 * The Hard Moment options for a (sport config, role): the role's override if one
 * exists (e.g. hockey Goalie — goalie-true labels mapped to the same cells),
 * else the flat `adversities` list mapped to {key, label} with key === label.
 * The `key` always drives `cellSlugFor` + `state.adversity`; only the displayed
 * `label` varies. (FV-101.)
 */
export function adversityOptionsFor(
  config: SportConfig,
  role: string | null,
): readonly AdversityOption[] {
  const override = role ? config.roleAdversities?.[role] : undefined;
  if (override) return override;
  return config.adversities.map((a) => ({ key: a, label: a }));
}

/**
 * The display LABEL for a stored adversity `key`, given the athlete's role —
 * the inverse of `adversityOptionsFor` for every place the chosen adversity is
 * shown downstream (Review screen, session card, text-mode `{{adversity}}`).
 * A goalie's stored "I get benched." shows as "I get pulled.". Falls back to the
 * key itself for skaters, custom free-text, and sports without overrides, and
 * passes a null key straight through. (FV-101.)
 */
export function adversityLabelFor(
  config: SportConfig,
  role: string | null,
  key: string | null,
): string | null {
  if (!key) return key;
  const override = role ? config.roleAdversities?.[role] : undefined;
  return override?.find((o) => o.key === key)?.label ?? key;
}
