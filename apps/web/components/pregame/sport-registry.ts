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

import {
  AUDIO_SCRIPT,
  SCRIPTURE_REF,
  SCRIPTURE_TEXT,
} from "./types";
import type { AudioSegment, NeedToday } from "./types";

// ---------------------------------------------------------------------------
// Sport type
// ---------------------------------------------------------------------------

export type Sport = "hockey" | "basketball" | "baseball" | "golf" | "football" | "swimming" | "track-field" | "lacrosse"; // extend as more sports land

/**
 * A Hard Moment option: the canonical `key` (drives `cellSlugFor` + the stored
 * `state.adversity`) and the `label` shown to the athlete. For most roles
 * key === label; a per-role override (see `SportConfig.roleAdversities`) lets a
 * position show truer language — e.g. a goalie sees "I get pulled" while the key
 * stays "I get benched", so the same audio cell resolves.
 */
export type AdversityOption = { key: string; label: string };

/**
 * Copy shown on the positive-plays picker (FV-294). A sport may override the
 * team-sport default to speak its own register — golf rehearses "shots," not
 * team "plays." `{MAX}` in `sub`/`empty` is replaced with MAX_POSITIVE_PLAYS by
 * the picker screen. See `SportConfig.positivePlaysCopy` +
 * `DEFAULT_POSITIVE_PLAYS_COPY`. Generalizes to swimming/tennis when they ship
 * plays. Mirrors the `cueWordHelper` / `cardShareHint` per-sport-copy pattern.
 */
export type PositivePlaysCopy = {
  /** Section label, e.g. "Step 04 · Positive Plays". */
  label: string;
  /** Heading, e.g. "Picture the plays you'll make.". */
  heading: string;
  /** Subhead; `{MAX}` → MAX_POSITIVE_PLAYS at render. */
  sub: string;
  /** Empty-state nudge; `{MAX}` → MAX_POSITIVE_PLAYS at render. */
  empty: string;
};

/**
 * The team-sport default picker copy (hockey/basketball/baseball). Used when a
 * SportConfig declares no `positivePlaysCopy`. Verbatim from the pre-FV-294
 * hardcoded screens-a strings, so team sports are byte-identical.
 */
export const DEFAULT_POSITIVE_PLAYS_COPY: PositivePlaysCopy = {
  label: "Step 04 · Positive Plays",
  heading: "Picture the plays you’ll make.",
  sub: "Pick up to {MAX} you want to see yourself nail today. We’ll rehearse each one in the guided session.",
  empty: "Choose 1 to {MAX} plays to rehearse before we step on.",
};

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

  // ── Text-mode audio script (FV-175) ──────────────────────────────────────
  /**
   * Script segments used by the text-mode fallback timer in AudioSessionScreen.
   * Hockey keeps AUDIO_SCRIPT verbatim; basketball gets sport-correct segments
   * (same startSec/structure, sport-specific body for segments 80/120/165).
   * Tokens ({{role}}, {{roleScenes}}, {{adversity}}, {{anchor}}, {{selfTalk}},
   * {{cueWord}}) are substituted at render time by substituteSegment(); the
   * renderer is unchanged — only the source array moves into the config.
   */
  audioScript: AudioSegment[];

  /**
   * Hint shown below the cue-word picker describing when the athlete uses it.
   * Hockey: "The one you'd say to yourself between shifts."
   * Basketball: "The one you'd say to yourself at the line."
   */
  cueWordHelper: string;

  /**
   * Secondary hint shown below the Pre-Game Card header nudging the athlete
   * to screenshot and open it before competition starts.
   * Hockey: "Screenshot it. Open it before puck drop."
   * Basketball: "Screenshot it. Open it before tip-off."
   */
  cardShareHint: string;

  /**
   * OPTIONAL per-sport copy for the positive-plays picker (FV-294). Lets an
   * individual sport speak its own register — golf rehearses "shots," not team
   * "plays." Absent → DEFAULT_POSITIVE_PLAYS_COPY (the team-sport strings), so
   * hockey/basketball/baseball are byte-identical. Generalizes to swimming/tennis
   * when they ship plays. Mirrors cueWordHelper / cardShareHint.
   */
  positivePlaysCopy?: PositivePlaysCopy;
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
      { key: "I get beaten wide.", label: "I let in a soft one." },
      { key: "I miss a scoring chance.", label: "I give up a bad rebound." },
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
  // FV-124: added "Be more Vocal" (opt-in Today's Focus need with dedicated opener).
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
    "Be more Vocal",
  ] as const satisfies readonly NeedToday[],

  // Order preserved verbatim from the original RESET_ANCHORS (hockey is the live
  // beta sport — the registry refactor must not reorder its chips). FV-117.
  anchors: [
    "Tap stick twice",
    "Touch glove",
    "Press thumb to palm",
    "Long exhale",
    "Look at tape",
    "Take a drink",
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

  // FV-175: hockey keeps the existing AUDIO_SCRIPT verbatim — zero behavior change.
  audioScript: AUDIO_SCRIPT,

  // FV-175: sport-specific copy for the cue-word picker and the pregame card.
  cueWordHelper: "The one you’d say to yourself between shifts.",
  cardShareHint: "Screenshot it. Open it before puck drop.",
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

// FV-175: basketball text-mode audio script.
// Segments 0/35/210/250/275 are sport-neutral — byte-identical to the hockey
// AUDIO_SCRIPT (same eyebrow, body, startSec). Segments 80/120/165 are
// basketball-specific (gym/possession/role scenes). The {{roleScenes}} token
// in segment 165 is substituted at render time via substituteSegment(), which
// reads sportConfig.roleContent — Guard/Wing/Big strings come from the registry,
// not duplicated here. This is the same mechanism hockey uses for Forward/Defense/Goalie.
const BASKETBALL_AUDIO_SCRIPT: AudioSegment[] = [
  {
    startSec: 0,
    eyebrow: "Identity",
    body: `${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.`,
  },
  {
    startSec: 35,
    eyebrow: "Settle",
    body: "Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.",
  },
  {
    startSec: 80,
    eyebrow: "See the gym",
    body: "See the floor. Hear the squeak, the bounce, the rim. Feel the ball in your hands, your shoes on the hardwood. You belong here. You are ready.",
  },
  {
    startSec: 120,
    eyebrow: "Your first possession",
    body: "You check in at the scorer's table. Sprint the lane. Eyes up. Find the open man. Simple, strong play. Recover. Next action.",
  },
  {
    startSec: 165,
    eyebrow: "Play your role · {{role}}",
    body: "{{roleScenes}}",
  },
  {
    startSec: 210,
    eyebrow: "If this happens",
    body: "{{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.",
  },
  {
    startSec: 250,
    eyebrow: "Coach yourself",
    body: "{{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.",
  },
  {
    startSec: 275,
    eyebrow: "Send-off",
    body: "Lord, help me compete with courage, humility, and joy. Help me serve my team, respond well to mistakes, and remember that my worth is secure in You. Amen. Play from victory.",
  },
];

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

  // FV-119 GATE (interim): the two most intense Big distress cells —
  // hm-bb-big-fouled-out (reached via "I get benched") and
  // hm-bb-big-fall-behind-early — are withheld from the Big athlete's
  // selectable adversities until clinical sign-off (FV-119). Guard/Wing keep
  // all 10 (their benched / fall-behind cells were not flagged as intense).
  // To re-enable after a clinician clears them, delete this Big override
  // (Big then falls back to the shared 10-adversity list above).
  roleAdversities: {
    Big: [
      { key: "I turn the ball over.", label: "I turn the ball over." },
      { key: "I miss an open shot.", label: "I miss an open shot." },
      { key: "I get cooked off the dribble.", label: "I get cooked off the dribble." },
      { key: "I get into foul trouble.", label: "I get into foul trouble." },
      { key: "Coach yells.", label: "Coach yells." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I miss two free throws.", label: "I miss two free throws." },
      { key: "I start slow.", label: "I start slow." },
    ],
  },

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
  // FV-124: added "Be more Vocal" (opt-in Today's Focus need with dedicated opener).
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
    "Be more Vocal",
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

  // FV-175: basketball text-mode audio script (sport-correct body for segs 80/120/165).
  audioScript: BASKETBALL_AUDIO_SCRIPT,

  // FV-175: sport-specific copy for the cue-word picker and the pregame card.
  cueWordHelper: "The one you'd say to yourself at the line.",
  cardShareHint: "Screenshot it. Open it before tip-off.",
};

// ---------------------------------------------------------------------------
// Baseball config (FV-94 — v2 sport; taxonomy = docs/baseball-taxonomy-FV-93.md)
// ---------------------------------------------------------------------------

const BASEBALL_ADVERSITY_SLUG_FRAGMENTS: Record<string, string> = {
  "I strike out.": "strikeout",
  "I'm in a slump.": "slump",
  "I make an error.": "error",
  "I give up the big hit.": "big-hit",
  "I lose my command.": "lose-command",
  "I get benched.": "benched",
  "I feel nervous.": "nervous",
  "I get hit by a pitch.": "hbp",
  "I start slow.": "start-slow",
  "We fall behind early.": "fall-behind-early",
};

export const BASEBALL_CONFIG: SportConfig = {
  displayName: "Baseball",
  sportKey: "baseball",

  roles: ["Pitcher", "Catcher", "Infield", "Outfield"] as const,
  roleLabel: "Position",

  roleContent: {
    Pitcher: {
      title: "Own the mound.",
      scenes: [
        "Win the first pitch.",
        "Trust your catcher.",
        "One pitch at a time.",
        "Attack the zone.",
        "Next pitch, next out.",
      ],
    },
    Catcher: {
      title: "Run the game back there.",
      scenes: [
        "Frame the borderline.",
        "Block everything.",
        "Call it with conviction.",
        "Control the run game.",
        "Lead the staff.",
      ],
    },
    Infield: {
      title: "Quiet hands, sure feet.",
      scenes: [
        "Get a good hop.",
        "Field it clean.",
        "Make the routine play.",
        "Turn two.",
        "Throw with intent.",
      ],
    },
    Outfield: {
      title: "Track it, run it down.",
      scenes: [
        "Read it off the bat.",
        "Take the right route.",
        "Catch it at full speed.",
        "Hit the cutoff.",
        "Stay loud, stay ready.",
      ],
    },
  },

  adversities: [
    "I strike out.",
    "I'm in a slump.",
    "I make an error.",
    "I give up the big hit.",
    "I lose my command.",
    "I get benched.",
    "I feel nervous.",
    "I get hit by a pitch.",
    "I start slow.",
    "We fall behind early.",
  ],

  // FV-93 §5/§6 per-position overrides + the clinical withholds.
  //  - Pitcher ships 9: drops "I make an error." (the thinnest cell, goalie-bad-
  //    penalty precedent), and relabels to pitcher-true language (pulled / lose
  //    the zone / hit a batter). Special-case slugs handled in cellSlugFor.
  //  - Catcher + Infield: "I lose my command." (the throwing YIPS) is authored
  //    (hm-bsb-{catcher,infield}-lose-command exist) but WITHHELD from the picker
  //    until clinical sign-off (FV-119 pattern). To re-enable, add it back here.
  //    Catcher also relabels "I get hit by a pitch." → "I take a foul tip.".
  //  - Outfield keeps the full flat 10 (its "I lose my command." is a bad throw,
  //    not the clinical yips) — no override entry needed.
  roleAdversities: {
    Pitcher: [
      { key: "I strike out.", label: "I strike out." },
      { key: "I'm in a slump.", label: "I'm in a slump." },
      { key: "I give up the big hit.", label: "I give up the big hit." },
      { key: "I lose my command.", label: "I lose the zone." },
      { key: "I get benched.", label: "I get pulled." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I get hit by a pitch.", label: "I hit a batter." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
    ],
    Catcher: [
      { key: "I strike out.", label: "I strike out." },
      { key: "I'm in a slump.", label: "I'm in a slump." },
      { key: "I make an error.", label: "I make an error." },
      { key: "I give up the big hit.", label: "I give up the big hit." },
      { key: "I get benched.", label: "I get benched." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I get hit by a pitch.", label: "I take a foul tip." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
    ],
    Infield: [
      { key: "I strike out.", label: "I strike out." },
      { key: "I'm in a slump.", label: "I'm in a slump." },
      { key: "I make an error.", label: "I make an error." },
      { key: "I give up the big hit.", label: "I give up the big hit." },
      { key: "I get benched.", label: "I get benched." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I get hit by a pitch.", label: "I get hit by a pitch." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
    ],
  },

  adversitySlugFragments: BASEBALL_ADVERSITY_SLUG_FRAGMENTS,

  cellSlugFor(adversity: string, role?: string | null): string {
    const frag =
      BASEBALL_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "strikeout";
    // Pitcher × benched → pulled (a pitcher is pulled, not benched).
    if (role === "Pitcher" && frag === "benched") return "bsb-pitcher-pulled";
    // Pitcher × hbp → hit-batter (a pitcher throws it, he doesn't wear it).
    if (role === "Pitcher" && frag === "hbp") return "bsb-pitcher-hit-batter";
    // Pitcher × error → strikeout: Pitcher ships 9 — the thin fielding-error cell
    // is dropped (FV-93). "I make an error." is omitted from the Pitcher picker
    // (roleAdversities), so this never fires at runtime; the redirect keeps the
    // exhaustive (roles × adversities) integrity matrix resolving to a real clip
    // (Pitcher stays at 9 distinct cells; the goalie-bad-penalty parallel).
    if (role === "Pitcher" && frag === "error") return "bsb-pitcher-strikeout";
    // Catcher × hbp → foul-tip (a catcher wears foul tips / gets crossed up).
    if (role === "Catcher" && frag === "hbp") return "bsb-catcher-foul-tip";
    const roleStr = role ? role.toLowerCase() : "pitcher";
    // Returns the bsb-* cell key (NOT hm-bsb-*), mirroring basketball's bb-*.
    // FV-95 renders BOTH hm-bsb-{pos}-{frag} (the hard-moment clip referenced by
    // the manifest templates) AND bsb-{pos}-{frag} (the full composite =
    // OPENING + {POSITION}_VIZ + hm-bsb-* + CLOSING) that this slug targets.
    return `bsb-${roleStr}-${frag}`;
  },

  // Pre-practice focus presets (FV-94). Audio render + the rest of the
  // pre-practice "Lock In" session (opener + Beats 2-6 tail + manifest
  // practiceState.baseball) land with the audio render (FV-95) / pre-practice
  // follow-up; these slugs are declared now so the registry is complete.
  practiceFocusOptions: [
    "Relentless",
    "Hungry",
    "Stay in the box",
    "Read the pitch",
    "Soft hands",
    "Quick feet",
    "One pitch at a time",
  ] as const,

  practiceFocusSlugs: {
    "Relentless": "pp-baseball-focus-relentless",
    "Hungry": "pp-baseball-focus-hungry",
    "Stay in the box": "pp-baseball-focus-stay-in-the-box",
    "Read the pitch": "pp-baseball-focus-read-the-pitch",
    "Soft hands": "pp-baseball-focus-soft-hands",
    "Quick feet": "pp-baseball-focus-quick-feet",
    "One pitch at a time": "pp-baseball-focus-one-pitch-at-a-time",
  },

  // FV-117 per-sport picker lists. "Better puck decisions" → "Better decisions
  // at the plate"; all other 8 needs are sport-neutral and shared. The baseball
  // need-openers REUSE the shared opener clips (resolveOpenerSlug falls back to
  // NEED_OPENER_SLUGS for non-basketball sports — no baseball opener clips).
  needs: [
    "Confidence",
    "Calm",
    "Compete level",
    "Reset after mistakes",
    "Physical courage",
    "Better decisions at the plate",
    "Leadership",
    "Joy",
    "Hope",
    "Be more Vocal",
  ] as const satisfies readonly NeedToday[],

  // "Long exhale", "Press thumb to palm", "Say cue word" are shared; "Tap bat
  // twice" and "Look at the pitcher" are baseball-specific (clips + slugs land
  // with the audio render — they drop cleanly until then).
  anchors: [
    "Long exhale",
    "Press thumb to palm",
    "Tap bat twice",
    "Look at the pitcher",
    "Say cue word",
  ] as const,

  // "You're okay. Next shift." → "You're okay. Next at-bat." for baseball; the
  // other 6 phrases are sport-neutral and shared.
  selfTalkOptions: [
    "You're okay. Next at-bat.",
    "Breathe. Do your job.",
    "Stay steady. Make the next play.",
    "You don't need to do too much.",
    "Compete, recover, go again.",
    "Your identity is secure. Play free.",
    "You are secure. Take the next faithful action.",
  ] as const,

  practiceOpenerSlugs: {
    // pp-opener-dialed-in is sport-neutral and reused across all sports.
    "dialed-in": "pp-opener-dialed-in",
    // Baseball-specific not-feeling-it opener (authored with the pre-practice
    // follow-up; declared here for registry completeness).
    "not-feeling-it": "pp-baseball-opener-get-to",
  },

  // Baseball audio clips are v2 (not yet generated). Use the shared AUDIO_SCRIPT
  // structure as a placeholder so the type is satisfied; a dedicated baseball
  // audio pass will replace this before the sport goes live.
  audioScript: AUDIO_SCRIPT,

  cueWordHelper: "The one you'd step up to the plate with.",
  cardShareHint: "Screenshot it. Open it before first pitch.",
};

// ---------------------------------------------------------------------------
// Golf config (FV-265 — v2 sport; taxonomy = docs/golf-module-map.md)
// ---------------------------------------------------------------------------

const GOLF_ADVERSITY_SLUG_FRAGMENTS: Record<string, string> = {
  "I three-putt.": "three-putt",
  "I have a blow-up hole.": "blow-up",
  "I hit it OB.": "ob",
  "I duff a short-game shot.": "duff-chip",
  "I miss a short putt.": "short-putt",
  "My swing leaves me on the first tee.": "first-tee",
  "I get outplayed in my group.": "outplayed",
  "I feel nervous.": "nervous",
  "I start slow.": "start-slow",
  "I fall behind the number.": "fall-behind",
};

// FV-265: golf text-mode audio script (sport-correct body for segs 80/120/165).
// Segments 0/35/210/250/275 are sport-neutral — byte-identical structure to the
// hockey AUDIO_SCRIPT (same eyebrow, body, startSec). Segments 80/120/165 are
// golf-specific (course/first-tee/profile scenes). {{roleScenes}} in segment 165
// is substituted at render time via substituteSegment() reading
// sportConfig.roleContent — Bomber/Ball-Striker/Scrambler strings come from the
// registry, not duplicated here.
const GOLF_AUDIO_SCRIPT: AudioSegment[] = [
  {
    startSec: 0,
    eyebrow: "Identity",
    body: `${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.`,
  },
  {
    startSec: 35,
    eyebrow: "Settle",
    body: "Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.",
  },
  {
    startSec: 80,
    eyebrow: "See the course",
    body: "See the first tee. Hear the quiet of the morning, the strike of a ball on the range. Feel the grip in your hands, your spikes settling into the turf. You belong here. You are ready.",
  },
  {
    startSec: 120,
    eyebrow: "Your first tee shot",
    body: "You step onto the first tee. Slow breath. Pick your target, commit to the number, and make one free, committed swing. The ball finds the short grass. You walk after it, in control. Next shot.",
  },
  {
    startSec: 165,
    eyebrow: "Play your game · {{role}}",
    body: "{{roleScenes}}",
  },
  {
    startSec: 210,
    eyebrow: "If this happens",
    body: "{{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.",
  },
  {
    startSec: 250,
    eyebrow: "Coach yourself",
    body: "{{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.",
  },
  {
    startSec: 275,
    eyebrow: "Send-off",
    body: "Lord, help me compete with courage, humility, and joy. Help me play the shot in front of me, respond well to a bad one, and remember that my worth is secure in You. Amen. Play from victory.",
  },
];

export const GOLF_CONFIG: SportConfig = {
  displayName: "Golf",
  sportKey: "golf",

  // Golf is non-positional — the role dimension maps to PLAYER PROFILE
  // (FV-264). Slug tokens: bomber / ballstriker / scrambler.
  roles: ["Bomber", "Ball-Striker", "Scrambler"] as const,
  roleLabel: "Player type",

  roleContent: {
    Bomber: {
      title: "Step up and trust it.",
      scenes: [
        "Pick your line.",
        "Commit to the number.",
        "Free, full release.",
        "Take your medicine when you miss.",
        "Next tee, next swing.",
      ],
    },
    "Ball-Striker": {
      title: "Flush it, hole to hole.",
      scenes: [
        "Pick a small target.",
        "One smooth swing.",
        "Hit your number.",
        "Stripe it, walk, repeat.",
        "Loose swing, let it go.",
      ],
    },
    Scrambler: {
      title: "Always a way to par.",
      scenes: [
        "See the shot, feel the shot.",
        "Soft hands, good speed.",
        "Get it up and down.",
        "Roll the next one pure.",
        "Grind out the number.",
      ],
    },
  },

  adversities: [
    "I three-putt.",
    "I have a blow-up hole.",
    "I hit it OB.",
    "I duff a short-game shot.",
    "I miss a short putt.",
    "My swing leaves me on the first tee.",
    "I get outplayed in my group.",
    "I feel nervous.",
    "I start slow.",
    "I fall behind the number.",
  ],

  // FV-264 §5/§6 per-profile overrides + the clinical withhold.
  //  - All three profiles WITHHOLD "My swing leaves me on the first tee." (the
  //    shank / putting-yips / feel-deserting umbrella). The clip is authored
  //    (hm-glf-{profile}-first-tee) but omitted from the picker here until
  //    clinical-advisor sign-off (FV-119 / baseball-yips precedent). To
  //    re-enable, add it back to each profile's array. This yields 27 selectable
  //    cells of 30 authored.
  //  - Profile-true relabels (label-only; the `key` is unchanged so cellSlugFor +
  //    state.adversity still resolve the same glf-* cell — the FV-101 mechanism):
  //    Bomber: OB → "I hit the big miss", outplayed → "Someone outdrives me".
  //    Ball-Striker: three-putt → "I three-putt a green I striped",
  //      outplayed → "A scrambler beats me".
  //    Scrambler: duff → "I miss the up-and-down", outplayed → "I get out-struck all day".
  roleAdversities: {
    Bomber: [
      { key: "I three-putt.", label: "I three-putt." },
      { key: "I have a blow-up hole.", label: "I have a blow-up hole." },
      { key: "I hit it OB.", label: "I hit the big miss." },
      { key: "I duff a short-game shot.", label: "I duff a short-game shot." },
      { key: "I miss a short putt.", label: "I miss a short putt." },
      { key: "I get outplayed in my group.", label: "Someone outdrives me." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "I fall behind the number.", label: "I fall behind the number." },
    ],
    "Ball-Striker": [
      { key: "I three-putt.", label: "I three-putt a green I striped." },
      { key: "I have a blow-up hole.", label: "I have a blow-up hole." },
      { key: "I hit it OB.", label: "I hit it OB." },
      { key: "I duff a short-game shot.", label: "I duff a short-game shot." },
      { key: "I miss a short putt.", label: "I miss a short putt." },
      { key: "I get outplayed in my group.", label: "A scrambler beats me." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "I fall behind the number.", label: "I fall behind the number." },
    ],
    Scrambler: [
      { key: "I three-putt.", label: "I three-putt." },
      { key: "I have a blow-up hole.", label: "I have a blow-up hole." },
      { key: "I hit it OB.", label: "I hit it OB." },
      { key: "I duff a short-game shot.", label: "I miss the up-and-down." },
      { key: "I miss a short putt.", label: "I miss a short putt." },
      { key: "I get outplayed in my group.", label: "I get out-struck all day." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "I fall behind the number.", label: "I fall behind the number." },
    ],
  },

  adversitySlugFragments: GOLF_ADVERSITY_SLUG_FRAGMENTS,

  cellSlugFor(adversity: string, role?: string | null): string {
    const frag = GOLF_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "three-putt";
    // No canonical-key reroutes — every profile plays every hole, so unlike a
    // pitcher (no fielding error) or a Big (fouls out vs benched) there is no
    // cell that doesn't exist for a profile. "Ball-Striker" → "ballstriker"
    // (hyphen stripped) so the slug token matches the authored hm-glf-* clips.
    const roleStr = role ? role.toLowerCase().replace(/-/g, "") : "bomber";
    // Golf is COMPOSITIONAL-ONLY — there is no baked glf-* composite session
    // clip (unlike basketball's bb-*). The "cell" IS the hard-moment clip, so
    // cellSlugFor returns hm-glf-* directly — exactly what the manifest
    // templates and the FV-271 integrity grid reference (FV-266). The legacy
    // two-<audio> fallback is dead for golf anyway (no baked top-level MP3s;
    // golf clips live content-addressed under /clips/), so resolution only ever
    // goes through the compositional manifest path.
    return `hm-glf-${roleStr}-${frag}`;
  },

  // Pre-practice focus presets (FV-264 Appendix). Audio render + the rest of the
  // pre-practice "Lock In" session (opener + Beats 2-6 tail + manifest
  // practiceState.golf) land with FV-267 / FV-266; these slugs are declared now
  // so the registry is complete.
  practiceFocusOptions: [
    "Committed to every shot",
    "One shot at a time",
    "Pick a small target",
    "Full routine, every ball",
    "Take my medicine",
    "Speed on every putt",
    "Reset between shots",
  ] as const,

  practiceFocusSlugs: {
    "Committed to every shot": "pp-golf-focus-committed-to-every-shot",
    "One shot at a time": "pp-golf-focus-one-shot-at-a-time",
    "Pick a small target": "pp-golf-focus-pick-a-small-target",
    "Full routine, every ball": "pp-golf-focus-full-routine-every-ball",
    "Take my medicine": "pp-golf-focus-take-my-medicine",
    "Speed on every putt": "pp-golf-focus-speed-on-every-putt",
    "Reset between shots": "pp-golf-focus-reset-between-shots",
  },

  // FV-294: golf is an individual sport — drop the team-sport needs
  // ("Leadership", "Physical courage", "Be more Vocal") and add "Trust my swing"
  // (the golf-true courage: commitment, not contact). 8 needs. "Better puck
  // decisions" → "Better course management". Golf need-openers use the
  // sport-neutral opener-shared-* clips (FV-466; resolveOpenerSlug falls back
  // to NEED_OPENER_SLUGS); "Trust my swing" → opener-shared-decisions (same
  // Proverbs 3:5-6 family — see NEED_OPENER_SLUGS / NEED_VERSE).
  needs: [
    "Confidence",
    "Calm",
    "Compete level",
    "Reset after mistakes",
    "Trust my swing",
    "Better course management",
    "Joy",
    "Hope",
  ] as const satisfies readonly NeedToday[],

  // "Long exhale", "Press thumb to palm", "Say cue word" are shared; "Re-grip the
  // club", "Glove tap", "Step back, then step in" are golf-specific (clips +
  // slugs land with the audio render — they drop cleanly until then, the
  // baseball-anchor precedent).
  anchors: [
    "Long exhale",
    "Press thumb to palm",
    "Re-grip the club",
    "Glove tap",
    "Step back, then step in",
    "Say cue word",
  ] as const,

  // "You're okay. Next shift." → "You're okay. Next shot." for golf;
  // "Stay steady. Make the next play." → "Stay steady. Play the next shot." for golf
  // (FV-294: "next play" is team-sport language, wrong for an individual sport);
  // the other 5 phrases are sport-neutral and shared.
  selfTalkOptions: [
    "You're okay. Next shot.",
    "Breathe. Do your job.",
    "Stay steady. Play the next shot.",
    "You don't need to do too much.",
    "Compete, recover, go again.",
    "Your identity is secure. Play free.",
    "You are secure. Take the next faithful action.",
  ] as const,

  practiceOpenerSlugs: {
    // pp-opener-dialed-in is sport-neutral and reused across all sports.
    "dialed-in": "pp-opener-dialed-in",
    // Golf-specific not-feeling-it opener (authored with FV-267; declared here
    // for registry completeness).
    "not-feeling-it": "pp-golf-opener-get-to",
  },

  // FV-265: golf text-mode audio script (sport-correct body for segs 80/120/165).
  audioScript: GOLF_AUDIO_SCRIPT,

  cueWordHelper: "The one you'd say to yourself on the walk to the next shot.",
  cardShareHint: "Screenshot it. Open it before your tee time.",

  // FV-294: golf rehearses "shots," not team "plays." Dormant until the golf
  // positive plays land (the picker step is skipped while golf ships no plays);
  // wired now so it activates with the right register the moment they do.
  positivePlaysCopy: {
    label: "Step 04 · Shots",
    heading: "Picture the shots you’ll hit.",
    sub: "Pick up to {MAX} you want to see yourself pure today. We’ll rehearse each one in the guided session.",
    empty: "Choose 1 to {MAX} shots to rehearse before your tee time.",
  },
};

// ---------------------------------------------------------------------------
// Football config (FV-206 — go-live wiring per the 2026-07-19 KC launch
// directive; taxonomy = docs/football-module-map.md, football-expert
// ratified. 123 pregame clips (67 hard-moment + 7 flagship viz + 49
// positive-play viz) rendered + in the manifest catalog (FV-203/FV-423); the
// DB sport CHECK + SUPPORTED_SPORTS gates are owned separately (lead's
// FV-205). Most position-diverse sport in the app: 7 roles.
//
// Role tokens are the SHORT depth-chart abbreviations ("QB","RB","WR","OL",
// "DL","LB","DB") — NOT the long position-group names the FV-203 dormant
// scaffold originally used. This is a deliberate fix, not a style choice:
// POSITIVE_PLAYS' `role` field (positive-plays.ts, FV-423, 49 entries) and
// every rendered clip slug (viz-ftb-{token}, hm-ftb-{token}-{frag}) are keyed
// on the short tokens, so `state.role` (drawn from `SportConfig.roles`) MUST
// match them exactly or the positive-play picker silently shows zero plays.
// Athletes already read QB/RB/WR/OL/DL/LB/DB as real depth-chart shorthand,
// so the short token doubles as the correct display value too.
// ---------------------------------------------------------------------------

const FOOTBALL_ADVERSITY_SLUG_FRAGMENTS: Record<string, string> = {
  "I turn the ball over.": "turnover",
  "I get beat.": "beat",
  "I make a mistake on film.": "film-mistake",
  "I give up the big play.": "big-play",
  "I get benched.": "benched",
  "I feel nervous.": "nervous",
  "I take a big hit.": "big-hit",
  "I start slow.": "start-slow",
  "We fall behind early.": "fall-behind-early",
  "I lose a battle in the trenches.": "trench-battle",
};

// Per-role canonical-key reroutes (football-module-map.md §5 — the
// baseball-pitcher-error / OL-DL-turnover precedent: a cell that doesn't
// exist for a role maps to that role's nearest authored cell, so cellSlugFor
// never produces an orphan slug and the (roles × adversities) integrity grid
// dedups cleanly to 67 distinct cells).
//
// QB's turnover→pick and benched→pulled reroute at the SLUG level, not just
// the label level — this departs from §5's minimal pseudocode table (which
// only lists the trench-battle reroute and calls turnover/benched "label-only
// relabels"), because the ACTUALLY RENDERED clip catalog (FV-203) has no
// hm-ftb-qb-turnover or hm-ftb-qb-benched clip — only hm-ftb-qb-pick and
// hm-ftb-qb-pulled exist. The rendered audio is ground truth here (the
// baseball pitcher-pulled/hit-batter precedent: a relabel that is ALSO a slug
// rename). QB's dropped trench-battle cell folds into the same qb-pick clip.
const FOOTBALL_KEY_REROUTES: Record<string, Record<string, string>> = {
  QB: { turnover: "pick", benched: "pulled", "trench-battle": "pick" },
  RB: { turnover: "fumble" },
  OL: { turnover: "trench-battle" },
  DL: { turnover: "trench-battle" },
};

// Football text-mode audio script (sport-correct body for segs 80/120/165).
// Segments 0/35/210/250/275 are sport-neutral (byte-identical structure to the
// hockey/golf AUDIO_SCRIPT). 80/120/165 are football-specific and role-neutral
// (work for offense + defense). {{roleScenes}} in segment 165 is substituted at
// render time from sportConfig.roleContent.
const FOOTBALL_AUDIO_SCRIPT: AudioSegment[] = [
  {
    startSec: 0,
    eyebrow: "Identity",
    body: `${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.`,
  },
  {
    startSec: 35,
    eyebrow: "Settle",
    body: "Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.",
  },
  {
    startSec: 80,
    eyebrow: "See the field",
    body: "See the field under the lights. Hear the crowd, the chatter in the huddle, cleats biting the turf. Feel your helmet, the pads settling on your shoulders. You belong here. You are ready.",
  },
  {
    startSec: 120,
    eyebrow: "Your first snap",
    body: "The ball is about to snap. First play. Eyes up, read your keys, do your job full speed, finish to the whistle. Recover. Next play.",
  },
  {
    startSec: 165,
    eyebrow: "Play your position · {{role}}",
    body: "{{roleScenes}}",
  },
  {
    startSec: 210,
    eyebrow: "If this happens",
    body: "{{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.",
  },
  {
    startSec: 250,
    eyebrow: "Coach yourself",
    body: "{{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.",
  },
  {
    startSec: 275,
    eyebrow: "Send-off",
    body: "Lord, help me compete with courage, humility, and joy. Help me play the snap in front of me, respond well to a bad one, and remember that my worth is secure in You. Amen. Play from victory.",
  },
];

export const FOOTBALL_CONFIG: SportConfig = {
  displayName: "Football",
  sportKey: "football",

  // 7 position groups (football-module-map.md §1) — the tightest authentic
  // set; football is the most positional sport in the catalog. WR/TE fold to
  // WR; DL/EDGE fold to DL; CB/S fold to DB. Specialist (K/P) is a documented
  // FUTURE role, held to bound the cell count. Tokens double as slug tokens
  // (qb/rb/wr/ol/dl/lb/db) and the display label — see the file-header note
  // on why these are short, not the long position-group names.
  roles: ["QB", "RB", "WR", "OL", "DL", "LB", "DB"] as const,
  roleLabel: "Position",

  // §2 ROLE_CONTENT — the athlete's first-rep rehearsal (identity title + 5
  // present-tense VIZ scenes). The reset cues are pre-loaded on purpose: each
  // role's collapse reflex is named so the rehearsal builds the antidote in —
  // QB "throw it away, live to the next down" (anti-hero-throw), WR "drop or
  // not, run the next one clean" (anti-drop-spiral), OL "lose one, win the
  // next rep" (anti-anonymous-until-blamed), DL "stay in my gap"
  // (anti-freelance), LB "missed it — back to my keys" (anti-guess), DB "beat
  // or burn, flush it" (the corner's amnesia, anti-gamble), RB "two hands,
  // ball secure" (pre-loads ball security ahead of the fumble cell).
  roleContent: {
    QB: {
      title: "Run the offense.",
      scenes: [
        "Read it pre-snap.",
        "Trust the progression.",
        "Deliver on time.",
        "Throw it away, live to the next down.",
        "Next play, next drive.",
      ],
    },
    RB: {
      title: "Hit it downhill.",
      scenes: [
        "See the hole.",
        "Press the line, then cut.",
        "Two hands, ball secure.",
        "Finish forward, every carry.",
        "Pick up the blitz.",
      ],
    },
    WR: {
      title: "Win my route.",
      scenes: [
        "Beat the press.",
        "Run it full speed.",
        "Snap the break.",
        "Late hands, look it in.",
        "Drop or not, run the next one clean.",
      ],
    },
    OL: {
      title: "Protect and finish.",
      scenes: [
        "Set the edge.",
        "Hands inside, anchor.",
        "Drive my feet.",
        "Pass it off clean.",
        "Lose one, win the next rep.",
      ],
    },
    DL: {
      title: "Win the line of scrimmage.",
      scenes: [
        "Get off on the ball.",
        "Win my one-on-one.",
        "Stay in my gap.",
        "Get hands up if I can't get home.",
        "Beat one block, then the next.",
      ],
    },
    LB: {
      title: "Diagnose and finish.",
      scenes: [
        "Read my keys.",
        "Trust my fit.",
        "Trigger downhill.",
        "Wrap up, drive my feet.",
        "Missed it — back to my keys.",
      ],
    },
    DB: {
      title: "Lock my one-on-one.",
      scenes: [
        "Eyes on my key.",
        "Phase, then play the ball.",
        "Trust my technique.",
        "Beat or burn, flush it.",
        "Next snap, short memory.",
      ],
    },
  },

  // §3 — the shared 10-adversity list, first-person football voice.
  adversities: [
    "I turn the ball over.",
    "I get beat.",
    "I make a mistake on film.",
    "I give up the big play.",
    "I get benched.",
    "I feel nervous.",
    "I take a big hit.",
    "I start slow.",
    "We fall behind early.",
    "I lose a battle in the trenches.",
  ],

  // §5 roleAdversities — label-only relabels + drops (key stays canonical so
  // cellSlugFor + state.adversity resolve the same cell — the FV-101
  // mechanism) PLUS the §6.3 clinical gate: "I take a big hit." is withheld
  // from EVERY role's picker here (authored + rendered at
  // hm-ftb-{role}-big-hit — it just isn't offered) until clinical sign-off —
  // the FV-119 / baseball-yips / golf-first-tee pattern, applied universally
  // per the 2026-07-19 KC go-live directive rather than conditionally per
  // role (§6 documents it as a conditional withhold; nothing is cleared yet,
  // so nothing ships selectable at go-live).
  roleAdversities: {
    QB: [
      { key: "I turn the ball over.", label: "I throw a pick." },
      { key: "I get beat.", label: "I get beat." },
      { key: "I make a mistake on film.", label: "I make a mistake on film." },
      { key: "I give up the big play.", label: "I give up the big play." },
      { key: "I get benched.", label: "I get pulled." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
      // trench-battle dropped (§5 — a QB doesn't fight at the point of
      // attack; rerouted to the qb-pick cell in cellSlugFor).
      // big-hit withheld (§6.3 clinical gate — see comment above).
    ],
    RB: [
      { key: "I turn the ball over.", label: "I put the ball on the ground." },
      { key: "I get beat.", label: "I get beat." },
      { key: "I make a mistake on film.", label: "I make a mistake on film." },
      { key: "I give up the big play.", label: "I give up the big play." },
      { key: "I get benched.", label: "I get benched." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
      { key: "I lose a battle in the trenches.", label: "I lose a battle in the trenches." },
      // big-hit withheld (§6.3).
    ],
    WR: [
      { key: "I turn the ball over.", label: "I cough it up after the catch." },
      { key: "I get beat.", label: "A corner shuts me down." },
      { key: "I make a mistake on film.", label: "I make a mistake on film." },
      { key: "I give up the big play.", label: "I give up the big play." },
      { key: "I get benched.", label: "I get benched." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
      { key: "I lose a battle in the trenches.", label: "I lose a battle in the trenches." },
      // big-hit withheld (§6.3).
    ],
    OL: [
      { key: "I get beat.", label: "My guy wins the rep." },
      { key: "I make a mistake on film.", label: "I make a mistake on film." },
      { key: "I give up the big play.", label: "I give up the big play." },
      { key: "I get benched.", label: "I get benched." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
      { key: "I lose a battle in the trenches.", label: "I lose a battle in the trenches." },
      // turnover dropped (§5 — a lineman doesn't carry the ball; rerouted to
      // the trench-battle cell in cellSlugFor). big-hit withheld (§6.3).
    ],
    DL: [
      { key: "I get beat.", label: "I get reached / hooked." },
      { key: "I make a mistake on film.", label: "I make a mistake on film." },
      { key: "I give up the big play.", label: "I give up the big play." },
      { key: "I get benched.", label: "I get benched." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
      { key: "I lose a battle in the trenches.", label: "I lose a battle in the trenches." },
      // turnover dropped (§5, same reroute as OL). big-hit withheld (§6.3).
    ],
    LB: [
      { key: "I turn the ball over.", label: "I turn the ball over." },
      { key: "I get beat.", label: "I get beat." },
      { key: "I make a mistake on film.", label: "I make a mistake on film." },
      { key: "I give up the big play.", label: "I give up the big play." },
      { key: "I get benched.", label: "I get benched." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
      { key: "I lose a battle in the trenches.", label: "I get washed out by a block." },
      // big-hit withheld (§6.3).
    ],
    DB: [
      { key: "I turn the ball over.", label: "I turn the ball over." },
      { key: "I get beat.", label: "I get burned." },
      { key: "I make a mistake on film.", label: "I make a mistake on film." },
      { key: "I give up the big play.", label: "I give up the big play." },
      { key: "I get benched.", label: "I get benched." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
      { key: "I lose a battle in the trenches.", label: "I lose the edge in run support." },
      // big-hit withheld (§6.3).
    ],
  },

  adversitySlugFragments: FOOTBALL_ADVERSITY_SLUG_FRAGMENTS,

  cellSlugFor(adversity: string, role?: string | null): string {
    const frag = FOOTBALL_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "nervous";
    const roleKey = role ?? "QB";
    const rerouted = FOOTBALL_KEY_REROUTES[roleKey]?.[frag] ?? frag;
    // Role tokens are already the slug tokens (QB→qb, RB→rb, …).
    const roleStr = roleKey.toLowerCase();

    // Football is COMPOSITIONAL-ONLY (golf precedent): cellSlugFor returns the
    // hm-ftb-* hard-moment clip directly — the slug the manifest templates +
    // the integrity grid reference. No baked ftb-* composite.
    return `hm-ftb-${roleStr}-${rerouted}`;
  },

  // Pre-practice focus presets (football-module-map.md Appendix; clips render
  // in a parallel stream — FV-206 references the slugs without verifying mp3
  // existence). "Run to the ball", "Win my one-on-one", "Play fast", "Ball
  // security", "Next play" are the football-distinct ones.
  practiceFocusOptions: [
    "Run to the ball",
    "Finish every rep",
    "Eyes up",
    "Win my one-on-one",
    "Play fast",
    "Ball security",
    "Next play",
  ] as const,

  practiceFocusSlugs: {
    "Run to the ball": "pp-football-focus-run-to-the-ball",
    "Finish every rep": "pp-football-focus-finish-every-rep",
    "Eyes up": "pp-football-focus-eyes-up",
    "Win my one-on-one": "pp-football-focus-win-my-one-on-one",
    "Play fast": "pp-football-focus-play-fast",
    "Ball security": "pp-football-focus-ball-security",
    "Next play": "pp-football-focus-next-play",
  },

  // FV-117 per-sport picker lists (Appendix). "Better puck decisions" →
  // "Better reads" (the cross-position football decisions need — QB reads the
  // defense, the back reads his blocks, the DB reads the route); "Physical
  // courage" is a strong native fit in football (unlike golf) and stays; all
  // other 8 needs are shared. Football uses the sport-neutral opener-shared-*
  // clips (FV-466; resolveOpenerSlug falls back to NEED_OPENER_SLUGS).
  needs: [
    "Confidence",
    "Calm",
    "Compete level",
    "Reset after mistakes",
    "Physical courage",
    "Better reads",
    "Leadership",
    "Joy",
    "Hope",
    "Be more Vocal",
  ] as const satisfies readonly NeedToday[],

  // "Long exhale", "Press thumb to palm", "Say cue word" shared; the 3 middle
  // gear/reset gestures are football-specific (Appendix — clips + slugs land
  // with the audio render; they drop cleanly until then, the baseball/golf
  // precedent).
  anchors: [
    "Long exhale",
    "Press thumb to palm",
    "Snap the chinstrap",
    "Tap the helmet",
    "Clap and break the huddle",
    "Say cue word",
  ] as const,

  // "You're okay. Next shift." → "You're okay. Next play." (the universal
  // football reset cadence); the other 6 are sport-neutral and shared.
  selfTalkOptions: [
    "You're okay. Next play.",
    "Breathe. Do your job.",
    "Stay steady. Make the next play.",
    "You don't need to do too much.",
    "Compete, recover, go again.",
    "Your identity is secure. Play free.",
    "You are secure. Take the next faithful action.",
  ] as const,

  practiceOpenerSlugs: {
    // pp-opener-dialed-in is sport-neutral and reused across all sports.
    "dialed-in": "pp-opener-dialed-in",
    // Football-specific not-feeling-it opener (clips render in a parallel
    // stream; declared here for registry completeness).
    "not-feeling-it": "pp-football-opener-get-to",
  },

  audioScript: FOOTBALL_AUDIO_SCRIPT,

  cueWordHelper: "The one you'd say to yourself walking back to the huddle.",
  cardShareHint: "Screenshot it. Open it before kickoff.",
};

// ---------------------------------------------------------------------------
// Swimming config (v2 — DORMANT; taxonomy = docs/swimming-module-map.md,
// swimming-expert ratified. Content authored, NOT athlete-selectable — absent
// from SUPPORTED_SPORTS + the DB sport CHECK, like baseball/football. Swimming
// is non-positional: the "position" dimension maps to EVENT SPECIALTY.
//
// TWO HARD SAFETY RAILS (swimming-expert): (1) breath/reset cues must NEVER
// resemble breath-hold/hypoxic/underwater training — all breath language is
// dry-land calm-down; (2) body-composition/suit/weight is flag-and-route, never
// a cell. Both held in the scripts (clips-swimming.ts) and the daily content.)
// ---------------------------------------------------------------------------

const SWIMMING_ADVERSITY_SLUG_FRAGMENTS: Record<string, string> = {
  "I get touched out.": "touched-out",
  "I false start.": "false-start",
  "I get DQ'd.": "dq",
  "I'm stuck on the same time.": "plateau",
  "I blow a turn.": "bad-turn",
  "My mind wanders mid-race.": "mind-wanders",
  "My goggles fail.": "goggles",
  "I'm seeded in a slow heat.": "slow-heat",
  "I feel nervous in the ready room.": "ready-room",
  "I go out too slow.": "go-out-slow",
};

// Swimming text-mode audio script (sport-correct body for segs 80/120/165).
// Segments 0/35/210/250/275 are sport-neutral. 80/120/165 are swimming-specific.
// SAFETY: every breath cue here is DRY-LAND, behind-the-blocks calm-down
// breathing (the breath rail) — never breath-hold / underwater / hypoxic.
const SWIMMING_AUDIO_SCRIPT: AudioSegment[] = [
  {
    startSec: 0,
    eyebrow: "Identity",
    body: `${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.`,
  },
  {
    startSec: 35,
    eyebrow: "Settle",
    body: "Sit tall on the deck. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.",
  },
  {
    startSec: 80,
    eyebrow: "See the pool",
    body: "See the pool. Hear the natatorium echo, a whistle, water lapping the gutters. Smell the chlorine. Feel your cap and goggles seated, the cool air on your shoulders behind the blocks. You belong here. You are ready.",
  },
  {
    startSec: 120,
    eyebrow: "Your first race",
    body: "They call your heat. Step up behind the blocks. Slow breath on the deck. Take your mark. Explode off the start, find your stroke, hold your form all the way to the wall. One race. Recover. Next race.",
  },
  {
    startSec: 165,
    eyebrow: "Swim your race · {{role}}",
    body: "{{roleScenes}}",
  },
  {
    startSec: 210,
    eyebrow: "If this happens",
    body: "{{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.",
  },
  {
    startSec: 250,
    eyebrow: "Coach yourself",
    body: "{{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.",
  },
  {
    startSec: 275,
    eyebrow: "Send-off",
    body: "Lord, help me compete with courage, humility, and joy. Help me swim the race in front of me, respond well to a bad one, and remember that my worth is secure in You. Amen. Play from victory.",
  },
];

export const SWIMMING_CONFIG: SportConfig = {
  displayName: "Swimming",
  sportKey: "swimming",

  // Non-positional — the role dimension maps to EVENT SPECIALTY (swimming-expert
  // FV-274). Slug tokens: sprint / dist / stroke / im.
  roles: ["Sprinter", "Distance", "Stroke", "IM"] as const,
  roleLabel: "Event",

  roleContent: {
    Sprinter: {
      title: "Explode and hold the touch.",
      scenes: [
        "Quick to the blocks.",
        "Rip the start, clean break.",
        "Hold your stroke, no spin.",
        "Drive through the finish.",
        "Reach for the wall.",
      ],
    },
    Distance: {
      title: "Settle in, hold the pace.",
      scenes: [
        "Find your rhythm early.",
        "Lock the pace, breathe easy.",
        "Stay on the line.",
        "Build through the back half.",
        "Bring it home strong.",
      ],
    },
    Stroke: {
      title: "Trust the stroke you own.",
      scenes: [
        "Feel the water, long and clean.",
        "Hold your tempo.",
        "Legal turn, sharp breakout.",
        "Finish the stroke, full and strong.",
        "Two hands, clean touch.",
      ],
    },
    IM: {
      title: "Master the whole race.",
      scenes: [
        "Fly out controlled.",
        "Smooth into the back.",
        "Own your breast leg.",
        "Bring it home freestyle.",
        "Clean every transition.",
      ],
    },
  },

  adversities: [
    "I get touched out.",
    "I false start.",
    "I get DQ'd.",
    "I'm stuck on the same time.",
    "I blow a turn.",
    "My mind wanders mid-race.",
    "My goggles fail.",
    "I'm seeded in a slow heat.",
    "I feel nervous in the ready room.",
    "I go out too slow.",
  ],

  // Per-specialty relabels + drops/withholds (swimming-expert §4). Every `key`
  // is canonical so cellSlugFor + state.adversity resolve the same cell.
  //  - "I'm stuck on the same time." (the season-long plateau) is WITHHELD from
  //    ALL FOUR specialties until clinical sign-off — swimming's lose-command /
  //    first-tee analog (the cell is authored; omitted here).
  //  - Sprinter drops "My mind wanders mid-race." (no lonely middle in a sub-
  //    minute sprint) → cellSlugFor reroutes to touched-out.
  //  - Distance drops "I get touched out." (the mile isn't decided at the wall by
  //    hundredths) → cellSlugFor reroutes to go-out-slow.
  //  NO team-sport relabels (no bench/shifts/minutes — swim team moments are
  //  relays + champs scoring, surfaced as script texture, never a cell).
  roleAdversities: {
    Sprinter: [
      { key: "I get touched out.", label: "I get touched out." },
      { key: "I false start.", label: "I false start." },
      { key: "I get DQ'd.", label: "I get DQ'd." },
      { key: "I blow a turn.", label: "I blow my turn." },
      { key: "My goggles fail.", label: "My goggles fill on the dive." },
      { key: "I'm seeded in a slow heat.", label: "I'm seeded outside." },
      { key: "I feel nervous in the ready room.", label: "I feel nervous in the ready room." },
      { key: "I go out too slow.", label: "I have a bad start." },
    ],
    Distance: [
      { key: "I false start.", label: "I false start." },
      { key: "I get DQ'd.", label: "I get DQ'd." },
      { key: "I blow a turn.", label: "I blow a flip turn." },
      { key: "My mind wanders mid-race.", label: "My mind wanders at the 300." },
      { key: "My goggles fail.", label: "My goggles fog up." },
      { key: "I'm seeded in a slow heat.", label: "I'm in the early slow heat." },
      { key: "I feel nervous in the ready room.", label: "I feel nervous before the long one." },
      { key: "I go out too slow.", label: "My pace slips early." },
    ],
    Stroke: [
      { key: "I get touched out.", label: "I get touched out." },
      { key: "I false start.", label: "I false start." },
      { key: "I get DQ'd.", label: "I get DQ'd on a touch." },
      { key: "I blow a turn.", label: "I miss my turn." },
      { key: "My mind wanders mid-race.", label: "My stroke falls apart late." },
      { key: "My goggles fail.", label: "My goggles slip." },
      { key: "I'm seeded in a slow heat.", label: "I'm seeded in a slow heat." },
      { key: "I feel nervous in the ready room.", label: "I feel nervous in the ready room." },
      { key: "I go out too slow.", label: "My stroke isn't there in warm-up." },
    ],
    IM: [
      { key: "I get touched out.", label: "I get touched out." },
      { key: "I false start.", label: "I false start." },
      { key: "I get DQ'd.", label: "I get DQ'd on a transition." },
      { key: "I blow a turn.", label: "I blow a stroke transition." },
      { key: "My mind wanders mid-race.", label: "I lose focus between strokes." },
      { key: "My goggles fail.", label: "My goggles fail mid-race." },
      { key: "I'm seeded in a slow heat.", label: "I'm seeded in a slow heat." },
      { key: "I feel nervous in the ready room.", label: "I feel nervous in the ready room." },
      { key: "I go out too slow.", label: "My weak leg costs me." },
    ],
  },

  adversitySlugFragments: SWIMMING_ADVERSITY_SLUG_FRAGMENTS,

  cellSlugFor(adversity: string, role?: string | null): string {
    const frag = SWIMMING_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "touched-out";
    const tokenMap: Record<string, string> = {
      Sprinter: "sprint",
      Distance: "dist",
      Stroke: "stroke",
      IM: "im",
    };
    const token = role ? (tokenMap[role] ?? "sprint") : "sprint";

    // Sprinter × mind-wanders → touched-out: no lonely middle in a sub-minute
    // sprint. Dropped from the picker; reroute keeps the integrity grid whole.
    if (token === "sprint" && frag === "mind-wanders") return "hm-swm-sprint-touched-out";
    // Distance × touched-out → go-out-slow: the mile isn't decided at the wall by
    // hundredths. Dropped from the picker; reroute keeps the grid resolving.
    if (token === "dist" && frag === "touched-out") return "hm-swm-dist-go-out-slow";

    // Swimming is COMPOSITIONAL-ONLY (golf model): cellSlugFor returns the
    // hm-swm-* hard-moment clip directly.
    return `hm-swm-${token}-${frag}`;
  },

  // Pre-practice focus presets. "Sharp breakouts" (NOT "Underwaters strong") is
  // the deliberate breath-rail-safe choice — same skill, zero breath-hold framing.
  practiceFocusOptions: [
    "Best average",
    "Hold my pace",
    "Streamline off every wall",
    "Race-pace turns",
    "Finish every length",
    "Sharp breakouts",
    "One length at a time",
  ] as const,

  practiceFocusSlugs: {
    "Best average": "pp-swimming-focus-best-average",
    "Hold my pace": "pp-swimming-focus-hold-my-pace",
    "Streamline off every wall": "pp-swimming-focus-streamline-off-every-wall",
    "Race-pace turns": "pp-swimming-focus-race-pace-turns",
    "Finish every length": "pp-swimming-focus-finish-every-length",
    "Sharp breakouts": "pp-swimming-focus-sharp-breakouts",
    "One length at a time": "pp-swimming-focus-one-length-at-a-time",
  },

  // FV-117 per-sport picker lists. "Better puck decisions" → "Better race
  // execution" (pacing / turn / finish execution — "swim your race, not theirs");
  // all other 9 needs are sport-neutral and shared. Swimming reuses the shared
  // opener clips (resolveOpenerSlug falls back to NEED_OPENER_SLUGS).
  needs: [
    "Confidence",
    "Calm",
    "Compete level",
    "Reset after mistakes",
    "Physical courage",
    "Better race execution",
    "Leadership",
    "Joy",
    "Hope",
    "Be more Vocal",
  ] as const satisfies readonly NeedToday[],

  // "Long exhale", "Press thumb to palm", "Say cue word" shared; the 3 middle
  // ones are swim-specific DRY-LAND deck gestures (clips + slugs land with the
  // audio render — they drop cleanly until then). None involve breath manipulation
  // (the breath rail): arm shake, arm swings, seating cap/goggles.
  anchors: [
    "Long exhale",
    "Press thumb to palm",
    "Shake out my arms",
    "Two arm swings",
    "Cap and goggles set",
    "Say cue word",
  ] as const,

  // "You're okay. Next shift." → "You're okay. Next race." (a swimmer races
  // multiple events per session — the between-events reset); the other 6 are
  // sport-neutral and shared.
  selfTalkOptions: [
    "You're okay. Next race.",
    "Breathe. Do your job.",
    "Stay steady. Make the next play.",
    "You don't need to do too much.",
    "Compete, recover, go again.",
    "Your identity is secure. Play free.",
    "You are secure. Take the next faithful action.",
  ] as const,

  practiceOpenerSlugs: {
    "dialed-in": "pp-opener-dialed-in",
    "not-feeling-it": "pp-swimming-opener-get-to",
  },

  audioScript: SWIMMING_AUDIO_SCRIPT,

  cueWordHelper: "The one you'd say behind the blocks.",
  cardShareHint: "Screenshot it. Open it before they call your heat.",
};

// ---------------------------------------------------------------------------
// Track & Field config (v2 — DORMANT; taxonomy = docs/track-field-module-map.md,
// authored by a standing track coach + content trio (no dedicated expert agent
// yet — recommend recruiting one before go-live). Content authored, NOT athlete-
// selectable — absent from SUPPORTED_SPORTS + the DB sport CHECK. Non-positional:
// the "position" dimension maps to EVENT GROUP. Sport slug is hyphenated
// ("track-field") — keep the daily seed sport column + registry key in lockstep.
//
// CLINICAL: the "no-height" cells (Jumper + Thrower) are WITHHELD until clinical
// sign-off (golf-first-tee precedent — never name the yips/balk; route mechanics
// to the coach). Body-composition / RED-S (distance + jumps) is flag-and-route,
// NEVER a cell.)
// ---------------------------------------------------------------------------

const TRACKFIELD_ADVERSITY_SLUG_FRAGMENTS: Record<string, string> = {
  "I false start.": "false-start",
  "I blow the handoff.": "handoff",
  "I get out-leaned at the line.": "out-leaned",
  "I foul.": "foul",
  "I no-height.": "no-height",
  "I draw a bad heat or lane.": "bad-heat",
  "I hit the wall.": "hit-wall",
  "I feel nervous in the blocks.": "nervous",
  "I start slow.": "start-slow",
  "I fall off the pace.": "off-pace",
};

// Track & Field text-mode audio script (sport-correct body for segs 80/120/165).
// Segments 0/35/210/250/275 are sport-neutral. 80/120/165 are track-specific and
// event-group-neutral (work for the gun events + the field events).
const TRACKFIELD_AUDIO_SCRIPT: AudioSegment[] = [
  {
    startSec: 0,
    eyebrow: "Identity",
    body: `${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.`,
  },
  {
    startSec: 35,
    eyebrow: "Settle",
    body: "Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.",
  },
  {
    startSec: 80,
    eyebrow: "See the track",
    body: "See the track. Hear the meet PA echo, a starter's whistle in the distance, spikes on the apron. Smell the infield. Feel your spikes bite, the chalk on your hands, the moment before you go. You belong here. You are ready.",
  },
  {
    startSec: 120,
    eyebrow: "Your first rep",
    body: "The starter raises the gun, or the official calls your name. Settle. Slow breath. Then go — explode, commit, finish all the way through. One rep. Recover. Next rep.",
  },
  {
    startSec: 165,
    eyebrow: "Compete in your event · {{role}}",
    body: "{{roleScenes}}",
  },
  {
    startSec: 210,
    eyebrow: "If this happens",
    body: "{{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.",
  },
  {
    startSec: 250,
    eyebrow: "Coach yourself",
    body: "{{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.",
  },
  {
    startSec: 275,
    eyebrow: "Send-off",
    body: "Lord, help me compete with courage, humility, and joy. Help me run the race in front of me, respond well to a bad one, and remember that my worth is secure in You. Amen. Play from victory.",
  },
];

export const TRACKFIELD_CONFIG: SportConfig = {
  displayName: "Track & Field",
  sportKey: "track-field",

  // Non-positional — the role dimension maps to EVENT GROUP. Slug tokens:
  // sprint / dist / hurdle / jump / throw.
  roles: ["Sprinter", "Distance", "Hurdler", "Jumper", "Thrower"] as const,
  roleLabel: "Event",

  roleContent: {
    Sprinter: {
      title: "Explode and stay relaxed.",
      scenes: [
        "Set in the blocks.",
        "React, drive, rise up.",
        "Fast hands, loose face.",
        "Run through the line.",
        "Lean, don't reach.",
      ],
    },
    Distance: {
      title: "Run your race, your way.",
      scenes: [
        "Settle into your pace.",
        "Relax the shoulders, breathe.",
        "Stay in contact, stay patient.",
        "Make your move on time.",
        "Empty the tank at the bell.",
      ],
    },
    Hurdler: {
      title: "Trust your steps.",
      scenes: [
        "Attack the first hurdle.",
        "Lead leg snaps down.",
        "Trail leg comes through.",
        "Run between the barriers.",
        "Sprint off the last one.",
      ],
    },
    Jumper: {
      title: "Commit down the runway.",
      scenes: [
        "Find your mark.",
        "Build the approach, stay tall.",
        "Hit the board, full speed.",
        "Commit and explode up.",
        "Next attempt, fresh start.",
      ],
    },
    Thrower: {
      title: "Big and explosive.",
      scenes: [
        "Settle in the ring.",
        "Slow, then violent.",
        "Stay back, then rip it.",
        "Finish tall and through.",
        "Next throw, let it go.",
      ],
    },
  },

  adversities: [
    "I false start.",
    "I blow the handoff.",
    "I get out-leaned at the line.",
    "I foul.",
    "I no-height.",
    "I draw a bad heat or lane.",
    "I hit the wall.",
    "I feel nervous in the blocks.",
    "I start slow.",
    "I fall off the pace.",
  ],

  // Per-event-group relabels + drops/withholds. Every `key` is canonical so
  // cellSlugFor + state.adversity resolve the same cell. Several adversities
  // don't exist in literal form for some groups — handled by relabel → withhold
  // → drop+reroute (priority). NO team-sport relabels (track team moments =
  // relays + meet scoring, surfaced as texture, never a cell).
  //  - "I no-height." is WITHHELD for Jumper + Thrower (clinical gate — the
  //    fouling-out / runway-balk spiral; authored, omitted here until sign-off).
  //  - Sprinter drops foul + no-height (no field implement/bar) → reroute.
  //  - Distance drops false-start + foul + no-height (arc start, no field) → reroute.
  //  - Hurdler drops no-height (no bar) → reroute; foul relabels to the hit-hurdle.
  //  - Jumper + Thrower drop false-start + handoff + hit-wall (no gun/relay-leg/
  //    rigging) → reroute to the group foul cell.
  roleAdversities: {
    Sprinter: [
      { key: "I false start.", label: "I false start." },
      { key: "I blow the handoff.", label: "I blow the handoff." },
      { key: "I get out-leaned at the line.", label: "I get out-leaned at the line." },
      { key: "I draw a bad heat or lane.", label: "I draw a bad lane." },
      { key: "I hit the wall.", label: "I tie up in the last 50." },
      { key: "I feel nervous in the blocks.", label: "I feel nervous in the blocks." },
      { key: "I start slow.", label: "I get a slow start." },
      { key: "I fall off the pace.", label: "I fade down the stretch." },
    ],
    Distance: [
      { key: "I get out-leaned at the line.", label: "I get out-kicked at the line." },
      { key: "I blow the handoff.", label: "I blow the handoff." },
      { key: "I draw a bad heat or lane.", label: "I get boxed in." },
      { key: "I hit the wall.", label: "I hit the wall." },
      { key: "I feel nervous in the blocks.", label: "I feel nervous on the line." },
      { key: "I start slow.", label: "I go out too slow." },
      { key: "I fall off the pace.", label: "I fall off the pace." },
    ],
    Hurdler: [
      { key: "I false start.", label: "I false start." },
      { key: "I blow the handoff.", label: "I blow the handoff." },
      { key: "I get out-leaned at the line.", label: "I get out-leaned at the line." },
      { key: "I foul.", label: "I hit a hurdle." },
      { key: "I draw a bad heat or lane.", label: "I draw a bad lane." },
      { key: "I hit the wall.", label: "I die in the 400 hurdles." },
      { key: "I feel nervous in the blocks.", label: "I feel nervous in the blocks." },
      { key: "I start slow.", label: "I'm off my steps early." },
      { key: "I fall off the pace.", label: "I lose my rhythm." },
    ],
    Jumper: [
      { key: "I foul.", label: "I scratch the jump." },
      { key: "I get out-leaned at the line.", label: "I get jumped on my last attempt." },
      { key: "I draw a bad heat or lane.", label: "I draw an early flight." },
      { key: "I feel nervous in the blocks.", label: "I feel nervous on the runway." },
      { key: "I start slow.", label: "I open with a bad jump." },
      { key: "I fall off the pace.", label: "I'm not hitting my marks." },
    ],
    Thrower: [
      { key: "I foul.", label: "I scratch the throw." },
      { key: "I get out-leaned at the line.", label: "I get out-thrown on the last throw." },
      { key: "I draw a bad heat or lane.", label: "I throw early in the order." },
      { key: "I feel nervous in the blocks.", label: "I feel nervous in the ring." },
      { key: "I start slow.", label: "I open with a weak throw." },
      { key: "I fall off the pace.", label: "I can't find a big throw." },
    ],
  },

  adversitySlugFragments: TRACKFIELD_ADVERSITY_SLUG_FRAGMENTS,

  cellSlugFor(adversity: string, role?: string | null): string {
    const frag = TRACKFIELD_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "nervous";
    const tokenMap: Record<string, string> = {
      Sprinter: "sprint",
      Distance: "dist",
      Hurdler: "hurdle",
      Jumper: "jump",
      Thrower: "throw",
    };
    const token = role ? (tokenMap[role] ?? "sprint") : "sprint";

    // Field groups (jump/throw): no gun, no relay leg, no rigging — these
    // adversities don't exist; reroute to the group's core foul cell.
    if (
      (token === "jump" || token === "throw") &&
      (frag === "false-start" || frag === "handoff" || frag === "hit-wall")
    ) {
      return `hm-trf-${token}-foul`;
    }
    // Sprinter: no field foul, no bar/height → reroute to the core rulebook-
    // erasure cell (false-start).
    if (token === "sprint" && (frag === "foul" || frag === "no-height")) {
      return "hm-trf-sprint-false-start";
    }
    // Distance: arc/waterfall start (block false-start is a sprint reality) +
    // field cells don't apply → reroute to the core distance failure (the wall).
    if (token === "dist" && (frag === "false-start" || frag === "foul" || frag === "no-height")) {
      return "hm-trf-dist-hit-wall";
    }
    // Hurdler: no bar/height → reroute to the hit-a-hurdle foul cell.
    if (token === "hurdle" && frag === "no-height") {
      return "hm-trf-hurdle-foul";
    }

    // Compositional-only (golf model): cellSlugFor returns the hm-trf-* clip.
    return `hm-trf-${token}-${frag}`;
  },

  // Pre-practice focus presets. "Relaxed speed" (the relax-to-sprint paradox)
  // and "Reset between attempts" (the field-event multi-round reset) are the
  // track-distinct ones.
  practiceFocusOptions: [
    "Compete every rep",
    "One rep at a time",
    "Trust my technique",
    "Relaxed speed",
    "Finish through the line",
    "Attack the moment",
    "Reset between attempts",
  ] as const,

  practiceFocusSlugs: {
    "Compete every rep": "pp-trackfield-focus-compete-every-rep",
    "One rep at a time": "pp-trackfield-focus-one-rep-at-a-time",
    "Trust my technique": "pp-trackfield-focus-trust-my-technique",
    "Relaxed speed": "pp-trackfield-focus-relaxed-speed",
    "Finish through the line": "pp-trackfield-focus-finish-through-the-line",
    "Attack the moment": "pp-trackfield-focus-attack-the-moment",
    "Reset between attempts": "pp-trackfield-focus-reset-between-attempts",
  },

  // FV-117 per-sport picker lists. "Better puck decisions" → "Better race
  // execution" (shared with swimming — the race-plan / pacing / approach
  // execution need); all other 9 needs are sport-neutral and shared. Track
  // reuses the shared opener clips (resolveOpenerSlug falls back).
  needs: [
    "Confidence",
    "Calm",
    "Compete level",
    "Reset after mistakes",
    "Physical courage",
    "Better race execution",
    "Leadership",
    "Joy",
    "Hope",
    "Be more Vocal",
  ] as const satisfies readonly NeedToday[],

  // "Long exhale", "Press thumb to palm", "Say cue word" shared; the 3 middle
  // ones are track-specific (clips + slugs land with the audio render — they
  // drop cleanly until then): the pre-race limb shake-out, the step-back-and-
  // re-set behind the line/runway, and settling the blocks/ring/board stance.
  anchors: [
    "Long exhale",
    "Press thumb to palm",
    "Shake out the legs",
    "Reset on the line",
    "Set your feet",
    "Say cue word",
  ] as const,

  // "You're okay. Next shift." → "You're okay. Next rep." ("rep" holds across a
  // sprinter's next round, a jumper's next attempt, a thrower's next throw); the
  // other 6 are sport-neutral and shared.
  selfTalkOptions: [
    "You're okay. Next rep.",
    "Breathe. Do your job.",
    "Stay steady. Make the next play.",
    "You don't need to do too much.",
    "Compete, recover, go again.",
    "Your identity is secure. Play free.",
    "You are secure. Take the next faithful action.",
  ] as const,

  practiceOpenerSlugs: {
    "dialed-in": "pp-opener-dialed-in",
    "not-feeling-it": "pp-trackfield-opener-get-to",
  },

  audioScript: TRACKFIELD_AUDIO_SCRIPT,

  cueWordHelper: "The one you'd say to yourself in the blocks.",
  cardShareHint: "Screenshot it. Open it before they call your heat.",
};

// ---------------------------------------------------------------------------
// Lacrosse config (v2 — DORMANT; taxonomy = docs/lacrosse-module-map.md,
// FV-404, KC-ratified, lacrosse-expert authored. Content wired, NOT athlete-
// selectable — absent from SUPPORTED_SPORTS (lib/sports.ts) + the DB sport
// CHECK, like baseball/football/swimming. BOYS'/MEN'S FIELD lacrosse only
// (girls'/box lacrosse are separate future modules — FV-404 §6). Genuinely
// positional: 5 positions (LSM is a variant lens inside Defense, not a 6th).
//
// ⚠⚠ CLINICAL GATE (FV-404 §4 — the FV-119 pattern): the three yips-class
// motor-anxiety cells (FOGO clamp / Goalie save / Defense clear — the
// throwing yips) are AUTHORED (clips-lacrosse.ts) but WITHHELD from the
// Step-02 picker until clinical sign-off. Mechanism: their umbrella key
// ("I lose my touch." → fragment "lose-touch") lives ONLY in
// LACROSSE_ADVERSITY_SLUG_FRAGMENTS + cellSlugFor — it is NOT in
// `adversities` and NO roleAdversities entry carries it, so it is fully
// unreachable from the picker. Re-enabling is a KC + clinical decision.
//
// VIZ library (FV-404 §2 two-libraries rule): TEN viz clips — 2 per position,
// viz-lax-<position>-<theme> (clips-lacrosse.ts), matching the FV-405 book
// slug-for-slug. There is NO flagship viz-lax-<position> clip; at go-live the
// 10 themes wire into POSITIVE_PLAYS (positive-plays.ts) as each position's
// selectable play list — no entries until the audio renders (dormant
// precedent), so sportHasPositivePlays() keeps the picker step gated off.)
// ---------------------------------------------------------------------------

const LACROSSE_ADVERSITY_SLUG_FRAGMENTS: Record<string, string> = {
  "I turn the ball over.": "turnover",
  "I get dodged.": "dodged",
  "I take a bad penalty.": "penalty",
  "I get shut off.": "shut-off",
  "I fail a clear.": "failed-clear",
  "Coach yells.": "coach-yells",
  "I get benched.": "benched",
  "I feel nervous.": "nervous",
  "I start slow.": "start-slow",
  "We fall behind early.": "fall-behind-early",
  // ⚠⚠ Gated umbrella (FV-404 §4) — resolvable by cellSlugFor for the grid +
  // integrity test, but NOT in `adversities`, so never shown in the picker.
  "I lose my touch.": "lose-touch",
};

export const LACROSSE_CONFIG: SportConfig = {
  displayName: "Lacrosse",
  sportKey: "lacrosse",

  // FV-404 §1 — the scope-minimal position-true set. Slug tokens (lowercased
  // role): attack / midfield / defense / fogo / goalie.
  roles: ["Attack", "Midfield", "Defense", "FOGO", "Goalie"] as const,
  roleLabel: "Position",

  // Picker-card titles verbatim from FV-404 §2; scenes are the flagship-5
  // seeds (FV-405 confirms/replaces the flagship picks with the book).
  roleContent: {
    Attack: {
      title: "Take him and finish.",
      scenes: [
        "Win your matchup at X.",
        "Beat your man, hands free.",
        "Finish through contact.",
        "Draw the slide, feed the open man.",
        "Next possession, take him again.",
      ],
    },
    Midfield: {
      title: "Both ends, full motor.",
      scenes: [
        "Win the ground ball, push it.",
        "Dodge downhill, rip it.",
        "Backcheck the fast break.",
        "Win your wing at the faceoff.",
        "Sub on fresh, first touch strong.",
      ],
    },
    Defense: {
      title: "Lock him down. Take it the other way.",
      scenes: [
        "Move your feet, keep him topside.",
        "Slide on time, wall up.",
        "Win the ground ball in traffic.",
        "Outlet clean, start the clear.",
        "Talk loud, run the defense.",
      ],
    },
    FOGO: {
      title: "Win the dot.",
      scenes: [
        "Fast clamp on the whistle.",
        "Win the pull, secure the ball.",
        "Exit to open field.",
        "Feed the fast break.",
        "Next whistle, quicker hands.",
      ],
    },
    Goalie: {
      title: "The next shot. Then start the break.",
      scenes: [
        "Track the shot, drive your hands.",
        "Set the angle, square up.",
        "Smother the rebound.",
        "Save-and-go, outlet clean.",
        "Call the slides, own the cage.",
      ],
    },
  },

  // The shared 10 canonical adversities (FV-404 §3, model (a)). The gated
  // "I lose my touch." umbrella is deliberately NOT here (see header comment).
  adversities: [
    "I turn the ball over.",
    "I get dodged.",
    "I take a bad penalty.",
    "I get shut off.",
    "I fail a clear.",
    "Coach yells.",
    "I get benched.",
    "I feel nervous.",
    "I start slow.",
    "We fall behind early.",
  ],

  // FV-404 §3 per-position drops + position-true relabels (FV-101 label-only
  // mechanism — every `key` is canonical so cellSlugFor + state.adversity
  // resolve the same cell). Final label wording confirmed by content-curator +
  // lacrosse-expert at FV-405.
  //  - Attack ships 9: drops "I get dodged." (attackmen are not on-ball
  //    defenders — the thin-cell / pitcher-error precedent; cellSlugFor
  //    reroutes the never-fired combo so the integrity grid resolves).
  //  - Midfield + Defense ship the full flat 10 — no override needed (the
  //    baseball-Outfield precedent).
  //  - FOGO ships 8: drops "I get shut off." (a FOGO isn't shut off — his
  //    world is the dot) AND "I fail a clear." (his exit loss IS his turnover
  //    cell); special-case slugs carry the dot-true cells.
  //  - Goalie ships 10 with goalie-true labels mapped to special-case slugs.
  //  - ⚠⚠ Every position omits the gated "I lose my touch." umbrella (FV-404
  //    §4 — withheld until clinical sign-off; see header comment).
  roleAdversities: {
    Attack: [
      { key: "I turn the ball over.", label: "I turn the ball over." },
      { key: "I take a bad penalty.", label: "I take a bad penalty." },
      { key: "I get shut off.", label: "I get shut off." },
      { key: "I fail a clear.", label: "I get rode out." },
      { key: "Coach yells.", label: "Coach yells." },
      { key: "I get benched.", label: "I get benched." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
    ],
    FOGO: [
      { key: "I turn the ball over.", label: "I win the clamp and lose the ball." },
      { key: "I get dodged.", label: "I lose a string of draws." },
      { key: "I take a bad penalty.", label: "I get hit with a violation." },
      { key: "Coach yells.", label: "Coach yells." },
      { key: "I get benched.", label: "I get pulled off the dot." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I drop the first draws." },
      { key: "We fall behind early.", label: "We fall behind early." },
    ],
    Goalie: [
      { key: "I turn the ball over.", label: "I throw the clear away." },
      { key: "I get dodged.", label: "I get beaten clean." },
      { key: "I take a bad penalty.", label: "We get scored on man-down." },
      { key: "I get shut off.", label: "I let in a soft goal." },
      { key: "I fail a clear.", label: "I fail a clear." },
      { key: "Coach yells.", label: "Coach yells." },
      { key: "I get benched.", label: "I get pulled." },
      { key: "I feel nervous.", label: "I feel nervous." },
      { key: "I start slow.", label: "I start slow." },
      { key: "We fall behind early.", label: "We fall behind early." },
    ],
  },

  adversitySlugFragments: LACROSSE_ADVERSITY_SLUG_FRAGMENTS,

  cellSlugFor(adversity: string, role?: string | null): string {
    const frag = LACROSSE_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "nervous";
    // Roles are single words, so the slug token is just the lowercased role
    // (FV-404 Appendix): attack / midfield / defense / fogo / goalie.
    const token = role ? role.toLowerCase() : "attack";

    // ⚠⚠ Gated yips umbrella (FV-404 §4) — WITHHELD from the picker (not in
    // `adversities` / any roleAdversities), resolvable here so the grid, the
    // integrity test, and a future clinical-signed re-enable stay whole.
    if (frag === "lose-touch") {
      if (token === "fogo") return "hm-lax-fogo-clamp-yips";
      if (token === "goalie") return "hm-lax-goalie-save-yips";
      if (token === "defense") return "hm-lax-defense-clear-yips";
      // Attack/Midfield carry NO yips cell — their cold-touch stretch is a
      // slump flavor of shut-off (FV-404 §4), which ships live.
      return `hm-lax-${token}-shut-off`;
    }

    // Attack drops `dodged` (not an on-ball defender). Omitted from the
    // Attack picker, so this never fires; the reroute keeps the exhaustive
    // (roles × adversities) integrity matrix resolving to a real clip.
    if (token === "attack" && frag === "dodged") return "hm-lax-attack-turnover";
    // Attack × failed-clear → rode-out (rode out hard from the front).
    if (token === "attack" && frag === "failed-clear") return "hm-lax-attack-rode-out";

    // FOGO special cases (FV-404 Appendix).
    if (token === "fogo") {
      // Dot-true cells.
      if (frag === "dodged") return "hm-lax-fogo-lose-draws";
      if (frag === "penalty") return "hm-lax-fogo-violation";
      if (frag === "benched") return "hm-lax-fogo-off-the-dot";
      if (frag === "fall-behind-early") return "hm-lax-fogo-behind-at-the-dot";
      // Dropped combos (never shown in the FOGO picker) — reroute so the
      // integrity matrix stays whole: his "shut off" is being beaten at the
      // dot; his failed clear is the lost exit (his turnover cell).
      if (frag === "shut-off") return "hm-lax-fogo-lose-draws";
      if (frag === "failed-clear") return "hm-lax-fogo-turnover";
    }

    // Goalie special cases (FV-404 Appendix — the goalie-pulled precedent).
    if (token === "goalie") {
      if (frag === "turnover") return "hm-lax-goalie-throw-away";
      if (frag === "dodged") return "hm-lax-goalie-beaten-clean";
      if (frag === "penalty") return "hm-lax-goalie-man-down";
      if (frag === "shut-off") return "hm-lax-goalie-soft-goal";
      if (frag === "benched") return "hm-lax-goalie-pulled";
    }

    // Lacrosse is COMPOSITIONAL-ONLY (golf/football/swimming precedent):
    // cellSlugFor returns the hm-lax-* hard-moment clip directly — the slug
    // the (deferred) manifest render + the integrity grid reference.
    return `hm-lax-${token}-${frag}`;
  },

  // Pre-practice focus presets (FV-404 Appendix — slugs declared now so the
  // registry is complete; clips land with the audio render / FV-405).
  practiceFocusOptions: [
    "Win my one-on-one",
    "Full motor, both ends",
    "Ground balls win games",
    "Talk on defense",
    "Next whistle, next play",
    "Move off-ball",
    "Take care of the ball",
  ] as const,

  practiceFocusSlugs: {
    "Win my one-on-one": "pp-lax-focus-win-my-one-on-one",
    "Full motor, both ends": "pp-lax-focus-full-motor-both-ends",
    "Ground balls win games": "pp-lax-focus-ground-balls-win-games",
    "Talk on defense": "pp-lax-focus-talk-on-defense",
    "Next whistle, next play": "pp-lax-focus-next-whistle-next-play",
    "Move off-ball": "pp-lax-focus-move-off-ball",
    "Take care of the ball": "pp-lax-focus-take-care-of-the-ball",
  },

  // FV-117 per-sport picker lists. "Better puck decisions" → "Better decisions
  // with the ball" (already a NeedToday member — basketball's swap — so the
  // hot NeedToday union stays stable, FV-404 Appendix); all other 9 needs are
  // sport-neutral and shared. Lacrosse reuses the shared opener clips
  // (resolveOpenerSlug falls back to NEED_OPENER_SLUGS; sport-specific
  // opener-lax-* clips are a documented FV-406+ follow-up, not v1 scope).
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
    "Be more Vocal",
  ] as const satisfies readonly NeedToday[],

  // "Long exhale", "Press thumb to palm", "Say cue word" shared; the 3 middle
  // gear-contact gestures are lacrosse-specific (FV-404 Appendix; clips +
  // slugs land with the audio render — they drop cleanly until then, the
  // baseball/golf/football precedent).
  anchors: [
    "Long exhale",
    "Press thumb to palm",
    "Tap your stick",
    "Glove tap on the shaft",
    "Reset at the X",
    "Say cue word",
  ] as const,

  // "You're okay. Next shift." → "You're okay. Next whistle." (the lacrosse
  // reset cadence — FV-404 Appendix); the other 6 are sport-neutral and shared.
  selfTalkOptions: [
    "You're okay. Next whistle.",
    "Breathe. Do your job.",
    "Stay steady. Make the next play.",
    "You don't need to do too much.",
    "Compete, recover, go again.",
    "Your identity is secure. Play free.",
    "You are secure. Take the next faithful action.",
  ] as const,

  practiceOpenerSlugs: {
    // pp-opener-dialed-in is sport-neutral and reused across all sports.
    "dialed-in": "pp-opener-dialed-in",
    // Lacrosse-specific not-feeling-it opener (authored at FV-405; declared
    // here for registry completeness).
    "not-feeling-it": "pp-lax-opener-get-to",
  },

  // Text-mode fallback: the shared AUDIO_SCRIPT placeholder satisfies the type
  // until the render pass (the BASEBALL_CONFIG precedent — FV-404 Appendix
  // directs this explicitly). The dedicated lacrosse text-mode script (segs
  // 80/120/165 — see the field / first dodge-draw-save / play your position)
  // lands with the FV-405 content pass / audio render, before go-live.
  audioScript: AUDIO_SCRIPT,

  cueWordHelper: "The one you'd say to yourself on the ride back.",
  cardShareHint: "Screenshot it. Open it before the first faceoff.",
};

// ---------------------------------------------------------------------------
// Registry + accessor
// ---------------------------------------------------------------------------

export const SPORT_REGISTRY: Record<Sport, SportConfig> = {
  hockey: HOCKEY_CONFIG,
  basketball: BASKETBALL_CONFIG,
  baseball: BASEBALL_CONFIG,
  golf: GOLF_CONFIG,
  football: FOOTBALL_CONFIG,
  swimming: SWIMMING_CONFIG,
  "track-field": TRACKFIELD_CONFIG,
  lacrosse: LACROSSE_CONFIG,
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
 * key itself for roles without an override, for sports without overrides, and
 * for any unmatched value (e.g. a legacy custom string from a pre-FV-343
 * session), and passes a null key straight through. (FV-101.)
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
