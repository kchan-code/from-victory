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
  await supabase.auth.getUser();

  return response;
}
