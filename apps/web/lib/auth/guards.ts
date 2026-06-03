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
    .select("id, role, first_name, sport, sport_selected_at")
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
  redirect("/dashboard");
}
