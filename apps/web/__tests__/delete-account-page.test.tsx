/**
 * @vitest-environment jsdom
 */
// /delete-account — Google Play / Apple account-deletion discoverability
// page. This must be reachable with NO login. Mirrors the pattern in
// about-page.test.tsx: render the real page (no mocked auth) and assert on
// structure + brand-critical copy.

import "@testing-library/jest-dom/vitest";
import fs from "fs";
import path from "path";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import DeleteAccountPage from "@/app/delete-account/page";

afterEach(() => cleanup());

// __dirname resolves to apps/web/__tests__
const PAGE_SOURCE = fs.readFileSync(
  path.resolve(__dirname, "..", "app", "delete-account", "page.tsx"),
  "utf8",
);

describe("DeleteAccountPage — public, not auth-gated", () => {
  it("does not import the auth-guards module (requireParent/requireAthlete/requireSubscriber)", () => {
    // The single most important functional requirement for this route: it
    // must render for a signed-out visitor with no session. If a future edit
    // adds a guard import, this test catches it before it ships. Matched as
    // an actual import statement (not a substring) so this doesn't trip on
    // the file's own explanatory comments about staying guard-free.
    expect(PAGE_SOURCE).not.toMatch(/from\s+["']@\/lib\/auth\/guards["']/);
  });

  it("does not create a Supabase client (no session dependency)", () => {
    expect(PAGE_SOURCE).not.toMatch(
      /from\s+["']@\/lib\/supabase\/(server|service)["']/,
    );
  });

  it("renders successfully with zero props/context (proves no server-side auth dependency)", () => {
    // If the page required a session, this render would throw.
    expect(() => render(<DeleteAccountPage />)).not.toThrow();
  });
});

describe("DeleteAccountPage — structure + Play/App Store requirements", () => {
  it("renders exactly one <h1>", () => {
    const { container } = render(<DeleteAccountPage />);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
  });

  it("names the app and developer as shown on the store listing", () => {
    const { container } = render(<DeleteAccountPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("From Victory");
    expect(text).toContain("From Victory LLC");
  });

  it("prominently features numbered, step-by-step deletion instructions", () => {
    const { container } = render(<DeleteAccountPage />);
    // Option A (delete one athlete) + Option B parent path + Option B adult
    // path = at least 3 distinct <ol> step lists.
    const orderedLists = container.querySelectorAll("ol");
    expect(orderedLists.length).toBeGreaterThanOrEqual(3);
    orderedLists.forEach((ol) => {
      expect(ol.querySelectorAll("li").length).toBeGreaterThan(0);
    });
  });

  it("states what data is deleted vs. kept, and the retention period", () => {
    const { container } = render(<DeleteAccountPage />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/deleted immediately/i);
    expect(text).toMatch(/what we keep/i);
    expect(text).toContain("30 days");
  });

  it("gives a contact fallback for anyone who can't sign in", () => {
    const { container } = render(<DeleteAccountPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("privacy@fromvictoryapp.com");
    expect(text).toMatch(/can't sign in/i);
  });

  it("accurately describes the minor-athlete path (parent/guardian completes deletion)", () => {
    const { container } = render(<DeleteAccountPage />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/minor athlete/i);
    expect(text).toMatch(/never sees billing or account-deletion controls/i);
  });
});

describe("DeleteAccountPage — audience language", () => {
  it("never uses 'kid' or its variants", () => {
    const { container } = render(<DeleteAccountPage />);
    const text = container.textContent ?? "";
    expect(/\bkid\b|kiddo|youngster|young person/i.test(text)).toBe(false);
  });
});
