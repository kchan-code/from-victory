/**
 * App Store screenshot CANDIDATES config (FV-214 prep) — NOT part of the
 * test suite (no project here matches the default config's testMatch, and
 * this config only matches store-screenshots.e2e.ts). Rides the real e2e
 * global-setup — local Supabase stack, real parent + paired hockey athlete,
 * real seeded content — so nothing in the shots is invented UI.
 *
 * Run (needs the local stack: `npx supabase start`, then .env.test filled
 * per .env.test.example):
 *
 *   cd apps/web
 *   npx dotenv -e .env.test -- playwright test -c playwright.screenshots.config.ts
 *
 * PNGs land in apps/web/test-results/store-shots/ (gitignored); override
 * with SHOT_DIR. Viewport 440x956 @3x = 1320x2868 device pixels (iPhone
 * 6.9-inch class). Candidates only — the submit set must be real TestFlight
 * frames per FV-214.
 */

import path from "path";

import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: path.join(__dirname, "e2e"),
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  reporter: "list",

  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 440, height: 956 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  },

  projects: [
    {
      name: "store-shots",
      testMatch: /store-screenshots\.e2e\.ts$/,
      use: {
        storageState: path.join(
          __dirname,
          "e2e",
          ".auth",
          "athlete.storageState.json",
        ),
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY:
        process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? "",
      NEXT_PUBLIC_SITE_URL: baseURL,
    },
  },

  globalSetup: path.join(__dirname, "e2e", "global-setup.ts"),
  globalTeardown: path.join(__dirname, "e2e", "global-teardown.ts"),
});
