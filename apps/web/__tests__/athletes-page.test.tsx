/**
 * @vitest-environment jsdom
 */
// FV-545 — the /athletes wisdom page.
//
// Coverage:
//   1. H1 is the locked KC pick, shared verbatim with the article
//      back-links via ATHLETES_H1 (verbatim-label convention).
//   2. The five moment sections render in order, three actions each,
//      with the locked step titles.
//   3. Evidence/voice pins: "The point of the rep is the response.",
//      qualified visualization framing, canonical close verbatim.
//   4. Scripture is labeled "NIV excerpt" (never presented as full
//      verbatim verses) — three labeled excerpts.
//   5. Source links: every moment block links its full article by exact
//      slug; the FAQ pointer goes to /#faq.
//   6. The labeled sample: exact label pin + the clip file exists on
//      disk (a clip regen that re-hashes the filename fails CI).
//   7. The approved beta quote renders with non-identifying attribution
//      and no outcome-claim framing.
//   8. Conversion fork: the 18+ card renders ONLY when adult signup is
//      enabled; the 13-17 card and share CTA render always.
//   9. Banned-term scans: sport-neutral vocabulary (no whistle / tonight /
//      final horn / bad night / reactive game / worst-game), no
//      "kid"-class words, no customer-facing em dashes.
//  10. Nav swap: ScrollNav, MobileMenu, and Footer point "For the
//      Athlete" at /athletes (source-level pin).
//  11. Extract drift-pins: the source articles still contain the lines
//      each moment block condenses — if an article body changes, these
//      force re-verification of the page's extracts.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";

vi.mock("@/components/landing/ScrollNav", () => ({ ScrollNav: () => null }));
vi.mock("@/components/landing/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/marketing/AttributionCapture", () => ({
  AttributionCapture: () => null,
}));
vi.mock("@/components/landing/icons", () => ({
  LandingIconDefs: () => null,
}));
// lib/flags imports the `server-only` marker package, which throws outside
// Next's RSC boundary — neutralize the marker only, so the real flag logic
// still reads ENABLE_ADULT_SIGNUP (same pattern as homepage-ia.test.tsx).
vi.mock("server-only", () => ({}));

import AthletesPage from "@/app/athletes/page";
import { ATHLETES_H1, ATHLETES_HREF } from "@/lib/gtm/page-titles";
import { getArticleBySlug } from "@/lib/resources/articles";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  class IntersectionObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserverStub,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ── 1. H1 + verbatim-label back-links ───────────────────────────────────────

describe("/athletes — H1 and verbatim back-link labels (FV-545)", () => {
  it("renders the locked H1 exactly once", () => {
    const { container } = render(<AthletesPage />);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]!.textContent).toBe(ATHLETES_H1);
    // The locked KC pick, pinned literally so the shared constant cannot
    // silently drift along with the page.
    expect(ATHLETES_H1).toBe("The mental game, moment by moment.");
  });

  it("all four athlete articles back-link the page with the H1 as label", () => {
    for (const slug of [
      "bible-verses-for-athletes-before-a-game",
      "pre-game-nerves-christian-athlete-routine",
      "how-to-bounce-back-after-a-bad-game",
      "does-visualization-work-for-athletes",
    ]) {
      const related = getArticleBySlug(slug)!.related ?? [];
      const link = related.find((r) => r.href === ATHLETES_HREF);
      expect(link, `missing /athletes back-link on ${slug}`).toBeDefined();
      expect(link!.label).toBe(ATHLETES_H1);
    }
  });
});

// ── 2. Moment sections: order and three actions each ────────────────────────

describe("/athletes — moment sections (FV-545)", () => {
  it("renders the five section headings in order", () => {
    const { container } = render(<AthletesPage />);
    const text = container.textContent ?? "";
    const headings = [
      "Nerves are energy, not a verdict.",
      "Does visualization work? Often, as a supplement.",
      "After a performance you want back.",
      "Three verses for three moments.",
      "Read it here. Train it in the app.",
    ];
    let cursor = -1;
    for (const h of headings) {
      const at = text.indexOf(h, cursor + 1);
      expect(at, `missing heading in order: ${h}`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it("each moment block carries its three locked step titles in order", () => {
    const { container } = render(<AthletesPage />);
    const text = container.textContent ?? "";
    const steps = [
      // Before
      "Breathe",
      "Remember what is true",
      "Choose your cue and pray",
      // The rep
      "Make it real",
      "Rehearse a plan, not a highlight reel",
      "Rehearse the response after disruption",
      // Afterward
      "Name what happened",
      "Take one lesson",
      "Return to the next rep",
    ];
    let cursor = -1;
    for (const step of steps) {
      const at = text.indexOf(step, cursor + 1);
      expect(at, `missing step in order: ${step}`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it("pins the corrected evidence/voice lines", () => {
    const { container } = render(<AthletesPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("The point of the rep is the response.");
    expect(text).toContain("A longer exhale can help your body settle.");
    expect(text).toContain("keep the cue short enough to use under pressure");
    expect(text).toContain("Take the lesson. Then return to the next rep.");
    // Canonical close, verbatim (docs/brand.md).
    expect(text).toContain("Play hard, fearless, and free.");
  });
});

// ── 4. Scripture labeled as NIV excerpts ────────────────────────────────────

describe("/athletes — Scripture excerpt labeling (FV-545)", () => {
  it('labels all three shortened quotations "NIV excerpt"', () => {
    const { container } = render(<AthletesPage />);
    const text = container.textContent ?? "";
    expect(text.split("NIV excerpt").length - 1).toBe(3);
    for (const ref of ["Hebrews 12:1–2", "Isaiah 41:10", "Lamentations 3:22–23"]) {
      expect(text).toContain(ref);
    }
  });
});

// ── 5. Source links ─────────────────────────────────────────────────────────

describe("/athletes — source and pointer links (FV-545)", () => {
  it("each moment block links its full article by exact slug", () => {
    const { container } = render(<AthletesPage />);
    for (const href of [
      "/resources/pre-game-nerves-christian-athlete-routine",
      "/resources/does-visualization-work-for-athletes",
      "/resources/how-to-bounce-back-after-a-bad-game",
      "/resources/bible-verses-for-athletes-before-a-game",
    ]) {
      expect(
        container.querySelector(`a[href="${href}"]`),
        `missing article link ${href}`,
      ).not.toBeNull();
    }
  });

  it("the questions pointer goes to the homepage FAQ (no new FAQ copy)", () => {
    const { container } = render(<AthletesPage />);
    expect(container.querySelector('a[href="/#faq"]')).not.toBeNull();
  });
});

// ── 6. The labeled sample ───────────────────────────────────────────────────

describe("/athletes — labeled hockey sample (FV-545)", () => {
  it("renders the exact clip label KC locked", () => {
    render(<AthletesPage />);
    expect(
      screen.getByText("Hockey sample · Forward · First shift"),
    ).toBeInTheDocument();
  });

  it("the flagship forward clip exists on disk (content-addressed)", () => {
    // A clip regen that re-hashes the filename must fail CI instead of
    // silently 404ing the play button on prod (same guard as the homepage
    // sample).
    const clip = resolve(
      __dirname,
      "../public/audio/pregame/clips/viz-forward.9e8d7eb1.mp3",
    );
    expect(existsSync(clip), `missing sample clip: ${clip}`).toBe(true);
  });
});

// ── 7. Beta quote ───────────────────────────────────────────────────────────

describe("/athletes — approved beta quote (FV-545)", () => {
  it("renders the quote, labeled as beta feedback, with non-identifying attribution", () => {
    render(<AthletesPage />);
    expect(
      screen.getByText(
        /helped me picture my first shift and gave me one thing to focus on/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Beta hockey athlete")).toBeInTheDocument();
    expect(screen.getByText(/beta feedback/i)).toBeInTheDocument();
  });

  it("does not frame the quote with a performance-outcome claim", () => {
    const { container } = render(<AthletesPage />);
    const text = (container.textContent ?? "").toLowerCase();
    for (const banned of ["won the game", "scored", "champion", "undefeated"]) {
      expect(text).not.toContain(banned);
    }
  });
});

// ── 8. Conversion fork ──────────────────────────────────────────────────────

describe("/athletes — conversion fork (FV-545)", () => {
  it("hides the 18+ card when adult signup is disabled (default)", () => {
    const { container } = render(<AthletesPage />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("18 OR OLDER");
    // The minor path is always present.
    expect(text).toContain("Send this to a parent.");
    expect(text).toContain("Training runs through a parent.");
  });

  it("renders the 18+ card with trial + post-trial price when the flag is on", () => {
    vi.stubEnv("ENABLE_ADULT_SIGNUP", "true");
    const { container } = render(<AthletesPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("18 OR OLDER");
    expect(text).toContain("start a 14-day free trial");
    expect(text).toContain("$5/month or $49/year after the trial");
    const signup = container.querySelector('a[href="/signup"]');
    expect(signup).not.toBeNull();
  });

  it("the share mechanic is a button (no form, no data collection) plus a plain /parents link", () => {
    const { container } = render(<AthletesPage />);
    expect(container.querySelectorAll("form")).toHaveLength(0);
    expect(container.querySelectorAll("input")).toHaveLength(1); // the sample scrubber only
    expect(
      screen.getByRole("button", { name: /send this to a parent/i }),
    ).toBeInTheDocument();
    expect(container.querySelector('a[href="/parents"]')).not.toBeNull();
  });
});

// ── 9. Banned-term scans ────────────────────────────────────────────────────

describe("/athletes — sport-neutral + voice scans (FV-545)", () => {
  it("uses no sport-default or banned vocabulary", () => {
    const { container } = render(<AthletesPage />);
    // The labeled sample line legitimately names hockey (it labels the
    // actual clip, per KC); exclude nothing else.
    const text = (container.textContent ?? "").toLowerCase();
    for (const banned of [
      "whistle",
      "tonight",
      "final horn",
      "bad night",
      "reactive game",
      "worst game",
      "opening play",
    ]) {
      expect(text, `banned term present: ${banned}`).not.toContain(banned);
    }
  });

  it('contains no "kid"-class words', () => {
    const { container } = render(<AthletesPage />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\bkids?\b|kiddo|youngster/i);
  });

  it("contains no customer-facing em dashes", () => {
    const { container } = render(<AthletesPage />);
    expect(container.textContent ?? "").not.toContain("—");
  });
});

// ── 10. Nav swap (source-level pin) ─────────────────────────────────────────

describe('nav — "For the Athlete" points at /athletes (FV-545)', () => {
  const componentsDir = resolve(__dirname, "../components/landing");
  for (const file of ["ScrollNav.tsx", "MobileMenu.tsx", "Footer.tsx"]) {
    it(`${file} links /athletes and no longer anchors the label to /#how`, () => {
      const src = readFileSync(resolve(componentsDir, file), "utf8");
      expect(src).toContain("/athletes");
      // The label must not sit on the old homepage anchor anywhere in the
      // file (other /#how links, like "How it works", are fine).
      const labelIdx = src.indexOf("For the Athlete");
      expect(labelIdx).toBeGreaterThan(-1);
      const windowBefore = src.slice(Math.max(0, labelIdx - 400), labelIdx);
      expect(windowBefore).toContain("/athletes");
    });
  }
});

// ── 11. Extract drift-pins against source articles ──────────────────────────
//
// The page condenses these articles; if a source body changes, these pins
// force the page's extracts to be re-verified (the sha256 body pins in
// resources-articles.test.ts catch the edit itself; these tie the page to
// the specific lines it draws on).

describe("/athletes — extract drift-pins (FV-545)", () => {
  it("the nerves article still teaches the lines the Before block condenses", () => {
    const body = getArticleBySlug("pre-game-nerves-christian-athlete-routine")!
      .bodyMd;
    expect(body).toContain("Four counts in. Six counts out.");
    expect(body).toContain("nerves are energy, not a verdict");
  });

  it("the visualization article still teaches the lines the Rep block condenses", () => {
    const body = getArticleBySlug("does-visualization-work-for-athletes")!.bodyMd;
    expect(body).toContain(
      "Picture the disruption briefly, then mentally rehearse the response and the next action.",
    );
    expect(body).toContain("what you would see and hear");
  });

  it("the bounce-back article still teaches the lines the Afterward block condenses", () => {
    const body = getArticleBySlug("how-to-bounce-back-after-a-bad-game")!.bodyMd;
    expect(body).toContain("Take the one lesson.");
    expect(body).toContain("information, not a verdict");
  });
});
