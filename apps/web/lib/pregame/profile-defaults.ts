/**
 * profile-defaults.ts (FV-253)
 *
 * Resolves the athlete's saved personalization-quiz answers (FV-228:
 * `profiles.position` + `profiles.focus_area`) into pregame setup
 * PRE-SELECTIONS — the initial values of the Today's Focus and Position
 * pickers. Both remain fully editable in the flow; this only seeds the
 * starting state so an athlete who already told us their position and what
 * they're working through doesn't re-answer it every game day.
 *
 * Validation rules (both fields fall back to null = "nothing pre-selected",
 * which is byte-for-byte the pre-FV-253 behaviour):
 *   - position: must be one of the CURRENT sport's declared roles. A stale
 *     cross-sport value (a hockey "Forward" after switching to basketball) or
 *     a no-ask sport (no roles) yields null. The DB CHECK constraint is a
 *     cross-sport union, so this per-sport narrowing is required here.
 *   - focus_area: mapped through FOCUS_AREA_TO_NEED (quiz-config.ts) and then
 *     checked against the sport's own `needs` list, so a mapped need the sport
 *     doesn't offer can never be pre-selected (NEED_VERSE is dereferenced
 *     unguarded downstream — the picker list is the only safe set).
 *
 * Pure + dependency-light on purpose: no React, no Supabase, no registry
 * import. Callers pass the sport's `roles` / `needs` from SportConfig.
 */

import { pregameNeedDefault } from "@/lib/quiz-config";
import type { NeedToday } from "@/components/pregame/types";

export type PregamePersonalization = {
  /** `profiles.position` as stored (unvalidated), or null when unset. */
  position: string | null;
  /** `profiles.focus_area` as stored (unvalidated), or null when unset. */
  focusArea: string | null;
};

export type PregameProfileDefaults = {
  need: NeedToday | null;
  role: string | null;
};

export const NO_PROFILE_DEFAULTS: PregameProfileDefaults = { need: null, role: null };

export function resolvePregameProfileDefaults(
  personalization: PregamePersonalization | null | undefined,
  sport: {
    roles?: readonly string[];
    needs: readonly NeedToday[];
  },
): PregameProfileDefaults {
  if (!personalization) return NO_PROFILE_DEFAULTS;

  const { position, focusArea } = personalization;

  const role =
    typeof position === "string" && (sport.roles ?? []).includes(position)
      ? position
      : null;

  const mappedNeed = pregameNeedDefault(focusArea);
  const need =
    mappedNeed !== null && (sport.needs as readonly string[]).includes(mappedNeed)
      ? (mappedNeed as NeedToday)
      : null;

  return { need, role };
}
