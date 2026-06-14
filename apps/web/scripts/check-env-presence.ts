#!/usr/bin/env node
// FV-188 — environment-variable presence check.
//
// Complement to the migration-drift detector. The 2026-06-10 incident had a
// second half: RESEND_API_KEY / WAITLIST_NOTIFICATION_TO / WAITLIST_NOTIFICATION_FROM
// were never set in prod, so the waitlist-notification + alert paths were
// silently inert. This script verifies that every REQUIRED documented env var
// is PRESENT in the current environment and alerts on any gap.
//
// NAMES ONLY — NON-NEGOTIABLE. This script never reads, prints, logs, or alerts
// a variable VALUE. It checks presence (is the name a non-empty key in
// process.env) and reports only the NAMES of any that are missing. (kids-privacy
// -officer reviews this file specifically for that property.)
//
// Source of truth = apps/web/.env.example. Every documented `KEY=` line is
// REQUIRED unless annotated optional. Mark a var optional with a comment on the
// line ABOVE it (preferred, keeps the value line clean) or trailing the line:
//     # fv-env-check: optional   (reason)
//     SOME_VAR=
// Optional vars are still reported as "present"/"absent" for visibility but do
// NOT fail the check or trigger an alert.
//
// Usage (from apps/web):
//   node --experimental-strip-types scripts/check-env-presence.ts
//   node --experimental-strip-types scripts/check-env-presence.ts --env-file .env.example
//   node --experimental-strip-types scripts/check-env-presence.ts --no-alert   (CI dry-run / local)
//
// Exit codes: 0 = all required present, 1 = one or more required missing
//             (and alert attempted), 2 = usage / IO error.

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { ciAlert } from "./ci-alert.ts";

const OPTIONAL_MARKER = /fv-env-check:\s*optional/i;

export interface DocumentedVar {
  name: string;
  optional: boolean;
}

/**
 * Parse a `.env.example`-style file into the list of documented variables.
 *
 * A documented var is a line of the form `NAME=...` (NAME is an env-style
 * identifier). Pure comment lines and blanks are skipped. A var is OPTIONAL if
 * the `fv-env-check: optional` marker appears either trailing its own line or
 * on the immediately-preceding comment line. VALUES are ignored entirely — we
 * only ever look at the NAME and the optional annotation.
 */
export function parseDocumentedVars(contents: string): DocumentedVar[] {
  const lines = contents.split(/\r?\n/);
  const out: DocumentedVar[] = [];
  const seen = new Set<string>();
  let prevWasOptionalComment = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("#")) {
      prevWasOptionalComment = OPTIONAL_MARKER.test(trimmed);
      continue;
    }
    if (!trimmed) {
      prevWasOptionalComment = false;
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      prevWasOptionalComment = false;
      continue;
    }

    const name = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      prevWasOptionalComment = false;
      continue;
    }

    // Optional if the preceding comment OR a trailing comment on this line
    // carries the marker. (We only inspect the comment text, never the value.)
    const hashIdx = trimmed.indexOf("#", eq);
    const trailingComment = hashIdx >= 0 ? trimmed.slice(hashIdx) : "";
    const optional = prevWasOptionalComment || OPTIONAL_MARKER.test(trailingComment);

    if (!seen.has(name)) {
      seen.add(name);
      out.push({ name, optional });
    }
    prevWasOptionalComment = false;
  }

  return out;
}

/** A var is "present" iff it is a non-empty, non-whitespace value in env. */
export function isPresent(name: string, env: Record<string, string | undefined>): boolean {
  const v = env[name];
  return typeof v === "string" && v.trim() !== "";
}

export function evaluate(
  vars: DocumentedVar[],
  env: Record<string, string | undefined>,
): { missingRequired: string[]; missingOptional: string[]; presentCount: number } {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  let presentCount = 0;
  for (const v of vars) {
    if (isPresent(v.name, env)) {
      presentCount++;
      continue;
    }
    if (v.optional) missingOptional.push(v.name);
    else missingRequired.push(v.name);
  }
  return { missingRequired, missingOptional, presentCount };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function defaultEnvExamplePath(): string {
  // Resolve relative to this script so it works from repo root or apps/web.
  const here = dirname(fileURLToPath(import.meta.url)); // apps/web/scripts
  return resolve(here, "..", ".env.example"); // apps/web/.env.example
}

function parseArgs(argv: string[]): { envFile: string; alert: boolean } {
  let envFile = "";
  let alert = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--env-file") envFile = argv[++i] ?? "";
    else if (a === "--no-alert") alert = false;
  }
  return { envFile: envFile || defaultEnvExamplePath(), alert };
}

async function main(): Promise<number> {
  const { envFile, alert } = parseArgs(process.argv.slice(2));

  const path = resolve(envFile);
  if (!existsSync(path)) {
    console.error(`[env-presence] .env.example not found at ${path}`);
    return 2;
  }

  let contents: string;
  try {
    contents = readFileSync(path, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[env-presence] Could not read ${path}: ${msg}`);
    return 2;
  }

  const vars = parseDocumentedVars(contents);
  if (vars.length === 0) {
    console.error(`[env-presence] No documented vars parsed from ${path} — refusing to pass blindly.`);
    return 2;
  }

  const requiredCount = vars.filter((v) => !v.optional).length;
  const { missingRequired, missingOptional, presentCount } = evaluate(vars, process.env);

  console.log(
    `[env-presence] documented=${vars.length} required=${requiredCount} ` +
      `present=${presentCount} missing_required=${missingRequired.length} ` +
      `missing_optional=${missingOptional.length}`,
  );
  if (missingOptional.length > 0) {
    console.log(`[env-presence] (optional, not failing) absent: ${missingOptional.join(", ")}`);
  }

  if (missingRequired.length === 0) {
    console.log("[env-presence] ✓ All required env vars are present.");
    return 0;
  }

  // NAMES ONLY in the log and the alert.
  console.error("[env-presence] ✗ Required env vars MISSING in this environment:");
  for (const name of missingRequired) console.error(`    - ${name}`);

  if (alert) {
    await ciAlert(
      "env-presence-gap",
      `${missingRequired.length} required env var(s) missing in ${process.env.GITHUB_WORKFLOW ? "CI" : "the deploy environment"}`,
      {
        missing_count: String(missingRequired.length),
        // Names only — never values.
        missing_names: missingRequired.join(", "),
      },
    );
  }

  return 1;
}

// Run only when executed directly (not when imported by the unit tests).
const invokedDirectly =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error("[env-presence] Unexpected error:", err);
      process.exit(2);
    });
}
