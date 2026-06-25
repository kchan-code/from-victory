"use server";

import { z } from "zod";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { sendContactNotification } from "@/lib/email/contact-notification";

const ContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email.")
    .max(320, "Email is too long."),
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(2000, "Message is too long (max 2000 characters)."),
  // Honeypot. Real users leave this blank; bots fill every field.
  // Submissions with a non-empty value are silently accepted (no send,
  // no error surfaced) so bots get no feedback signal.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactActionState =
  | { ok: true }
  | { ok: false; error: string; field?: string }
  | null;

export async function submitContact(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  };

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  const data = parsed.data;

  // Honeypot tripped — pretend success without notifying.
  // Bots see the same response as real users; no signal to retry.
  if (data.website && data.website.length > 0) {
    return { ok: true };
  }

  // Admin notification — must not break the user-facing success state.
  // deliverInBackground registers the send with the Vercel platform so it
  // completes even after the server action response is returned.
  // NOTE: no rate limiting yet — tracked as a follow-up (it needs a
  // companion migration to extend the auth_rate_limit_events action list).
  deliverInBackground(
    sendContactNotification({
      name: data.name,
      email: data.email,
      message: data.message,
    }).then((result) => {
      if (!result.ok) {
        console.warn("[contact] notification not sent:", result.reason);
      }
    }),
  );

  return { ok: true };
}
