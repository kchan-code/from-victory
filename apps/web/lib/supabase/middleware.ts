import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./types";

let warnedMissingEnv = false;

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Degrade gracefully when env vars are missing: log once per process and
  // pass the request through with no session refresh. Without this, every
  // request would 500 with MIDDLEWARE_INVOCATION_FAILED, breaking even the
  // landing page. Routes that actually need a Supabase client (server actions,
  // /dashboard) will surface their own scoped error instead.
  if (!url || !anonKey) {
    if (!warnedMissingEnv) {
      warnedMissingEnv = true;
      console.warn(
        "[supabase/middleware] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing — session refresh disabled for this process.",
      );
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not put code between createServerClient and getUser. getUser()
  // validates the session against the Supabase Auth server and refreshes
  // the access token cookie when needed.
  //
  // FV-107 offline tolerance: wrap getUser() in a try/catch so a network
  // outage at the rink (no connectivity) does NOT hard-fail middleware and
  // produce a 500. On a network error we pass the request through unchanged
  // (no token refresh, but the existing cookies survive). The route's own
  // client-side auth logic (PregameClientShell) handles the offline case.
  //
  // SECURITY: this does NOT allow unauthenticated access online.
  //   - Supabase getUser() only throws a network-level error when it cannot
  //     reach auth.supabase.co (TypeError / "Failed to fetch"). An invalid or
  //     expired token causes an AuthError, NOT a thrown exception, so the
  //     catch block is never reached for bad credentials — they still fail
  //     through the normal getUser() result handling in the server component.
  //   - The middleware's job is session-cookie refresh, not an authorization
  //     gate. Authorization is enforced by requireAthlete() (now moved to the
  //     client component for the pregame route) and by RLS on every DB call.
  //   - Other routes that use requireAthlete() / requireParent() in Server
  //     Components still call getUser() themselves; if they fail offline the
  //     server will error as before (the offline path is narrowly for pregame,
  //     which is the only route with the PII-free client shell).
  try {
    await supabase.auth.getUser();
  } catch (err) {
    // Log once per request so we can see offline occurrences in server logs
    // without drowning them out. Do not re-throw — pass the request through.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[supabase/middleware] getUser() threw (likely offline):",
        err instanceof Error ? err.message : String(err),
      );
    }
    // Fall through: return the unmodified response.
  }

  return response;
}
