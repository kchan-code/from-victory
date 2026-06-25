// check-athlete-no-tracking.cjs  (FV-350)
//
// CI guard: fails if any banned analytics / ads / tracking / session-replay
// SDK is imported — or a third-party tracking script injected — on
// ATHLETE-FACING surfaces of apps/web.
//
// WHY THIS EXISTS
// ───────────────
// From Victory's public FAQ and pricing page promise:
//   "no ads, no behavioral analytics, and no third-party tracking, ever"
//   for athletes 13–17, and by extension for all athlete-facing routes.
// This invariant is currently true only by *absence* of those packages.
// This script turns that absence into a mechanical gate: adding a banned
// import (even accidentally) will fail the CI job before the PR merges.
//
// SCOPE: WHAT WE SCAN
// ───────────────────
// We scan file SOURCE TEXT — imports, require() calls, and script-src strings
// present in the files we examine. This is a STATIC TEXT SCAN, NOT a full
// transitive import-graph walk.
//
// LIMITATION (document honestly):
//   A file that re-exports a banned SDK under an alias — or a server action
//   that dynamically require()s one at runtime — would NOT be caught here.
//   Dynamic require with a variable argument is inherently undetectable by
//   static analysis. The guard catches the common, accidental pattern
//   (engineer adds `import { track } from "@vercel/analytics"`) and makes
//   the gap visible; a full module-graph tracer would require a build step
//   and is v2 hardening.
//
// SCANNED GLOBS (athlete-facing surfaces):
//   apps/web/app/athlete/**          — every route under /athlete
//   apps/web/components/pregame/**   — guided pregame session components
//   apps/web/components/postgame/**  — postgame debrief components
//   apps/web/components/athlete/**   — shared athlete-only UI (nav, pickers)
//   apps/web/components/daily/**     — daily training session UI
//   apps/web/app/layout.tsx          — root layout (affects all routes incl. athletes)
//
// Not scanned in v1:
//   - apps/web/app/dashboard/**      (parent-only)
//   - apps/web/app/signin|signup/**  (pre-auth, not minor-data surfaces per se)
//   - apps/web/components/landing/** (marketing page, adult-facing)
//   - apps/web/components/dashboard/**
//   If any of those are ever designated minor-reachable, add them here.
//
// BANNED TOKENS
// ─────────────
// Each entry is matched ONLY against:
//   (a) ES module import specifiers:  import X from "TOKEN"
//   (b) require() specifiers:         require("TOKEN") / require('TOKEN')
//   (c) Dynamic import specifiers:    import("TOKEN")
//   (d) Script src attributes:        src="TOKEN" / src={'TOKEN'} / src={`TOKEN`}
//   (e) script-src-shaped URL strings in dangerouslySetInnerHTML / <Script>
//
// Raw-line scanning is intentionally NOT done for common English words like
// "segment", "amplitude" — those have legitimate uses in audio-processing code.
// Instead, BANNED_TOKENS are checked against import/require/src string literals
// ONLY. For tokens that only appear as SDK invocations (gtag, fbq, dataLayer),
// a separate RAW_INVOCATION_PATTERNS list checks raw code for their call patterns.
//
// ALLOWLIST
// ─────────
// Sentry-style crash diagnostics (no behavioral beacons):
//   "@sentry/" — server-side error capture only; no user-behavior data sent.
//   Our own monitoring module (apps/web/lib/monitoring/notify.ts) uses Resend
//   for infra-error alerts and explicitly documents: "No tracking beacons or
//   behavioral data. Safe to call from athlete-facing code."
//   Neither is blocked by this guard.
//
// Zero dependencies — Node built-ins only. Runs in CI without `npm install`.

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Root of the monorepo (two levels up from .github/scripts/)
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Athlete-facing source dirs / files to scan (relative to REPO_ROOT).
// Directories are walked recursively; individual files are read directly.
const SCAN_PATHS = [
  'apps/web/app/athlete',
  'apps/web/components/pregame',
  'apps/web/components/postgame',
  'apps/web/components/athlete',
  'apps/web/components/daily',
  'apps/web/app/layout.tsx',
];

// Extensions to inspect.
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

// ---------------------------------------------------------------------------
// BANNED_TOKENS — checked against IMPORT/REQUIRE/SRC STRING LITERALS ONLY
//
// These are the npm package names / CDN URLs that must never appear in an
// import specifier or script src on athlete-facing surfaces.
// Each entry is a substring (case-insensitive) — e.g. "gtag" catches both
// "gtag" and "https://www.googletagmanager.com/gtag/js".
//
// Add new tokens as new strings in this array. Keep alphabetical.
// ---------------------------------------------------------------------------
const BANNED_IMPORT_TOKENS = [
  // Amplitude (analytics SDK — NOT the audio term "amplitude")
  'amplitude-js',
  '@amplitude/analytics',
  '@amplitude/node',
  // Datadog RUM — browser session replay / user monitoring
  '@datadog/browser-rum',
  'datadog-rum',
  // Facebook / Meta Pixel
  'fbevents.js',
  // FullStory
  '@fullstory/browser',
  'fullstory',
  // Google Analytics / Tag Manager (CDN URLs and npm packages)
  'google-analytics',
  'googletagmanager',
  'gtag/js',
  // Heap Analytics
  'heapanalytics',
  // Hotjar
  'hotjar',
  // Intercom (behavioral + chat widget)
  'intercom',
  // Microsoft Clarity
  'clarity.ms',
  // Mixpanel
  'mixpanel',
  // PostHog
  'posthog-js',
  'posthog-node',
  // Segment (analytics SDK — NOT internal variable names / audio segment types)
  'analytics.js',
  '@segment/analytics',
  // Vercel first-party analytics (behavioral beacon; not crash-only)
  '@vercel/analytics',
  '@vercel/speed-insights',
  // Crisp chat
  'crisp.chat',
  // Drift
  'drift.com',
];

// ---------------------------------------------------------------------------
// RAW_INVOCATION_PATTERNS — checked on non-comment code lines
//
// These patterns catch SDK invocations that appear outside import specifiers —
// e.g. `window.gtag(...)`, `fbq('track', ...)`, `dataLayer.push(...)`.
// Each entry must be a unique call-site fingerprint that cannot appear
// in legitimate non-tracking code (i.e. NOT plain English words).
// ---------------------------------------------------------------------------
const RAW_INVOCATION_PATTERNS = [
  // Google Analytics / GTM global push
  'window.gtag(',
  'window[\'gtag\']',
  'window["gtag"]',
  'dataLayer.push(',
  // Facebook Pixel global
  'window.fbq(',
  'window[\'fbq\']',
  'window["fbq"]',
  // Hotjar global
  'window.hj(',
  'window[\'hj\']',
  'window["hj"]',
  // Heap analytics
  'window.heap.',
  // Microsoft Clarity
  'window.clarity(',
  // Intercom
  'window.Intercom(',
  // Google Analytics legacy
  'window.ga(',
];

// Allowlist: imports containing any of these substrings are NOT flagged even
// if a banned token also matches. Sentry is a crash-only diagnostic tool
// with no behavioral beacons. Our own monitoring module is Resend-backed
// infra alerts, also no tracking.
const ALLOWED_TOKENS = [
  '@sentry/',
  'sentry/nextjs',
  'lib/monitoring',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect files with SCAN_EXTENSIONS under dirPath. */
function collectFiles(dirPath) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Return all files to scan (absolute paths). */
function resolveScanFiles() {
  const files = [];
  for (const rel of SCAN_PATHS) {
    const abs = path.join(REPO_ROOT, rel);
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      files.push(...collectFiles(abs));
    } else if (stat.isFile() && SCAN_EXTENSIONS.has(path.extname(abs))) {
      files.push(abs);
    }
  }
  return files;
}

/** True if the import specifier / token is on the allowlist. */
function isAllowed(token) {
  const lower = token.toLowerCase();
  return ALLOWED_TOKENS.some((a) => lower.includes(a.toLowerCase()));
}

/** True if the line is a code comment (single-line). */
function isCommentLine(line) {
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*')
  );
}

/**
 * Extract all string-literal values from import / require / src patterns.
 * Returns an array of { value: string, lineNo: number }.
 *
 * Patterns matched:
 *   import X from "VALUE"
 *   import("VALUE")
 *   require("VALUE")
 *   src="VALUE" / src={'VALUE'} / src={`VALUE`}
 */
function extractImportSpecifiers(source) {
  const results = [];
  const lines = source.split('\n');

  // One combined regex that matches import specifiers and src attributes.
  // Group 1: from/require/import() specifier value
  // Groups 2-4: src attribute values (three quote-forms)
  const SPECIFIER_RE = /(?:(?:from|require\s*\(|import\s*\()\s*(['"`])([^'"`\s]+)\1)|(?:src\s*=\s*(?:\{(['"`])([^'"`]+)\3\}|(['"`])([^'"`]+)\5|\{`([^`]+)`\}))/gi;

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (isCommentLine(line)) return;

    let match;
    SPECIFIER_RE.lastIndex = 0;
    while ((match = SPECIFIER_RE.exec(line)) !== null) {
      // Import/require specifier (groups 1,2) or src value (groups 3,4 / 5,6 / 7)
      const value = match[2] || match[4] || match[6] || match[7];
      if (value) {
        results.push({ value, lineNo });
      }
    }
  });

  return results;
}

/**
 * Scan source lines for raw SDK invocation patterns.
 * Only fires on non-comment lines. Returns { pattern, lineNo } pairs.
 */
function scanRawInvocations(source) {
  const hits = [];
  const lines = source.split('\n');

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (isCommentLine(line)) return;

    const lower = line.toLowerCase();
    for (const pattern of RAW_INVOCATION_PATTERNS) {
      if (lower.includes(pattern.toLowerCase())) {
        hits.push({ pattern, lineNo });
        break; // one hit per line is enough
      }
    }
  });

  return hits;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const files = resolveScanFiles();
  const violations = [];

  for (const filePath of files) {
    let source;
    try {
      source = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error(`[check-athlete-no-tracking] Could not read ${filePath}: ${err.message}`);
      continue;
    }

    const relPath = path.relative(REPO_ROOT, filePath);

    // --- Check 1: import/require/src specifier strings vs BANNED_IMPORT_TOKENS ---
    const specifiers = extractImportSpecifiers(source);
    for (const { value, lineNo } of specifiers) {
      if (isAllowed(value)) continue;
      const lower = value.toLowerCase();
      for (const banned of BANNED_IMPORT_TOKENS) {
        if (lower.includes(banned.toLowerCase())) {
          violations.push({
            file: relPath,
            line: lineNo,
            kind: 'import/src',
            matched: banned,
            snippet: value,
          });
          break; // one violation per specifier
        }
      }
    }

    // --- Check 2: raw SDK invocation patterns (window.gtag, fbq, etc.) ---
    const rawHits = scanRawInvocations(source);
    for (const { pattern, lineNo } of rawHits) {
      // Deduplicate with Check 1 hits on same line
      const alreadyReported = violations.some(
        (v) => v.file === relPath && v.line === lineNo,
      );
      if (!alreadyReported) {
        violations.push({
          file: relPath,
          line: lineNo,
          kind: 'sdk-invocation',
          matched: pattern,
          snippet: '(raw global invocation)',
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------------

  console.log('');
  console.log('check-athlete-no-tracking (FV-350)');
  console.log('  Scanned athlete-facing surfaces for banned analytics / ads / tracking SDKs.');
  console.log(`  Files scanned   : ${files.length}`);
  console.log(`  Banned imports  : ${BANNED_IMPORT_TOKENS.length} tokens`);
  console.log(`  Banned patterns : ${RAW_INVOCATION_PATTERNS.length} raw invocations`);
  console.log('');

  if (violations.length === 0) {
    console.log('  PASS — no banned analytics / tracking tokens found on athlete-facing surfaces.');
    console.log('');
    process.exit(0);
  }

  console.error('  FAIL — banned analytics / tracking token(s) found on athlete-facing surfaces.');
  console.error('');
  console.error('  These SDKs are banned on any route a 13-17 athlete can reach (CLAUDE.md');
  console.error('  "Non-Negotiable Constraints / Minor Data Protection"). Remove them.');
  console.error('');

  for (const v of violations) {
    console.error(`  VIOLATION  ${v.file}:${v.line}  [${v.kind}]`);
    console.error(`             matched  : ${v.matched}`);
    console.error(`             in       : ${v.snippet}`);
    console.error('');
  }

  console.error(`  ${violations.length} violation(s) found. Fix all before merging.`);
  console.error('');
  process.exit(1);
}

main();
