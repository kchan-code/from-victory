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
 * phrases. Categories are checked in order — the FIRST match wins.
 * Order matters: vocabulary.categories[0] is the highest urgency.
 *
 * Detection is best-effort. The keyword list is a stub pending clinical
 * advisor review (CLAUDE.md Open Items). False negatives are expected.
 */
export function detectSafetyConcern(content: string): SafetyDetection {
  if (typeof content !== "string" || content.length === 0) {
    return { matched: false };
  }

  const haystack = content.toLowerCase();

  for (const category of safetyVocabulary.categories) {
    for (const keyword of category.keywords) {
      if (haystack.includes(keyword.toLowerCase())) {
        return { matched: true, category };
      }
    }
  }

  return { matched: false };
}
