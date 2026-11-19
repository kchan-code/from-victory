/**
 * @vitest-environment jsdom
 */
// FV-766: /help is a static, public page. Renders with no auth context, has
// one h1, links to /contact, and makes no promise the owner ruled out
// (refund, reply time, deletion timeline, support email).

import "@testing-library/jest-dom/vitest";
import fs from "fs";
import path from "path";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import HelpPage from "@/app/help/page";
import { Footer } from "@/components/landing/Footer";

afterEach(() => cleanup());

const PAGE_SOURCE = fs.readFileSync(
  path.resolve(__dirname, "..", "app", "help", "page.tsx"),
  "utf8",
);

describe("HelpPage", () => {
  it("is not auth-gated and reads no data", () => {
    expect(PAGE_SOURCE).not.toMatch(/from\s+["']@\/lib\/auth\/guards["']/);
    expect(PAGE_SOURCE).not.toMatch(/from\s+["']@\/lib\/supabase\//);
    expect(() => render(<HelpPage />)).not.toThrow();
  });

  it("renders one h1 and a heading per topic", () => {
    const { container } = render(<HelpPage />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelectorAll("h2").length).toBeGreaterThanOrEqual(8);
  });

  it("links to /contact and does not hardcode an email address", () => {
    const { container } = render(<HelpPage />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/contact");
    expect(hrefs).toContain("/privacy");
    expect(hrefs.some((h) => h?.startsWith("mailto:"))).toBe(false);
    expect(container.textContent ?? "").not.toMatch(/@/);
  });

  it("makes no refund, reply-time, or deletion-timeline promise and has no em dash or 'kid'", () => {
    const { container } = render(<HelpPage />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/refund/i);
    expect(text).not.toMatch(/within \d+|business day|reply|respond|30 days|immediately/i);
    expect(text).not.toMatch(/—/);
    expect(text).not.toMatch(/\bkids?\b/i);
    expect(text).not.toMatch(/streak/i);
  });

  it("covers the cancel paths by purchase source", () => {
    render(<HelpPage />);
    expect(
      screen.getByRole("heading", { name: "How do I cancel?" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Manage subscription/)).toBeInTheDocument();
  });
});

describe("Footer help link", () => {
  it("includes a Help link to /help", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "Help" });
    expect(link).toHaveAttribute("href", "/help");
  });
});
