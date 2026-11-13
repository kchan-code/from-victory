import "server-only";

// Pregame selection counts — SERVER WRITE PATH (server-only).
//
// Writes via the SERVICE-ROLE client because the count tables are service-role-
// only (RLS enabled, no policies). The database NEVER receives an athlete id
// (FV-749): this module turns the athlete id into an opaque keyed one-way digest
// (lib/activity/pregame-marker.ts) so each athlete is counted at most once per
// UTC month, and passes only that digest plus the validated {dimension, value}
// pairs. Neither the id nor the digest is ever logged or returned.
//
// The HMAC secret is RATE_LIMIT_HASH_SECRET (already used by
// lib/actions/rate-limit-store.ts for auth_rate_limit_events digests), with the
// domain-separation prefix in pregame-marker.ts. If it is not set, NOTHING is
// recorded (unlike rate limiting there is no dev fallback here, and we never
// fall back to the raw id).
//
// NEVER throws. On failure it logs one generic line — never the selections,
// never an id or digest.

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { createServiceClient } from "@/lib/supabase/service";

import { pregameMarker, utcPeriodStartIso } from "./pregame-marker";
import { buildSelectionCounts, type PregameSelectionsInput } from "./pregame-selection-core";

// Operator alert for a missing secret in production, at most once per server
// instance (the rate-limit helper's equivalent alert has no dedupe, and one
// alert per pregame completion would be noise). Never includes an id.
let missingSecretAlerted = false;

export async function recordPregameSelectionCounts(
  athleteId: string,
  sport: unknown,
  input: PregameSelectionsInput | null | undefined,
): Promise<void> {
  try {
    const built = buildSelectionCounts(sport, input);
    if (!built || built.selections.length === 0) return;

    const secret = process.env.RATE_LIMIT_HASH_SECRET;
    if (!secret) {
      console.error("[activity] pregame selection counts skipped: hash secret not configured");
      if (process.env.NODE_ENV === "production" && !missingSecretAlerted) {
        missingSecretAlerted = true;
        deliverInBackground(
          notifyError(
            "[activity] RATE_LIMIT_HASH_SECRET not set in production",
            "Pregame selection totals are NOT being recorded. Set RATE_LIMIT_HASH_SECRET in Vercel env vars.",
          ),
        );
      }
      return;
    }
    // ONE clock reading: the digest's month and the period passed to the
    // database are the same value, so they always agree. The database stores the
    // row under p_period only if it is the current UTC month, else counts nothing
    // (a call straddling midnight at a month boundary is simply not counted).
    const now = new Date();
    const period = utcPeriodStartIso(now);
    const marker = pregameMarker(athleteId, secret, now);

    const supabase = createServiceClient();
    const { error } = await supabase.rpc("record_pregame_selections", {
      p_marker: marker,
      p_period: period,
      p_sport: built.sport,
      p_selections: built.selections,
    });
    if (error) {
      console.error("[activity] pregame selection counts write failed");
    }
  } catch {
    console.error("[activity] pregame selection counts write failed");
  }
}
