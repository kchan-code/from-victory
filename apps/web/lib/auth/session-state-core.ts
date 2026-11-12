import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Session state (FV-672, SSO A3; spec FV-569 §5.1). Pure + client-agnostic so
 * the Edge-side native-shell router, the Server Component guards, the OAuth
 * callback and the Apple post-sign-in resolver all classify a session exactly
 * the same way. No `server-only` import here on purpose.
 *
 *   none           no (valid) session
 *   orphan         signed in, no profile, email-only identity that is NOT
 *                  confirmed (an unverified signup) -> today's sign-out
 *   pending        signed in, no profile, and verified: an apple/google
 *                  provider OR a confirmed email -> /welcome
 *   parent | athlete | adult_athlete   a profile exists (its role)
 *   error          the profile read FAILED. Never "pending", never routed to
 *                  /welcome or /subscribe (spec §13a invariants 1/5, FV-656):
 *                  callers show a "couldn't check" / retry path instead.
 *
 * ROUTING APPROXIMATION (documented per the A3 brief): the spec's deletability
 * predicate `private.is_unestablished(uid)` is NOT executable by the client
 * roles, so routing approximates "unestablished" with "no profile row". That
 * is safe because routing is non-destructive: every destructive path
 * (complete_pending_profile, cancel_my_pending_account,
 * finalize_pending_deletion) re-checks `is_unestablished` itself under the
 * per-user lock. The app never decides deletability.
 *
 * A profile row with an unrecognised role is returned as `orphan` (sign out,
 * nothing deleted) — the same "escape hatch" the guards used before.
 */
export type SessionState =
  | "none"
  | "orphan"
  | "pending"
  | "parent"
  | "athlete"
  | "adult_athlete"
  | "error";

export type SessionResolution = { state: SessionState; user: User | null };

type ProfileReader = { from: SupabaseClient["from"] };

const SSO_PROVIDERS = new Set(["apple", "google"]);

/** Providers recorded for the user (app_metadata first, identities as a backstop). */
function providersOf(user: User): string[] {
  const meta = (user.app_metadata ?? {}) as {
    provider?: unknown;
    providers?: unknown;
  };
  const out = new Set<string>();
  if (Array.isArray(meta.providers)) {
    for (const p of meta.providers) if (typeof p === "string") out.add(p);
  }
  if (typeof meta.provider === "string") out.add(meta.provider);
  for (const i of user.identities ?? []) {
    if (typeof i.provider === "string") out.add(i.provider);
  }
  return [...out];
}

/**
 * For a signed-in user WITHOUT a profile: `pending` (verified: apple/google
 * provider or a confirmed email) vs `orphan` (email-only, unconfirmed).
 */
export function classifyProfilelessUser(user: User): "pending" | "orphan" {
  if (providersOf(user).some((p) => SSO_PROVIDERS.has(p))) return "pending";
  if (user.email_confirmed_at) return "pending";
  return "orphan";
}

/** Resolve the state for an already-authenticated `user` (from `auth.getUser()`). */
export async function resolveSessionState(
  supabase: ProfileReader,
  user: User | null,
): Promise<SessionResolution> {
  if (!user) return { state: "none", user: null };

  let profile: { role: string } | null = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (error) return { state: "error", user };
    profile = data as { role: string } | null;
  } catch {
    return { state: "error", user };
  }

  if (!profile) return { state: classifyProfilelessUser(user), user };
  if (
    profile.role === "parent" ||
    profile.role === "athlete" ||
    profile.role === "adult_athlete"
  ) {
    return { state: profile.role, user };
  }
  return { state: "orphan", user };
}

/** Role home for an established state; null for any other state. */
export function homeForState(state: SessionState): string | null {
  if (state === "parent") return "/dashboard";
  if (state === "athlete" || state === "adult_athlete") return "/athlete";
  return null;
}
