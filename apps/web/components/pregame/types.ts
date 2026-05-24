// Pregame v2 — state model + content constants.
// Designed from the Claude Design bundle. No persistence yet (see
// docs/feature-roadmap.md). Local state only.

export type GameType =
  | "Regular game"
  | "Tournament game"
  | "Tryout / showcase"
  | "Playoff game"
  | "Rivalry game"
  | "Return from injury"
  | "Other";

export type NeedToday =
  | "Confidence"
  | "Calm"
  | "Compete level"
  | "Reset after mistakes"
  | "Physical courage"
  | "Better puck decisions"
  | "Leadership"
  | "Joy";

export type Role = "Forward" | "Defense" | "Goalie";

export type PregameState = {
  gameType: GameType | null;
  need: NeedToday | null;
  confidence: string | null;
  rinkCues: string[];
  role: Role | null;
  adversity: string | null;
  selfTalk: string | null;
  anchor: string | null;
  cueWord: string;
  commitment: string | null;
  breathDone: boolean;
};

export const INITIAL_STATE: PregameState = {
  gameType: null,
  need: null,
  confidence: null,
  rinkCues: [],
  role: null,
  adversity: null,
  selfTalk: null,
  anchor: null,
  cueWord: "Faithful",
  commitment: null,
  breathDone: false,
};

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

export const GAME_TYPES: GameType[] = [
  "Regular game",
  "Tournament game",
  "Tryout / showcase",
  "Playoff game",
  "Rivalry game",
  "Return from injury",
  "Other",
];

export const NEEDS: NeedToday[] = [
  "Confidence",
  "Calm",
  "Compete level",
  "Reset after mistakes",
  "Physical courage",
  "Better puck decisions",
  "Leadership",
  "Joy",
];

export const CONFIDENCE_OPTIONS: string[] = [
  "I skate hard.",
  "I compete for pucks.",
  "I make smart passes.",
  "I defend hard.",
  "I shoot with courage.",
  "I encourage teammates.",
  "I recover after mistakes.",
  "I stay calm under pressure.",
];

export type RinkCue = {
  id: string;
  label: string;
  icon: "eye" | "ear" | "hand" | "stick" | "bolt" | "pin";
};

export const RINK_CUES: RinkCue[] = [
  { id: "ice", label: "See the ice.", icon: "eye" },
  { id: "skates", label: "Hear the skates.", icon: "ear" },
  { id: "gloves", label: "Feel your gloves.", icon: "hand" },
  { id: "stick", label: "Feel your stick.", icon: "stick" },
  { id: "edges", label: "Feel your edges.", icon: "bolt" },
  { id: "team", label: "Hear your teammates.", icon: "ear" },
  { id: "bench", label: "Picture the bench.", icon: "pin" },
];

export const FIRST_SHIFT_SEQUENCE: string[] = [
  "Your line is called.",
  "Over the boards.",
  "Three hard strides.",
  "Eyes up.",
  "Shoulder check.",
  "Simple strong play.",
  "Recover.",
  "Next action.",
];

export const ROLE_CONTENT: Record<Role, { title: string; scenes: string[] }> = {
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
};

export const ADVERSITIES: string[] = [
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
];

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

export const COMMITMENT_OPTIONS: string[] = [
  "Finish every backcheck.",
  "Win my first race.",
  "Communicate every shift.",
  "Reset after mistakes.",
  "Shoot when I have space.",
  "Keep my feet moving.",
  "Encourage teammates.",
  "Stay composed after contact.",
  "Make the simple play under pressure.",
];

// ---------------------------------------------------------------------------
// Brand-anchor constants (canonical pregame copy — used on Pregame Card too)
// ---------------------------------------------------------------------------

export const SCRIPTURE_REF = "Romans 8:37";
export const SCRIPTURE_TEXT =
  "No, in all these things we are more than conquerors through him who loved us.";
export const SCRIPTURE_SHORT = "More than conquerors through him who loved us.";

export const IDENTITY_TRUTH =
  "You are not playing to become enough. In Christ, you are already loved.";

// Sensible defaults used on the Pregame Card if the user skipped a step.
export const DEFAULTS = {
  cueWord: "Faithful",
  anchor: "Long exhale",
  selfTalk: "You are secure. Take the next faithful action.",
  commitment: "Reset after mistakes.",
} as const;

// ---------------------------------------------------------------------------
// Flow definition
// ---------------------------------------------------------------------------

export type FlowStep = {
  id: string;
  label: string;
  required: (state: PregameState) => boolean;
};

export const FLOW: FlowStep[] = [
  { id: "context", label: "Context", required: (s) => !!s.gameType && !!s.need },
  { id: "identity", label: "Identity", required: () => true },
  { id: "breath", label: "Breath", required: () => true },
  { id: "confidence", label: "Evidence", required: (s) => !!s.confidence },
  { id: "rink", label: "Enter Rink", required: (s) => s.rinkCues.length > 0 },
  { id: "firstShift", label: "First Shift", required: () => true },
  { id: "role", label: "Your Role", required: (s) => !!s.role },
  { id: "coping", label: "Coping", required: (s) => !!s.adversity },
  { id: "selfTalk", label: "Self-Talk", required: (s) => !!s.selfTalk },
  { id: "reset", label: "Reset Anchor", required: (s) => !!s.anchor && !!s.cueWord },
  { id: "commit", label: "Commitment", required: (s) => !!s.commitment },
  { id: "prayer", label: "Send-Off", required: () => true },
];
