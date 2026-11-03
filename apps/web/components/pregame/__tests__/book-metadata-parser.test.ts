import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseBook } from "../../../scripts/apply-scripts.ts";

const file = "components/pregame/audio/clips-soccer.ts";
const book = (header: string) => `## Audio Clips\n### Clip\n${header}\n1. Reset.\n_(pause: 1.5s)_\n2. Next play.\n`;

describe("parseBook metadata (FV-628)", () => {
  it.each([
    `<!-- slug: test-clip | file: ${file} -->`,
    `<!-- slug: test-clip | file: ${file} | adversity: "Coach yells." -->`,
    `<!-- slug: test-clip | file: ${file} | adversity: "Coach yells." | note: optional -->`,
    `<!-- slug: test-clip | file: ${file}|adversity: "Coach yells." -->`,
  ])("preserves clip identity and ordered content: %s", (header) => {
    expect(parseBook(book(header)).clips).toEqual([{
      slug: "test-clip", file,
      lines: ["Reset.", "Next play."],
      pauses: [{ durationSec: 1.5 }],
      items: [
        { type: "speech", text: "Reset." },
        { type: "pause", durationSec: 1.5 },
        { type: "speech", text: "Next play." },
      ],
    }]);
  });

  it.each([
    "<!-- slug: test-clip | adversity: optional -->",
    "<!-- slug: test-clip | file: | adversity: optional -->",
    `<!-- slug: test-clip | file: ${file} | adversity: optional`,
  ])("does not invent identity from incomplete metadata: %s", (header) => {
    expect(parseBook(book(header)).clips).toEqual([]);
  });

  it("includes all 20 annotated soccer clips with their authoritative speech and pauses", () => {
    const source = readFileSync(fileURLToPath(new URL("../../../../../docs/scripts/soccer.md", import.meta.url)), "utf8");
    const sections = source.split(/^### /m).filter((section) => section.includes("| adversity:"));
    expect(sections).toHaveLength(20);
    const parsed = parseBook(source).clips;
    expect(parsed).toHaveLength(77);
    for (const section of sections) {
      const header = section.split("\n").find((line) => line.startsWith("<!-- slug:"))!;
      const slug = header.split("|")[0]!.replace("<!-- slug:", "").trim();
      const clip = parsed.find((entry) => entry.slug === slug);
      const lines = section.split("\n").filter((line) => /^\d+\. /.test(line)).map((line) => line.replace(/^\d+\. /, ""));
      const pauses = [...section.matchAll(/_\(pause: ([\d.]+)s\)_/g)].map((match) => ({ durationSec: Number(match[1]) }));
      expect(lines).toHaveLength(6);
      expect(clip, slug).toMatchObject({ slug, file, lines, pauses });
    }
  });
});
