/**
 * Vercel Cron — /api/cron/send-reminders
 *
 * Fires at the top of every hour (schedule: "0 * * * *" in vercel.json).
 *
 * Two notification types per invocation:
 *
 * 1. Daily training reminder — fetches push_subscriptions rows whose athlete's
 *    current local hour matches their reminder_hour and that have not been
 *    notified today, then sends a "Time to train" push notification.
 *
 * 2. Game-day nudge (FV-240) — fetches push_subscriptions rows whose athlete
 *    has next_game_on = today in their local timezone AND the local hour is
 *    between 15–16 (3–4 PM). Sends a "Big game tonight" push.
 *    Dedupe across cron runs: next_game_on is cleared to NULL after a successful
 *    game-day send, so subsequent hourly runs don't re-match.
 *    Dedupe within a run: app-layer exclusion set prevents double-sending to an
 *    athlete that appears in both game-day and daily batches.
 *    last_sent_on is stamped after the game-day send so the daily evening
 *    reminder is replaced on game day for evening-hour athletes.
 *    Morning-reminder athletes receive BOTH their daily (AM) and the game-day
 *    nudge (PM) — the game-day function does not gate on last_sent_on.
 *
 * Security:
 *   - CRON_SECRET Bearer token must match. Vercel injects this header when
 *     invoking the cron. Without it the route returns 401.
 *   - VAPID keys must be configured. Missing keys return 500.
 *   - Service-role client bypasses RLS (intentional — this is a server-only
 *     background job, not a user-initiated action).
 *
 * Privacy contract:
 *   - NEVER log endpoint URLs, p256dh, auth, or any athlete identifier.
 *     Counts (sent, pruned, failed) are the only output.
 *   - Dead endpoints (404/410) are pruned immediately via service-role delete.
 *     No retry queue, no DLQ, no re-engagement logic.
 *   - No open/click tracking. last_sent_on is the only state written back.
 *   - next_game_on is coarse date only; nulled after game-day send.
 *
 * Vercel Pro note: hourly crons ("0 * * * *") require Vercel Pro or Enterprise.
 * Hobby plan supports at most one invocation per day. KC must confirm plan tier
 * before relying on hourly delivery.
 */

export const runtime = "nodejs"; // web-push requires Node.js crypto
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import webpush from "web-push";

import { createServiceClient } from "@/lib/supabase/service";

// ---------------------------------------------------------------------------
// Notification copy
//
// Content-curator can swap these in ONE place. Keep body under 120 chars to
// avoid truncation on Android lock screens.
// ---------------------------------------------------------------------------

const REMINDER_COPY = {
  title: "Time to train",
  body: "A few minutes for your mind today. Your training is ready when you are.",
} as const;

// FV-240: game-day nudge copy. Teammate/Mentor voice, rhythm-framed, direct.
const GAME_DAY_COPY = {
  title: "Big game tonight",
  body: "Run your pregame. Your mind is part of your preparation — get it right.",
} as const;

// ---------------------------------------------------------------------------
// GET handler (Vercel Cron issues GET requests)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // 1. Auth: Bearer CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      "[cron/send-reminders] CRON_SECRET is not configured. " +
        "Set this env var and redeploy.",
    );
    return NextResponse.json(
      { error: "Cron secret not configured." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 2. VAPID guard
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error(
      "[cron/send-reminders] VAPID keys are not configured. " +
        "Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY and redeploy.",
    );
    return NextResponse.json(
      { error: "VAPID keys not configured." },
      { status: 500 },
    );
  }

  // 3. Configure VAPID (idempotent — safe to call on every invocation)
  webpush.setVapidDetails(
    "mailto:privacy@fromvictoryapp.com",
    vapidPublicKey,
    vapidPrivateKey,
  );

  const service = createServiceClient();

  // 4a + 4b. Fetch both batches concurrently. Both fetches must complete
  //          before we decide what to send — game-day sends must not be blocked
  //          by a daily-reminder RPC failure, and vice versa.
  const [
    { data: gameDayRows, error: gameDayFetchError },
    { data: dueRows, error: fetchError },
  ] = await Promise.all([
    service.rpc("due_game_day_reminders"),
    service.rpc("due_push_reminders"),
  ]);

  // 4a errors are non-fatal: log and continue.
  if (gameDayFetchError) {
    console.error(
      "[cron/send-reminders] due_game_day_reminders() RPC failed:",
      gameDayFetchError.message,
    );
  }

  // 4b errors are also non-fatal: we still want to send any game-day rows
  // we already fetched. Log and treat as an empty daily batch.
  if (fetchError) {
    console.error(
      "[cron/send-reminders] due_push_reminders() RPC failed:",
      fetchError.message,
    );
  }

  const allGameDayRows = gameDayRows ?? [];
  const allDueRows = dueRows ?? [];

  if (allGameDayRows.length === 0 && allDueRows.length === 0) {
    return NextResponse.json({ sent: 0, pruned: 0, failed: 0 });
  }

  let sent = 0;
  let pruned = 0;
  let failed = 0;

  // ---------------------------------------------------------------------------
  // Helper: stamp last_sent_on + optionally null next_game_on after a send.
  // Returns "sent" | "pruned" | "failed".
  // ---------------------------------------------------------------------------
  async function sendAndStamp(
    row: { athlete_id: string; endpoint: string; p256dh: string; auth: string; timezone: string },
    payload: string,
    clearNextGameOn: boolean,
  ): Promise<"sent" | "pruned" | "failed"> {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload,
      );

      const todayInTz = new Date().toLocaleDateString("en-CA", {
        timeZone: row.timezone,
      }); // YYYY-MM-DD

      // Stamp last_sent_on (daily dedup)
      const { error: updateError } = await service
        .from("push_subscriptions")
        .update({ last_sent_on: todayInTz })
        .eq("athlete_id", row.athlete_id);

      if (updateError) {
        console.error(
          "[cron/send-reminders] last_sent_on update failed:",
          updateError.message,
        );
      }

      // FV-240: clear next_game_on after a game-day send so stale past-dates
      // don't retrigger on later invocations today or tomorrow.
      if (clearNextGameOn) {
        const { error: clearError } = await service
          .from("profiles")
          .update({ next_game_on: null })
          .eq("id", row.athlete_id);

        if (clearError) {
          // Non-critical: worst case the next invocation's RPC won't match
          // (next_game_on is still today, but last_sent_on dedup blocks it).
          console.error(
            "[cron/send-reminders] next_game_on clear failed:",
            clearError.message,
          );
        }
      }

      return "sent";
    } catch (err: unknown) {
      const statusCode =
        err instanceof webpush.WebPushError ? err.statusCode : null;

      if (statusCode === 404 || statusCode === 410) {
        const { error: deleteError } = await service
          .from("push_subscriptions")
          .delete()
          .eq("athlete_id", row.athlete_id);

        if (deleteError) {
          console.error(
            "[cron/send-reminders] dead-endpoint prune failed:",
            deleteError.message,
          );
        }
        return "pruned";
      }

      const message = err instanceof Error ? err.message : String(err);
      console.error(
        "[cron/send-reminders] sendNotification failed:",
        message,
      );
      return "failed";
    }
  }

  // 5a. Send game-day nudges.
  const gameDayPayload = JSON.stringify({
    title: GAME_DAY_COPY.title,
    body: GAME_DAY_COPY.body,
    url: "/athlete/pregame",
  });

  const gameDayResults = await Promise.allSettled(
    allGameDayRows.map((row) => sendAndStamp(row, gameDayPayload, true)),
  );

  // Track the athlete IDs that already received a game-day nudge this pass.
  // These are excluded from the daily reminder batch to enforce the one-per-day
  // limit at the application layer (last_sent_on provides the DB-level guard).
  const sentGameDayIds = new Set<string>();
  for (const result of gameDayResults) {
    if (result.status === "fulfilled") {
      if (result.value === "sent") sent++;
      else if (result.value === "pruned") pruned++;
      else failed++;
    } else {
      failed++;
    }
  }
  // Build the exclusion set from the rows we attempted (sent or pruned both
  // mean last_sent_on was stamped or the row was deleted — either way skip).
  for (let i = 0; i < gameDayResults.length; i++) {
    const result = gameDayResults[i];
    const row = allGameDayRows[i];
    if (
      result?.status === "fulfilled" &&
      (result.value === "sent" || result.value === "pruned") &&
      row
    ) {
      sentGameDayIds.add(row.athlete_id);
    }
  }

  // 5b. Send daily reminders — skip any athlete already nudged above.
  const reminderPayload = JSON.stringify({
    title: REMINDER_COPY.title,
    body: REMINDER_COPY.body,
    url: "/athlete",
  });

  const filteredDueRows = allDueRows.filter(
    (row) => !sentGameDayIds.has(row.athlete_id),
  );

  const reminderResults = await Promise.allSettled(
    filteredDueRows.map((row) => sendAndStamp(row, reminderPayload, false)),
  );

  for (const result of reminderResults) {
    if (result.status === "fulfilled") {
      if (result.value === "sent") sent++;
      else if (result.value === "pruned") pruned++;
      else failed++;
    } else {
      failed++;
    }
  }

  // 6. Opportunistic stale-date hygiene (FV-240).
  //    Clear next_game_on rows that are in the past — any date strictly before
  //    UTC-today-minus-1 is guaranteed past in every timezone on Earth
  //    (UTC-12 being the latest offset). This catches rows for athletes who
  //    never received a game-day nudge (e.g. no push subscription, no reminder
  //    hour in the 15–16 window) so they don't accumulate indefinitely.
  //    Non-fatal on error: if this fails, stale rows remain harmless (the
  //    due_game_day_reminders WHERE clause will simply not match them next day).
  try {
    const staleBeforeDate = new Date();
    staleBeforeDate.setUTCDate(staleBeforeDate.getUTCDate() - 1);
    const staleCutoff = staleBeforeDate.toISOString().slice(0, 10); // YYYY-MM-DD

    const { error: staleError } = await service
      .from("profiles")
      .update({ next_game_on: null })
      .lt("next_game_on", staleCutoff);

    if (staleError) {
      console.error(
        "[cron/send-reminders] stale next_game_on cleanup failed:",
        staleError.message,
      );
    }
  } catch (staleErr) {
    // Non-fatal: log and continue.
    const msg = staleErr instanceof Error ? staleErr.message : String(staleErr);
    console.error(
      "[cron/send-reminders] stale next_game_on cleanup threw:",
      msg,
    );
  }

  console.info(
    `[cron/send-reminders] done — sent=${sent} pruned=${pruned} failed=${failed}`,
  );

  return NextResponse.json({ sent, pruned, failed });
}
