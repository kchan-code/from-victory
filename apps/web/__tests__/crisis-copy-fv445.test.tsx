/**
 * @vitest-environment jsdom
 */
// FV-445 — universal crisis-resource copy (KC-approved, final) for the two
// crisis-resource surfaces: the always-present post-game CrisisFooter
// (FV-225) and the dormant Option C ResourceScreen (FV-135, built but not
// wired). Both must render the same "trusted person" wording and the same
// "nothing here is shared" closing disclaimer — no singling out the parent,
// no "trusted adult," and the 988 / Crisis Text Line contact methods stay
// byte-identical.

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { CrisisFooter } from "@/components/postgame/CrisisFooter";
import { ResourceScreen } from "@/components/safety/ResourceScreen";

afterEach(() => cleanup());

const APPROVED_CLOSING =
  "This screen is private — no one is notified, and nothing here is shared. From Victory is not a mental-health service. In an immediate emergency, call 911.";

describe("CrisisFooter — FV-445 copy", () => {
  it("renders the approved trusted-person header and body", () => {
    const { container } = render(<CrisisFooter />);
    const text = container.textContent ?? "";
    expect(text).toContain("Talk to someone you trust");
    expect(text).toContain(
      "A parent, coach, teammate, pastor, mentor, or counselor. You don’t have to carry this alone.",
    );
  });

  it("renders the approved closing disclaimer", () => {
    const { container } = render(<CrisisFooter />);
    const text = (container.textContent ?? "").replace(/\s+/g, " ");
    expect(text).toContain(APPROVED_CLOSING.replace(/\s+/g, " "));
  });

  it("keeps the 988 and Crisis Text Line hrefs unchanged", () => {
    const { container } = render(<CrisisFooter />);
    const links = Array.from(container.querySelectorAll("a")).map(
      (a) => a.getAttribute("href"),
    );
    expect(links).toContain("tel:988");
    expect(links).toContain("sms:741741?body=HOME");
  });

  it("no longer references 'your parent'", () => {
    const { container } = render(<CrisisFooter />);
    const text = container.textContent ?? "";
    expect(text.toLowerCase()).not.toContain("your parent");
  });

  it("never uses 'kid', 'kiddo', or 'youngster'", () => {
    const { container } = render(<CrisisFooter />);
    const text = container.textContent ?? "";
    expect(/\bkid\b|kiddo|youngster/i.test(text)).toBe(false);
  });
});

describe("ResourceScreen — FV-445 copy", () => {
  it("renders the approved trusted-person name and description", () => {
    const { container } = render(<ResourceScreen />);
    const text = container.textContent ?? "";
    expect(text).toContain("Talk to someone you trust");
    expect(text).toContain(
      "A parent, coach, teammate, pastor, mentor, or counselor. You don’t have to carry this alone.",
    );
  });

  it("renders session-privacy intro phrasing instead of parent-notification phrasing", () => {
    const { container } = render(<ResourceScreen />);
    const text = container.textContent ?? "";
    expect(text).toContain("Your training session is saved");
    expect(text).toContain("it stays private");
  });

  it("renders the approved closing disclaimer", () => {
    const { container } = render(<ResourceScreen />);
    const text = (container.textContent ?? "").replace(/\s+/g, " ");
    expect(text).toContain(APPROVED_CLOSING.replace(/\s+/g, " "));
  });

  it("keeps the 988 and Crisis Text Line hrefs unchanged", () => {
    const { container } = render(<ResourceScreen />);
    const links = Array.from(container.querySelectorAll("a")).map(
      (a) => a.getAttribute("href"),
    );
    expect(links).toContain("tel:988");
    expect(links).toContain("sms:741741?body=HOME");
  });

  it("no longer references 'your parent'", () => {
    const { container } = render(<ResourceScreen />);
    const text = container.textContent ?? "";
    expect(text.toLowerCase()).not.toContain("your parent");
  });

  it("never uses 'kid', 'kiddo', or 'youngster'", () => {
    const { container } = render(<ResourceScreen />);
    const text = container.textContent ?? "";
    expect(/\bkid\b|kiddo|youngster/i.test(text)).toBe(false);
  });
});
