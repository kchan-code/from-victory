"use client";
// client: clears a localStorage entry in useEffect.

import { useEffect } from "react";
import { clearAthleteCache } from "@/lib/pregame/athlete-cache";

/**
 * ClearOfflinePregameOnMount (FV-625)
 *
 * Renders nothing. Clears the `fv_athlete_cache` entry that unlocks offline
 * pregame (see PregameClientShell). Mounted on:
 *
 *   - /athlete/paused — REVOCATION. Every gated training surface redirects a
 *     blocked athlete there, so the first time a lapsed device is online and
 *     hits ANY gated page, offline pregame stops on that device, not only when
 *     pregame itself is reopened online.
 *   - /invite and /pair — IDENTITY SWITCH. Finishing an invite signs a
 *     different athlete in on this device without passing through /signin
 *     (whose ClearCacheOnMount already clears). Without this, the new athlete
 *     could open pregame offline on the PREVIOUS athlete's verified entry
 *     (their entitlement and first name) before ever connecting. Clearing on
 *     page mount (not on claim success) is deliberately conservative: an
 *     abandoned invite page only costs the current athlete one online
 *     pregame open to re-verify.
 *
 * Narrow on purpose: it does NOT clear `fv_pregame_session` (the athlete's
 * last setup choices, no PII). Those only matter once the shell renders
 * again, which requires a fresh online entitlement check — and keeping them
 * means a reactivated athlete still gets "Run it like last time".
 */
export function ClearOfflinePregameOnMount() {
  useEffect(() => {
    clearAthleteCache();
  }, []);

  return null;
}
