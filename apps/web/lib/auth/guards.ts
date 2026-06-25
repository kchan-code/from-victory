import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Sport } from "@/lib/sports";

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
    .single();

  if (error || !profile) redirect("/signin");
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
    .single();

  if (error || !profile) redirect("/signin");
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
    .single();

  if (error || !profile) redirect("/signin");
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
    .select("id, role, first_name, sport, sport_selected_at, position, focus_area")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/signin");
  // FV-325: accept the 18+ self-serve role on athlete training surfaces.
  if (profile.role !== "athlete" && profile.role !== "adult_athlete")
    redirect("/signin");

  return {
    userId: user.id,
    profile: profile as AthleteProfile,
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // FV-325: adult_athlete (18+ self-serve) trains in the athlete app, same
  // home as a parent-created athlete.
  if (profile?.role === "athlete" || profile?.role === "adult_athlete")
    redirect("/athlete");
  if (profile?.role === "parent") redirect("/dashboard");

  // No profile (or unknown role): the session is orphaned. Redirecting to
  // /dashboard would loop back here via requireParent(). Route the user
  // through the sign-out handler so the session is actually cleared first.
  redirect("/auth/signout");
}
