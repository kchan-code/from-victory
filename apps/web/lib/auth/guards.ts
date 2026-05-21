import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ParentProfile = {
  id: string;
  role: "parent";
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

export async function redirectIfAuthed(to: string = "/dashboard") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(to);
}
