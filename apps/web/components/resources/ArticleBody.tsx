// Trusted-markdown renderer for /resources article bodies (FV-238).
//
// TRUSTED CONTENT ONLY — only feed this renderer content from the
// articles registry (lib/resources/articles.ts), which comes from
// the curator-vetted source file. Never pass user-generated input.
//
// Handles exactly the constructs that appear in FV-238 article bodies:
//   ### heading        → <h2> (visually styled like h3; axe heading-order fix)
//   blank-line paragraphs → <p>
//   > blockquote       → <blockquote>
//   **bold**           → <strong>
//   *italic*           → <em>
//   [text](href)       → <a> (same-origin or /#anchor only)
//   - item             → <ul><li>
//   1. item            → <ol><li>
//
// Does NOT use dangerouslySetInnerHTML. Raw HTML in input renders as
// plain text — never emitted as markup.
//
// Server Component by default.

import React, { type ReactNode } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Inline parser: bold, italic, links — left-to-right, non-overlapping.
// ---------------------------------------------------------------------------

// NOTE: ***bold-italic*** is unsupported — the regex matches bold first,
// leaving a dangling leading/trailing *.
export function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match: **bold**, *italic*, [label](href)
  // Bold before italic to avoid partial match on ***.
  const re =
    /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(((?:https?:\/\/[^\s)]+|\/[^\s)]*|#[^\s)]*)?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const [, , boldContent, italicContent, linkLabel, linkHref] = match;

    if (boldContent !== undefined) {
      nodes.push(<strong key={start}>{boldContent}</strong>);
    } else if (italicContent !== undefined) {
      nodes.push(<em key={start}>{italicContent}</em>);
    } else if (linkLabel !== undefined && linkHref !== undefined) {
      // Inline link — use Next Link for same-origin, plain <a> for external.
      const isInternal =
        linkHref.startsWith("/") || linkHref.startsWith("#");
      const cls =
        "text-gold underline underline-offset-2 hover:text-gold-bright transition-colors duration-fast";
      if (isInternal) {
        nodes.push(
          <Link key={start} href={linkHref} className={cls}>
            {linkLabel}
          </Link>,
        );
      } else {
        nodes.push(
          <a
            key={start}
            href={linkHref}
            className={cls}
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkLabel}
          </a>,
        );
      }
    } else {
      nodes.push(match[0]);
    }

    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

// ---------------------------------------------------------------------------
// Block parser
// ---------------------------------------------------------------------------

type ListItem = { text: string };

type Block =
  | { type: "heading"; level: 2; text: string }
  | { type: "blockquote"; lines: string[] }
  | { type: "ul"; items: ListItem[] }
  | { type: "ol"; items: ListItem[] }
  | { type: "paragraph"; lines: string[] };

export function parseBlocks(markdown: string): Block[] {
  const raw = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < raw.length) {
    const line = raw[i] ?? "";

    if (line.trim() === "") {
      i++;
      continue;
    }

    // ### heading
    if (line.startsWith("### ")) {
      blocks.push({ type: "heading", level: 2, text: line.slice(4).trim() });
      i++;
      continue;
    }

    // > blockquote
    if (line.startsWith("> ")) {
      const lines: string[] = [];
      while (i < raw.length && (raw[i] ?? "").startsWith("> ")) {
        lines.push((raw[i] ?? "").slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", lines });
      continue;
    }

    // - unordered list
    if (/^- /.test(line)) {
      const items: ListItem[] = [];
      while (i < raw.length && /^- /.test(raw[i] ?? "")) {
        items.push({ text: (raw[i] ?? "").slice(2) });
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // 1. ordered list (any leading digit + ". ")
    if (/^\d+\. /.test(line)) {
      const items: ListItem[] = [];
      while (i < raw.length && /^\d+\. /.test(raw[i] ?? "")) {
        items.push({ text: (raw[i] ?? "").replace(/^\d+\. /, "") });
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Paragraph
    const lines: string[] = [];
    while (
      i < raw.length &&
      (raw[i] ?? "").trim() !== "" &&
      !(raw[i] ?? "").startsWith("### ") &&
      !(raw[i] ?? "").startsWith("> ") &&
      !/^- /.test(raw[i] ?? "") &&
      !/^\d+\. /.test(raw[i] ?? "")
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
// Renderer
// ---------------------------------------------------------------------------

interface ArticleBodyProps {
  markdown: string;
}

export function ArticleBody({ markdown }: ArticleBodyProps) {
  const blocks = parseBlocks(markdown);

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          // Emits <h2> so heading-order is h1→h2 (axe: heading-order).
          // Visual styling is identical to the old <h3> — classes unchanged.
          return (
            <h2
              key={idx}
              className="font-heading font-semibold text-cream text-[22px] sm:text-[24px] leading-snug tracking-[-0.01em] pt-4"
            >
              {parseInline(block.text)}
            </h2>
          );
        }

        if (block.type === "blockquote") {
          // The CTA blockquotes in the articles contain bold + links.
          // Treat as a callout box, not a scripture-style quote.
          const isCta =
            block.lines.some((l) => l.includes("→")) ||
            block.lines.some((l) => l.includes("["));
          const content = block.lines.join(" ");

          if (isCta) {
            return (
              <div
                key={idx}
                className="rounded-[16px] px-6 py-5 my-8"
                style={{
                  background:
                    "linear-gradient(180deg,rgba(223,175,55,0.07),rgba(223,175,55,0)),var(--bg-elev-1)",
                  border: "1px solid rgba(223,175,55,0.22)",
                }}
              >
                <p className="font-body text-[14.5px] leading-[1.6] text-cream/85 m-0">
                  {parseInline(content)}
                </p>
              </div>
            );
          }

          // Inline pull-quote (e.g. breathing count, identity affirmation)
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-gold/40 pl-5 my-6"
            >
              <p className="font-body italic text-[16px] leading-[1.65] text-cream/75 m-0">
                {parseInline(content)}
              </p>
            </blockquote>
          );
        }

        if (block.type === "ul") {
          return (
            <ul
              key={idx}
              className="list-none m-0 p-0 flex flex-col gap-3 pl-0"
            >
              {block.items.map((item, iIdx) => (
                <li
                  key={iIdx}
                  className="flex items-start gap-3 font-body text-[15px] leading-[1.65] text-cream/80"
                >
                  <span
                    className="mt-[6px] w-1.5 h-1.5 rounded-full bg-gold/60 flex-none"
                    aria-hidden="true"
                  />
                  <span>{parseInline(item.text)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={idx} className="list-none m-0 p-0 flex flex-col gap-3">
              {block.items.map((item, iIdx) => (
                <li
                  key={iIdx}
                  className="flex items-start gap-3.5 font-body text-[15px] leading-[1.65] text-cream/80"
                >
                  <span className="font-mono text-[12px] text-gold/70 font-semibold mt-[3px] w-5 flex-none text-right">
                    {iIdx + 1}.
                  </span>
                  <span>{parseInline(item.text)}</span>
                </li>
              ))}
            </ol>
          );
        }

        // Paragraph — join soft-wrapped lines with a space.
        const content = block.lines.join(" ");
        return (
          <p
            key={idx}
            className="font-body text-[15.5px] leading-[1.75] text-cream/80"
          >
            {parseInline(content)}
          </p>
        );
      })}
    </div>
  );
}
