import { z } from "zod";

import { ageFromBirthdate } from "@/lib/age";
import { SUPPORTED_SPORTS } from "@/lib/sports";

/**
 * Validation for the two-step verified email signup (FV-671, SSO A1;
 * spec §4). Pure (no I/O, not "use server") so it is shared by
 * startEmailSignup / completeEmailSignup and unit-testable.
 *
 * Nothing here is ever written to auth user_metadata: the form fields live in
 * client state between the two steps and are re-submitted (and re-validated) at
 * completion.
 */

export type SignupRole = "parent" | "adult_athlete";

export function parseSignupRole(raw: unknown): SignupRole | null {
  return raw === "parent" || raw === "adult_athlete" ? raw : null;
}

// 18+ floor for the self-serve adult path. The DB backstops it with the
// adult_athlete_min_age_18 CHECK and complete_pending_profile().
export const MIN_ADULT_AGE = 18;

const email = z.string().trim().toLowerCase().email("Enter a valid email.");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");

const firstName = z
  .string()
  .trim()
  .min(1, "First name is required.")
  .max(50, "First name is too long.");

const consent = z.literal("on", {
  message:
    "You need to agree to the Terms of Use and acknowledge the Privacy Policy.",
});

const token = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email.");

// Parent: explicit "parent or guardian, 18 or older" attestation (the parent is
// the buyer; spec §4 / §5.2).
const guardianAttestation = z.literal("on", {
  message: "Please confirm you are a parent or guardian, 18 or older.",
});

// Adult athlete: explicit 18+ affirmation, separate from the computed
// birthdate check — the documented attestation surface (FV-325 review).
const ageAttestation = z.literal("on", {
  message: "Please confirm you are 18 or older.",
});

const adultBirthdate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .refine(
    (b) => {
      const age = ageFromBirthdate(b);
      return age !== null && age >= MIN_ADULT_AGE;
    },
    { message: `You must be ${MIN_ADULT_AGE} or older to create your own account.` },
  );

const sport = z.enum(SUPPORTED_SPORTS, { message: "Choose your sport." });

const parentFields = {
  email,
  first_name: firstName,
  guardian_attestation: guardianAttestation,
  consent,
};

const adultFields = {
  email,
  first_name: firstName,
  birthdate: adultBirthdate,
  sport,
  age_attestation: ageAttestation,
  consent,
};

/** Step 1 (startEmailSignup): everything, including the password. */
export const StartParentSchema = z.object({ ...parentFields, password });
export const StartAdultSchema = z.object({ ...adultFields, password });

/** Step 2 (completeEmailSignup): the same fields re-validated, plus the code. */
export const CompleteParentSchema = z.object({ ...parentFields, token });
export const CompleteAdultSchema = z.object({ ...adultFields, token });

/** Legacy-account code entry (verifyEmailOnly). */
export const VerifyOnlySchema = z.object({ email, token });

/** Resend. */
export const ResendSchema = z.object({ email });

export type ParsedIssue = { error: string; field?: string };

export function firstIssue(error: z.ZodError): ParsedIssue {
  const issue = error.issues[0];
  return {
    error: issue?.message ?? "Invalid input.",
    field: issue?.path[0]?.toString(),
  };
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

/** Pull the named string fields out of a FormData (non-strings become null). */
export function pick(formData: FormData, keys: readonly string[]) {
  const out: Record<string, string | null> = {};
  for (const k of keys) out[k] = str(formData, k);
  return out;
}

export const PARENT_START_KEYS = [
  "email",
  "password",
  "first_name",
  "guardian_attestation",
  "consent",
] as const;
export const ADULT_START_KEYS = [
  "email",
  "password",
  "first_name",
  "birthdate",
  "sport",
  "age_attestation",
  "consent",
] as const;
export const PARENT_COMPLETE_KEYS = [
  "email",
  "token",
  "first_name",
  "guardian_attestation",
  "consent",
] as const;
export const ADULT_COMPLETE_KEYS = [
  "email",
  "token",
  "first_name",
  "birthdate",
  "sport",
  "age_attestation",
  "consent",
] as const;
