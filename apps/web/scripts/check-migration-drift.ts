#!/usr/bin/env node
// FV-188 — migration drift detector.
//
// Complement to the `db-migrate` workflow (FV-259, which AUTO-APPLIES migrations
// on merge). This one is a scheduled DETECTOR: it never applies anything. It
// answers "is any migration that exists locally NOT yet on the linked/remote
// project?" — the exact failure mode of the 2026-06-10 incident, where three
// merged migrations were never `db push`ed and sat silently inert on prod.
//
// READ-ONLY. It does not touch the database. It compares:
//   (a) the local migration versions = the 14-digit timestamp prefixes of the
//       *.sql files in supabase/migrations/, and
//   (b) the REMOTE versions reported by `supabase migration list --linked`.
// Drift = local versions with no matching remote version.
//
// Usage (from repo root or apps/web; pass the migrations dir + the CLI output):
//   supabase migration list --linked > /tmp/mig.txt
//   node --experimental-strip-types apps/web/scripts/check-migration-drift.ts \
//     --migrations-dir supabase/migrations --list-file /tmp/mig.txt
//
// Or pipe the CLI output on stdin:
//   supabase migration list --linked | \
//     node --experimental-strip-types apps/web/scripts/check-migration-drift.ts \
//       --migrations-dir supabase/migrations
//
// Exit codes: 0 = in sync, 1 = drift detected (and alert attempted),
//             2 = usage / IO error.
//
// On drift it alerts KC via ciAlert (the Resend channel) with FILENAMES only —
// migration filenames are not secrets and contain no user data.

import { readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { ciAlert } from "./ci-alert.ts";

// ---------------------------------------------------------------------------
// Pure parsing helpers (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Extract a 14-digit migration version timestamp from an arbitrary token.
 *
 * Uses digit lookarounds rather than `\b` because `_` is a word character — a
 * `\b` between the trailing digit and the `_` in `20260520200000_baseline.sql`
 * does NOT exist, so `\b\d{14}\b` would fail to match a real filename. The
 * `(?<!\d)...(?!\d)` guard isolates an exactly-14-digit run (not part of a
 * longer number) while allowing `_`, `.`, whitespace, or string edges around it.
 */
export function extractVersion(token: string): string | null {
  const m = token.match(/(?<!\d)(\d{14})(?!\d)/);
  return m?.[1] ?? null;
}

/**
 * Local migration versions = the 14-digit prefix of each `*.sql` file in the
 * migrations directory. Returns a sorted, de-duplicated list of versions, and
 * a version→filename map for human-readable alerting.
 */
export function readLocalMigrations(dir: string): {
  versions: string[];
  fileByVersion: Map<string, string>;
} {
  const fileByVersion = new Map<string, string>();
  const entries = readdirSync(dir);
  for (const name of entries) {
    if (!name.endsWith(".sql")) continue;
    const version = extractVersion(name);
    if (!version) continue;
    // First file wins if two share a prefix (shouldn't happen — versions are unique).
    if (!fileByVersion.has(version)) fileByVersion.set(version, name);
  }
  const versions = [...fileByVersion.keys()].sort();
  return { versions, fileByVersion };
}

/**
 * Parse the REMOTE column of `supabase migration list --linked` output.
 *
 * The CLI prints a bordered, pipe-delimited table whose data rows look like:
 *     20260520200000 | 20260520200000 | 2026-05-20 ...
 * (Local | Remote | Time). A migration applied remotely has a 14-digit value
 * in the SECOND (Remote) column; one missing remotely has an empty Remote cell:
 *     20260613100000 |                | 2026-06-13 ...
 *
 * We collect every version that appears in the Remote column. We deliberately
 * parse by column position (not "any 14-digit token on the line") so a local-
 * only migration — whose timestamp appears ONLY in the Local column — is NOT
 * mistakenly counted as present remotely.
 *
 * Robust to CLI cosmetics: tolerates leading/trailing border pipes, header and
 * separator (`---`) rows, and surrounding whitespace.
 */
export function parseRemoteVersions(listOutput: string): Set<string> {
  const remote = new Set<string>();
  const lines = listOutput.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || !line.includes("|")) continue;
    // Drop optional leading/trailing border pipes, then split into cells.
    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    if (cells.length < 2) continue;
    // Skip header / separator rows (no 14-digit value anywhere on the row).
    const remoteCell = cells[1] ?? "";
    const version = extractVersion(remoteCell);
    if (version) remote.add(version);
  }
  return remote;
}

/** Drift = local versions absent from the remote set. */
export function computeDrift(
  localVersions: string[],
  remoteVersions: Set<string>,
): string[] {
  return localVersions.filter((v) => !remoteVersions.has(v));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { migrationsDir: string; listFile?: string } {
  let migrationsDir = "supabase/migrations";
  let listFile: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--migrations-dir") migrationsDir = argv[++i] ?? migrationsDir;
    else if (a === "--list-file") listFile = argv[++i];
  }
  return { migrationsDir, listFile };
}

function readStdin(): string {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

async function main(): Promise<number> {
  const { migrationsDir, listFile } = parseArgs(process.argv.slice(2));

  let listOutput: string;
  try {
    listOutput = listFile ? readFileSync(listFile, "utf8") : readStdin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[migration-drift] Could not read migration-list output: ${msg}`);
    return 2;
  }

  if (!listOutput.trim()) {
    console.error(
      "[migration-drift] Empty `supabase migration list --linked` output. " +
        "The CLI likely failed to link (bad token/ref) — treating as a hard failure so it can't false-pass.",
    );
    await ciAlert(
      "migration-drift-check-error",
      "supabase migration list --linked produced no output (link/auth likely failed)",
      { migrations_dir: migrationsDir },
    );
    return 2;
  }

  let local: ReturnType<typeof readLocalMigrations>;
  try {
    local = readLocalMigrations(migrationsDir);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[migration-drift] Could not read migrations dir "${migrationsDir}": ${msg}`);
    return 2;
  }

  const remote = parseRemoteVersions(listOutput);
  const drift = computeDrift(local.versions, remote);

  console.log(
    `[migration-drift] local=${local.versions.length} remote=${remote.size} drift=${drift.length}`,
  );

  if (drift.length === 0) {
    console.log("[migration-drift] ✓ All local migrations are present on the linked project.");
    return 0;
  }

  const driftFiles = drift.map((v) => local.fileByVersion.get(v) ?? v);
  console.error("[migration-drift] ✗ Migrations missing on the linked/remote project:");
  for (const f of driftFiles) console.error(`    - ${f}`);
  console.error(
    "[migration-drift] These are merged but NOT applied to prod. Run `supabase db push` " +
      "(or check the db-migrate workflow) — this is the FV-259 / 2026-06-10 incident class.",
  );

  // Names/filenames only — never values. Cap the list so the email stays small.
  const shown = driftFiles.slice(0, 20).join(", ");
  const extra = driftFiles.length > 20 ? ` (+${driftFiles.length - 20} more)` : "";
  await ciAlert(
    "migration-drift-detected",
    `${driftFiles.length} migration(s) merged but not applied to the linked project`,
    {
      missing_count: String(driftFiles.length),
      missing_migrations: `${shown}${extra}`,
      remedy: "supabase db push (deliberate human action)",
    },
  );

  return 1;
}

// Run only when executed directly (not when imported by the unit tests, which
// would otherwise trigger process.exit on import).
const invokedDirectly =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      // Last-ditch: never let an unexpected throw turn into a green job.
      console.error("[migration-drift] Unexpected error:", err);
      process.exit(2);
    });
}
