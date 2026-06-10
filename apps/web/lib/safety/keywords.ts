import "server-only";

// Loaded at server start. The keyword vocabulary is a stub pending
// clinical-advisor review per CLAUDE.md Open Items.
// Lives at apps/web/lib/safety/safety-keywords.json (FV-173).
import keywordsData from "./safety-keywords.json";

export type SafetyResourcesFocus =
  | "988_lifeline"
  | "crisis_text_line"
  | "trusted_adult";

export type SafetyCategory = {
  id: string;
  label: string;
  resources_focus: SafetyResourcesFocus;
  keywords: string[];
};

export type SafetyVocabulary = {
  version: number;
  status: string;
  matching_strategy: string;
  categories: SafetyCategory[];
};

export const safetyVocabulary = keywordsData as unknown as SafetyVocabulary;
