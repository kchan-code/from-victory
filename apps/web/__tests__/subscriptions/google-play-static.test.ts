/**
 * Static guards for the Google Play modules (FV-661), checked by reading
 * source text (no imports, so the real `google-auth-library` is never needed):
 *
 *   - Criterion 6: every new server module has `import "server-only"`; exactly
 *     one module imports `google-auth-library`; no "use client" file imports a
 *     new Google server module.
 *   - Criterion 9: `google_subscriptions` is never read with `select('*')` or a
 *     bare `select()` (client reads fail at runtime with 42501), and the
 *     client-readable column list is exactly the five granted columns.
 *   - Criterion 10: nothing writes `google_license_testers.note` anywhere in
 *     app code except as a short literal label.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { GOOGLE_SUBSCRIPTION_CLIENT_COLUMNS } from "@/lib/subscriptions/google-subscription-client-read";

const WEB_ROOT = path.resolve(__dirname, "..", "..");
const SCAN_DIRS = ["lib", "app", "components"];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(full);
  }
  return out;
}

const SOURCE_FILES = SCAN_DIRS.flatMap((d) => walk(path.join(WEB_ROOT, d)));
const read = (f: string) => readFileSync(f, "utf8");
const rel = (f: string) => path.relative(WEB_ROOT, f);

/** Modules that must never be imported by client code. */
const SERVER_ONLY_MODULES = [
  "lib/subscriptions/google-play-auth.ts",
  "lib/subscriptions/google-play-api.ts",
  "lib/subscriptions/google-product-catalog.ts",
  "lib/subscriptions/subscription-plan-key.ts",
  "lib/actions/google-play-subscription.ts",
];

describe("server-only boundary", () => {
  it('every new Google server module has `import "server-only"`', () => {
    for (const m of SERVER_ONLY_MODULES) {
      expect(read(path.join(WEB_ROOT, m)), m).toMatch(/^import "server-only";$/m);
    }
  });

  it("exactly one module imports google-auth-library: google-play-auth.ts", () => {
    const importers = SOURCE_FILES.filter((f) => /["']google-auth-library["']/.test(read(f))).map(rel);
    expect(importers).toEqual(["lib/subscriptions/google-play-auth.ts"]);
  });

  it("the library is imported lazily (dynamic import), never at module load", () => {
    const src = read(path.join(WEB_ROOT, "lib/subscriptions/google-play-auth.ts"));
    expect(src).not.toMatch(/^import[^;]*from ["']google-auth-library["']/m);
    expect(src).toMatch(/await import\("google-auth-library"\)/);
  });

  it('no "use client" file imports a Google server module', () => {
    const offenders: string[] = [];
    for (const f of SOURCE_FILES) {
      const src = read(f);
      const isClient = /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*["']use client["']/.test(src);
      if (!isClient) continue;
      // Only server modules are banned; importing the "use server" action
      // from a client component is the sanctioned way to call it.
      for (const m of SERVER_ONLY_MODULES.filter((x) => !x.startsWith("lib/actions/"))) {
        const base = m.replace(/^lib\//, "").replace(/\.ts$/, "");
        if (src.includes(base)) offenders.push(`${rel(f)} -> ${m}`);
      }
      if (/google-auth-library/.test(src)) offenders.push(`${rel(f)} -> google-auth-library`);
    }
    expect(offenders).toEqual([]);
  });

  it("the Google server action file is a use-server module", () => {
    expect(read(path.join(WEB_ROOT, "lib/actions/google-play-subscription.ts"))).toMatch(
      /^"use server";$/m,
    );
  });
});

describe("google_subscriptions client reads", () => {
  it("the client column list is exactly the five granted columns", () => {
    expect(
      GOOGLE_SUBSCRIPTION_CLIENT_COLUMNS.split(",").map((c) => c.trim()),
    ).toEqual(["product_id", "base_plan_id", "status", "expires_at", "auto_renewing"]);
  });

  it("no source file selects * (or nothing) from google_subscriptions", () => {
    const offenders: string[] = [];
    for (const f of SOURCE_FILES) {
      const src = read(f);
      let idx = src.indexOf('"google_subscriptions"');
      while (idx !== -1) {
        // Look at the rest of this query chain (up to the next statement end).
        const chain = src.slice(idx, idx + 400).split(";")[0] ?? "";
        if (/\.select\(\s*(?:["'`]\s*\*\s*["'`])?\s*\)/.test(chain)) offenders.push(rel(f));
        idx = src.indexOf('"google_subscriptions"', idx + 1);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the scan itself would catch a select('*') (self-check of the regex)", () => {
    const bad = `await supabase.from("google_subscriptions").select('*').eq("x", 1);`;
    const chain = bad.slice(bad.indexOf('"google_subscriptions"')).split(";")[0] ?? "";
    expect(/\.select\(\s*(?:["'`]\s*\*\s*["'`])?\s*\)/.test(chain)).toBe(true);
    const bare = `await supabase.from("google_subscriptions").select().eq("x", 1);`;
    expect(
      /\.select\(\s*(?:["'`]\s*\*\s*["'`])?\s*\)/.test(bare.slice(bare.indexOf('"google_subscriptions"'))),
    ).toBe(true);
  });
});

describe("google_license_testers.note", () => {
  it("is never written by app code (the allowlist is managed out of band)", () => {
    const writers = SOURCE_FILES.filter((f) => {
      const src = read(f);
      return (
        /google_license_testers/.test(src) &&
        /\.(insert|upsert|update)\(/.test(src.slice(src.indexOf("google_license_testers")).split(";")[0] ?? "")
      );
    }).map(rel);
    expect(writers).toEqual([]);
  });
});
