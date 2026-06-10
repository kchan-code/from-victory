/**
 * Characterization suite for detectSafetyConcern (FV-169).
 *
 * WHY THIS FILE EXISTS — and why it contains crisis/self-harm/abuse strings:
 *   detectSafetyConcern (apps/web/lib/safety/detect.ts) is the crisis-resource
 *   keyword detector — the highest-stakes feature for a 13-17 audience. Today it
 *   has zero tests and zero production callers (dormant since the journal
 *   descope, PR #138). This suite is a REGRESSION NET that pins the detector's
 *   CURRENT behavior before it is ever wired live (FV-84) or before its STUB
 *   vocabulary is changed by the quarterly clinical review (FV-12). With this
 *   net in place, a vocabulary edit that silently breaks an expected match — or
 *   silently introduces a new false positive — fails CI instead of shipping.
 *
 *   The fixture strings below (e.g. "I want to die") are deliberately clinical,
 *   minimal, and synthetic. They exist solely to exercise the matcher. They are
 *   NOT real journal entries and are NOT representative of any real athlete.
 *   If a future grep surfaces this file: these are test fixtures, by design.
 *
 * SCOPE — CHARACTERIZATION ONLY (FV-169 is test-only):
 *   This suite does NOT modify detect.ts, keywords.ts, or the vocabulary
 *   (safety-keywords.json). It pins what the code does TODAY, including known
 *   false positives. Those false positives are captured in a clearly-labelled
 *   "known-bad characterization" describe block — they are pinned AS CURRENT
 *   BEHAVIOR, NOT endorsed. The matcher is plain case-insensitive substring
 *   with no word-boundary handling (detect.ts:30-38); the substring traps below
 *   are the direct, observable consequence of that. Whether to fix the matcher
 *   or hand the trap list to the FV-12 clinical review is documented in the PR.
 */

// detect.ts and keywords.ts both begin with `import "server-only"`, which throws
// under vitest's node environment. Mock it to a no-op — the same pattern used by
// __tests__/stripe/webhook-route.test.ts and stripe-server-singleton.test.ts.
// vitest hoists vi.mock above the imports, so detect.ts sees the no-op module.
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { detectSafetyConcern } from "@/lib/safety/detect";
import { safetyVocabulary } from "@/lib/safety/keywords";

// ---------------------------------------------------------------------------
// Vocabulary snapshot — kept in lockstep with safety-keywords.json by reading
// from the same source the production code reads. If a category id changes, the
// asserts that name an id by string will fail and force a deliberate update.
// ---------------------------------------------------------------------------
const CRISIS_KEYWORDS = [
  "kill myself",
  "want to die",
  "wanna die",
  "end my life",
  "end it all",
  "suicidal",
  "suicide",
  "better off dead",
  "no reason to live",
  "no point living",
  "no point in living",
];
const SELF_HARM_KEYWORDS = [
  "cutting myself",
  "hurt myself",
  "harm myself",
  "self harm",
  "self-harm",
  "burn myself",
];
const ABUSE_KEYWORDS = [
  "he hits me",
  "she hits me",
  "they hit me",
  "hits me",
  "beats me",
  "touched me",
  "made me touch",
  "made me do",
  "scared to go home",
  "afraid to go home",
];

describe("detectSafetyConcern — vocabulary is the expected stub (drift guard)", () => {
  it("has exactly the three ordered categories, most-urgent first", () => {
    expect(safetyVocabulary.categories.map((c) => c.id)).toEqual([
      "crisis",
      "self_harm",
      "abuse",
    ]);
  });

  it("each category carries the keyword list this suite characterizes", () => {
    // If the clinical review (FV-12) edits these, this assert flags it so the
    // expectations below are revisited deliberately rather than drifting.
    const byId = Object.fromEntries(
      safetyVocabulary.categories.map((c) => [c.id, c.keywords]),
    );
    expect(byId.crisis).toEqual(CRISIS_KEYWORDS);
    expect(byId.self_harm).toEqual(SELF_HARM_KEYWORDS);
    expect(byId.abuse).toEqual(ABUSE_KEYWORDS);
  });
});

// ---------------------------------------------------------------------------
// 1. TRUE POSITIVES — every vocabulary phrase matches and returns its category.
// ---------------------------------------------------------------------------
describe("true positives — every keyword maps to the right category", () => {
  it.each(CRISIS_KEYWORDS)("crisis keyword %j → category crisis", (kw) => {
    expect(detectSafetyConcern(kw)).toMatchObject({
      matched: true,
      category: { id: "crisis", resources_focus: "988_lifeline" },
    });
  });

  it.each(SELF_HARM_KEYWORDS)(
    "self-harm keyword %j → category self_harm",
    (kw) => {
      expect(detectSafetyConcern(kw)).toMatchObject({
        matched: true,
        category: { id: "self_harm", resources_focus: "crisis_text_line" },
      });
    },
  );

  it.each(ABUSE_KEYWORDS)("abuse keyword %j → category abuse", (kw) => {
    expect(detectSafetyConcern(kw)).toMatchObject({
      matched: true,
      category: { id: "abuse", resources_focus: "trusted_adult" },
    });
  });

  it("matches a trigger embedded mid-sentence (true crisis signal)", () => {
    // The kind of entry the detector exists to catch.
    expect(
      detectSafetyConcern("some nights i honestly just want to die"),
    ).toMatchObject({ matched: true, category: { id: "crisis" } });
  });
});

// ---------------------------------------------------------------------------
// First-match-wins ordering — detect.ts iterates categories in array order and
// returns the FIRST match, so the most-urgent category outranks the rest when
// an entry trips more than one. Pinned so a vocabulary reorder is caught.
// ---------------------------------------------------------------------------
describe("category precedence — first match wins, most-urgent first", () => {
  it("crisis outranks abuse when both are present", () => {
    expect(
      detectSafetyConcern("he hits me and some days i want to die"),
    ).toMatchObject({ matched: true, category: { id: "crisis" } });
  });

  it("self_harm outranks abuse when both are present", () => {
    // "hurt myself" (self_harm, index 1) wins over "hits me" (abuse, index 2).
    expect(
      detectSafetyConcern("he hits me and sometimes i hurt myself"),
    ).toMatchObject({ matched: true, category: { id: "self_harm" } });
  });
});

// ---------------------------------------------------------------------------
// 2. KNOWN-BAD CHARACTERIZATION — NOT ENDORSEMENT.
//
//    The matcher is plain case-insensitive substring with no word-boundary
//    handling. These inputs are things a real 13-17 hockey/basketball athlete
//    would plausibly write that trip the detector with ZERO crisis intent.
//    They are pinned as CURRENT behavior so the cost of the substring strategy
//    is visible and regression-tracked — they are explicitly NOT desired
//    behavior. See the PR body for the fix-now-vs-hand-to-FV-12 decision.
// ---------------------------------------------------------------------------
describe("KNOWN-BAD characterization (false positives — NOT endorsed)", () => {
  describe("substring traps — no word boundary, so a keyword fires inside a benign word/phrase", () => {
    // The exemplar from the FV-169 issue: "hits me" (abuse) inside "music hits me".
    it('"the music really hits me" → false abuse match (KNOWN-BAD)', () => {
      expect(
        detectSafetyConcern("that hype song the music really hits me"),
      ).toMatchObject({ matched: true, category: { id: "abuse" } });
    });

    // "suicide" is a substring of "suicides" — the running drill (basketball)
    // and "suicide pass" (hockey). The single most likely false positive for
    // this exact audience.
    it('"we ran suicides at practice" → false crisis match (KNOWN-BAD)', () => {
      expect(
        detectSafetyConcern("coach made us run suicides at practice"),
      ).toMatchObject({ matched: true, category: { id: "crisis" } });
    });

    // "beats me" (abuse) inside ordinary defensive/competitive sports talk.
    it('"nobody beats me off the dribble" → false abuse match (KNOWN-BAD)', () => {
      expect(
        detectSafetyConcern("when i lock in nobody beats me off the dribble"),
      ).toMatchObject({ matched: true, category: { id: "abuse" } });
    });

    // "made me do" (abuse) inside everyday coaching language.
    it('"coach made me do extra laps" → false abuse match (KNOWN-BAD)', () => {
      expect(
        detectSafetyConcern("coach made me do extra laps after the loss"),
      ).toMatchObject({ matched: true, category: { id: "abuse" } });
    });

    // "burn myself" (self_harm) inside "burn myself out" — burnout is core
    // athlete vocabulary.
    it('"don\'t want to burn myself out" → false self_harm match (KNOWN-BAD)', () => {
      expect(
        detectSafetyConcern("i don't want to burn myself out before playoffs"),
      ).toMatchObject({ matched: true, category: { id: "self_harm" } });
    });

    // "end it all" (crisis) inside "in the end it all ...".
    it('"in the end it all came together" → false crisis match (KNOWN-BAD)', () => {
      expect(
        detectSafetyConcern("rough start but in the end it all came together"),
      ).toMatchObject({ matched: true, category: { id: "crisis" } });
    });
  });

  describe("hyperbole / literal-but-benign — the phrase is exact, the meaning is not a crisis", () => {
    // Athlete hyperbole: exhaustion, not ideation.
    it('"those sprints made me want to die" → false crisis match (KNOWN-BAD)', () => {
      expect(
        detectSafetyConcern("those sprints made me want to die lol"),
      ).toMatchObject({ matched: true, category: { id: "crisis" } });
    });

    // "hurt myself" routinely means a physical training injury.
    it('"i hurt myself doing squats" → false self_harm match (KNOWN-BAD)', () => {
      expect(
        detectSafetyConcern("i think i hurt myself doing squats today"),
      ).toMatchObject({ matched: true, category: { id: "self_harm" } });
    });
  });
});

// ---------------------------------------------------------------------------
// 3. BOUNDARY CASES — case, punctuation, whitespace, empty, long benign text.
// ---------------------------------------------------------------------------
describe("boundary cases", () => {
  it("is case-insensitive (uppercase / mixed case still match)", () => {
    expect(detectSafetyConcern("I WANT TO DIE")).toMatchObject({
      matched: true,
      category: { id: "crisis" },
    });
    expect(detectSafetyConcern("I Feel Suicidal")).toMatchObject({
      matched: true,
      category: { id: "crisis" },
    });
  });

  it("matches despite adjacent punctuation (substring ignores it)", () => {
    expect(detectSafetyConcern("i'm suicidal.")).toMatchObject({
      matched: true,
      category: { id: "crisis" },
    });
    expect(detectSafetyConcern("...end my life, honestly")).toMatchObject({
      matched: true,
      category: { id: "crisis" },
    });
    expect(detectSafetyConcern("want to die!!!")).toMatchObject({
      matched: true,
      category: { id: "crisis" },
    });
  });

  describe("phrase-across-whitespace — matcher needs the EXACT single-space phrase (KNOWN-BAD: irregular whitespace defeats it)", () => {
    it("matches with the exact single space between words", () => {
      expect(detectSafetyConcern("kill myself")).toMatchObject({
        matched: true,
        category: { id: "crisis" },
      });
    });

    it("does NOT match when a double space splits the phrase (current behavior)", () => {
      expect(detectSafetyConcern("kill  myself")).toEqual({ matched: false });
    });

    it("does NOT match when a newline splits the phrase (current behavior)", () => {
      expect(detectSafetyConcern("kill\nmyself")).toEqual({ matched: false });
    });
  });

  it("empty string → no match", () => {
    expect(detectSafetyConcern("")).toEqual({ matched: false });
  });

  it("non-string input is guarded → no match (defensive runtime path)", () => {
    // detect.ts guards `typeof content !== "string"`. Cast past the TS signature
    // to pin the runtime guard, since a wired caller could pass a bad value.
    expect(detectSafetyConcern(undefined as unknown as string)).toEqual({
      matched: false,
    });
    expect(detectSafetyConcern(null as unknown as string)).toEqual({
      matched: false,
    });
  });

  it("long benign athlete journal entry → no match", () => {
    const entry = [
      "Tonight's game was rough. I let in three goals in the first period",
      "and coach pulled me. I sat on the bench feeling like I let the whole",
      "team down. But coach reminded me one bad period doesn't define who I am.",
      "I prayed about it, took a deep breath, and remembered my worth isn't tied",
      "to my save percentage. Next game I'll be ready. Compete from victory.",
    ].join(" ");
    expect(detectSafetyConcern(entry)).toEqual({ matched: false });
  });
});

// ---------------------------------------------------------------------------
// 4. PRIVACY CONTRACT (Option C: event, not content).
//
//    The detection result must surface ONLY the category taxonomy (id / label /
//    resources_focus) plus the static vocabulary list. It must NEVER echo back
//    the athlete's own free text. The caller logs this result as an EVENT; if
//    the athlete's words leaked into it, logging the event would leak content.
//
//    Nuance: the matched keyword phrase (e.g. "want to die") legitimately
//    appears in result.category.keywords because that array is OUR static
//    config — not athlete-authored content. The contract we assert is that the
//    athlete's SURROUNDING private words never appear in the result.
// ---------------------------------------------------------------------------
describe("privacy contract — result carries category only, never input content", () => {
  it("a match returns exactly { matched, category } with no content fields", () => {
    const result = detectSafetyConcern(
      "PRIVATE_SENTINEL_TEXT i want to die ANOTHER_SECRET",
    );
    expect(result.matched).toBe(true);
    expect(Object.keys(result).sort()).toEqual(["category", "matched"]);
  });

  it("the category object exposes only taxonomy + static vocabulary, no content", () => {
    const result = detectSafetyConcern("i want to die");
    if (!result.matched) throw new Error("expected a match for this fixture");
    expect(Object.keys(result.category).sort()).toEqual([
      "id",
      "keywords",
      "label",
      "resources_focus",
    ]);
  });

  it("never echoes the athlete's surrounding private text into the result", () => {
    // Unique sentinels that are NOT vocabulary phrases. The serialized result
    // must not contain them — only the static category/vocabulary may appear.
    const result = detectSafetyConcern(
      "zzsentinelalpha i want to die zzsentinelomega",
    );
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("zzsentinelalpha");
    expect(serialized).not.toContain("zzsentinelomega");
  });

  it("a non-match returns exactly { matched: false } (no content echo)", () => {
    expect(detectSafetyConcern("just a normal entry about practice")).toEqual({
      matched: false,
    });
  });
});
