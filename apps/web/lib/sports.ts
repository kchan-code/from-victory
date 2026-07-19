// Supported sports — the single source of truth for the athlete `sport`
// dimension. Must match the `sport_valid_values` CHECK constraint in
// supabase/migrations/20260602000000_athlete_sport.sql (widened for golf in
// 20260613020000_golf_db_enablement.sql) AND training_sessions_catalog.sport.
// To add a sport: add it here and extend the DB CHECK in a migration — keep the
// two in lockstep. Adding a sport here forces a typecheck failure on every
// `Record<Sport, …>` (SportPicker / ChangeSportFlow meta) until it gets an
// entry — that exhaustiveness is the safety net.
//
// Golf goes live at launch (KC directive 2026-06-12, overriding the FV-272
// founder gate). Football goes live per the 2026-07-19 KC launch directive
// (FV-206) — app-side wiring only; the DB sport CHECK widening is owned
// separately by the lead (FV-205; must land before football is truly usable
// end-to-end). Baseball stays DORMANT — content authored, not
// athlete-selectable — so it is intentionally absent here.
//
// Plain module (no "use server"): safe to import from server actions and
// client components alike (e.g. the FV-33 onboarding sport selector).
export const SUPPORTED_SPORTS = ["hockey", "basketball", "golf", "football"] as const;
export type Sport = (typeof SUPPORTED_SPORTS)[number];

// The interim default until the FV-33 onboarding selector ships. Hockey is the
// launch default; basketball athletes become creatable once FV-33 adds the
// selector so a parent can choose.
export const DEFAULT_SPORT: Sport = "hockey";

// Capitalized display label for a sport ("hockey" → "Hockey"). Single-word
// sports only — fine for the current set and any future single-word sport.
// Forward-compat: derived, not a hardcoded two-way branch, so a 3rd sport in
// SUPPORTED_SPORTS gets a label for free (FV-56 §4).
export function sportLabel(sport: Sport): string {
  return sport.charAt(0).toUpperCase() + sport.slice(1);
}
