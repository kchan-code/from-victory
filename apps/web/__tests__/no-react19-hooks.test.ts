/**
 * Regression guard (FV-33 hotfix).
 *
 * This app runs on React 18 (Next 14). React 19 hooks — `useActionState`,
 * `useOptimistic`, `use` — are NOT exported from the installed `react` runtime,
 * even though `@types/react@18.3.x` *declares* `useActionState` (so `tsc`
 * passes and the build only emits a soft "Attempted import error" WARNING).
 * At runtime the import resolves to `undefined` and the component crashes when
 * it calls the hook.
 *
 * SportPicker shipped with `import { useActionState } from "react"` and crashed
 * the first-run sport gate in prod. This test makes that class of mistake a hard
 * failure: scan all client source for a React-19 hook imported from "react".
 *
 * The correct React-18 pattern is `useFormState` / `useFormStatus` from
 * "react-dom" (see SubscribeForm.tsx and the auth forms).
 */

import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { describe, it, expect } from "vitest";

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = ["app", "components", "lib"].map((d) => path.join(WEB_ROOT, d));

// React 19 hooks that are not available on the React 18 runtime.
const FORBIDDEN_HOOKS = ["useActionState", "useOptimistic"];

function sourceFiles(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out = out.concat(sourceFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Match an import of `name` specifically from the "react" module, e.g.
 *   import { useActionState } from "react";
 *   import { useState, useActionState } from 'react';
 * Does NOT match imports from "react-dom".
 */
function importsFromReact(src: string, name: string): boolean {
  const importRe = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+["']react["']/g;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(src)) !== null) {
    const group = m[1] ?? "";
    const named = group
      .split(",")
      .map((s) => (s.trim().split(/\s+as\s+/)[0] ?? "").trim());
    if (named.includes(name)) return true;
  }
  return false;
}

describe("no React 19 hooks imported from 'react' (this app is React 18)", () => {
  const files = SCAN_DIRS.flatMap(sourceFiles);

  it("scans a non-trivial number of source files", () => {
    // Guards against the scan silently finding nothing (e.g. path drift).
    expect(files.length).toBeGreaterThan(10);
  });

  for (const hook of FORBIDDEN_HOOKS) {
    it(`no file imports \`${hook}\` from "react"`, () => {
      const offenders = files
        .filter((f) => importsFromReact(readFileSync(f, "utf8"), hook))
        .map((f) => path.relative(WEB_ROOT, f));
      expect(
        offenders,
        `These files import the React 19 hook \`${hook}\` from "react", which is ` +
          `undefined on this React 18 runtime. Use react-dom's useFormState / ` +
          `useFormStatus instead. Offenders:\n  ${offenders.join("\n  ")}`,
      ).toEqual([]);
    });
  }
});
