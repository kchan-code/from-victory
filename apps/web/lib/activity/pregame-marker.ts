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
// Month boundary: the database derives the row's month in SQL (UTC) at insert
// time; this derives the digest's month in the app. A call that straddles
// midnight UTC at a month boundary may count under either month. That is
// acceptable (at worst one athlete is counted once in each of two adjacent
// months, or its marker month differs from the row month for that one call).

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
