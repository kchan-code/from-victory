/**
 * FV-733: iOS zooms a focused text field under 16px. Do not lock zoom.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_ROOT = resolve(__dirname, "..");

const SKIP_DIRS = new Set(["node_modules", ".next", "__tests__", "e2e", "coverage"]);

const CONTROL_RE = /<(input|select|textarea)\b[\s\S]*?(?:\/>|<\/\1>)/g;
const NON_TEXT_TYPES = new Set([
  "hidden",
  "checkbox",
  "radio",
  "range",
  "button",
  "submit",
  "reset",
  "file",
  "image",
  "color",
]);
const SMALL_TEXT = /text-(?:xs|sm)\b|text-\[(\d+(?:\.\d+)?)px\]/;

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith(".tsx") || entry.endsWith(".jsx")) out.push(full);
  }
}

describe("form control font size (FV-733)", () => {
  it("does not set a text input, select, or textarea below 16px", () => {
    const files: string[] = [];
    walk(join(WEB_ROOT, "app"), files);
    walk(join(WEB_ROOT, "components"), files);
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const match of src.match(CONTROL_RE) ?? []) {
        const type = match.match(/\btype=["']([^"']+)["']/)?.[1] ?? "";
        if (NON_TEXT_TYPES.has(type)) continue;
        const size = match.match(SMALL_TEXT);
        if (!size) continue;
        const px = size[1] ? Number(size[1]) : 0;
        if (!size[1] || px < 16) {
          offenders.push(`${relative(WEB_ROOT, file)} ${size[0]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("forces 16px on text fields in CSS and does not disable user zoom", () => {
    const css = readFileSync(join(WEB_ROOT, "app/globals.css"), "utf8");
    expect(css).toMatch(/input:not\(\[type="checkbox"\]\)/);
    expect(css).toMatch(/font-size:\s*16px\s*!important/);
    const declarations = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(declarations).not.toMatch(/user-scalable/i);
    expect(declarations).not.toMatch(/maximum-scale/i);

    const layout = readFileSync(join(WEB_ROOT, "app/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/maximumScale/);
    expect(layout).not.toMatch(/userScalable\s*:\s*false/);
  });
});
