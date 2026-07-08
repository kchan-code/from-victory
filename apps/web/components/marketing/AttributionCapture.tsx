"use client";

import { useEffect } from "react";

import {
  ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
  ATTRIBUTION_COOKIE_NAME,
  isAttributionEligiblePath,
  parseUtmParams,
} from "@/lib/attribution";

/**
 * First-touch UTM attribution capture (FV-396).
 *
 * Renders nothing. On mount, if the current pathname is one of the public
 * marketing routes (deny by default — see isAttributionEligiblePath) AND
 * the URL carries at least one utm_* query param AND no `fv_attribution`
 * cookie already exists, writes a first-party cookie recording the UTM
 * fields present plus a `landed_at` timestamp.
 *
 * FIRST-TOUCH WINS: if the cookie already exists we never overwrite it,
 * even if the current visit carries different/new UTM params.
 *
 * Privacy contract: the cookie holds ONLY utm_source/utm_medium/
 * utm_campaign/utm_content/utm_term (whichever are present) + landed_at.
 * No identifiers, no PII. Not httpOnly — this is a first-touch marketing
 * signal, not an auth/session artifact, and is read again client-side by
 * nothing else today; the checkout server action reads it directly via
 * next/headers cookies().
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      const pathname = window.location.pathname;
      if (!isAttributionEligiblePath(pathname)) return;

      // First-touch wins — never overwrite an existing cookie.
      if (document.cookie.split("; ").some((c) => c.startsWith(`${ATTRIBUTION_COOKIE_NAME}=`))) {
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const utm = parseUtmParams(searchParams);

      if (Object.keys(utm).length === 0) return;

      const payload = {
        ...utm,
        landed_at: new Date().toISOString(),
      };

      const value = encodeURIComponent(JSON.stringify(payload));
      document.cookie = [
        `${ATTRIBUTION_COOKIE_NAME}=${value}`,
        `max-age=${ATTRIBUTION_COOKIE_MAX_AGE_SECONDS}`,
        "path=/",
        "SameSite=Lax",
      ].join("; ");
    } catch {
      // Never let attribution capture break page rendering.
    }
  }, []);

  return null;
}
