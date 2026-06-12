// Converts a scripture reference string (e.g. "Romans 8:37", "Hebrews 12:1-2")
// to a YouVersion/bible.com deep-link URL for the NIV translation (version 111).
// Returns null for unrecognised books — no link beats a broken link.

const USFM: Record<string, string> = {
  // Old Testament
  genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM",
  deuteronomy: "DEU", joshua: "JOS", judges: "JDG", ruth: "RUT",
  "1 samuel": "1SA", "2 samuel": "2SA", "1 kings": "1KI", "2 kings": "2KI",
  "1 chronicles": "1CH", "2 chronicles": "2CH", ezra: "EZR",
  nehemiah: "NEH", esther: "EST", job: "JOB",
  psalms: "PSA", psalm: "PSA",
  proverbs: "PRO", ecclesiastes: "ECC", "song of solomon": "SNG",
  "song of songs": "SNG", isaiah: "ISA", jeremiah: "JER",
  lamentations: "LAM", ezekiel: "EZK", daniel: "DAN", hosea: "HOS",
  joel: "JOL", amos: "AMO", obadiah: "OBA", jonah: "JON", micah: "MIC",
  nahum: "NAM", habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG",
  zechariah: "ZEC", malachi: "MAL",
  // New Testament
  matthew: "MAT", mark: "MRK", luke: "LUK", john: "JHN", acts: "ACT",
  romans: "ROM", "1 corinthians": "1CO", "2 corinthians": "2CO",
  galatians: "GAL", ephesians: "EPH", philippians: "PHP", colossians: "COL",
  "1 thessalonians": "1TH", "2 thessalonians": "2TH",
  "1 timothy": "1TI", "2 timothy": "2TI", titus: "TIT", philemon: "PHM",
  hebrews: "HEB", james: "JAS", "1 peter": "1PE", "2 peter": "2PE",
  "1 john": "1JN", "2 john": "2JN", "3 john": "3JN", jude: "JUD",
  revelation: "REV",
};

const NIV_VERSION_ID = 111;

/**
 * Build a bible.com/YouVersion URL from a human-readable scripture ref.
 *
 * Supported formats:
 *   "Romans 8:37"        → https://www.bible.com/bible/111/ROM.8.37.NIV
 *   "Hebrews 12:1-2"     → https://www.bible.com/bible/111/HEB.12.1-2.NIV
 *   "1 Corinthians 9:24" → https://www.bible.com/bible/111/1CO.9.24.NIV
 */
export function bibleLink(ref: string): string | null {
  // Capture: optional leading digit + book words, chapter, verse (with optional range)
  const m = ref
    .trim()
    .match(/^((?:\d\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+(?:-\d+)?)$/);
  if (!m) return null;

  const bookKey = (m[1] ?? "").trim().toLowerCase();
  const chapter = m[2] ?? "";
  const verse = m[3] ?? "";

  const code = USFM[bookKey];
  if (!code) return null;

  return `https://www.bible.com/bible/${NIV_VERSION_ID}/${code}.${chapter}.${verse}.NIV`;
}
