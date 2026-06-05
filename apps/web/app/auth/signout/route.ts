import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Signs the caller out and redirects to /signin.
//
// This MUST be a Route Handler (not a Server Component or Server Action
// called from a redirect chain) because the server Supabase client swallows
// cookie writes during Server Component render (the setAll try/catch in
// lib/supabase/server.ts). In a Route Handler the cookies() store is
// writable, so supabase.auth.signOut() successfully clears the session
// cookies on the response.
//
// Primary caller: redirectIfAuthed() in lib/auth/guards.ts, used to break
// the infinite redirect loop that occurs when a user is authenticated but
// has no profiles row (auth user created, profile insert failed). Without
// this escape hatch, /signin bounces the orphaned session to /dashboard,
// which bounces it back to /signin — forever.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(
    new URL("/signin?error=session_invalid", url.origin),
  );
}
