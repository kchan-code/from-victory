/**
 * GET /api/health (FV-729)
 *
 * Public reachability probe for an external uptime monitor. Returns no row
 * data and no secrets. Cached for no one.
 *
 * The probe is an anon-key header read of `training_sessions_catalog`.
 * That table is shared content (zero PII) and anon already has SELECT. The
 * query still has to reach Postgres; RLS returns no rows to anon. The service
 * role key is intentionally not used on this unauthenticated route.
 *
 * Wiring the monitor itself is a third-party dependency — see
 * docs/runbooks/uptime.md. This route does not phone any vendor.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const NO_STORE = {
  "Cache-Control": "no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
} as const;

function down() {
  return NextResponse.json({ ok: false }, { status: 503, headers: NO_STORE });
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.error("[health] Supabase URL or anon key is not configured");
    return down();
  }

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // head + count is a Postgres round-trip that returns no rows. The
    // catalog is shared content (no athlete data); anon's RLS policy matches
    // nothing, and the count is discarded either way.
    const { error } = await supabase
      .from("training_sessions_catalog")
      .select("day_number", { head: true, count: "exact" });

    if (error) {
      console.error("[health] database unreachable", error.code ?? "unknown");
      return down();
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  } catch {
    console.error("[health] database check threw");
    return down();
  }
}
