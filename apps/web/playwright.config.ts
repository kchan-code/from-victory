/**
 * Playwright configuration for From Victory.
 *
 * Default viewport: iPhone 14 (390 × 844) — mobile-first per QA spec.
 * Secondary viewport: Pixel 7 is wired as a second project below but
 *   excluded from the default run; enable via `--project=pixel7`.
 *
 * Auth projects:
 *   chromium-mobile-parent  — parent storageState (multi-athlete.e2e.ts)
 *   chromium-mobile-athlete — athlete storageState (practice-flow.e2e.ts)
 *
 * webServer: spins up `next dev` locally or `next build && next start` on CI.
 *   Env vars (NEXT_PUBLIC_SUPABASE_URL etc.) are injected by global-setup
 *   before Next.js starts, and also forwarded explicitly via the env block.
 */

import path from "path";

import { defineConfig, devices } from "@playwright/test";

// Base URL defaults to localhost:3000. Override via E2E_BASE_URL in .env.test
// for CI environments that run on a different port.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  // Test files live under apps/web/e2e/
  testDir: path.join(__dirname, "e2e"),

  // Each test file runs in isolation: no shared state between files.
  fullyParallel: false, // serial until we have more specs; avoids DB races

  // Fail the build immediately if a test.only slipped into a committed spec.
  forbidOnly: !!process.env.CI,

  // Retry once on CI to absorb transient flakiness; zero retries locally for
  // fast feedback.
  retries: process.env.CI ? 1 : 0,

  // Single worker on CI to prevent Supabase write conflicts.
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? "github" : "list",

  // Global timeout per test.
  timeout: 30_000,

  // Timeout for each expect() assertion.
  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL,

    // iPhone 14 — mobile-first per qa-reviewer spec.
    ...devices["iPhone 14"],

    // Capture traces on first retry so failures are diagnosable in CI.
    trace: "on-first-retry",

    // Screenshot on failure.
    screenshot: "only-on-failure",
  },

  projects: [
    // ------------------------------------------------------------------
    // Setup project: runs global-setup before any test project.
    // ------------------------------------------------------------------
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },

    // ------------------------------------------------------------------
    // Parent-auth specs — signed in as the test parent.
    // ------------------------------------------------------------------
    {
      name: "chromium-mobile-parent",
      testMatch: /multi-athlete\.e2e\.ts$/,
      use: {
        ...devices["iPhone 14"],
        storageState: path.join(__dirname, "e2e", ".auth", "parent.storageState.json"),
      },
      dependencies: ["setup"],
    },

    // ------------------------------------------------------------------
    // Athlete-auth specs — signed in as the test athlete.
    // These target /athlete/* routes which call requireAthlete() and redirect
    // non-athletes, so they must use the athlete session. The seeded athlete
    // is sport: "hockey" (see global-setup), which postgame-module relies on.
    // ------------------------------------------------------------------
    {
      name: "chromium-mobile-athlete",
      testMatch: [/practice-flow\.e2e\.ts$/, /postgame-module\.e2e\.ts$/],
      use: {
        ...devices["iPhone 14"],
        storageState: path.join(__dirname, "e2e", ".auth", "athlete.storageState.json"),
      },
      dependencies: ["setup"],
    },

    // ------------------------------------------------------------------
    // Secondary: Pixel 7 — run explicitly with --project=pixel7
    // Parent-auth only (multi-athlete). Add pixel7-athlete if needed.
    // ------------------------------------------------------------------
    {
      name: "pixel7",
      testMatch: /multi-athlete\.e2e\.ts$/,
      use: {
        ...devices["Pixel 7"],
        storageState: path.join(__dirname, "e2e", ".auth", "parent.storageState.json"),
      },
      dependencies: ["setup"],
    },
  ],

  // Spin up Next.js before tests start.
  //
  // Local: `next dev` for fast iteration (reuseExistingServer lets you pre-start it).
  // CI:    `next build && next start` catches SSR build errors before they
  //        surface at runtime, and avoids the webpack overhead of dev mode.
  //
  // The env block forwards test-specific env vars to the Next.js process.
  // global-setup also sets these on process.env, but the webServer may start
  // before global-setup in some configurations, so explicit forwarding is safer.
  webServer: {
    command: process.env.CI
      ? "npm run build && npm run start"
      : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 300_000 : 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY:
        process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? "",
      NEXT_PUBLIC_SITE_URL: baseURL,
    },
  },

  // global-setup writes storageState; global-teardown cleans DB.
  globalSetup: path.join(__dirname, "e2e", "global-setup.ts"),
  globalTeardown: path.join(__dirname, "e2e", "global-teardown.ts"),
});
