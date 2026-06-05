// Minimal trusted-markdown renderer for daily training session bodies (FV-83).
//
// TRUSTED CONTENT ONLY. This renderer is intentionally narrow — it handles
// exactly the constructs that appear in seeded training_sessions_catalog rows:
//   ### ATX heading     → <h3>
//   blank-line paragraphs → <p>
//   > blockquote lines  → <blockquote>
//   *italic*            → <em>
//   **bold**            → <strong>
//
// It does NOT use dangerouslySetInnerHTML. Any input it does not recognise
// renders as plain text — raw HTML (including <script> tags) is never emitted
// as markup. Zero supply-chain surface for a minors' app.
//
// Server Component by default — no interactivity needed.

import React, { type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Inline parser: bold + italic only.
// Returns an array of ReactNode (strings and <em>/<strong>) for a single line.
// ---------------------------------------------------------------------------

export function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match **bold** or *italic* (bold checked first to avoid partial match).
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const [full, , boldContent, italicContent] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (boldContent !== undefined) {
      nodes.push(<strong key={start}>{boldContent}</strong>);
    } else if (italicContent !== undefined) {
      nodes.push(<em key={start}>{italicContent}</em>);
    } else {
      // Fallback — should not occur given the regex structure.
      nodes.push(full);
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

// ---------------------------------------------------------------------------
// Block parser: chunk raw markdown into typed blocks.
// ---------------------------------------------------------------------------

type Block =
  | { type: "heading"; level: 3; text: string }
  | { type: "blockquote"; lines: string[] }
  | { type: "paragraph"; lines: string[] };

export function parseBlocks(markdown: string): Block[] {
  const raw = markdown.split("\n");
  const blocks: Block[] = [];

  let i = 0;

  while (i < raw.length) {
    const line = raw[i] ?? "";

    // Skip blank lines between blocks.
    if (line.trim() === "") {
      i++;
      continue;
    }

    // ATX heading: ### only (h3).
    if (line.startsWith("### ")) {
      blocks.push({ type: "heading", level: 3, text: line.slice(4).trim() });
      i++;
      continue;
    }

    // Blockquote: one or more consecutive > lines.
    if (line.startsWith("> ")) {
      const lines: string[] = [];
      while (i < raw.length && (raw[i] ?? "").startsWith("> ")) {
        lines.push((raw[i] ?? "").slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", lines });
      continue;
    }

    // Paragraph: one or more non-blank, non-heading, non-blockquote lines.
    const lines: string[] = [];
    while (
      i < raw.length &&
      (raw[i] ?? "").trim() !== "" &&
      !(raw[i] ?? "").startsWith("### ") &&
      !(raw[i] ?? "").startsWith("> ")
    ) {
      lines.push(raw[i] ?? "");
      i++;
    }
    if (lines.length > 0) {
      blocks.push({ type: "paragraph", lines });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Renderer: blocks → styled React elements.
// ---------------------------------------------------------------------------

interface SessionBodyProps {
  markdown: string;
}

export function SessionBody({ markdown }: SessionBodyProps) {
  const blocks = parseBlocks(markdown);

  return (
    <div className="space-y-5">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          return (
            <h3
              key={idx}
              className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[18px] sm:text-[20px] leading-snug"
            >
              {parseInline(block.text)}
            </h3>
          );
        }

        if (block.type === "blockquote") {
          const content = block.lines.join(" ");
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-gold/50 pl-4 my-6"
            >
              <p className="font-scripture text-cream text-[17px] leading-relaxed italic text-center">
                {parseInline(content)}
              </p>
            </blockquote>
          );
        }

        // Paragraph — join soft-wrapped lines with a space.
        const content = block.lines.join(" ");
        return (
          <p
            key={idx}
            className="font-body text-cream/85 text-[15.5px] leading-relaxed"
          >
            {parseInline(content)}
          </p>
        );
      })}
    </div>
  );
}
