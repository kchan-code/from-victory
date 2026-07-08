"use client";
// client: @vercel/analytics/next itself requires the client boundary (script
// injection + route tracking); root layout stays a Server Component and
// mounts this small wrapper instead of importing Analytics directly.

/**
 * AnalyticsMount (FV-395)
 *
 * Mounts Vercel Web Analytics, scoped STRICTLY to public marketing surfaces
 * via filterAnalyticsEvent's deny-by-default allowlist (lib/analytics/
 * allowed-routes.ts). Any signed-in or athlete-reachable route — /athlete,
 * /dashboard, /pair, /signup, /signin, /subscribe, and anything not on the
 * allowlist — emits nothing.
 *
 * Pageviews only. No custom events, no PII, no user identifiers attached.
 *
 * The filter function must be defined/passed from inside a Client Component
 * — Server Components cannot pass a plain function as a prop across the
 * client boundary, so this file exists purely to own that wiring.
 */

import { Analytics } from "@vercel/analytics/next";

import { filterAnalyticsEvent } from "@/lib/analytics/allowed-routes";

export function AnalyticsMount() {
  return <Analytics beforeSend={filterAnalyticsEvent} />;
}
