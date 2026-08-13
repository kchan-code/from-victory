// Supported sports — the single source of truth for the athlete `sport`
// dimension. Must match the `sport_valid_values` CHECK constraint in
// supabase/migrations/20260602000000_athlete_sport.sql (widened for golf in
// 20260613020000_golf_db_enablement.sql; widened for baseball via the FV-97
// migration, already applied in prod) AND training_sessions_catalog.sport.
// To add a sport: add it here and extend the DB CHECK in a migration — keep the
// two in lockstep. Adding a sport here forces a typecheck failure on every
// `Record<Sport, …>` (SportPicker / ChangeSportFlow meta) until it gets an
// entry — that exhaustiveness is the safety net.
//
// Golf goes live at launch (KC directive 2026-06-12, overriding the FV-272
// founder gate). Football goes live per the 2026-07-19 KC launch directive
// (FV-206) — app-side wiring only; the DB sport CHECK widening is owned
// separately by the lead (FV-205; must land before football is truly usable
// end-to-end). Baseball goes live per the 2026-08-11 KC launch directive
// (FV-100 GO) — content + hard-moment/viz clips were already authored and
// rendered (FV-94/FV-95); this app-side wiring (FV-98) makes it
// athlete-selectable. The DB sport CHECK was widened separately (FV-97,
// already applied in prod). Lacrosse goes live per the 2026-08-11 KC
// launch directive (FV-407) — content, hard-moment/viz clips, and the
// first audio render were already authored (FV-404/FV-405/FV-406, then
// rendered at FV-407); this app-side wiring makes it athlete-selectable.
// The DB sport CHECK widening ships in the same PR chain via the
// 20260812010000 migration. Soccer goes live per the 2026-08-13 KC
// launch directive (FV-78/FV-79; FV-81 founder gate) — content, hard-
// moment/viz clips, and the first audio render were already authored
// (FV-76, #422/#425); this app-side wiring makes it athlete-selectable.
// The DB sport CHECK widening already landed via #426 (squash 56844c00,
// 20260812230000_soccer_db_enablement.sql + daily 1–30 seed). Merge this
// app PR after #426 (already merged).
//
// Plain module (no "use server"): safe to import from server actions and
// client components alike (e.g. the FV-33 onboarding sport selector).
export const SUPPORTED_SPORTS = ["hockey", "basketball", "golf", "football", "baseball", "lacrosse", "soccer"] as const;
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
