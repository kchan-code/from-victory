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
  role: "athlete";
  first_name: string;
  sport: Sport;
  sport_selected_at: string | null;
  // FV-228: personalization quiz fields. Nullable — athlete may have skipped.
  // These are athlete-private; never exposed to parent queries.
  position: string | null;
  focus_area: string | null;
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
  if (profile.role !== "athlete") redirect("/signin");

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

  if (profile?.role === "athlete") redirect("/athlete");
  if (profile?.role === "parent") redirect("/dashboard");

  // No profile (or unknown role): the session is orphaned. Redirecting to
  // /dashboard would loop back here via requireParent(). Route the user
  // through the sign-out handler so the session is actually cleared first.
  redirect("/auth/signout");
}
