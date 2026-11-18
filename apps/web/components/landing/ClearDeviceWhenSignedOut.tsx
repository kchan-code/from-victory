"use client";
// client: reads document.cookie and clears localStorage / Cache Storage in
// useEffect.

import { useEffect } from "react";

import { hasSupabaseAuthSessionCookie } from "@/lib/analytics/mount";
import { clearOfflineAudioCaches } from "@/lib/audio/clear-audio-cache";
import { clearAthleteCache } from "@/lib/pregame/athlete-cache";
import { clearPregameSession } from "@/lib/pregame/session-cache";

/**
 * ClearDeviceWhenSignedOut (FV-759)
 *
 * Renders nothing. On the web landing page, if this browser holds NO Supabase
 * session cookie, it drops what the device may still hold for a previous
 * account: the local name/sport entry, the saved Pregame session and the
 * downloaded `fv-audio-*` clips.
 *
 * WHY: web sign-out lands on "/". The only clear on that path was the
 * fire-and-forget one in SignOutButton's submit handler, which is lost if the
 * app is killed mid-submit or the form is posted before hydration. This is the
 * mount-time backstop. /signin, /pair and /invite already clear on mount; "/"
 * did not.
 *
 * WHY THE COOKIE CHECK, AND WHY IT IS SAFE: "/" is also the installed PWA's
 * start_url, so a signed-in athlete lands here on every launch, including
 * offline with a downloaded session. Their session cookie is on the device and
 * readable without the network, so they are never cleared. Only a browser with
 * no session cookie at all is. The landing HTML itself can be served from the
 * service worker's cache, which is why this decision is made in the browser
 * and not from anything the server rendered.
 *
 * NOT COVERED HERE: a session that is dead on the server while its cookie is
 * still on the device (for example a parent deleted the athlete). Online, the
 * next guarded page or Pregame open redirects to /signin, which clears.
 * Offline, the device cannot know.
 */
export function ClearDeviceWhenSignedOut() {
  useEffect(() => {
    const names = document.cookie
      .split(";")
      .map((part) => part.trim().split("=")[0] ?? "")
      .filter((name) => name.length > 0);
    if (hasSupabaseAuthSessionCookie(names)) return;
    clearAthleteCache();
    clearPregameSession();
    void clearOfflineAudioCaches();
  }, []);

  return null;
}
