"use server";

/**
 * Server actions for Web Push reminder subscription management (FV-164).
 *
 * Auth model: all three actions use the RLS client (createClient) scoped to the
 * athlete's own session. The push_subscriptions_*_own RLS policies restrict every
 * operation to rows where athlete_id = auth.uid(), so cross-athlete writes are
 * impossible at the DB level regardless of what the client sends.
 *
 * No service-role client here — the athlete manages their own subscription row.
 * The service-role path is only in the cron route (send-reminders).
 *
 * Privacy contract:
 *   - No PII is logged (no endpoint URLs, no keys).
 *   - Parents cannot call these actions on behalf of an athlete (requireAthlete
 *     redirects any non-athlete session).
 *   - last_sent_on is reset to null on save so the next cron pass can fire even
 *     if the athlete re-subscribes on the same day.
 */

import { z } from "zod";

import { requireAthlete } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type ReminderResult = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const HourSchema = z
  .number()
  .int("hour must be an integer")
  .min(0, "hour must be between 0 and 23")
  .max(23, "hour must be between 0 and 23");

/**
 * Validates an IANA timezone string by attempting to construct an
 * Intl.DateTimeFormat with it. An invalid zone throws a RangeError.
 * This is the most reliable cross-platform check without a tz database dep.
 */
function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const TimezoneSchema = z
  .string()
  .min(1, "timezone is required")
  .refine(isValidIANATimezone, {
    message: "timezone must be a valid IANA timezone (e.g. 'America/New_York')",
  });

const EndpointSchema = z
  .string()
  .url("endpoint must be a valid URL")
  .refine((url) => url.startsWith("https://"), {
    message: "endpoint must use https",
  });

const KeySchema = z.string().min(1, "key must not be empty");

const SaveInputSchema = z.object({
  subscription: z.object({
    endpoint: EndpointSchema,
    keys: z.object({
      p256dh: KeySchema,
      auth: KeySchema,
    }),
  }),
  hour: HourSchema,
  timezone: TimezoneSchema,
});

const UpdateHourSchema = z.object({
  hour: HourSchema,
});

// ---------------------------------------------------------------------------
// savePushReminder — enable or re-subscribe
//
// Upserts the single push_subscriptions row for the calling athlete.
// onConflict: athlete_id replaces the existing row, handling re-subscribe
// (new device or browser) transparently.
//
// last_sent_on is explicitly null on save so the athlete can receive a
// notification today even if they re-subscribed after a prior send.
// ---------------------------------------------------------------------------

export async function savePushReminder(input: {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  hour: number;
  timezone: string;
}): Promise<ReminderResult> {
  const parsed = SaveInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { userId } = await requireAthlete();
  const supabase = createClient();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      athlete_id: userId,
      endpoint: parsed.data.subscription.endpoint,
      p256dh: parsed.data.subscription.keys.p256dh,
      auth: parsed.data.subscription.keys.auth,
      reminder_hour: parsed.data.hour,
      timezone: parsed.data.timezone,
      last_sent_on: null,
    },
    { onConflict: "athlete_id" },
  );

  if (error) {
    console.error("[push-reminder.savePushReminder] upsert failed:", error.message);
    return { ok: false, error: "Couldn't save your reminder — try again." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// updateReminderTime — change just the reminder hour
//
// Row must already exist (athlete is already subscribed). If no row is found,
// the update is a no-op and returns ok:false so the frontend can prompt the
// athlete to subscribe first.
// ---------------------------------------------------------------------------

export async function updateReminderTime(hour: number): Promise<ReminderResult> {
  const parsed = UpdateHourSchema.safeParse({ hour });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid hour.",
    };
  }

  const { userId } = await requireAthlete();
  const supabase = createClient();

  // Single atomic update keyed on the athlete's own row (RLS-scoped). Using
  // .select() to return the affected rows lets us detect the "no subscription
  // row" case from the rows-affected count — instead of a select-then-update
  // pair, where the row could be deleted between the two queries and the update
  // would still report ok:true (the FV-244 TOCTOU).
  const { data: updated, error } = await supabase
    .from("push_subscriptions")
    .update({ reminder_hour: parsed.data.hour })
    .eq("athlete_id", userId)
    .select("athlete_id");

  if (error) {
    console.error(
      "[push-reminder.updateReminderTime] update failed:",
      error.message,
    );
    return { ok: false, error: "Couldn't update your reminder time — try again." };
  }

  if (!updated || updated.length === 0) {
    // No row matched — the athlete isn't subscribed (or the row was just
    // deleted). Prompt them to enable reminders first.
    return {
      ok: false,
      error:
        "No active reminder found. Enable reminders first, then update the time.",
    };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// disablePushReminder — delete the athlete's push subscription row
//
// The athlete disables reminders from the UI; this deletes their row.
// The push_subscriptions_delete_own RLS policy scopes the delete to the
// calling athlete's athlete_id — no service-role needed.
//
// Idempotent: deleting a non-existent row is a no-op and returns ok:true
// (the goal state — "no active reminder" — is already achieved).
// ---------------------------------------------------------------------------

export async function disablePushReminder(): Promise<ReminderResult> {
  const { userId } = await requireAthlete();
  const supabase = createClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("athlete_id", userId);

  if (error) {
    console.error(
      "[push-reminder.disablePushReminder] delete failed:",
      error.message,
    );
    return { ok: false, error: "Couldn't disable your reminder — try again." };
  }

  return { ok: true };
}
