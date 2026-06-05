// Unit tests for the bespoke SessionBody markdown renderer (FV-83).
//
// Coverage:
//  - ### heading → <h3>
//  - paragraph → <p>
//  - > blockquote → <blockquote>
//  - *italic* → <em>
//  - **bold** → <strong>
//  - raw HTML / <script> in input is rendered as plain text, NOT as markup

import { describe, it, expect } from "vitest";

import { parseBlocks, parseInline } from "@/components/daily/SessionBody";

// ---------------------------------------------------------------------------
// parseInline — bold, italic, plain text
// ---------------------------------------------------------------------------

describe("parseInline", () => {
  it("returns plain text unchanged", () => {
    const result = parseInline("hello world");
    expect(result).toEqual(["hello world"]);
  });

  it("wraps *italic* in <em>", () => {
    const result = parseInline("This is *important* text");
    // [before, <em>, after]
    expect(result.length).toBe(3);
    expect(result[0]).toBe("This is ");
    expect(result[2]).toBe(" text");
    // The middle element is a React element — check type string heuristically.
    const mid = result[1] as React.ReactElement;
    expect(mid.type).toBe("em");
    expect(mid.props.children).toBe("important");
  });

  it("wraps **bold** in <strong>", () => {
    const result = parseInline("You **compete** from victory");
    const bold = (result as React.ReactElement[]).find(
      (n) => typeof n === "object" && n.type === "strong",
    );
    expect(bold).toBeDefined();
    expect((bold as React.ReactElement).props.children).toBe("compete");
  });

  it("handles **bold** before *italic* in same line", () => {
    const result = parseInline("**First** and *second*");
    const types = (result as React.ReactElement[])
      .filter((n) => typeof n === "object")
      .map((n) => n.type);
    expect(types).toContain("strong");
    expect(types).toContain("em");
  });

  it("italicizes a full sentence (period inside the span) — the real reset line", () => {
    // Seeded Day 1 reset is "*That is what happened. That is not who I am.*"
    const result = parseInline("That is what happened. That is not who I am.");
    expect(result).toEqual(["That is what happened. That is not who I am."]);

    const wrapped = parseInline("*That is what happened. That is not who I am.*");
    const em = (wrapped as React.ReactElement[]).find(
      (n) => typeof n === "object" && n.type === "em",
    );
    expect(em).toBeDefined();
    // Non-greedy match must keep the whole sentence (incl. interior period).
    expect((em as React.ReactElement).props.children).toBe(
      "That is what happened. That is not who I am.",
    );
  });

  it("treats <script>alert(1)</script> as plain text, not DOM", () => {
    const raw = "<script>alert(1)</script>";
    const result = parseInline(raw);
    // Should be a single plain-text string — no React element with type "script".
    const hasScriptElement = (result as React.ReactElement[]).some(
      (n) => typeof n === "object" && n.type === "script",
    );
    expect(hasScriptElement).toBe(false);
    // The content is returned verbatim as a string.
    expect(result.join("")).toBe(raw);
  });
});

// ---------------------------------------------------------------------------
// parseBlocks — block-level structure
// ---------------------------------------------------------------------------

// Import React for type assertions below.
import type React from "react";

describe("parseBlocks", () => {
  it("parses ### heading", () => {
    const blocks = parseBlocks("### The Reset\n\nBody text here.");
    expect(blocks[0]).toEqual({ type: "heading", level: 3, text: "The Reset" });
    expect(blocks[1]?.type).toBe("paragraph");
  });

  it("parses a plain paragraph and keeps each soft-wrapped line", () => {
    const blocks = parseBlocks("You train every day.\nThis is how it works.");
    expect(blocks.length).toBe(1);
    const para = blocks[0];
    expect(para?.type).toBe("paragraph");
    // Lines are preserved verbatim; the renderer joins them with a space, so a
    // regression to "\n" or "" here would visibly break a real seeded body.
    if (para?.type === "paragraph") {
      expect(para.lines).toEqual([
        "You train every day.",
        "This is how it works.",
      ]);
    }
  });

  it("parses > blockquote lines", () => {
    const blocks = parseBlocks(
      "> Let us run with perseverance\n> the race marked out for us.",
    );
    expect(blocks.length).toBe(1);
    const bq = blocks[0];
    expect(bq?.type).toBe("blockquote");
    if (bq?.type === "blockquote") {
      expect(bq.lines).toEqual([
        "Let us run with perseverance",
        "the race marked out for us.",
      ]);
    }
  });

  it("preserves inline italic inside a blockquote (the Day 1 reset shape)", () => {
    // "> *That is what happened. That is not who I am.*"
    const blocks = parseBlocks("> *That is what happened. That is not who I am.*");
    expect(blocks.length).toBe(1);
    const bq = blocks[0];
    expect(bq?.type).toBe("blockquote");
    if (bq?.type === "blockquote") {
      // The * markers survive block parsing so the renderer's parseInline turns
      // them into <em> — verify the round-trip end to end.
      const inline = parseInline(bq.lines.join(" "));
      const em = (inline as React.ReactElement[]).find(
        (n) => typeof n === "object" && n.type === "em",
      );
      expect(em).toBeDefined();
      expect((em as React.ReactElement).props.children).toBe(
        "That is what happened. That is not who I am.",
      );
    }
  });

  it("ignores blank lines between blocks", () => {
    const md = "### Title\n\n> A quote\n\nA paragraph.";
    const blocks = parseBlocks(md);
    expect(blocks.length).toBe(3);
    expect(blocks[0]?.type).toBe("heading");
    expect(blocks[1]?.type).toBe("blockquote");
    expect(blocks[2]?.type).toBe("paragraph");
  });

  it("treats a literal <script> tag as a paragraph of plain text", () => {
    const md = "<script>alert('xss')</script>";
    const blocks = parseBlocks(md);
    // Must become a paragraph (not a heading or blockquote).
    expect(blocks.length).toBe(1);
    expect(blocks[0]?.type).toBe("paragraph");
    // The raw text is preserved as-is — the renderer will emit it as a
    // text node, not as DOM. Verified in the parseInline test above.
    if (blocks[0]?.type === "paragraph") {
      expect(blocks[0].lines[0]).toBe("<script>alert('xss')</script>");
    }
  });
});
