import "server-only";

// Loaded from @from-victory/content at server start. The keyword vocabulary
// is a stub pending clinical-advisor review per CLAUDE.md Open Items.
import keywordsData from "@from-victory/content/safety-keywords.json";

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
