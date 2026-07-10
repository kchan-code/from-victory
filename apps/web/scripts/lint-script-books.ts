#!/usr/bin/env node
// FV-400 — deterministic banned-phrase + reframe-repetition lint for the
// pregame script books (docs/scripts/*.md).
//
// WHY: docs/pregame-script-style.md ("the de-corned voice") documents a set
// of banned phrases and clichés that KC hand-edited out of the hockey +
// basketball hard-moment (HM) and opener scripts. Nothing enforced that spec
// mechanically — new cells (new sports, new positions) could silently
// reintroduce the corny patterns. This script is that enforcement, wired
// into CI via the `script-book-lint` job in .github/workflows/ci.yml.
//
// SYNC RULE (read this before editing the phrase lists below): the banned
// phrases, the negation-pivot rule, and the standardized-reframe allowlist
// are mirrored from docs/pregame-script-style.md § "Quick banned-phrase
// list", § "Standardized reframes" (the table under Part 1), Part 2 rule 2
// (one honest negation is canon; stacked/unresolved negation is not), and
// § "The gated cells". This file is synced to the FV-398-RECONCILED spec
// (2026-07-08, PR #304). If a later spec revision changes a banned phrase, a
// standardized reframe, the negation rule, or the gated-cell set, re-diff
// this file's SIMPLE_RULES / STANDARDIZED_REFRAME_CORES /
// NEGATION_RESOLUTION_RE / GATED_IDENTITY_CELLS against the spec and update
// both in the same PR.
//
// SCOPE (what gets scanned): only cells whose slug starts with `hm-`
// (hard-moment) or `opener-`. VIZ/positive-play cells were explicitly left
// untouched by the de-cheesing pass (see spec's "What did NOT change") so
// they are out of scope here too. "Full-Session Cells (legacy...)" sections
// and pre-compositional session-*.ts-backed cells use non-`hm-`/non-`opener-`
// slugs (e.g. `bb-guard-turnover`), so they fall out of scope automatically —
// they are known-corny legacy copy, not the live compositional clip path.
// "Text-mode fallback" sections use a different comment format entirely
// (`<!-- audioScriptN | eyebrow: ... -->`, no `slug:` key) and are excluded
// entirely from rule scanning; they're counted in the summary line only.
//
// RULE SCOPE (per-rule, not "all rules everywhere"):
//   - The body-checklist, mindfulness-platitude, "reset and go again",
//     identity/worth-phrase, "from victory" tagline, and somatic-trio rules
//     scan `hm-*` cells only — they're HM-cell antipatterns by definition in
//     the spec.
//   - The negation rule scans BOTH `hm-*` and `opener-*` cells, with
//     different strictness (spec Part 2 rule 2, FV-398 reconciliation):
//       * hm-* cells: ANY "does not mean / doesn't mean" occurrence flags —
//         exposition-by-negation has no place inside a hard-moment reset.
//       * opener-* cells: ONE negation with an immediate affirmation pivot
//         is AUTHORIZED canon (shipped Reset/Calm/Decisions openers use it).
//         Flag only STACKED negation (>=2 "does not mean" constructions in
//         one cell) or UNRESOLVED negation (a negation never followed by a
//         positive resolution — "but it means / it means / he says / but it
//         does" — later in the same cell).
//   - The identity/worth-phrase rules ("It is not your identity / who you
//     are", "Your worth is secure", and the "from victory" tagline) are the
//     ONLY rules exempted for `opener-*` cells and for the clinically GATED
//     identity-collapse cells — those lines are canon there (the opener is
//     where the identity truth is meant to land; a gated cell is the one
//     place the worth truth is allowed back inside an HM cell). Gating is
//     NOT a marker in the books: it is picker withholding via
//     `roleAdversities` in apps/web/components/pregame/sport-registry.ts
//     (FV-119 pattern), so this script carries the gated slugs as the
//     explicit GATED_IDENTITY_CELLS allowlist below.
//   - The rule-2a line-3 checks (capability/identity verdict, status/
//     permanence verdict, other-party trust verdict — KC, FV-412, spec
//     "2a. The thought's CONTENT is constrained — defuse, don't install")
//     scan ONLY the numbered line-3 text of `hm-*` cells (the "The thought
//     hits: ___" / "You think, ___" line) — never line 5's reframe, which
//     legitimately carries sanctioned worth motifs ("It does not have your
//     worth."). They are also exempted on GATED_IDENTITY_CELLS: a gated
//     cell's thought line is the clinically-owned identity-collapse subject
//     (FV-119 territory), not a mechanical rule-2a violation.
//
// Usage (dependency-free — node stdlib only, run exactly like sibling
// scripts):
//   node --experimental-strip-types apps/web/scripts/lint-script-books.ts
//   node --experimental-strip-types apps/web/scripts/lint-script-books.ts --json
//
// Exit codes: 0 = clean (or only advisory / LEGACY_PENDING_KC hits),
//             1 = a non-legacy blocking hit was found,
//             2 = usage / IO error.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Resolve relative to apps/web/scripts/ -> apps/web -> repo root, exactly
// like export-scripts.ts / apply-scripts.ts.
const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const DOCS_SCRIPTS_DIR = join(REPO_ROOT, "docs", "scripts");
const STYLE_SPEC_REL_PATH = "docs/pregame-script-style.md";

// ---------------------------------------------------------------------------
// LEGACY_PENDING_KC — known pre-existing hits on `main` as of FV-400.
// ---------------------------------------------------------------------------
// These are real findings — KC (via FV-398, "Pregame script de-corn" — see
// docs/pregame-script-style.md) owns the decision on whether/how to fix each
// one. FV-400's job is to make the gate mechanically real and GREEN on day
// one, not to silently fix or hide pre-existing content. Each entry
// downgrades ONE (slug, ruleId) pair from a blocking failure to a visible
// "[LEGACY_PENDING_KC]"-tagged line in the output — it still prints, it does
// not fail the build. Any NEW hit (a new slug, or an existing slug tripping a
// DIFFERENT rule) still fails CI. Do not add to this list to make new content
// pass — only KC / a follow-up FV-398 decision should grow it.
type LegacyKey = `${string}::${string}`; // `${slug}::${ruleId}`
const LEGACY_PENDING_KC: ReadonlySet<LegacyKey> = new Set<LegacyKey>([
  // "Feel what your body does" (banned stock line-3 opener) — spec's "Open KC
  // decisions" items 1-4 catalog these four cells verbatim as canon drift.
  "hm-forward-coach-yells::feel-what-your-body-does",
  "hm-forward-start-slow::feel-what-your-body-does",
  "hm-defense-bad-penalty::feel-what-your-body-does",
  "hm-bb-guard-nervous::feel-what-your-body-does",
  // "Come back to your breath / right now / base" (banned HM mindfulness
  // platitude) — spec's "Open KC decisions" item 4.
  "hm-bb-guard-nervous::come-back-mindfulness-platitude",
  // Unresolved negation in the Joy openers (hockey + basketball share the
  // wording): "Joy does not mean you fake a smile..." pivots to "Paul ties
  // joy to prayer and thanksgiving" — a real affirmation, but not phrased
  // with any of the spec's resolution markers ("but it means / it means /
  // he says / but it does"), so the deterministic check can't see it.
  // Whether to ratify the phrasing or re-cut it is a KC call (FV-398).
  "opener-joy::teaching-by-negation",
  "opener-bb-joy::teaching-by-negation",
]);

// ---------------------------------------------------------------------------
// GATED_IDENTITY_CELLS — clinically gated identity-collapse cells.
// ---------------------------------------------------------------------------
// Mirrors docs/pregame-script-style.md § "The gated cells" (FV-398
// reconciliation): gating is NOT a flag in the books — it's picker
// withholding via the `roleAdversities` overrides in
// apps/web/components/pregame/sport-registry.ts (FV-119 pattern). These
// slugs are the one place the worth truth is authorized INSIDE an HM cell
// (a 7th worth-truth line, or identity woven into line 5), so they are
// exempt from the identity/worth-phrase checks ONLY. Every other rule still
// applies to them. Keep in sync with the spec's gated-cells section and the
// sport-registry withholds.
const GATED_IDENTITY_CELLS: ReadonlySet<string> = new Set<string>([
  // golf first-tee (all three profiles) — the swing-deserts-you umbrella
  "hm-glf-bomber-first-tee",
  "hm-glf-ballstriker-first-tee",
  "hm-glf-scrambler-first-tee",
  // baseball lose-command (Catcher + Infield — the throwing yips; Outfield's
  // version is a bad throw, not gated)
  "hm-bsb-catcher-lose-command",
  "hm-bsb-infield-lose-command",
  // hockey pulled — the authorized in-cell worth-clause variant ("The bench
  // has your body for now. It does not have your worth.")
  "hm-goalie-pulled",
  // lacrosse yips-class (FV-404 §4 / FV-406 — withheld via roleAdversities
  // omission in sport-registry.ts): the FOGO clamp, the goalie save, and the
  // pole's throwing yips (the routine clear). Authorized worth register only.
  "hm-lax-fogo-clamp-yips",
  "hm-lax-goalie-save-yips",
  "hm-lax-defense-clear-yips",
]);

// ---------------------------------------------------------------------------
// Standardized reframes (allowlisted from the advisory repetition check) —
// verbatim CORE fragments from docs/pregame-script-style.md's
// "Standardized reframes" table. The scripts adapt vocabulary per sport (a
// golfer doesn't "get one stop") per the spec's own instruction, so we match
// on the invariant fragment of each motif rather than the full table
// sentence, which never appears untouched outside hockey.
// ---------------------------------------------------------------------------
const STANDARDIZED_REFRAME_CORES: readonly string[] = [
  "the volume is not the verdict", // Coach yells / correction
  "does not have your mind", // Benched / pulled
  "these nerves are energy, not danger", // Nervous
  "does not own the next one", // Beaten / cooked / got-by
  "that run is over", // Fall behind early
  "the whistle happened", // Penalty / whistle
].map(normalizeForCompare);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NumberedLine {
  label: number;
  text: string;
  lineNo: number; // 1-based absolute line number in the source file
}

interface Cell {
  file: string; // e.g. "hockey.md"
  slug: string;
  headingLineNo: number;
  numberedLines: NumberedLine[];
}

interface BlockingHit {
  file: string;
  lineNo: number;
  slug: string;
  ruleId: string;
  ruleLabel: string;
  text: string;
  legacy: boolean;
}

interface AdvisoryGroup {
  normalizedText: string;
  sampleText: string;
  occurrences: { file: string; lineNo: number; slug: string }[];
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const HEADING_RE = /^###\s+(.*)$/;
const SECTION_RE = /^##\s+(.*)$/;
const SLUG_COMMENT_RE = /^<!--\s*slug:\s*([a-zA-Z0-9-]+)\s*\|/;
const NUMBERED_LINE_RE = /^(\d+)\.\s+(.*)$/;
const TEXT_MODE_FALLBACK_SECTION_RE = /^##\s+Text-mode fallback/i;
const AUDIOSCRIPT_COMMENT_RE = /^<!--\s*audioScript#\d+/;

/** Parse one script-book markdown file into its `hm-*`/`opener-*` cells. */
function parseBook(fileBasename: string, content: string): {
  cells: Cell[];
  textModeFallbackCellCount: number;
} {
  const lines = content.split(/\r?\n/);
  const cells: Cell[] = [];
  let textModeFallbackCellCount = 0;
  let inTextModeFallback = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line === undefined) break; // unreachable (i < length); satisfies noUncheckedIndexedAccess

    if (SECTION_RE.test(line)) {
      inTextModeFallback = TEXT_MODE_FALLBACK_SECTION_RE.test(line);
      i++;
      continue;
    }

    if (inTextModeFallback) {
      if (AUDIOSCRIPT_COMMENT_RE.test(line)) textModeFallbackCellCount++;
      i++;
      continue;
    }

    const headingMatch = line.match(HEADING_RE);
    if (!headingMatch) {
      i++;
      continue;
    }

    const headingLineNo = i + 1;

    // Look ahead (skipping blank lines) for the `<!-- slug: ... -->` comment
    // and any other HTML comments before the first numbered line.
    let j = i + 1;
    let slug: string | null = null;
    while (j < lines.length) {
      const candidate = lines[j];
      if (candidate === undefined) break; // unreachable (j < length); satisfies noUncheckedIndexedAccess
      if (candidate.trim() === "") {
        j++;
        continue;
      }
      const slugMatch = candidate.match(SLUG_COMMENT_RE);
      if (slugMatch) {
        slug = slugMatch[1] ?? null;
        j++;
        continue;
      }
      if (candidate.startsWith("<!--")) {
        j++;
        continue;
      }
      break; // hit the first non-comment, non-blank line
    }

    if (!slug) {
      // Not a slug-bearing cell (e.g. a plain prose "### " heading in
      // HOW TO EDIT). Nothing to scan; move on.
      i = j;
      continue;
    }

    // Collect numbered prose lines until the next heading (### or ##) or EOF.
    const numberedLines: NumberedLine[] = [];
    let k = j;
    while (k < lines.length) {
      const candidate = lines[k];
      if (candidate === undefined) break; // unreachable (k < length); satisfies noUncheckedIndexedAccess
      if (HEADING_RE.test(candidate) || SECTION_RE.test(candidate)) break;
      const numMatch = candidate.match(NUMBERED_LINE_RE);
      if (numMatch) {
        numberedLines.push({
          label: Number(numMatch[1]),
          text: numMatch[2] ?? "",
          lineNo: k + 1,
        });
      }
      k++;
    }

    cells.push({ file: fileBasename, slug, headingLineNo, numberedLines });
    i = k;
  }

  return { cells, textModeFallbackCellCount };
}

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

/** Tolerate straight (') and curly (’) apostrophes uniformly. */
function apostropheTolerant(pattern: string): string {
  return pattern.replace(/'/g, "['’]");
}

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’"“”]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cellProse(cell: Cell): string {
  return cell.numberedLines.map((l) => l.text).join(" ");
}

// ---------------------------------------------------------------------------
// Blocking rules
// ---------------------------------------------------------------------------

interface SimpleRule {
  id: string;
  label: string;
  /** Skip this rule on GATED_IDENTITY_CELLS (identity/worth canon there). */
  identityWorthExempt?: boolean;
  /** Restrict this rule to one numbered-line label (e.g. 3 = the thought line). Unset = scan every line. */
  lineScope?: number;
  regex: RegExp;
}

// All simple rules scan hm-* cells only; the negation rule (opener side) has
// its own stacked/unresolved logic below.
const SIMPLE_RULES: SimpleRule[] = [
  {
    id: "feel-what-your-body-does",
    label: 'Banned stock line-3: "Feel what your body does."',
    regex: /feel what your body does/i,
  },
  {
    id: "come-back-mindfulness-platitude",
    label: 'Banned mindfulness platitude: "Come back to your breath / right now / base."',
    regex: new RegExp(
      apostropheTolerant("come back to your breath|come back to right now|come back to your base"),
      "i",
    ),
  },
  {
    id: "identity-worth-phrase",
    label: 'Banned HM closer: "It is not your identity / who you are."',
    identityWorthExempt: true,
    regex: new RegExp(
      apostropheTolerant(
        "it is not your identity|it's not your identity|it is not who you are|it's not who you are",
      ),
      "i",
    ),
  },
  {
    id: "your-worth-is-secure",
    label: 'Banned HM closer: "Your worth is secure." (verbatim — FV-339 blockquote wording)',
    identityWorthExempt: true,
    regex: new RegExp(apostropheTolerant("your worth is secure"), "i"),
  },
  {
    id: "reset-and-go-again",
    label: 'Banned HM closer: "Reset and go again."',
    regex: /reset and go again/i,
  },
  {
    id: "teaching-by-negation",
    label: 'Exposition-by-negation in an HM cell: "does not mean" / "doesn\'t mean."',
    regex: new RegExp(apostropheTolerant("does not mean|doesn't mean"), "i"),
  },
  {
    id: "from-victory-tagline",
    label: 'Brand tagline stapled into HM prose: "from victory."',
    identityWorthExempt: true,
    regex: /from victory/i,
  },
  // Rule 2a (KC, 2026-07-09, FV-412) — the thought's CONTENT is constrained:
  // defuse, don't install. Scoped to line 3 (the "The thought hits: ___" /
  // "You think, ___" line) only — never the reframe (line 5), which
  // legitimately carries sanctioned worth motifs. Exempt on
  // GATED_IDENTITY_CELLS: the identity lie is the clinical subject there.
  {
    id: "rule2a-capability-verdict",
    label:
      'Banned line-3 intrusive thought (capability/identity verdict), rule 2a: "I\'m not ready for this."',
    identityWorthExempt: true,
    lineScope: 3,
    regex: /not ready for this/i,
  },
  {
    id: "rule2a-status-permanence-verdict",
    label:
      'Banned line-3 intrusive thought (status/permanence verdict), rule 2a: "I lost my spot" / "I\'m done here" / "I lost the staff."',
    identityWorthExempt: true,
    lineScope: 3,
    regex: new RegExp(
      apostropheTolerant("i lost my spot|i'm done here|i lost the staff"),
      "i",
    ),
  },
  {
    id: "rule2a-other-party-trust-verdict",
    label:
      'Banned line-3 intrusive thought (other-party judgment read), rule 2a: "don\'t / doesn\'t / can\'t trust me" or "can\'t be trusted."',
    identityWorthExempt: true,
    lineScope: 3,
    regex: new RegExp(
      apostropheTolerant("don't trust me|doesn't trust me|can't trust me|can't be trusted"),
      "i",
    ),
  },
];

// Opener negation (spec Part 2 rule 2, FV-398 reconciliation): one negation
// with an immediate affirmation pivot is authorized; flag only stacked (>=2)
// or unresolved negation. Resolution markers per the reconciled canon.
const NEGATION_RE_SOURCE = apostropheTolerant("does not mean|doesn't mean");
const NEGATION_RESOLUTION_RE = new RegExp(
  "but it means|it means|he says|but it does",
  "i",
);
const OPENER_NEGATION_RULE = {
  id: "teaching-by-negation",
  stackedLabel:
    'Stacked negation in an opener (>=2 "does not mean" constructions in one cell).',
  unresolvedLabel:
    "Unresolved negation in an opener (no affirmation pivot after the negation).",
};

const SOMATIC_TRIO_RULE = {
  id: "somatic-trio",
  label: 'Stock somatic trio ("Stomach drop" / "Heat in your face" / "Tight chest") appearing together.',
};
const SOMATIC_TRIO_PARTS = ["stomach drop", "heat in your face", "tight chest"];

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

/**
 * Opener-cell negation check (spec Part 2 rule 2): flag stacked negation
 * (>=2 occurrences in the cell) or an unresolved negation (no affirmation
 * pivot anywhere after the negation in the cell's prose).
 */
function scanOpenerNegation(cell: Cell): BlockingHit[] {
  const negationRe = new RegExp(NEGATION_RE_SOURCE, "gi");

  // Occurrences across the cell's numbered lines, in order, with the text
  // remaining after each match (rest of its line + all later lines).
  const occurrences: { line: NumberedLine; textAfter: string }[] = [];
  for (let li = 0; li < cell.numberedLines.length; li++) {
    const nl = cell.numberedLines[li];
    if (nl === undefined) continue; // unreachable (li < length); satisfies noUncheckedIndexedAccess
    negationRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = negationRe.exec(nl.text)) !== null) {
      const restOfLine = nl.text.slice(m.index + m[0].length);
      const laterLines = cell.numberedLines
        .slice(li + 1)
        .map((l) => l.text)
        .join(" ");
      occurrences.push({ line: nl, textAfter: `${restOfLine} ${laterLines}` });
    }
  }

  if (occurrences.length === 0) return [];

  const key: LegacyKey = `${cell.slug}::${OPENER_NEGATION_RULE.id}`;
  const legacy = LEGACY_PENDING_KC.has(key);

  if (occurrences.length >= 2) {
    // Stacked: flag every occurrence.
    return occurrences.map((occ) => ({
      file: cell.file,
      lineNo: occ.line.lineNo,
      slug: cell.slug,
      ruleId: OPENER_NEGATION_RULE.id,
      ruleLabel: OPENER_NEGATION_RULE.stackedLabel,
      text: occ.line.text,
      legacy,
    }));
  }

  // Exactly one: authorized IF a positive resolution follows it in the cell.
  const only = occurrences[0];
  if (only === undefined) return []; // unreachable (length === 1); satisfies noUncheckedIndexedAccess
  if (NEGATION_RESOLUTION_RE.test(only.textAfter)) return [];
  return [
    {
      file: cell.file,
      lineNo: only.line.lineNo,
      slug: cell.slug,
      ruleId: OPENER_NEGATION_RULE.id,
      ruleLabel: OPENER_NEGATION_RULE.unresolvedLabel,
      text: only.line.text,
      legacy,
    },
  ];
}

function scanBlocking(cells: Cell[]): BlockingHit[] {
  const hits: BlockingHit[] = [];

  for (const cell of cells) {
    const isHm = cell.slug.startsWith("hm-");
    const isOpener = cell.slug.startsWith("opener-");
    if (!isHm && !isOpener) continue; // out of scope (VIZ, shared, etc.)

    if (isOpener) {
      // Openers: only the stacked/unresolved negation check applies. The
      // identity/worth lines are canon in openers; the HM antipattern rules
      // don't govern opener prose.
      hits.push(...scanOpenerNegation(cell));
      continue;
    }

    const identityWorthExempt = GATED_IDENTITY_CELLS.has(cell.slug);

    for (const rule of SIMPLE_RULES) {
      if (rule.identityWorthExempt && identityWorthExempt) continue;

      for (const nl of cell.numberedLines) {
        if (rule.lineScope !== undefined && nl.label !== rule.lineScope) continue;
        if (rule.regex.test(nl.text)) {
          const key: LegacyKey = `${cell.slug}::${rule.id}`;
          hits.push({
            file: cell.file,
            lineNo: nl.lineNo,
            slug: cell.slug,
            ruleId: rule.id,
            ruleLabel: rule.label,
            text: nl.text,
            legacy: LEGACY_PENDING_KC.has(key),
          });
        }
      }
    }

    // Somatic trio: whole-cell check (hm-* only — this is the old line-3
    // template pattern, not something opener prose would ever contain).
    {
      const prose = cellProse(cell).toLowerCase();
      const allPresent = SOMATIC_TRIO_PARTS.every((part) => prose.includes(part));
      if (allPresent) {
        const key: LegacyKey = `${cell.slug}::${SOMATIC_TRIO_RULE.id}`;
        // Report against the first numbered line that contains any trio part,
        // so the hit points somewhere concrete in the file.
        const anchor =
          cell.numberedLines.find((nl) =>
            SOMATIC_TRIO_PARTS.some((part) => nl.text.toLowerCase().includes(part)),
          ) ?? cell.numberedLines[0];
        hits.push({
          file: cell.file,
          lineNo: anchor?.lineNo ?? cell.headingLineNo,
          slug: cell.slug,
          ruleId: SOMATIC_TRIO_RULE.id,
          ruleLabel: SOMATIC_TRIO_RULE.label,
          text: anchor?.text ?? "(somatic trio spread across cell)",
          legacy: LEGACY_PENDING_KC.has(key),
        });
      }
    }
  }

  return hits;
}

function scanAdvisory(cells: Cell[]): AdvisoryGroup[] {
  // Only hm-* cells' numbered line "5" (the reframe line, per the 6-line
  // de-corned HM shape in docs/pregame-script-style.md Part 1).
  const groups = new Map<string, AdvisoryGroup>();

  for (const cell of cells) {
    if (!cell.slug.startsWith("hm-")) continue;
    const line5 = cell.numberedLines.find((nl) => nl.label === 5);
    if (!line5 || !line5.text.trim()) continue;

    const normalized = normalizeForCompare(line5.text);
    if (!normalized) continue;

    // Blessed standardized motif — excluded from repetition counting.
    const isBlessed = STANDARDIZED_REFRAME_CORES.some((core) => normalized.includes(core));
    if (isBlessed) continue;

    let group = groups.get(normalized);
    if (!group) {
      group = { normalizedText: normalized, sampleText: line5.text, occurrences: [] };
      groups.set(normalized, group);
    }
    group.occurrences.push({ file: cell.file, lineNo: line5.lineNo, slug: cell.slug });
  }

  return [...groups.values()]
    .filter((g) => g.occurrences.length > 2)
    .sort((a, b) => b.occurrences.length - a.occurrences.length);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function loadBooks(): { fileBasename: string; content: string }[] {
  const entries = readdirSync(DOCS_SCRIPTS_DIR).filter(
    (f) => f.endsWith(".md") && f !== "README.md",
  );
  return entries
    .sort()
    .map((f) => ({ fileBasename: f, content: readFileSync(join(DOCS_SCRIPTS_DIR, f), "utf8") }));
}

function main(): number {
  const jsonMode = process.argv.includes("--json");

  let books: { fileBasename: string; content: string }[];
  try {
    books = loadBooks();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[script-book-lint] Could not read ${DOCS_SCRIPTS_DIR}: ${msg}`);
    return 2;
  }

  const allCells: Cell[] = [];
  let textModeFallbackTotal = 0;

  for (const { fileBasename, content } of books) {
    const { cells, textModeFallbackCellCount } = parseBook(fileBasename, content);
    allCells.push(...cells);
    textModeFallbackTotal += textModeFallbackCellCount;
  }

  const scannedCells = allCells.filter(
    (c) => c.slug.startsWith("hm-") || c.slug.startsWith("opener-"),
  );

  const blockingHits = scanBlocking(allCells).sort(
    (a, b) => a.file.localeCompare(b.file) || a.lineNo - b.lineNo,
  );
  const advisoryGroups = scanAdvisory(allCells);

  const failingHits = blockingHits.filter((h) => !h.legacy);
  const legacyHits = blockingHits.filter((h) => h.legacy);

  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          scannedCells: scannedCells.length,
          textModeFallbackCells: textModeFallbackTotal,
          blocking: blockingHits,
          advisory: advisoryGroups,
          failingCount: failingHits.length,
          legacyCount: legacyHits.length,
        },
        null,
        2,
      ),
    );
    return failingHits.length > 0 ? 1 : 0;
  }

  console.log(
    `[script-book-lint] Scanning ${books.length} book(s) — ${scannedCells.length} hm-*/opener-* cell(s), ` +
      `${textModeFallbackTotal} text-mode-fallback entr${textModeFallbackTotal === 1 ? "y" : "ies"} (not scanned).`,
  );
  console.log("");

  if (blockingHits.length === 0) {
    console.log("[script-book-lint] BLOCKING: no hits. ✓");
  } else {
    console.log(`[script-book-lint] BLOCKING (${failingHits.length} failing, ${legacyHits.length} LEGACY_PENDING_KC):`);
    for (const hit of blockingHits) {
      const tag = hit.legacy ? "[LEGACY_PENDING_KC] " : "";
      console.log(
        `  docs/scripts/${hit.file}:${hit.lineNo}  [${hit.slug}]  ${tag}${hit.ruleId} — ${hit.text}`,
      );
    }
  }

  console.log("");
  if (advisoryGroups.length === 0) {
    console.log("[script-book-lint] ADVISORY (reframe repetition): no groups over threshold. ✓");
  } else {
    console.log(
      `[script-book-lint] ADVISORY (reframe repetition, >2 hm-* cells sharing line-5 text, ` +
        `excluding standardized motifs — ${STYLE_SPEC_REL_PATH}):`,
    );
    for (const group of advisoryGroups) {
      console.log(`  "${group.sampleText}"  (${group.occurrences.length} cells)`);
      for (const occ of group.occurrences) {
        console.log(`    docs/scripts/${occ.file}:${occ.lineNo}  [${occ.slug}]`);
      }
    }
  }

  console.log("");
  console.log(
    `[script-book-lint] Summary: ${failingHits.length} failing, ${legacyHits.length} legacy-pending, ` +
      `${advisoryGroups.length} advisory group(s).`,
  );

  if (failingHits.length > 0) {
    console.error(
      "[script-book-lint] ✗ Blocking hit(s) found outside LEGACY_PENDING_KC. Fix the prose in docs/scripts/*.md, " +
        "or — if this is a pre-existing decision pending KC (FV-398) — do not add it to LEGACY_PENDING_KC yourself; flag it for KC.",
    );
    return 1;
  }

  console.log("[script-book-lint] ✓ Gate green.");
  return 0;
}

const invokedDirectly =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  process.exit(main());
}
