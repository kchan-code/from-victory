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

const SEND_TIMEOUT_MS = 8000;
const SEND_TIMEOUT_REASON = "timeout";

type SendFailureCategory = "timeout" | "provider_error" | "exception" | "not_configured";

function failureCategory(reason: string): SendFailureCategory {
  if (reason === SEND_TIMEOUT_REASON) return "timeout";
  if (reason.startsWith("Resend error")) return "provider_error";
  if (reason.startsWith("Resend exception")) return "exception";
  return "not_configured";
}

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

  // Success is only shown once the send actually succeeded (FV-770). The
  // send is bounded so a hung provider still ends in the honest error.
  const result = await Promise.race([
    sendContactNotification({
      name: data.name,
      email: data.email,
      message: data.message,
    }),
    new Promise<{ ok: false; reason: string }>((resolve) =>
      setTimeout(() => resolve({ ok: false, reason: SEND_TIMEOUT_REASON }), SEND_TIMEOUT_MS),
    ),
  ]);
  if (!result.ok) {
    // Category only. The sender's free-text reason can echo a provider or
    // exception message containing the name, email or message, so it is
    // never logged.
    console.error("[contact] notification not sent:", failureCategory(result.reason));
    // Static label/message per notifyError's PII rule; reason is in the logs.
    deliverInBackground(
      notifyError(
        "contact.send_failed",
        "Contact notification email was not sent; see function logs for the category.",
      ),
    );
    return { ok: false, error: SEND_FAILED_ERROR, values };
  }

  return { ok: true };
}
