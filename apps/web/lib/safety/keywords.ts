import "server-only";

// Loaded at server start. The keyword vocabulary is a stub pending
// clinical-advisor review per CLAUDE.md Open Items.
//
// CLAUDE.md originally specified this file at packages/content/
// safety-keywords.json so it could be shared across future apps. That
// abstraction is deferred — Vercel's default monorepo install didn't
// resolve npm workspaces reliably, and we have only one app today.
// When PR-07 lands shared training-session content and requires a
// proper monorepo Vercel build, move this back into packages/content.
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
