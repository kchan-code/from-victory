// Synthetic email domain used for athletes onboarded via the parent →
// pairing flow. These addresses are never delivered to — the server
// generates them so each athlete has a stable Supabase auth.users row.
//
// Direct-signup athletes (admin-created beta path) use real emails and
// do NOT match this domain.
//
// Source of truth: the creation site in `lib/actions/athletes.ts`. The
// reset guard in `lib/actions/auth.ts` short-circuits any password reset
// targeting this domain so we don't burn email sends on undeliverable
// inboxes.
export const ATHLETE_SYNTHETIC_EMAIL_DOMAIN = "athletes.fromvictory.app";

export function isSyntheticAthleteEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ATHLETE_SYNTHETIC_EMAIL_DOMAIN}`);
}
