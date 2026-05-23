import "server-only";

import { notFound } from "next/navigation";

import { requireParent } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Admin emails are configured via the ADMIN_EMAILS env var on Vercel
// (comma-separated). This is a beta-testing affordance, not a permanent
// admin role system. When the proper 18+ self-onboard fork ships,
// this gate can be retired.
//
// Routes guarded by requireAdminParent() return 404 (notFound) for any
// non-admin caller — including unauthenticated users and authenticated
// non-admin parents. Hidden surface, not a permission-denied surface.

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().has(email.trim().toLowerCase());
}

export async function requireAdminParent() {
  // First the parent check; if it redirects, never reaches here.
  const ctx = await requireParent();

  // Re-fetch the user to read the email (requireParent only returns profile).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    notFound();
  }

  return ctx;
}
