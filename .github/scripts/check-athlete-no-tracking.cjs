// check-athlete-no-tracking.cjs  (FV-350, native surfaces FV-728)
//
// CI guard: fails if any banned analytics / ads / tracking / session-replay
// SDK is imported — or a third-party tracking script injected — on
// ATHLETE-FACING surfaces of apps/web, or declared in the native shell
// (apps/native package.json, CocoaPods, Gradle, or plugin import lines).
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
//   apps/web/app/signin/**           — athlete sign-in (every return visit)
//   apps/web/app/pair/**             — athlete pairing / claim on a new device
//   apps/web/app/forgot-password/**  — athlete-reachable reset flow
//   apps/web/app/reset-password/**   — athlete-reachable reset flow
//   apps/web/app/auth/**             — auth callback / signout route handlers
//   apps/web/components/auth/**      — sign-in / claim / username form components
//   apps/web/app/layout.tsx          — root layout (affects all routes incl. athletes)
//
// FV-728 — native shell (the binary athletes install). Declared dependencies
// only, not a resolved Maven/CocoaPods graph:
//   apps/native/package.json
//   apps/native/ios/App/Podfile and Podfile.lock (when committed)
//   apps/native/android/**/*.gradle
//   import lines in apps/native plugin sources (.swift, .java, .kt, .m)
//
// Not scanned in v1:
//   - apps/web/app/dashboard/**      (parent-only)
//   - apps/web/app/signup/**         (account creation: parent-managed or adult self-serve)
//   - apps/web/components/landing/** (marketing page, adult-facing)
//   - apps/web/components/dashboard/**
//   Keep SCAN_PATHS in sync as new athlete-reachable routes are added.
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
  // Auth/pairing surfaces a 13-17 athlete passes through — sign-in on every
  // return visit, pairing/claim on a new device, password-reset links. Added
  // per the FV-350 privacy review (PR #289): a tracking script added here would
  // otherwise evade the guard on the athlete's most-frequented pre-session page.
  'apps/web/app/signin',
  'apps/web/app/pair',
  // FV-630: the invite door (an athlete's first screen) and the root-layout
  // native link handler.
  'apps/web/app/invite',
  'apps/web/components/native',
  'apps/web/lib/invites',
  'apps/web/app/forgot-password',
  'apps/web/app/reset-password',
  'apps/web/app/auth',
  'apps/web/components/auth',
  'apps/web/app/layout.tsx',
  // Root-layout helper components + the analytics gate module (FV-395 /
  // PR #302 privacy review): layout.tsx only imports these by relative
  // path, so without scanning them a banned SDK could hide one level of
  // indirection away from the root layout and evade this guard.
  'apps/web/app/_components',
  'apps/web/lib/analytics',
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
  // TikTok Pixel (From Victory has an active TikTok channel; ban on minor surfaces)
  'analytics.tiktok.com',
  '@tiktok/analytics',
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
// FILE-SCOPED EXCEPTIONS — banned tokens sanctioned in ONE named file only.
//
// FV-395 (PR #302): AnalyticsMount.tsx is the single sanctioned
// @vercel/analytics import in the app. It renders nothing unless
// usePathname() is on the public-marketing allowlist
// (lib/analytics/allowed-routes.ts — deny-by-default, unit-tested), so the
// SDK never loads on an athlete-reachable route; beforeSend event filtering
// is a second layer. Reviewed and approved by kids-privacy-officer.
// The exception is keyed to (file, token): importing @vercel/analytics from
// ANY other scanned file — or adding a different banned SDK to this file —
// still fails the guard.
// ---------------------------------------------------------------------------
const FILE_TOKEN_EXCEPTIONS = {
  'apps/web/app/_components/AnalyticsMount.tsx': ['@vercel/analytics'],
};

/** True if this (file, banned-token) pair is a documented sanctioned exception. */
function isExceptedFileToken(relPath, bannedToken) {
  const posixPath = relPath.split(path.sep).join('/');
  const tokens = FILE_TOKEN_EXCEPTIONS[posixPath];
  return Boolean(tokens && tokens.includes(bannedToken));
}

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
// FV-728 — native shell dependency scan
//
// Same deny-list as the web import scan, plus the native SDK names that do
// not appear as npm import specifiers (Firebase Analytics, Crashlytics,
// AdMob, the Facebook SDK, AppsFlyer, Adjust, and close cousins).
//
// Play Billing (`com.android.billingclient:billing`) is an explicit allow-list
// entry. It is the payments library, not a tracking SDK (FV-664). A line that
// declares billing AND a banned coordinate still fails. This scan does not
// walk Maven's or CocoaPods' transitive graph: firebase-encoders pulled in by
// billing is not a hit unless someone declares it.
//
// Podfile.lock is scanned only when it is in the checkout. It is gitignored
// until a Mac `pod install` commits it (docs/ios-app-store-release.md §11), so
// CI does not see transitive pods until that file lands.
//
// Native lines also honor ALLOWED_TOKENS (the web Sentry exception). Adding a
// name there is a privacy-reviewed edit of this script, not a casual
// dependency add.
//
// Gradle, version catalogs (*.toml), Package.swift, and the Xcode project are
// scanned on every non-comment line, so `id` / `apply plugin` lines and a
// coordinate on its own line are included. A banned SDK that appears only as
// an unresolved alias with none of these tokens in the name is still missed.
// ---------------------------------------------------------------------------

const NATIVE_REQUIRED_FILES = [
  'apps/native/package.json',
  'apps/native/ios/App/Podfile',
  'apps/native/android/app/build.gradle',
  'apps/native/android/build.gradle',
];

const NATIVE_BANNED_TOKENS = [
  ...BANNED_IMPORT_TOKENS,
  'firebase-analytics',
  'firebaseanalytics',
  'firebase/analytics',
  'firebase.analytics',
  'firebase-crashlytics',
  'firebasecrashlytics',
  'firebase/crashlytics',
  'firebase.crashlytics',
  'com.google.firebase',
  'crashlytics',
  'play-services-ads',
  'admob',
  'googlemobileads',
  'google-mobile-ads-sdk',
  'fbsdk',
  'facebook-android-sdk',
  'facebook-ios-sdk',
  'fbaudiencenetwork',
  'appsflyer',
  'com.adjust.sdk',
  'adjust-android',
  'adjustsdk',
  // Bare "adjust" matches `pod 'Adjust'` and `import Adjust`. It is not on the
  // web list: audio code says "adjust" in English. Native scan only looks at
  // dependency and import lines, so that English use is not in range.
  'adjust',
  'kochava',
  'onesignal',
  'com.singular.sdk',
];

const NATIVE_SOURCE_EXTENSIONS = new Set(['.swift', '.java', '.kt', '.kts', '.m', '.mm']);
const NATIVE_SKIP_DIRS = new Set([
  'node_modules',
  'Pods',
  'build',
  '.gradle',
  'DerivedData',
  'capacitor-cordova-android-plugins',
]);

/** True when the line is a Play Billing declaration and nothing else banned. */
function isPlayBillingAllowListed(line) {
  const lower = line.toLowerCase();
  if (!lower.includes('com.android.billingclient:billing')) return false;
  const stripped = lower.replace(/com\.android\.billingclient:billing(-ktx)?/g, '');
  return !NATIVE_BANNED_TOKENS.some((banned) => stripped.includes(banned.toLowerCase()));
}

function nativeBannedInLine(line) {
  if (isCommentLine(line) || line.trimStart().startsWith('#')) return null;
  if (isAllowed(line) || isPlayBillingAllowListed(line)) return null;
  const lower = line.toLowerCase();
  for (const banned of NATIVE_BANNED_TOKENS) {
    if (lower.includes(banned.toLowerCase())) return banned;
  }
  return null;
}

function isNativeDependencyLine(line) {
  return /\b(implementation|api|compileOnly|runtimeOnly|classpath|testImplementation|androidTestImplementation|kapt|ksp)\b/.test(line)
    || /\bpod\s+['"]/.test(line)
    || /\b(id|apply)\b/.test(line);
}

function isNativeImportLine(line) {
  return /^\s*(import\s+|import\s*\(|#import\s+|#include\s+)/.test(line);
}

/**
 * Scan one native manifest. package.json is parsed (dependency names only).
 * Gradle and Podfiles are scanned on dependency lines. Plugin sources are
 * scanned on import lines. Other files are scanned on non-comment lines when
 * the caller asks for that (Podfile.lock pod names are not `pod '...'` lines).
 */
function scanNativeContent(relPath, source, mode) {
  const violations = [];
  if (mode === 'package.json') {
    let parsed;
    try {
      parsed = JSON.parse(source);
    } catch (err) {
      violations.push({
        file: relPath,
        line: 1,
        kind: 'native-manifest',
        matched: 'package.json',
        snippet: `unreadable package.json: ${err.message}`,
      });
      return violations;
    }
    for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
      const deps = parsed[section];
      if (!deps || typeof deps !== 'object') continue;
      for (const name of Object.keys(deps)) {
        const banned = nativeBannedInLine(name);
        if (banned) {
          violations.push({
            file: relPath,
            line: 1,
            kind: 'native-dependency',
            matched: banned,
            snippet: `${section}: ${name}`,
          });
        }
      }
    }
    return violations;
  }

  const lines = source.split('\n');
  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const relevant = mode === 'imports'
      ? isNativeImportLine(line)
      : mode === 'deps'
        ? isNativeDependencyLine(line)
        : true;
    if (!relevant) return;
    const banned = nativeBannedInLine(line);
    if (!banned) return;
    violations.push({
      file: relPath,
      line: lineNo,
      kind: mode === 'imports' ? 'native-import' : 'native-dependency',
      matched: banned,
      snippet: line.trim().slice(0, 180),
    });
  });
  return violations;
}

function walkNativeFiles(dirPath, predicate) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (NATIVE_SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkNativeFiles(fullPath, predicate));
    } else if (entry.isFile() && predicate(entry.name, fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

function scanNativeSurfaces() {
  const violations = [];
  const scanned = [];

  for (const rel of NATIVE_REQUIRED_FILES) {
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) {
      violations.push({
        file: rel,
        line: 1,
        kind: 'native-manifest',
        matched: 'missing-required-file',
        snippet: 'native guard required this file and it was not in the checkout',
      });
      continue;
    }
    scanned.push(abs);
    const source = fs.readFileSync(abs, 'utf8');
    // Gradle and the Podfile are scanned on every non-comment line so a plugin
    // id, an `apply plugin` line, or a coordinate on its own line is visible.
    const mode = rel.endsWith('package.json') ? 'package.json' : 'text';
    violations.push(...scanNativeContent(rel, source, mode));
  }

  const podLock = path.join(REPO_ROOT, 'apps/native/ios/App/Podfile.lock');
  if (fs.existsSync(podLock)) {
    scanned.push(podLock);
    violations.push(...scanNativeContent(
      'apps/native/ios/App/Podfile.lock',
      fs.readFileSync(podLock, 'utf8'),
      'lock',
    ));
  }

  const nativeRoot = path.join(REPO_ROOT, 'apps/native');
  const gradleRoot = path.join(REPO_ROOT, 'apps/native/android');
  for (const file of walkNativeFiles(gradleRoot, (name) => name.endsWith('.gradle') || name.endsWith('.gradle.kts'))) {
    if (scanned.includes(file)) continue;
    scanned.push(file);
    const rel = path.relative(REPO_ROOT, file);
    violations.push(...scanNativeContent(rel, fs.readFileSync(file, 'utf8'), 'text'));
  }

  // Version catalogs, Swift Package Manager, and Xcode package references.
  const extraManifests = walkNativeFiles(
    nativeRoot,
    (name) => name === 'Package.swift' || name.endsWith('.toml') || name === 'project.pbxproj',
  );
  for (const file of extraManifests) {
    if (scanned.includes(file)) continue;
    scanned.push(file);
    const rel = path.relative(REPO_ROOT, file);
    violations.push(...scanNativeContent(rel, fs.readFileSync(file, 'utf8'), 'text'));
  }

  for (const file of walkNativeFiles(nativeRoot, (name) => NATIVE_SOURCE_EXTENSIONS.has(path.extname(name)))) {
    scanned.push(file);
    const rel = path.relative(REPO_ROOT, file);
    violations.push(...scanNativeContent(rel, fs.readFileSync(file, 'utf8'), 'imports'));
  }

  return { violations, filesScanned: scanned.length };
}

/**
 * Proves a banned native coordinate fails and Play Billing does not.
 * Runs in memory. Nothing is written into the tree.
 */
function runNativeSelfTest() {
  const failures = [];
  const mustFlag = [
    ['fixture/app/build.gradle', 'deps', 'implementation "com.google.firebase:firebase-analytics:22.0.0"'],
    ['fixture/app/build.gradle', 'deps', 'implementation "com.google.firebase:firebase-crashlytics:19.0.0"'],
    ['fixture/app/build.gradle', 'deps', 'implementation "com.google.android.gms:play-services-ads:23.0.0"'],
    ['fixture/app/build.gradle', 'deps', 'implementation "com.android.billingclient:billing:9.1.0"\nimplementation "com.google.firebase:firebase-analytics:22.0.0"'],
    ['fixture/Podfile', 'deps', "pod 'FirebaseAnalytics'\n"],
    ['fixture/Podfile', 'deps', "pod 'FBSDKCoreKit'\n"],
    ['fixture/Podfile', 'deps', "pod 'AppsFlyerFramework'\n"],
    ['fixture/Podfile', 'deps', "pod 'Adjust'\n"],
    ['fixture/Plugin.swift', 'imports', 'import FirebaseCrashlytics\n'],
    ['fixture/package.json', 'package.json', '{"dependencies":{"@react-native-firebase/analytics":"1.0.0"}}\n'],
    ['fixture/app/build.gradle', 'text', "id 'com.google.firebase.crashlytics'\n"],
    ['fixture/app/build.gradle', 'text', "apply plugin: 'com.google.firebase.crashlytics'\n"],
    ['fixture/app/build.gradle', 'text', '    "com.google.firebase:firebase-analytics:22.0.0"\n'],
    ['fixture/libs.versions.toml', 'text', 'firebase-analytics = "22.0.0"\n'],
    ['fixture/libs.versions.toml', 'text', 'analytics = { module = "libs.firebase.analytics" }\n'],
  ];
  const mustAllow = [
    ['fixture/app/build.gradle', 'deps', 'implementation "com.android.billingclient:billing:9.1.0"'],
    ['fixture/app/build.gradle', 'text', 'implementation "com.android.billingclient:billing:9.1.0"'],
    ['fixture/app/build.gradle', 'deps', 'implementation "androidx.appcompat:appcompat:1.7.1"'],
    ['fixture/app/build.gradle', 'deps', '// implementation "com.google.firebase:firebase-analytics:22.0.0"'],
    ['fixture/Plugin.swift', 'imports', 'import AVFoundation\n'],
    ['fixture/Plugin.swift', 'imports', '// import FirebaseAnalytics\n'],
    ['fixture/package.json', 'package.json', '{"dependencies":{"@capacitor/app":"^8.0.0"}}\n'],
  ];

  for (const [file, mode, source] of mustFlag) {
    const hits = scanNativeContent(file, source, mode);
    if (hits.length === 0) {
      failures.push(`expected a hit in ${file}: ${source.split('\n')[0]}`);
    }
  }
  for (const [file, mode, source] of mustAllow) {
    const hits = scanNativeContent(file, source, mode);
    if (hits.length !== 0) {
      failures.push(`Play Billing / allowed line was flagged in ${file}: ${hits.map((h) => h.matched).join(', ')}`);
    }
  }
  return failures;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const files = resolveScanFiles();
  const violations = [];
  const native = scanNativeSurfaces();
  violations.push(...native.violations);
  const selfTestFailures = runNativeSelfTest();

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
          if (isExceptedFileToken(relPath, banned)) continue;
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
  console.log('check-athlete-no-tracking (FV-350, native FV-728)');
  console.log('  Scanned athlete-facing surfaces and the native shell for banned tracking SDKs.');
  console.log(`  Web files scanned    : ${files.length}`);
  console.log(`  Native files scanned : ${native.filesScanned}`);
  console.log(`  Banned imports       : ${BANNED_IMPORT_TOKENS.length} tokens`);
  console.log(`  Native tokens        : ${NATIVE_BANNED_TOKENS.length} tokens`);
  console.log(`  Banned patterns      : ${RAW_INVOCATION_PATTERNS.length} raw invocations`);
  console.log('  Allow-list           : com.android.billingclient:billing (Play Billing, FV-664)');
  if (selfTestFailures.length === 0) {
    console.log('  SELF-TEST PASS — a banned native dependency fails; Play Billing is allow-listed.');
  }
  console.log('');

  if (selfTestFailures.length > 0) {
    console.error('  SELF-TEST FAIL — the native guard did not behave as specified.');
    for (const failure of selfTestFailures) {
      console.error(`    ${failure}`);
    }
    console.error('');
    process.exit(1);
  }

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
