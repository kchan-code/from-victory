"use server";

import { z } from "zod";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { sendContactNotification } from "@/lib/email/contact-notification";
import { getRequestIp, rateLimitGate } from "@/lib/actions/rate-limit-store";

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

/** What the person typed, echoed back ONLY on error so the form can refill. */
export type ContactValues = { name: string; email: string; message: string };

export type ContactActionState =
  | { ok: true }
  | { ok: false; error: string; field?: string; values: ContactValues }
  | null;

const SEND_FAILED_ERROR =
  "Your message did not go through. Please try again shortly, or email support@fromvictoryapp.com.";

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

  const typed = (v: FormDataEntryValue | null): string =>
    typeof v === "string" ? v : "";
  const values: ContactValues = {
    name: typed(raw.name),
    email: typed(raw.email),
    message: typed(raw.message),
  };

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
      values,
    };
  }

  const data = parsed.data;

  // Honeypot tripped — pretend success without notifying.
  // Bots see the same response as real users; no signal to retry.
  if (data.website && data.website.length > 0) {
    return { ok: true };
  }

  // FV-334: throttle per request IP (HMAC digest only; no content stored).
  // Fails open on any helper/DB problem or missing IP (see rateLimitGate).
  let limited = false;
  try {
    const ip = await getRequestIp();
    ({ limited } = await rateLimitGate("contact_form", ip));
  } catch (err) {
    // Fail open: a throwing helper must not stop a real message (reason only).
    console.error(
      "[contact] rate limit check failed, allowing:",
      err instanceof Error ? err.message : "unknown",
    );
  }
  if (limited) {
    return {
      ok: false,
      error:
        "You've sent several messages recently. Please wait a little while and try again.",
      values,
    };
  }

  // Success is only shown once the send actually succeeded (FV-770).
  const result = await sendContactNotification({
    name: data.name,
    email: data.email,
    message: data.message,
  });
  if (!result.ok) {
    // Reason only: never the message body or name. The sender's reason can
    // echo a provider message, so the submitted email is scrubbed from it.
    const reason = result.reason.split(data.email).join("[redacted]");
    console.error("[contact] notification not sent:", reason);
    // Static label/message per notifyError's PII rule; reason is in the logs.
    deliverInBackground(
      notifyError(
        "contact.send_failed",
        "Contact notification email was not sent; see function logs for the reason.",
      ),
    );
    return { ok: false, error: SEND_FAILED_ERROR, values };
  }

  return { ok: true };
}
