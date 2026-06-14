/**
 * Unit tests for the FV-188 infra-drift detectors' pure logic.
 *
 * Covers the parsing/comparison functions that decide PASS vs FAIL — the
 * load-bearing bits. The CLI wrappers (process.exit, Resend send) are not
 * exercised here; they are thin and side-effecting. The modules guard their
 * `main()` behind an "invoked directly" check so importing them for these
 * tests does not trigger process.exit.
 *
 * Node env, no mocking — same style as sport-label.test.ts.
 */

import { describe, it, expect } from "vitest";

import {
  extractVersion,
  parseRemoteVersions,
  computeDrift,
} from "@/scripts/check-migration-drift.ts";
import {
  parseDocumentedVars,
  isPresent,
  evaluate,
} from "@/scripts/check-env-presence.ts";

describe("check-migration-drift: extractVersion", () => {
  it("pulls the 14-digit version out of a filename", () => {
    expect(extractVersion("20260520200000_baseline.sql")).toBe("20260520200000");
  });
  it("returns null when no 14-digit token is present", () => {
    expect(extractVersion("README.md")).toBeNull();
    expect(extractVersion("2026052020.sql")).toBeNull(); // too short
  });
});

describe("check-migration-drift: parseRemoteVersions", () => {
  it("collects versions from the Remote (2nd) column only", () => {
    // Local-only migration 20260613100000 has an EMPTY remote cell and must NOT
    // be counted as present remotely.
    const out = [
      "        Local          |        Remote         |     Time (UTC)",
      "  ---------------------|-----------------------|---------------------",
      "  20260520200000       |  20260520200000       |  2026-05-20 20:00:00",
      "  20260613100000       |                       |  2026-06-13 10:00:00",
    ].join("\n");
    const remote = parseRemoteVersions(out);
    expect(remote.has("20260520200000")).toBe(true);
    expect(remote.has("20260613100000")).toBe(false);
  });

  it("tolerates leading/trailing border pipes", () => {
    const out = [
      "| Local | Remote | Time |",
      "|-------|--------|------|",
      "| 20260101000000 | 20260101000000 | t |",
    ].join("\n");
    expect(parseRemoteVersions(out).has("20260101000000")).toBe(true);
  });

  it("ignores header and separator rows", () => {
    const out = "Local | Remote | Time\n----- | ------ | ----";
    expect(parseRemoteVersions(out).size).toBe(0);
  });
});

describe("check-migration-drift: computeDrift", () => {
  it("returns local versions missing from remote", () => {
    const local = ["20260101000000", "20260102000000", "20260103000000"];
    const remote = new Set(["20260101000000", "20260102000000"]);
    expect(computeDrift(local, remote)).toEqual(["20260103000000"]);
  });
  it("returns empty when all local are present remotely", () => {
    const local = ["20260101000000"];
    const remote = new Set(["20260101000000", "20260102000000"]); // remote-ahead is fine
    expect(computeDrift(local, remote)).toEqual([]);
  });
});

describe("check-env-presence: parseDocumentedVars", () => {
  it("treats a bare KEY= line as required", () => {
    const vars = parseDocumentedVars("FOO=bar\nBAZ=");
    expect(vars).toEqual([
      { name: "FOO", optional: false },
      { name: "BAZ", optional: false },
    ]);
  });

  it("marks a var optional via a preceding comment marker", () => {
    const src = ["# fv-env-check: optional   (reason)", "MAYBE="].join("\n");
    expect(parseDocumentedVars(src)).toEqual([{ name: "MAYBE", optional: true }]);
  });

  it("marks a var optional via a trailing comment marker", () => {
    expect(parseDocumentedVars("MAYBE=  # fv-env-check: optional")).toEqual([
      { name: "MAYBE", optional: true },
    ]);
  });

  it("does not let an optional marker leak to the NEXT var", () => {
    const src = [
      "# fv-env-check: optional",
      "OPT=",
      "REQ=",
    ].join("\n");
    expect(parseDocumentedVars(src)).toEqual([
      { name: "OPT", optional: true },
      { name: "REQ", optional: false },
    ]);
  });

  it("skips pure comments, blanks, and non-identifier lines", () => {
    const src = ["# just a comment", "", "not a var line", "GOOD=1"].join("\n");
    expect(parseDocumentedVars(src)).toEqual([{ name: "GOOD", optional: false }]);
  });

  it("de-duplicates repeated names (first wins)", () => {
    expect(parseDocumentedVars("DUP=1\nDUP=2")).toEqual([{ name: "DUP", optional: false }]);
  });

  it("never captures a value — only the name and the optional flag", () => {
    const vars = parseDocumentedVars("SECRET=super-secret-value-do-not-leak");
    expect(JSON.stringify(vars)).not.toContain("super-secret-value");
  });
});

describe("check-env-presence: isPresent", () => {
  it("is true for a non-empty value", () => {
    expect(isPresent("X", { X: "v" })).toBe(true);
  });
  it("is false for empty / whitespace-only / undefined", () => {
    expect(isPresent("X", { X: "" })).toBe(false);
    expect(isPresent("X", { X: "   " })).toBe(false);
    expect(isPresent("X", {})).toBe(false);
  });
});

describe("check-env-presence: evaluate", () => {
  it("splits missing into required vs optional and never reports present ones", () => {
    const vars = [
      { name: "REQ_PRESENT", optional: false },
      { name: "REQ_MISSING", optional: false },
      { name: "OPT_MISSING", optional: true },
    ];
    const env = { REQ_PRESENT: "ok" };
    const { missingRequired, missingOptional, presentCount } = evaluate(vars, env);
    expect(missingRequired).toEqual(["REQ_MISSING"]);
    expect(missingOptional).toEqual(["OPT_MISSING"]);
    expect(presentCount).toBe(1);
  });
});
