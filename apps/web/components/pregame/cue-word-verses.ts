// FV-229 — Cue-word verse registry.
//
// Maps each of the 10 supported cue words (CUE_WORDS in types.ts) to a
// { reference, text } pair for the say-it-then-reveal memory loop on the
// Pregame Card. Custom cue words that are not in CUE_WORDS fall through to
// the default (the brand-spine Hebrews 12:2 memorize-core).
//
// NIV texts are VERBATIM-LOCKED — do not paraphrase. Source: youth-pastor
// curation (docs/cue-word-verses-fv229.md), verified against biblegateway.com
// 2026-06-11. NIV © 1973, 1978, 1984, 2011 Biblica, Inc.® (attribution on
// /terms per gating condition in docs/cue-word-verses-fv229.md).
//
// Style mirrors positive-plays.ts: pure data + a resolver, no React, no audio
// imports, safe to import from the card, tests, and any future server path.

export type CueWordVerse = {
  /** Bible reference, e.g. "Psalm 16:8". */
  reference: string;
  /** Verbatim NIV text. Do not edit without re-verifying against the source doc. */
  text: string;
};

// ── Verse map ──────────────────────────────────────────────────────────────
// Keys are lowercase-normalised at build time (the resolver does case-insensitive
// lookup); the display cue word comes from PregameState.cueWord, not from here.

const CUE_WORD_VERSE_MAP: Record<string, CueWordVerse> = {
  steady: {
    reference: "Psalm 16:8",
    text: "I keep my eyes always on the Lord. With him at my right hand, I will not be shaken.",
  },
  courage: {
    reference: "Joshua 1:9",
    text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
  },
  // Psalm 131 over Micah 6:8 (sports-psych + youth-pastor convergence): the
  // plain sense matches "make the simple play" without an interpretive
  // bridge at 13. See docs/cue-word-verses-fv229.md, KC decision 2.
  simple: {
    reference: "Psalm 131:1-2",
    text: "My heart is not proud, Lord, my eyes are not haughty; I do not concern myself with great matters or things too wonderful for me. But I have calmed and quieted myself, I am like a weaned child with its mother; like a weaned child I am content.",
  },
  attack: {
    reference: "1 Corinthians 16:13",
    text: "Be on your guard; stand firm in the faith; be courageous; be strong.",
  },
  next: {
    reference: "Lamentations 3:22-23",
    text: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
  },
  serve: {
    reference: "Mark 10:45",
    text: "For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.",
  },
  compete: {
    reference: "Colossians 3:23",
    text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters,",
  },
  faithful: {
    reference: "1 Thessalonians 5:24",
    text: "The one who calls you is faithful, and he will do it.",
  },
  free: {
    reference: "Galatians 5:1",
    text: "It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery.",
  },
  relentless: {
    reference: "Galatians 6:9",
    text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
  },
};

// ── Custom-word default ────────────────────────────────────────────────────
// Athletes who type a custom cue word have no mapped verse.
// The fallback is the brand-spine memorize-core (Hebrews 12:2, trimmed from
// the full 12:1-2 displayed elsewhere in the app) so the loop always has
// something worth memorising, and the default points to the founding text.
// Flagged for KC in docs/cue-word-verses-fv229.md.
const DEFAULT_VERSE: CueWordVerse = {
  reference: "Hebrews 12:2",
  text: "…fixing our eyes on Jesus, the pioneer and perfecter of faith.",
};

/**
 * Returns the verse for a cue word.
 *
 * - Matches the 10 canonical CUE_WORDS case-insensitively.
 * - For a custom word (not in the map) returns the Hebrews 12:2 default.
 * - Never returns undefined — always a { reference, text } object.
 */
export function verseForCueWord(word: string): CueWordVerse {
  const key = word.trim().toLowerCase();
  return CUE_WORD_VERSE_MAP[key] ?? DEFAULT_VERSE;
}

// Export the map for completeness tests (see __tests__/cue-word-verses.test.ts).
export { CUE_WORD_VERSE_MAP, DEFAULT_VERSE };
