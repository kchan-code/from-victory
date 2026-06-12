// Pregame v2.1 — state model + content constants.
// Designed from the Claude Design bundle, restructured per KC's revision:
// Breathe is the threshold step (immediately after Start), setup is six
// single-select taps, then a Review checkpoint, a 5-minute Guided Audio
// Session, and finally the Pregame Card. Identity scripture + prayer fold
// into the audio narrative (not standalone screens). No persistence yet
// (see docs/feature-roadmap.md). Local state only.
//
export type NeedToday =
  | "Confidence"
  | "Calm"
  | "Compete level"
  | "Reset after mistakes"
  | "Physical courage"
  | "Better puck decisions"
  | "Better decisions with the ball"
  | "Better decisions at the plate"
  | "Better course management"
  | "Leadership"
  | "Joy"
  | "Hope"
  | "Be more Vocal";

/**
 * How the athlete wants to close the guided session:
 * "guided"      → the narration leads a closing prayer.
 * "self-guided" → the audio invites a moment of silence (~18-20s);
 *                 the athlete prays at their own pace and taps when done.
 */
export type PrayerStyle = "guided" | "self-guided";

export type PrayerStyleOption = {
  value: PrayerStyle;
  label: string;
  sub: string;
};

export const PRAYER_STYLE_OPTIONS: PrayerStyleOption[] = [
  {
    value: "guided",
    label: "Pray with me",
    sub: "I'll lead us through the closing prayer together.",
  },
  {
    value: "self-guided",
    label: "I'll pray on my own",
    sub: "I'll lead you in, then give you a quiet moment to pray.",
  },
];

export type PregameState = {
  breathDone: boolean;
  need: NeedToday | null;
  /** Sport-specific role/position string, or null for no-ask sports. */
  role: string | null;
  /**
   * Athlete-picked positive-play viz slugs for this session (FV-144), in the
   * order they'll be rehearsed. 1–MAX_POSITIVE_PLAYS entries once the picker is
   * complete; [] means "use the position flagship" (the no-pick fallback that
   * preserves pre-FV-144 behaviour for any non-picker call site). See
   * positive-plays.ts.
   */
  positivePlays: string[];
  adversity: string | null;
  anchor: string | null;
  selfTalk: string | null;
  cueWord: string;
  prayerStyle: PrayerStyle;
  /**
   * FV-227 — athlete-chosen music bed id (see BedId in audio/beds.ts for the
   * full six-option catalog), or null for silence. Persisted to localStorage
   * at the device level (fv_pregame_bed),
   * independent of the session cache. Default is null (silence).
   */
  bedId: string | null;
  audioCompleted: boolean;
};

export const INITIAL_STATE: PregameState = {
  breathDone: false,
  need: null,
  role: null,
  positivePlays: [],
  adversity: null,
  anchor: null,
  selfTalk: null,
  cueWord: "Faithful",
  prayerStyle: "guided",
  bedId: null,
  audioCompleted: false,
};

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

// NEEDS and RESET_ANCHORS and SELF_TALK_OPTIONS are kept here as the
// HOCKEY defaults (the original global lists). Sport-specific overrides
// live in sport-registry.ts (SportConfig.needs / .anchors / .selfTalkOptions).
// Consumers that need sport-aware lists should use sportConfig.needs etc.
// These global exports remain only for backward-compat with non-sport-aware
// call sites (text-mode AUDIO_SCRIPT, defaults, etc.).
export const NEEDS: NeedToday[] = [
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
];

// ROLE_CONTENT and ADVERSITIES have moved to sport-registry.ts (HOCKEY_CONFIG).
// They are no longer exported from this module; consumers should import from
// sport-registry.ts or receive a sportConfig prop from the flow root.

// Five-step coping response — surfaced inside the Audio Session narrative,
// not as a standalone setup screen anymore.
export const COPING_PLAN: string[] = [
  "See it.",
  "Feel it.",
  "Breathe.",
  "Speak truth.",
  "Take the next faithful action.",
];

export const SELF_TALK_OPTIONS: string[] = [
  "You're okay. Next shift.",
  "Breathe. Do your job.",
  "Stay steady. Make the next play.",
  "You don't need to do too much.",
  "Compete, recover, go again.",
  "Your identity is secure. Play free.",
  "You are secure. Take the next faithful action.",
];

export const RESET_ANCHORS: string[] = [
  "Tap stick twice",
  "Touch glove",
  "Press thumb to palm",
  "Long exhale",
  "Look at tape",
  "Say cue word",
];

// Pre-practice focus options now live in sport-registry.ts
// (HOCKEY_CONFIG.practiceFocusOptions). Read them via the sportConfig prop;
// no proxy export here.

// Athlete's self-reported pre-practice state — drives opener selection.
// "dialed-in" is the default; "not-feeling-it" swaps Beat 1 only.
export type PracticeState = "dialed-in" | "not-feeling-it";

export const CUE_WORDS: string[] = [
  "Steady",
  "Courage",
  "Simple",
  "Attack",
  "Next",
  "Serve",
  "Compete",
  "Faithful",
  "Free",
  "Relentless",
];

// ---------------------------------------------------------------------------
// Need-specific verses — youth-pastor approved, surfaced in AudioSessionScreen
// and mirrored on the Pregame Card. Eyebrow is a short framing line shown
// above the verse for needs where a one-line frame strengthens the truth
// (e.g. Hope: "Strength you receive, not strength you summon.").
// ---------------------------------------------------------------------------

export type NeedVerse = {
  reference: string;
  displayText: string;
  eyebrow?: string;
};

export const NEED_VERSE: Record<NeedToday, NeedVerse> = {
  Confidence: {
    reference: "Hebrews 12:1-2",
    displayText:
      "Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith.",
  },
  Calm: {
    reference: "Philippians 4:6-7",
    displayText:
      "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
  },
  "Compete level": {
    reference: "Colossians 3:23-24",
    displayText:
      "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters... It is the Lord Christ you are serving.",
  },
  "Reset after mistakes": {
    reference: "Romans 8:1",
    displayText:
      "Therefore, there is now no condemnation for those who are in Christ Jesus.",
  },
  "Physical courage": {
    reference: "Isaiah 41:10",
    displayText:
      "Do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
  },
  "Better puck decisions": {
    reference: "Proverbs 3:5-6",
    displayText:
      "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him.",
  },
  // Basketball variant — same sport-neutral scripture, different need label. (FV-117)
  "Better decisions with the ball": {
    reference: "Proverbs 3:5-6",
    displayText:
      "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him.",
  },
  // Baseball variant — same sport-neutral scripture, different need label. (FV-94)
  "Better decisions at the plate": {
    reference: "Proverbs 3:5-6",
    displayText:
      "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him.",
  },
  // Golf variant — same sport-neutral scripture, different need label. (FV-265)
  "Better course management": {
    reference: "Proverbs 3:5-6",
    displayText:
      "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him.",
  },
  Leadership: {
    reference: "Mark 10:45",
    displayText:
      "For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.",
  },
  Joy: {
    reference: "1 Thessalonians 5:16-18",
    displayText:
      "Rejoice always, pray continually, give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
  },
  Hope: {
    reference: "Isaiah 40:31",
    eyebrow: "Strength you receive, not strength you summon.",
    displayText:
      "Those who hope in the Lord will renew their strength... they will run and not grow weary, they will walk and not be faint.",
  },
  // Deliberately shares Romans 8:1 with "Reset after mistakes" (FV-124): one
  // gospel spine ("no condemnation"), two applications — reset owns "the next
  // mistake can't reopen a closed case"; be-vocal owns "the image-protecting
  // ego is already covered, so you're free to speak." An athlete hears only one
  // opener per session, so the verse never repeats in-product. Not a copy-paste.
  "Be more Vocal": {
    reference: "Romans 8:1",
    displayText:
      "Therefore, there is now no condemnation for those who are in Christ Jesus.",
  },
};

// ---------------------------------------------------------------------------
// Brand-anchor constants — surfaced in the audio narrative + Pregame Card
// ---------------------------------------------------------------------------

export const SCRIPTURE_REF = "Hebrews 12:1-2";
export const SCRIPTURE_TEXT =
  "Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith.";
export const SCRIPTURE_SHORT = "Run with perseverance, eyes fixed on Jesus.";

export const IDENTITY_TRUTH =
  "You are not playing to become enough. In Christ, you are already loved.";

// Sensible defaults used on the Pregame Card if the athlete skipped a step.
export const DEFAULTS = {
  cueWord: "Faithful",
  anchor: "Long exhale",
  selfTalk: "You are secure. Take the next faithful action.",
} as const;

// ---------------------------------------------------------------------------
// 5-Minute Guided Audio Session
// ---------------------------------------------------------------------------

// Fallback duration used by the text-mode timer when audio fails to
// load. Audio mode derives the real total from opener + cell metadata
// at runtime (see AudioSessionScreen).
export const AUDIO_SESSION_DURATION_S = 300;

export type AudioSegment = {
  startSec: number;
  eyebrow: string;
  body: string;
};

// Script segments (timestamps in seconds). Folds in the brand-spine moments
// that used to live on standalone screens: Identity (Hebrews 12:1-2, pulled
// from SCRIPTURE_REF/SCRIPTURE_TEXT so it tracks the spine) at the top, the
// coping plan around the visualization, and the prayer at the close. Copy
// here is a working draft pending content-curator review.
// {{cueWord}}, {{role}}, {{adversity}}, {{anchor}}, {{selfTalk}} are
// substituted at render time.
export const AUDIO_SCRIPT: AudioSegment[] = [
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
    eyebrow: "See the rink",
    body: "See the ice. Hear the skates. Feel your gloves, your stick, your edges. You belong here. You are ready.",
  },
  {
    startSec: 120,
    eyebrow: "Your first shift",
    body: "Your line is called. Three hard strides. Eyes up. Shoulder check. Simple, strong play. Recover. Next action.",
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

// ---------------------------------------------------------------------------
// Flow definition
// ---------------------------------------------------------------------------

export type FlowStep = {
  id: string;
  label: string;
  required: (state: PregameState) => boolean;
  cta?: string;
  hideBottomBar?: boolean;
};

export const FLOW: FlowStep[] = [
  {
    id: "breath",
    label: "Breathe",
    required: (s) => s.breathDone,
    cta: "SET MY FOCUS",
    // BreathScreen renders its own in-screen CTA post-breathing (per KC
    // UX feedback) — the global bottom bar is suppressed for this step.
    hideBottomBar: true,
  },
  {
    id: "todaysFocus",
    label: "Today's Focus",
    required: (s) => !!s.need,
  },
  {
    id: "position",
    label: "Position",
    required: (s) => !!s.role,
  },
  {
    // FV-144 — multi-select positive-play picker. Slotted after Position
    // (the plays are role-scoped) and before Hard Moment, mirroring the audio
    // order (viz rehearsal plays before the adversity rehearsal). "None
    // pre-picked, must choose ≥1" per KC, so required gates on a non-empty list.
    id: "positivePlays",
    label: "Positive Plays",
    required: (s) => s.positivePlays.length > 0,
  },
  {
    id: "hardMoment",
    label: "Hard Moment",
    required: (s) => !!s.adversity,
  },
  {
    id: "resetAnchor",
    label: "Reset Anchor",
    required: (s) => !!s.anchor,
  },
  {
    id: "selfTalk",
    label: "Self-Talk",
    required: (s) => !!s.selfTalk,
  },
  {
    id: "cueWord",
    label: "Cue Word",
    required: (s) => !!s.cueWord,
  },
  {
    id: "prayerStyle",
    label: "Close",
    required: (s) => !!s.prayerStyle,
  },
  {
    // FV-227 — music bed picker. bedId=null means silence (the default), which
    // is always a valid selection. required() is always true so the bottom-bar
    // Continue is never blocked — the athlete can always continue without
    // picking a bed (silence is pre-selected). Adjacent to prayerStyle because
    // both are "how do you want to close/open the audio experience" setup choices.
    id: "soundBed",
    label: "Sound",
    required: () => true,
  },
  {
    id: "review",
    label: "Review",
    required: () => true,
    cta: "BEGIN GUIDED SESSION",
  },
  {
    id: "audio",
    label: "Guided Audio Session",
    required: (s) => s.audioCompleted,
    cta: "SHOW MY PRE-GAME CARD",
    hideBottomBar: true,
  },
];
