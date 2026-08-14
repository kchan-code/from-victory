import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import type { Database } from "@/lib/supabase/types";

/**
 * Native-shell entry-point router (Google Play "no in-app purchase"
 * compliance — FV-478 follow-up).
 *
 * apps/native/capacitor.config.ts points `server.url` at the marketing site
 * root, so the native shell's FIRST screen is the public landing page —
 * which shows real prices and "Start your athlete's 14-day free trial." A
 * Play reviewer sees a purchase surface on screen one, which Payments policy
 * rejects. Gating every marketing page was explicitly rejected (KC ruling);
 * instead, in-shell, the three marketing routes that can show pricing
 * (`/`, `/pricing`, `/parents` — see middleware.ts) route by auth state to
 * the signed-in user's actual home instead of ever rendering marketing
 * content.
 */

/** Signed-out visitor, in-shell — same destination as any unauthenticated
 * visit to a gated route elsewhere in the app. */
export const NATIVE_SHELL_SIGNED_OUT_TARGET = "/signin";
/** Signed-in parent, in-shell. */
export const NATIVE_SHELL_PARENT_TARGET = "/dashboard";
/** Signed-in athlete (minor or adult_athlete), in-shell. */
export const NATIVE_SHELL_ATHLETE_TARGET = "/athlete";
/**
 * Authenticated session with no profiles row (or an unrecognized role) — the
 * same orphaned-session escape hatch `redirectIfAuthed()` uses in
 * lib/auth/guards.ts. Routing straight to /signin or /dashboard here would
 * create a redirect loop (those pages bounce an orphaned session right back
 * to /signin); /auth/signout actually clears the session first.
 */
const NATIVE_SHELL_ORPHANED_SESSION_TARGET = "/auth/signout";

/**
 * The marketing routes that redirect through this router in-shell. Single
 * source of truth for middleware.ts. Deliberately narrow — this is the KC
 * ruling's entry-point fix, not a blanket gate on every marketing page.
 */
export const NATIVE_SHELL_ROUTED_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/pricing",
  "/parents",
]);

/**
 * Resolve where the native shell should land for this request, given its
 * auth state. Mirrors the role → home mapping in `redirectIfAuthed()`
 * (lib/auth/guards.ts): parent → /dashboard, athlete/adult_athlete →
 * /athlete, signed out → /signin, orphaned session → /auth/signout.
 *
 * Can't call `redirectIfAuthed()` (or `requireParent()` / `requireAthlete()`)
 * directly — they call `next/navigation`'s `redirect()`, which only works
 * inside a rendered Server Component / Server Action, not Edge Middleware.
 * This is the middleware-safe equivalent, deliberately kept in parity with
 * it rather than inventing a new role-mapping.
 *
 * Landing on /athlete or /dashboard is sufficient even though this function
 * doesn't itself check subscription/onboarding state — those pages already
 * run their own guards (requireActiveAccess, the sport-onboarding redirect,
 * etc.) once the router hands off to them.
 *
 * Cookie handling: reuses `request` + `response` (the same pair
 * `updateSession()` in lib/supabase/middleware.ts already refreshed for this
 * request) so a token refresh triggered by this second `getUser()` call — a
 * rare edge case, since `updateSession()` runs first and its own `setAll`
 * already updated `request.cookies` in place — still lands on the same
 * response the caller returns, and never writes a second, inconsistent
 * cookie state.
 *
 * Degrades to `null` (no redirect) when Supabase env vars are missing,
 * matching `updateSession()`'s graceful-degradation contract — never 500 the
 * marketing page over a missing env var.
 */
export async function resolveNativeShellEntryTarget(
  request: NextRequest,
  response: NextResponse,
): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NATIVE_SHELL_SIGNED_OUT_TARGET;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) return NATIVE_SHELL_ORPHANED_SESSION_TARGET;
  if (profile.role === "parent") return NATIVE_SHELL_PARENT_TARGET;
  if (profile.role === "athlete" || profile.role === "adult_athlete")
    return NATIVE_SHELL_ATHLETE_TARGET;

  return NATIVE_SHELL_ORPHANED_SESSION_TARGET;
}
