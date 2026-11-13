"use client";
// client: @vercel/analytics/next itself requires the client boundary (script
// injection + route tracking); root layout stays a Server Component and
// mounts this small wrapper instead of importing Analytics directly.

/**
 * AnalyticsMount (FV-395, FV-727)
 *
 * Mounts Vercel Web Analytics only when shouldMountAnalytics allows it:
 * an allowlisted marketing path, AND not a native store shell, AND not a
 * signed-in minor (profile role `athlete`). /privacy and /terms stay on
 * the marketing allowlist for signed-out browser visitors; a signed-in
 * minor opening them from Settings does not load the script, and neither
 * does any route inside the store apps.
 *
 * `nativeShell` and `session` come from the server (User-Agent + the
 * verified profile role). usePathname re-checks on client navigation so a
 * minor moving from /athlete/settings to /privacy still does not mount.
 *
 * Pageviews only. No custom events, no PII, no user identifiers attached.
 *
 * The filter function must be defined/passed from inside a Client Component
 * — Server Components cannot pass a plain function as a prop across the
 * client boundary, so this file exists purely to own that wiring.
 */

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";

import {
  shouldMountAnalytics,
  type AnalyticsSession,
} from "@/lib/analytics/mount";
import { filterAnalyticsEvent } from "@/lib/analytics/allowed-routes";

export function AnalyticsMount({
  nativeShell,
  session,
}: {
  nativeShell: boolean;
  session: AnalyticsSession;
}) {
  const pathname = usePathname();

  // Don't mount the SDK at all when the audience or the path forbids it.
  // The analytics script never loads — filtering alone would still fetch it.
  if (!shouldMountAnalytics(pathname ?? "", { nativeShell, session })) {
    return null;
  }

  // beforeSend still drops any event whose URL is off-allowlist, so a
  // client-side navigation away from a marketing page can't leak.
  return <Analytics beforeSend={filterAnalyticsEvent} />;
}
