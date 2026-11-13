/**
 * Regression guard (FV-33 hotfix, kept on the Next 15 / React 19 upgrade).
 *
 * Forms in this app use `useFormState` / `useFormStatus` from "react-dom".
 * React 19 still exports those hooks. `useActionState` is the replacement and
 * is available now, but swapping one form at a time changes how pending state
 * is read. This upgrade keeps every form on the existing hooks.
 *
 * SportPicker once shipped `import { useActionState } from "react"` against a
 * React 18 runtime and crashed the first-run sport gate. The scan remains so
 * a partial migration cannot land beside the useFormState forms.
 */

import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { describe, it, expect } from "vitest";

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = ["app", "components", "lib"].map((d) => path.join(WEB_ROOT, d));

// Kept off the form surfaces. useFormState / useFormStatus stay the pattern.
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

describe("forms stay on react-dom useFormState (no useActionState migration)", () => {
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
        `These files import \`${hook}\` from "react". Forms in this app use ` +
          `react-dom's useFormState / useFormStatus so pending-state behavior ` +
          `stays the same. Offenders:\n  ${offenders.join("\n  ")}`,
      ).toEqual([]);
    });
  }
});
