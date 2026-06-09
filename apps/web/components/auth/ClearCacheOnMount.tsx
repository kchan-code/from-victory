"use client";
// client: calls clearAthleteCache() in useEffect (localStorage access).

import { useEffect } from "react";
import { clearAthleteCache } from "@/lib/pregame/athlete-cache";

/**
 * ClearCacheOnMount (FV-154)
 *
 * Renders nothing visible. On mount it calls clearAthleteCache() once, so
 * the `fv_athlete_cache` localStorage entry (athlete first name + sport) is
 * wiped whenever the browser lands on /signin.
 *
 * WHY /signin IS SAFE TO CLEAR ON EVERY MOUNT
 * --------------------------------------------
 * /signin has `redirectIfAuthed()` at the top of the page — an authenticated
 * athlete is never parked here. The cache is written by PregameClientShell
 * the next time the athlete visits /athlete/pregame while online. So clearing
 * on mount is safe: it only runs when a real session is absent.
 *
 * COVERAGE
 * --------
 * This single component covers two paths that bypass the SignOutButton form:
 *  1. `forgetDevice()` server action (re-pair chokepoint) → redirect(/signin)
 *  2. GET /auth/signout route (infinite-redirect escape hatch) →
 *       redirect(/signin?error=session_invalid)
 *
 * Both paths land on /signin and both need the cache cleared so the prior
 * athlete's name doesn't survive a device-account switch.
 */
export function ClearCacheOnMount() {
  useEffect(() => {
    clearAthleteCache();
  }, []);

  return null;
}
