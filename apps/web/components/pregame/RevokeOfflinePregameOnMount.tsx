"use client";
// client: clears a localStorage entry in useEffect.

import { useEffect } from "react";
import { clearAthleteCache } from "@/lib/pregame/athlete-cache";

/**
 * RevokeOfflinePregameOnMount (FV-625)
 *
 * Renders nothing. Mounted on /athlete/paused — the screen every gated
 * training surface redirects a blocked athlete to — it clears the
 * `fv_athlete_cache` entry that unlocks offline pregame (see
 * PregameClientShell). So the first time a lapsed device is online and hits
 * ANY gated page, offline pregame stops working on that device, not only when
 * pregame itself is reopened online.
 *
 * Narrow on purpose: it does NOT clear `fv_pregame_session` (the athlete's
 * last setup choices, no PII). Those only matter once the shell renders
 * again, which requires a fresh online entitlement check — and keeping them
 * means a reactivated athlete still gets "Run it like last time".
 */
export function RevokeOfflinePregameOnMount() {
  useEffect(() => {
    clearAthleteCache();
  }, []);

  return null;
}
