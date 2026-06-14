import "server-only";

import { safetyVocabulary, type SafetyCategory } from "./keywords";

export type SafetyDetection =
  | { matched: true; category: SafetyCategory }
  | { matched: false };

/**
 * Server-side keyword detection on a journal entry.
 *
 * Implements CLAUDE.md Journal Safety Architecture (Option C):
 *   - athlete writes privately
 *   - this function runs on submission (PR-09 will wire it)
 *   - if a match is found, caller shows the resource screen and logs
 *     an event (logSafetyEvent in ./log.ts)
 *
 * Matching strategy is case-insensitive substring against multi-word
 * phrases, with whitespace runs (incl. newlines/tabs) collapsed to a single
 * space first so phrases still match across the line breaks and irregular
 * spacing that real journal entries contain. Categories are checked in order —
 * the FIRST match wins. Order matters: vocabulary.categories[0] is the highest
 * urgency.
 *
 * Detection is best-effort. The keyword list is a stub pending clinical
 * advisor review (CLAUDE.md Open Items). False negatives are expected.
 */
export function detectSafetyConcern(content: string): SafetyDetection {
  if (typeof content !== "string" || content.length === 0) {
    return { matched: false };
  }

  // Collapse whitespace runs (incl. newlines/tabs) to a single space and trim,
  // so multi-word phrases match despite the line breaks and sloppy spacing real
  // journal input carries ("burn myself\nout", "made  me  do"). The vocabulary
  // is single-spaced, so this aligns the haystack to it; the vocabulary itself
  // is untouched (FV-187).
  const haystack = content.toLowerCase().replace(/\s+/g, " ").trim();

  for (const category of safetyVocabulary.categories) {
    for (const keyword of category.keywords) {
      if (haystack.includes(keyword.toLowerCase())) {
        return { matched: true, category };
      }
    }
  }

  return { matched: false };
}
