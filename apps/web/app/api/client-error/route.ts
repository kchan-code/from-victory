/**
 * POST /api/client-error (FV-729)
 *
 * First-party report from the root and athlete error boundaries. Alerts go
 * through notifyError (the existing Resend channel) with an in-memory rate
 * limit. Nothing is written to the database.
 *
 * The handler does not read cookies, does not call getUser, and does not
 * accept a user id. Shell capability is classified from the User-Agent the
 * browser already sends — the same presentation hint as lib/native-shell —
 * and only the enum is kept. The raw UA is not logged or emailed.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getShellCapability } from "@/lib/native-shell";
import {
  isAllowedErrorOrigin,
  parseClientErrorReport,
} from "@/lib/monitoring/client-error-report";
import {
  claimClientErrorAlert,
  clientErrorAlertKey,
} from "@/lib/monitoring/client-error-rate-limit";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";

const MAX_BODY_CHARS = 2_000;

function rejected() {
  return NextResponse.json({ ok: false }, { status: 400 });
}

export async function POST(req: NextRequest) {
  if (
    !isAllowedErrorOrigin(
      req.headers.get("origin"),
      process.env.NEXT_PUBLIC_SITE_URL,
    )
  ) {
    return rejected();
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_CHARS) {
    return rejected();
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return rejected();
  }
  if (raw.length === 0 || raw.length > MAX_BODY_CHARS) return rejected();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return rejected();
  }

  const report = parseClientErrorReport(parsed);
  if (!report) return rejected();

  const shell = getShellCapability(req.headers.get("user-agent")) ?? "web";
  const key = clientErrorAlertKey(report, shell);
  if (!claimClientErrorAlert(key)) {
    return new NextResponse(null, { status: 204 });
  }

  const context: Record<string, string> = {
    route: report.route,
    shell,
  };
  if (report.digest) context.digest = report.digest;
  if (report.build) context.build = report.build;

  deliverInBackground(
    notifyError(
      "[client-error] render error",
      report.message ?? "client error boundary",
      context,
    ),
  );

  return new NextResponse(null, { status: 204 });
}
