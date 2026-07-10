/**
 * Pregame page — FV-107 offline-tolerant auth.
 *
 * This is an intentionally PII-free server shell. It renders no athlete data
 * server-side, so the HTML it produces is identical for every request and can
 * safely be served by the SW offline without caching minor PII.
 *
 * Auth + sport resolution live entirely in PregameClientShell (client component):
 *   - Online:  calls supabase.auth.getUser() → fetches profile → renders flow.
 *   - Offline: reads cached sport from localStorage → renders flow.
 *   - No session or genuine auth error → router.replace("/signin").
 *
 * Security invariants (unchanged from before FV-107):
 *   - RLS still governs every real DB read/write via the anon client.
 *   - No data is fetched, written, or returned from this server component.
 *   - The pregame UI is made available offline solely through the
 *     /_next/static/* JS cache (cached network-first by the SW) + the auth
 *     check in the client component that tolerates network errors.
 *
 * PRIVACY CONTRACT for SW caching:
 *   The SW (public/sw.js, FV-107) routes /athlete/pregame to a
 *   network-first + cache strategy. It caches the response ONLY if it has no
 *   Set-Cookie header (PII-free backstop). This page MUST remain a static
 *   shell — no requireAthlete(), no server-side user data. If this is ever
 *   changed to call requireAthlete() or embed user data in the RSC payload,
 *   the SW pregame strategy MUST be reverted to the all-network bypass.
 */

import { PregameClientShell } from "@/components/pregame/PregameClientShell";

export const metadata = {
  title: "Pregame",
};

export default function PregamePage() {
  return <PregameClientShell />;
}
