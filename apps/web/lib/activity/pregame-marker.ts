// Once-per-month counting marker for pregame selection totals (FV-749).
//
// The database must never receive an athlete identifier. Instead the
// application computes an opaque keyed one-way digest and passes only that:
//
//   marker = hex( HMAC-SHA256( secret,
//                 "pregame-selection-marker:v1:" + athleteId + ":" + periodStartISO ) )
//
// periodStartISO is the first day of the UTC month ("YYYY-MM-01"), so an
// athlete's marker is different every month (markers are not linkable across
// months) and only the application server, which holds the secret, can compute
// it. Pure function: the secret and clock are injected so it is unit-testable.
//
// Month boundary: the caller reads the clock ONCE and passes the same period it
// used for the digest to the database (p_period). The database counts only if
// p_period is exactly the current UTC month's first day; otherwise it returns 0
// without claiming a marker or writing counts. A call that straddles midnight
// UTC at a month boundary is therefore simply not counted, and the athlete's
// next call in the new month counts normally (digest and period always agree).

import { createHmac } from "node:crypto";

const DOMAIN = "pregame-selection-marker:v1";

/** First day of the UTC month containing `now`, as YYYY-MM-01. */
export function utcPeriodStartIso(now: Date): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** 64-char lowercase hex digest. Never log it; never log the athlete id. */
export function pregameMarker(athleteId: string, secret: string, now: Date): string {
  return createHmac("sha256", secret)
    .update(`${DOMAIN}:${athleteId}:${utcPeriodStartIso(now)}`)
    .digest("hex");
}
