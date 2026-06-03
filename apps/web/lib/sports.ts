// Supported sports — the single source of truth for the athlete `sport`
// dimension. Must match the `sport_valid_values` CHECK constraint in
// supabase/migrations/20260602000000_athlete_sport.sql AND
// training_sessions_catalog.sport. To add a sport (e.g. tennis, v2): add it
// here and extend the DB CHECK in a migration — keep the two in lockstep.
//
// Plain module (no "use server"): safe to import from server actions and
// client components alike (e.g. the FV-33 onboarding sport selector).
export const SUPPORTED_SPORTS = ["hockey", "basketball"] as const;
export type Sport = (typeof SUPPORTED_SPORTS)[number];

// The interim default until the FV-33 onboarding selector ships. Hockey is the
// launch default; basketball athletes become creatable once FV-33 adds the
// selector so a parent can choose.
export const DEFAULT_SPORT: Sport = "hockey";
