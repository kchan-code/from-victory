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
//   - BASKETBALL_CONFIG is a typed stub (shape present, content TODO when
//     the basketball content sprint lands — FV-30/31). Do not use its
//     values in any production path.

// ---------------------------------------------------------------------------
// Sport type
// ---------------------------------------------------------------------------

export type Sport = "hockey" | "basketball"; // extend as more sports land

// ---------------------------------------------------------------------------
// SportConfig shape
// ---------------------------------------------------------------------------

export type SportConfig = {
  displayName: string;
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
  ] as const,

  practiceFocusSlugs: {
    "Relentless": "pp-focus-relentless",
    "Hungry": "pp-focus-hungry",
    "Head up every breakout": "pp-focus-head-up-every-breakout",
    "Feet always moving": "pp-focus-feet-always-moving",
    "Hard first pass": "pp-focus-hard-first-pass",
    "Win every race to the puck": "pp-focus-win-every-race-to-the-puck",
    "Full reps, no glide": "pp-focus-full-reps-no-glide",
  },

  practiceOpenerSlugs: {
    "dialed-in": "pp-opener-dialed-in",
    "not-feeling-it": "pp-opener-get-to",
  },
};

// ---------------------------------------------------------------------------
// Basketball config stub (FV-30 / FV-31)
// TODO: fill when basketball content sprint lands. Do NOT use these values
// in any production path until the content is authored and audio is generated.
// ---------------------------------------------------------------------------

export const BASKETBALL_CONFIG: SportConfig = {
  displayName: "Basketball",

  // TODO FV-30: declare roles when basketball position content is ready.
  // Basketball likely has roles (Guard / Forward / Center) but this is TBD.
  // Leaving undefined so the no-ask path is exercised until confirmed.

  adversities: [
    // TODO FV-30: basketball-specific adversity list
  ],

  adversitySlugFragments: {
    // TODO FV-30: basketball adversity slug fragments
  },

  cellSlugFor(_adversity: string, _role?: string | null): string {
    // TODO FV-30: basketball cell slug composition
    return "session-basketball-placeholder";
  },

  practiceFocusOptions: [
    // TODO FV-30: basketball practice focus options
  ] as const,

  practiceFocusSlugs: {
    // TODO FV-30: basketball practice focus slug map
  },

  practiceOpenerSlugs: {
    // TODO FV-30: basketball practice opener slugs
    "dialed-in": "pp-basketball-opener-dialed-in",
    "not-feeling-it": "pp-basketball-opener-not-feeling-it",
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
