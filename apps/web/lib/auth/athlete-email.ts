// Synthetic email domain used for athletes onboarded via the parent →
// pairing flow. These addresses are never delivered to — the server
// generates them so each athlete has a stable Supabase auth.users row.
//
// ALL athlete accounts — whether created via the parent → pairing flow or the
// admin direct-create path (FV-323) — use a synthetic address on this domain.
// (No athlete has a real, deliverable email.)
//
// Source of truth: the creation site in `lib/actions/athletes.ts`. The
// reset guard in `lib/actions/auth.ts` short-circuits any password reset
// targeting this domain so we don't burn email sends on undeliverable
// inboxes.
//
// PRIVACY (FV-317): this synthetic address is an internal SYSTEM KEY — not
// athlete contact data / PII. It is non-deliverable and UUID-based. It is
// surfaced in the athlete's OWN page DOM (a readonly autocomplete="username"
// field on /pair + /signin) so password managers can save/autofill the
// credential; kids-privacy-officer reviewed and APPROVED this — it is reachable
// only by that athlete on their own device, never exposed to another party.
export const ATHLETE_SYNTHETIC_EMAIL_DOMAIN = "athletes.fromvictory.app";

export function isSyntheticAthleteEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ATHLETE_SYNTHETIC_EMAIL_DOMAIN}`);
}
