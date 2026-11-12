import "server-only";

import { homeForState, resolveSessionState } from "@/lib/auth/session-state-core";

import { revokeAppleTokens } from "./revoke";

import type { SupabaseLike } from "./flow";

/**
 * Post-sign-in destination for the Apple flows (web callback, iOS native,
 * Android handoff completion), resolved from the shared session state
 * (FV-672; spec §5.1):
 *   pending -> /welcome            (verified, no profile yet)
 *   parent / athlete / adult_athlete -> role home
 *   error / orphan / none -> "/"   (NEVER /welcome or /subscribe: a failed
 *                                   profile read is not "no profile", spec
 *                                   §13a invariant 5; "/" re-routes by the
 *                                   real gates)
 */
export async function resolvePostSignInPath(
  supabase: SupabaseLike,
  userId: string,
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user || user.id !== userId) return "/";

  const { state } = await resolveSessionState(supabase, user);
  if (state === "pending") return "/welcome";
  if (state === "athlete") {
    // Defense in depth (privacy review #601): minors (13-17) never hold an SSO
    // session. Practically unreachable (an Apple token cannot assert a
    // synthetic athlete address), but if it happens: revoke, sign out, fail.
    console.error("[apple-signin] SSO session resolved to a minor athlete; revoking");
    await revokeAppleTokens(userId).catch(() => undefined);
    await supabase.auth.signOut().catch(() => undefined);
    return "/signin?error=oauth";
  }
  return homeForState(state) ?? "/";
}
