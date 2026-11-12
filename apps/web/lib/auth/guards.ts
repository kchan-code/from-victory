import { redirect } from "next/navigation";

import {
  classifyProfilelessUser,
  homeForState,
  resolveSessionState,
} from "@/lib/auth/session-state-core";
import { createClient } from "@/lib/supabase/server";
import type { Sport } from "@/lib/sports";

/**
 * FV-672 (spec FV-569 §5.1 / §13a invariants 1 + 5): a failed profile read is
 * `error` — "we couldn't check" — never `pending` and never "no profile". The
 * guards throw this so the nearest error boundary renders a retry; it is
 * deliberately NOT a redirect to /welcome, /subscribe or /signin (which would
 * either onboard a possibly-established account or sign the user out on a
 * transient blip). /welcome catches it to render its own "couldn't check" card.
 */
export class SessionCheckError extends Error {
  constructor() {
    super("session_check_failed");
    this.name = "SessionCheckError";
  }
}

/**
 * Destination for a signed-in user with NO profile row: `pending` (verified
 * apple/google/confirmed-email, still to complete onboarding) -> /welcome;
 * `orphan` (unverified email-only) -> today's /signin -> sign-out chain.
 */
function noProfileTarget(user: Parameters<typeof classifyProfilelessUser>[0]) {
  return classifyProfilelessUser(user) === "pending" ? "/welcome" : "/signin";
}

type ParentProfile = {
  id: string;
  role: "parent";
  first_name: string;
};

type AthleteProfile = {
  id: string;
  // FV-325: an adult_athlete (18+ self-serve) trains on the same surfaces as a
  // parent-created athlete, so the athlete guard accepts both roles.
  role: "athlete" | "adult_athlete";
  first_name: string;
  sport: Sport;
  sport_selected_at: string | null;
  // FV-228: personalization quiz fields. Nullable — athlete may have skipped.
  // These are athlete-private; never exposed to parent queries.
  position: string | null;
  focus_area: string | null;
};

// FV-325: the 18+ self-serve account — the payer IS the athlete. Used by the
// adult checkout guard. Kept separate from ParentProfile so requireParent()'s
// "a parent is never a trainee" semantics stay clean.
type AdultAthleteProfile = {
  id: string;
  role: "adult_athlete";
  first_name: string;
};

// FV-327: a payer may be either a parent OR an adult_athlete. Used by the
// /subscribe and /subscribe/success pages which must accept both roles.
export type SubscriberProfile = {
  id: string;
  role: "parent" | "adult_athlete";
  first_name: string;
};

export async function requireParent(): Promise<{
  userId: string;
  profile: ParentProfile;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, first_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new SessionCheckError();
  if (!profile) redirect(noProfileTarget(user));
  if (profile.role !== "parent") redirect("/signin");

  return {
    userId: user.id,
    profile: profile as ParentProfile,
  };
}

/**
 * Require an adult self-serve account (18+) — the payer IS the athlete (FV-325).
 * Used by the adult checkout action. Kept distinct from requireParent() so the
 * parent guard keeps its "a parent is never a trainee" meaning, and from
 * requireAthlete() so checkout never accepts a parent-created (minor) athlete.
 */
export async function requireSelfPayer(): Promise<{
  userId: string;
  profile: AdultAthleteProfile;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, first_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new SessionCheckError();
  if (!profile) redirect(noProfileTarget(user));
  if (profile.role !== "adult_athlete") redirect("/signin");

  return {
    userId: user.id,
    profile: profile as AdultAthleteProfile,
  };
}

/**
 * Require a payer account — either a parent or an adult_athlete (FV-327).
 * Used by /subscribe and /subscribe/success which must serve both roles.
 * Redirects to /signin if not authed, no profile row, or the profile is
 * neither parent nor adult_athlete (e.g. a minor athlete session).
 */
export async function requireSubscriber(): Promise<{
  userId: string;
  profile: SubscriberProfile;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, first_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new SessionCheckError();
  if (!profile) redirect(noProfileTarget(user));
  if (profile.role !== "parent" && profile.role !== "adult_athlete")
    redirect("/signin");

  return {
    userId: user.id,
    profile: profile as SubscriberProfile,
  };
}

export async function requireAthlete(): Promise<{
  userId: string;
  profile: AthleteProfile;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, first_name, sport, sport_selected_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new SessionCheckError();
  if (!profile) redirect(noProfileTarget(user));
  // FV-325: accept the 18+ self-serve role on athlete training surfaces.
  if (profile.role !== "athlete" && profile.role !== "adult_athlete")
    redirect("/signin");

  // FV-361: position/focus_area are athlete-private columns — `authenticated`
  // has no table-level SELECT on profiles and these columns are deliberately
  // excluded from its column-restricted SELECT grant (a linked parent's JWT
  // must not be able to read them via a raw PostgREST request; RLS is
  // row-only and cannot make that distinction on its own). Read them via the
  // SECURITY DEFINER get_own_personalization() RPC instead, which scopes to
  // auth.uid() internally and is unaffected by the grant restriction. A
  // failure here is non-fatal — personalization is supplementary, not
  // auth-critical — so we fall back to nulls rather than blocking sign-in.
  // The try/catch is defensive: supabase-js normally resolves `{ data, error }`
  // even on an API-level failure, but a genuine thrown error (e.g. a network
  // fault) must not block sign-in either.
  let personalization: { position: string | null; focus_area: string | null } | null =
    null;
  try {
    const { data, error: personalizationError } = await supabase
      .rpc("get_own_personalization")
      .maybeSingle();

    if (personalizationError) {
      console.error(
        "[guards.requireAthlete] get_own_personalization failed:",
        personalizationError.message,
      );
    } else {
      personalization = data;
    }
  } catch (err) {
    console.error(
      "[guards.requireAthlete] get_own_personalization threw:",
      err instanceof Error ? err.message : String(err),
    );
  }

  return {
    userId: user.id,
    profile: {
      ...profile,
      position: personalization?.position ?? null,
      focus_area: personalization?.focus_area ?? null,
    } as AthleteProfile,
  };
}

/**
 * If a user is already signed in, redirect them to their role's home.
 * Used by /signup and /signin to bounce signed-in visitors away.
 *
 * LOOP PREVENTION: if the user is authenticated but has no profiles row
 * (e.g. the profile insert failed during signUp()), we must NOT redirect
 * to /dashboard — that page calls requireParent(), which redirects back
 * to /signin, creating an infinite loop. Instead we redirect to the
 * /auth/signout Route Handler, which can actually clear the session
 * cookies (Server Components cannot mutate cookies; Route Handlers can)
 * and then lands the user on /signin with an explanatory error param.
 */
export async function redirectIfAuthed() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { state } = await resolveSessionState(supabase, user);

  // Verified but not yet onboarded (SSO / confirmed email): finish setup.
  if (state === "pending") redirect("/welcome");

  // FV-325: adult_athlete (18+ self-serve) trains in the athlete app, same
  // home as a parent-created athlete.
  const home = homeForState(state);
  if (home) redirect(home);

  // `error`: we could not read the profile. Do NOT route to /welcome or
  // sign the user out on a transient failure — let the page (/signin,
  // /signup) render; the real gates re-check on the next request.
  if (state === "error") return;

  // `orphan` (or unknown role): the session cannot be used. Redirecting to
  // /dashboard would loop back here via requireParent(). Route the user
  // through the sign-out handler so the session is actually cleared first
  // (Server Components cannot mutate cookies; Route Handlers can).
  redirect("/auth/signout");
}

/**
 * Guard for /welcome (FV-672). Only a `pending` session may stay:
 *   none     -> /signin
 *   orphan   -> /auth/signout (unverified email-only; today's behaviour)
 *   parent / athlete / adult_athlete -> their role home
 *   error    -> throws SessionCheckError (never /welcome-as-fallthrough)
 * Returns the auth email for the "Signed in as" line (the auth email only).
 */
export async function requireOnboarding(): Promise<{
  userId: string;
  email: string | null;
  /** True when the account signed in with Apple (app_metadata.providers). */
  viaApple: boolean;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { state } = await resolveSessionState(supabase, user);
  if (state === "error") throw new SessionCheckError();
  if (state === "pending") {
    // app_metadata is server-controlled (never user_metadata, spec §5.8).
    const providers = (user.app_metadata?.providers ?? []) as unknown[];
    return {
      userId: user.id,
      email: user.email ?? null,
      viaApple: Array.isArray(providers) && providers.includes("apple"),
    };
  }
  if (state === "orphan" || state === "none") redirect("/auth/signout");
  redirect(homeForState(state) ?? "/auth/signout");
}
