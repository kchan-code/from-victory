"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { sendWaitlistNotification } from "@/lib/email/waitlist-notification";

// FV-517 dropped the first-name field and the optional note textarea from
// the form (KC decision, docs/conversion-audit-2026-08-29.md §7.4) — only
// email, role, and sport are collected now. `name` and `note` are no longer
// read from formData below, so they are not validated here either.
//
// waitlist_signups.name is NOT NULL with no column default (see
// supabase/migrations/20260522180000_waitlist_signups.sql) and this issue is
// scoped to not touch migrations, so the insert below still writes an empty
// string placeholder for `name` to satisfy the constraint. `note` is
// nullable, so it is simply omitted from the insert.
const WaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email.")
    .max(320, "Email is too long."),
  role: z.enum(["athlete", "parent", "coach", "other"], {
    message: "Pick a role.",
  }),
  sport: z
    .string()
    .trim()
    .min(1, "Sport is required.")
    .max(80, "Sport name is too long."),
  consent: z.literal("on", {
    message: "You need to agree to the Terms of Use and acknowledge the Privacy Policy.",
  }),
  // Optional metadata from /teams page CTA — captured in the admin
  // notification email so group-pricing requests are distinguishable.
  // Not written to the DB; no schema migration needed.
  source: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  intent: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  // Honeypot. Real users leave this blank; bots fill every field.
  // Submissions with a non-empty value are silently accepted (no DB write,
  // no error surfaced) so bots get no feedback signal.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type WaitlistActionState =
  | { ok: true; alreadyOnList: boolean }
  | { ok: false; error: string; field?: string }
  | null;

export async function submitWaitlist(
  _prev: WaitlistActionState,
  formData: FormData,
): Promise<WaitlistActionState> {
  const raw = {
    email: formData.get("email"),
    role: (formData.get("role") as string | null)?.toLowerCase() ?? undefined,
    sport: formData.get("sport"),
    consent: formData.get("consent") ?? undefined,
    source: formData.get("source") ?? undefined,
    intent: formData.get("intent") ?? undefined,
    website: formData.get("website") ?? "",
  };

  const parsed = WaitlistSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  const data = parsed.data;

  // Honeypot tripped — pretend success without writing or notifying.
  // Bots see the same response as real users; no signal to retry.
  if (data.website && data.website.length > 0) {
    return { ok: true, alreadyOnList: false };
  }

  const supabase = createClient();
  const { error } = await supabase.from("waitlist_signups").insert({
    email: data.email,
    // waitlist_signups.name is NOT NULL with no default — the form no
    // longer collects a name (FV-517), so an empty string is written
    // instead of a migration to relax the constraint.
    name: "",
    role: data.role,
    sport: data.sport,
  });

  if (error) {
    // Unique-violation on email → treat as "already on the list" (idempotent UX).
    if (error.code === "23505") {
      return { ok: true, alreadyOnList: true };
    }
    console.error("[waitlist] insert failed", {
      code: error.code,
      message: error.message,
    });
    return {
      ok: false,
      error: "Something went wrong. Please try again in a minute.",
    };
  }

  // Admin notification — must not break the user-facing success state.
  // deliverInBackground registers the send with the Vercel platform so it
  // completes even after the server action response is returned.
  deliverInBackground(
    sendWaitlistNotification({
      email: data.email,
      role: data.role,
      sport: data.sport,
      source: data.source ?? null,
      intent: data.intent ?? null,
    }).then((result) => {
      if (!result.ok) {
        console.warn("[waitlist] notification not sent:", result.reason);
      }
    }),
  );

  return { ok: true, alreadyOnList: false };
}
