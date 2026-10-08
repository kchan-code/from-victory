/**
 * FV-285 — ElevenLabs bake-off CLI: pure-function coverage (flag parsing,
 * slug resolution, filename-safety) for scripts/bakeoff-voices.ts. No
 * network calls — importing this module is safe because it never calls
 * main() unless it IS the process entry point (same import.meta guard as
 * generate-pregame-audio.ts).
 */

import { describe, expect, it } from "vitest";

import {
  findScriptBySlug,
  parseFlags,
  parseVoicesArg,
  resolveOutDir,
  slugifyLabel,
} from "../scripts/bakeoff-voices.ts";
import { isAbsolute, sep } from "node:path";

describe("parseVoicesArg", () => {
  it("parses a single voiceId with no label — label defaults to the id", () => {
    expect(parseVoicesArg("21m00Tcm4TlvDq8ikWAM")).toEqual([
      { id: "21m00Tcm4TlvDq8ikWAM", label: "21m00Tcm4TlvDq8ikWAM" },
    ]);
  });

  it("parses voiceId:label", () => {
    expect(parseVoicesArg("21m00Tcm4TlvDq8ikWAM:Bella")).toEqual([
      { id: "21m00Tcm4TlvDq8ikWAM", label: "Bella" },
    ]);
  });

  it("parses a comma-separated list of voiceId:label pairs", () => {
    expect(parseVoicesArg("id1:Label One,id2:Label Two")).toEqual([
      { id: "id1", label: "Label One" },
      { id: "id2", label: "Label Two" },
    ]);
  });

  it("ignores empty entries from trailing/leading commas", () => {
    expect(parseVoicesArg("id1:A,,id2:B,")).toEqual([
      { id: "id1", label: "A" },
      { id: "id2", label: "B" },
    ]);
  });

  it("falls back to the id when the label half is empty (trailing colon)", () => {
    expect(parseVoicesArg("id1:")).toEqual([{ id: "id1", label: "id1" }]);
  });
});

describe("slugifyLabel", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyLabel("Bella")).toBe("bella");
    expect(slugifyLabel("Label One")).toBe("label-one");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugifyLabel("Rachel (US)!!")).toBe("rachel-us");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugifyLabel("--weird--")).toBe("weird");
  });

  it("never returns an empty string", () => {
    expect(slugifyLabel("!!!")).toBe("voice");
    expect(slugifyLabel("")).toBe("voice");
  });
});

describe("parseFlags", () => {
  it("defaults to the backbone slugs, default model, default out dir, no voices", () => {
    const flags = parseFlags([]);
    expect(flags.voices).toEqual([]);
    expect(flags.model).toBe("eleven_multilingual_v2");
    expect(flags.slugs).toEqual([]);
    expect(flags.outDir).toBe("docs/audio-ab-fv285");
    expect(flags.dryRun).toBe(false);
    expect(flags.listVoices).toBe(false);
    expect(flags.keepSegments).toBe(false);
  });

  it("parses --dry-run, --list-voices, --keep-segments as booleans", () => {
    const flags = parseFlags(["--dry-run", "--list-voices", "--keep-segments"]);
    expect(flags.dryRun).toBe(true);
    expect(flags.listVoices).toBe(true);
    expect(flags.keepSegments).toBe(true);
  });

  it("parses --voices into candidates", () => {
    const flags = parseFlags(["--voices", "id1:A,id2:B"]);
    expect(flags.voices).toEqual([
      { id: "id1", label: "A" },
      { id: "id2", label: "B" },
    ]);
  });

  it("supports repeated --voices flags in addition to comma-separation", () => {
    const flags = parseFlags(["--voices", "id1:A", "--voices", "id2:B"]);
    expect(flags.voices).toEqual([
      { id: "id1", label: "A" },
      { id: "id2", label: "B" },
    ]);
  });

  it("parses --model, --slugs, --out", () => {
    const flags = parseFlags([
      "--model",
      "eleven_v3",
      "--slugs",
      "breath-threshold,shared-opening",
      "--out",
      "/tmp/bakeoff",
    ]);
    expect(flags.model).toBe("eleven_v3");
    expect(flags.slugs).toEqual(["breath-threshold", "shared-opening"]);
    expect(flags.outDir).toBe("/tmp/bakeoff");
  });
});

describe("findScriptBySlug — the six FV-285 backbone slugs resolve", () => {
  const backboneSlugs = [
    "breath-threshold",
    "shared-opening",
    "shared-prayer",
    "shared-sendoff",
    "hm-forward-nervous",
    "opener-shared-confidence",
  ];

  it.each(backboneSlugs)("resolves %s to an AudioScript with matching slug", (slug) => {
    const script = findScriptBySlug(slug);
    expect(script.slug).toBe(slug);
    expect(script.segments.length).toBeGreaterThan(0);
  });

  it("throws a clear error for an unknown slug", () => {
    expect(() => findScriptBySlug("not-a-real-slug")).toThrow(/no AudioScript found/);
  });
});

describe("resolveOutDir", () => {
  it("keeps an absolute --out as-is", () => {
    expect(resolveOutDir("/tmp/bakeoff")).toBe("/tmp/bakeoff");
  });

  it("resolves a relative --out (and the default) against the repo root, not cwd", () => {
    const out = resolveOutDir("docs/audio-ab-fv285");
    expect(isAbsolute(out)).toBe(true);
    // Repo root = three levels above apps/web/scripts/. The rendered MP3s must
    // land under <repo>/docs/audio-ab-*/ so the root .gitignore covers them,
    // even though the script is run from apps/web/.
    expect(out.endsWith(["docs", "audio-ab-fv285"].join(sep))).toBe(true);
    expect(out.includes(["apps", "web", "docs"].join(sep))).toBe(false);
  });
});
