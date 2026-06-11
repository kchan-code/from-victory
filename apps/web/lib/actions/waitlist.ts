"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { sendWaitlistNotification } from "@/lib/email/waitlist-notification";

const WaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email.")
    .max(320, "Email is too long."),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(120, "Name is too long."),
  role: z.enum(["athlete", "parent", "coach", "other"], {
    message: "Pick a role.",
  }),
  sport: z
    .string()
    .trim()
    .min(1, "Sport is required.")
    .max(80, "Sport name is too long."),
  note: z
    .string()
    .trim()
    .max(1000, "Note is too long (max 1000 characters).")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  consent: z.literal("on", {
    message: "You need to agree to the Terms of Use and acknowledge the Privacy Policy.",
  }),
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
    name: formData.get("name"),
    role: (formData.get("role") as string | null)?.toLowerCase() ?? undefined,
    sport: formData.get("sport"),
    note: formData.get("note") ?? undefined,
    consent: formData.get("consent") ?? undefined,
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
    name: data.name,
    role: data.role,
    sport: data.sport,
    note: data.note ?? null,
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
      name: data.name,
      role: data.role,
      sport: data.sport,
      note: data.note ?? null,
    }).then((result) => {
      if (!result.ok) {
        console.warn("[waitlist] notification not sent:", result.reason);
      }
    }),
  );

  return { ok: true, alreadyOnList: false };
}
