import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";

// Derives the live-sport prose list from SUPPORTED_SPORTS (FV-517) so a
// future live sport is reflected automatically everywhere the sentence
// appears, without changing the visible text as currently rendered:
// sportLabel capitalizes every sport, so mid-sentence entries are lowercased
// to match the grammatical capitalization of the original hand-written copy
// (only the first word of the sentence stays capitalized).
export function joinSportsProse(labels: readonly string[]): string {
  const cased = labels.map((label, i) => (i === 0 ? label : label.toLowerCase()));
  if (cased.length === 0) return "";
  if (cased.length === 1) return cased[0] ?? "";
  if (cased.length === 2) return `${cased[0]} and ${cased[1]}`;
  return `${cased.slice(0, -1).join(", ")}, and ${cased[cased.length - 1]}`;
}

export const LIVE_SPORTS_PROSE = joinSportsProse(SUPPORTED_SPORTS.map(sportLabel));
