// Per-option once-per-month counting markers for pregame selection totals (FV-749).
//
// The database must never receive an athlete identifier. For each chosen option
// the application computes an opaque keyed one-way digest and passes only that:
//
//   marker = hex( HMAC-SHA256( secret,
//                 "pregame-selection-marker:v2:" +
//                 JSON.stringify([athleteId, period, sport, dimension, value]) ) )
//
// JSON.stringify of the tuple is an unambiguous encoding: different tuples can
// never collide by concatenation (("a:b","c") vs ("a","b:c")). `period` is the
// first day of the UTC month ("YYYY-MM-01"), so an athlete's markers differ every
// month. Only the application server, which holds the secret, can compute them.
// One marker per (athlete, month, sport, option) lets the database count each
// athlete at most once per option per month (athlete_count) while still adding
// every pick to selection_count.
//
// Honest limit: someone holding BOTH the database and the server secret could
// test a known athlete id + option against the stored markers. Markers are
// deleted after the month ends.
//
// Month boundary: the caller reads the clock ONCE and passes the same period it
// used for the digests to the database (p_period). The database counts only if
// p_period is exactly the current UTC month's first day; otherwise it returns 0
// and writes nothing. A call that straddles midnight UTC at a month boundary is
// therefore simply not counted, and the athlete's next call counts normally.

import { createHmac } from "node:crypto";

const DOMAIN = "pregame-selection-marker:v2:";

/** First day of the UTC month containing `now`, as YYYY-MM-01. */
export function utcPeriodStartIso(now: Date): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** 64-char lowercase hex digest for one option. Never log it or the athlete id. */
export function pregameOptionMarker(
  athleteId: string,
  secret: string,
  period: string,
  sport: string,
  dimension: string,
  value: string,
): string {
  return createHmac("sha256", secret)
    .update(DOMAIN + JSON.stringify([athleteId, period, sport, dimension, value]))
    .digest("hex");
}
