/**
 * @vitest-environment jsdom
 */
// FV-236 — FAQ + Founder + Testimonials on the home page.
//
// Coverage:
//   1. All FAQ questions render in the FAQ section.
//   2. Answers match the source copy (spot-pin 3 verbatim sentences).
//   3. JSON-LD parses and its questions array length === the rendered list.
//   4. Testimonials renders nothing while the array is empty.
//   5. No "kid" in the section copy (founder's "my own kids" line is
//      allowed — it's the founder speaking about his family, not product copy).

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { Faq, FAQ_ITEMS, FAQ_JSON_LD } from "@/components/landing/Faq";
import { APP_STORE_URL } from "@/lib/marketing/app-store";
import { Founder } from "@/components/landing/Founder";
import { Testimonials, TESTIMONIALS } from "@/components/landing/Testimonials";

// jsdom doesn't implement matchMedia — stub it so Reveal.tsx can mount.
// Reveal reads it only to check prefers-reduced-motion; returning false here
// is equivalent to "no preference" and causes Reveal to add "in" immediately.
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

afterEach(() => cleanup());

// ── 1. All FAQ questions render ──────────────────────────────────────────────

describe("Faq — all questions render", () => {
  it("renders one <summary> per FAQ entry", () => {
    const { container } = render(<Faq />);
    const summaries = container.querySelectorAll("summary");
    expect(summaries).toHaveLength(FAQ_ITEMS.length);
    // Trip-wire pin (repo convention, see FV-539): bump this deliberately
    // whenever an FAQ entry is added or removed, so the count change is a
    // visible, reviewed diff rather than silent drift. 8 -> 9 for the
    // "Where do I find From Victory online?" entry; 9 -> 13 for FV-681's four
    // subscriber sign-in / recovery entries; 13 -> 15 for FV-685's
    // existing-subscriber intro and Apple-only Restore Purchases entries.
    expect(summaries).toHaveLength(15);
  });

  it("renders every question text in the DOM", () => {
    const { container } = render(<Faq />);
    const summaryTexts = Array.from(container.querySelectorAll("summary span")).map(
      (el) => el.textContent ?? "",
    );
    for (const item of FAQ_ITEMS) {
      expect(summaryTexts).toContain(item.q);
    }
  });

  it("renders questions in parent-journey order, and FAQPage JSON-LD follows it", () => {
    const { container } = render(<Faq />);
    const summaryTexts = Array.from(container.querySelectorAll("summary span")).map(
      (el) => el.textContent ?? "",
    );
    // Parent reading top to bottom: what it is, safety, cost, getting
    // started, troubleshooting, then where to find the product.
    // "Restore Purchases" is the iPhone-specific next step after the
    // subscribe prompt, so it sits with troubleshooting, before "Training paused".
    const order = [
      "Is this therapy or counseling?",
      "What does my athlete actually believe here?",
      "Does visualization actually work?",
      "How much screen time is this?",
      "How old does my athlete need to be?",
      "Can I read what my athlete does inside a session?",
      "What does it cost, and can I cancel?",
      "Where do I subscribe?",
      "How does my athlete get the app?",
      "How do we sign in to the app?",
      "I already subscribe. How do I use the app?",
      "I already subscribe. Why is the app asking me to subscribe?",
      "I subscribed in the iPhone app. When do I use Restore Purchases?",
      "What does “Training paused” mean on my athlete’s screen?",
      "Where do I find From Victory online?",
    ];
    expect(FAQ_ITEMS.map((item) => item.q)).toEqual(order);
    expect(summaryTexts).toEqual(order);
    expect(FAQ_JSON_LD.mainEntity.map((entry) => entry.name)).toEqual(order);
  });
});

// ── 2. Answers match the source copy (verbatim spot-pins) ───────────────────

describe("Faq — verbatim answer spot-pins", () => {
  it("privacy answer contains the authoritative privacy sentence verbatim", () => {
    render(<Faq />);
    // Use getAllByText with regex to avoid issues with multiple matches
    const els = screen.getAllByText(
      /It never shows what they selected or worked through inside a session\./,
    );
    expect(els.length).toBeGreaterThan(0);
  });

  it("therapy answer contains the not-therapy sentence verbatim", () => {
    render(<Faq />);
    const els = screen.getAllByText(
      /From Victory is mental-toughness and mindset training, not therapy, treatment, or clinical care\./,
    );
    expect(els.length).toBeGreaterThan(0);
  });

  it("screen-time answer contains the anti-scroll sentence verbatim", () => {
    render(<Faq />);
    const els = screen.getAllByText(
      /From Victory is built to be picked up, used, and put down/,
    );
    expect(els.length).toBeGreaterThan(0);
  });

  it("pricing answer (Q6) contains the sibling-discount sentence verbatim (FV-283)", () => {
    render(<Faq />);
    // Curator-final copy: first-athlete + additional-athlete pricing line.
    const els = screen.getAllByText(
      /\$5 a month, or \$49 a year for your first athlete, and \$3 a month, or \$29 a year, for each additional athlete in your household\./,
    );
    expect(els.length).toBeGreaterThan(0);
  });

  it("get-the-app answer names the App Store listing and Google Play (FV-681)", () => {
    const entry = FAQ_ITEMS.find(
      (item) => item.q === "How does my athlete get the app?",
    );
    expect(entry).toBeDefined();
    expect(entry!.a).toContain(APP_STORE_URL);
    expect(entry!.a).toMatch(/from the US App Store/);
    expect(entry!.a).toContain("On Android, search for From Victory on Google Play.");
    expect(entry!.a).not.toMatch(/not on Google Play/);
    // No unverified country claim for Google Play.
    expect(entry!.a).not.toMatch(/Google Play \(|US Google Play|Google Play in/);
    expect(entry!.a).not.toMatch(/nothing to download/i);
    expect(entry!.a).not.toMatch(/Home Screen|browser on iPhone/i);
    expect(entry!.a).not.toMatch(/—/);
    render(<Faq />);
    const link = screen.getByRole("link", { name: APP_STORE_URL });
    expect(link).toHaveAttribute("href", APP_STORE_URL);
  });

  it("brand-alias answer names fromvictoryapp.com without renaming the product", () => {
    render(<Faq />);
    const els = screen.getAllByText(
      /The product lives at fromvictoryapp\.com\./,
    );
    expect(els.length).toBeGreaterThan(0);
    const alias = FAQ_ITEMS.find(
      (item) => item.q === "Where do I find From Victory online?",
    );
    expect(alias).toBeDefined();
    expect(alias!.a).toContain("fromvictoryapp.com");
    expect(alias!.a).not.toMatch(/FromVictoryApp/);
    expect(alias!.a).not.toMatch(/apps\.apple\.com|play\.google\.com/);
  });

  it("pricing answer (Q6) contains the household-generosity sentence verbatim (FV-283)", () => {
    render(<Faq />);
    // The FAQ copy uses a curly apostrophe (U+2019) in "that's"; match with a
    // character class that accepts both straight and curly apostrophes.
    const els = screen.getAllByText(
      /A household with more athletes pays less per athlete: that['’]s by design, because the same training serves your whole family\./,
    );
    expect(els.length).toBeGreaterThan(0);
  });
});

// ── 2a. Subscriber sign-in + recovery entries (FV-681) ─────────────────────
//
// These answers quote on-screen labels. If a label changes in the app, the
// FAQ must change with it, so the quoted strings are pinned here.

describe("Faq — subscriber sign-in and recovery entries (FV-681)", () => {
  const find = (q: string) => {
    const entry = FAQ_ITEMS.find((item) => item.q === q);
    expect(entry).toBeDefined();
    return entry!.a;
  };

  it("subscribe answer: website or iPhone App Store, no Android purchase", () => {
    const a = find("Where do I subscribe?");
    expect(a).toContain("The Android app doesn’t sell subscriptions");
    // FV-685: Restore Purchases lives in its own Apple-only entry, not here.
    expect(a).not.toMatch(/Restore Purchases/);
    expect(a).not.toMatch(/\$\d/);
  });

  // FV-685 ─────────────────────────────────────────────────────────────────
  it("existing-subscriber intro: same account everywhere, no second payment, points linked athletes to sign-in", () => {
    const a = find("I already subscribe. How do I use the app?");
    expect(a).toMatch(/^Sign in with the same From Victory account you used to subscribe\./);
    expect(a).toContain("works across the website, iPhone, and Android, so you don’t need to pay again.");
    expect(a).toContain("“How do we sign in to the app?”");
    expect(a).not.toMatch(/Restore Purchases/);
  });

  it("Restore Purchases entry is Apple-only, payer-only, and never tells web or Android subscribers to restore", () => {
    const a = find("I subscribed in the iPhone app. When do I use Restore Purchases?");
    expect(a).toMatch(/^Only for a subscription bought in the From Victory iPhone app through the App Store\./);
    expect(a).toContain("it can’t find a subscription bought on the website");
    expect(a).toContain("An athlete on a parent’s subscription never needs it.");
    expect(a).toContain("can’t move a subscription to a different account");
    // On-screen labels quoted from AppleSubscribeSection / dashboard.
    for (const label of [
      "“Restore Purchases”",
      "“Choose a plan”",
      "“No previous purchase was found for this Apple ID.”",
      "“We couldn’t check for a previous purchase. Please try again.”",
      "“Subscribe”",
    ]) {
      expect(a).toContain(label);
    }
    // Restore steps are conditional on the button appearing; a missing button
    // (e.g. store configuration) routes to support, never to "update the app"
    // or a second purchase.
    expect(a).toContain("If “Restore Purchases” appears there, tap it.");
    expect(a).toContain("If you don’t see “Restore Purchases”, don’t subscribe again: reach us through the Contact page.");
    expect(a).not.toMatch(/update the app/i);
    // No blanket "No" and no instruction for Android/web subscribers to restore.
    expect(a).not.toMatch(/^No\b/);
    expect(a).not.toMatch(/Android/);
  });

  it("only the Apple-only entry mentions Restore Purchases", () => {
    const mentioning = FAQ_ITEMS.filter((item) => /Restore Purchases/.test(item.a)).map((item) => item.q);
    expect(mentioning).toEqual(["I subscribed in the iPhone app. When do I use Restore Purchases?"]);
  });

  it("sign-in answer covers parent, 18+ self-payer and athlete on a parent's subscription", () => {
    const a = find("How do we sign in to the app?");
    for (const label of [
      "“Welcome back”",
      "“Parent”",
      "“Athlete”",
      "“Not [name]? Sign in as someone else”",
      "“Forgot password?”",
      "“Reset it here”",
    ]) {
      expect(a).toContain(label);
    }
    expect(a).toContain("18 or older who pays for their own account");
    expect(a).toContain("including every athlete under 18");
  });

  it("already-subscribed answer: wrong account, access-check retry and the Android-specific recovery", () => {
    const a = find("I already subscribe. Why is the app asking me to subscribe?");
    expect(a).toMatch(/^Don’t subscribe again\./);
    expect(a).toContain("“Try again”");
    expect(a).toContain("“Subscribed with a different account? Sign out, then sign in with that one.”");
    expect(a).toContain("“Subscribe to From Victory from a web browser at fromvictoryapp.com.”");
    expect(a).toContain("“Sign out” is at the top of the screen");
    // KC wording (2026-11-12): a wrong account is possible, not "most common".
    expect(a).toContain("You may be signed in to a different account.");
    expect(a).not.toMatch(/most common/i);
  });

  it("training-paused answer covers inactive plan, fewer spots and access check", () => {
    const a = find("What does “Training paused” mean on my athlete’s screen?");
    expect(a).toContain("nothing has been removed");
    expect(a).toContain("fewer spots");
    expect(a).toContain("“Access check”");
    expect(a).toContain("“We couldn’t check your access”");
    expect(a).toContain("“Try again”");
  });

  // KC wording (2026-11-12): a failed access check is not proof that nothing
  // changed with the subscription, so neither answer may claim it.
  it("access-check failure copy says status is unconfirmed, never that nothing changed", () => {
    for (const q of [
      "I already subscribe. Why is the app asking me to subscribe?",
      "What does “Training paused” mean on my athlete’s screen?",
    ]) {
      const a = find(q);
      expect(a).toContain("we couldn’t confirm your subscription status. Wait a minute and tap “Try again”.");
      expect(a).not.toMatch(/nothing has changed|nothing changed/i);
    }
  });

  it("new entries carry no internal QA, environment or em-dash leakage", () => {
    const qs = [
      "How does my athlete get the app?",
      "Where do I subscribe?",
      "How do we sign in to the app?",
      "I already subscribe. Why is the app asking me to subscribe?",
      "What does “Training paused” mean on my athlete’s screen?",
      "I already subscribe. How do I use the app?",
      "I subscribed in the iPhone app. When do I use Restore Purchases?",
    ];
    for (const q of qs) {
      const a = find(q);
      expect(a).not.toMatch(/—/);
      expect(a).not.toMatch(/staging|sandbox|emulator|TestFlight|FV-\d|build \d|\bQA\b|\bkid/i);
    }
  });
});

// ── 2b. Visualization FAQ entry — evidence-claims guard (FV-539) ─────────────
//
// The "Does visualization actually work?" answer carries a research-adjacent
// claim, so it is held to docs/content-evidence-standards.md: qualified
// register, no proof badges. (The therapy entry legitimately uses "clinical
// care" as boundary language, so this guard scopes to the one entry.)

describe("Faq — visualization entry evidence guard (FV-539)", () => {
  it("keeps the qualified register and no banned proof badges", () => {
    const entry = FAQ_ITEMS.find(
      (i) => i.q === "Does visualization actually work?",
    );
    expect(entry).toBeDefined();
    const a = entry!.a.toLowerCase();
    for (const banned of [
      "proven",
      "guaranteed",
      "science-backed",
      "clinically",
    ]) {
      expect(a).not.toContain(banned);
    }
    // The answer must keep its supplement framing and no-promise close.
    expect(entry!.a).toContain("Often, as a supplement.");
    expect(entry!.a).toContain("No promises about tonight’s result.");
  });
});

// ── 3. JSON-LD parses and its questions array length === rendered list ───────

describe("Faq — FAQ_JSON_LD structured data", () => {
  it("FAQ_JSON_LD.mainEntity has the same length as FAQ_ITEMS", () => {
    expect(FAQ_JSON_LD.mainEntity).toHaveLength(FAQ_ITEMS.length);
    // Trip-wire pin (repo convention, see FV-539): bump this deliberately
    // whenever an FAQ entry is added or removed. 8 -> 9 for the
    // "Where do I find From Victory online?" entry; 9 -> 13 for FV-681;
    // 13 -> 15 for FV-685.
    expect(FAQ_JSON_LD.mainEntity).toHaveLength(15);
  });

  it("FAQ_JSON_LD is valid JSON (stringify/parse round-trip)", () => {
    const raw = JSON.stringify(FAQ_JSON_LD);
    const parsed = JSON.parse(raw) as typeof FAQ_JSON_LD;
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(FAQ_ITEMS.length);
  });

  it("each mainEntity entry has a name matching the corresponding FAQ_ITEMS question", () => {
    for (let i = 0; i < FAQ_ITEMS.length; i++) {
      const entry = FAQ_JSON_LD.mainEntity[i];
      expect(entry).toBeDefined();
      expect(entry!.name).toBe(FAQ_ITEMS[i]!.q);
    }
  });

  it("FAQ_JSON_LD @context is schema.org", () => {
    expect(FAQ_JSON_LD["@context"]).toBe("https://schema.org");
  });

  it("the script tag is injected into the rendered section", () => {
    const { container } = render(<Faq />);
    const scriptEl = container.querySelector('script[type="application/ld+json"]');
    expect(scriptEl).not.toBeNull();
    const parsed = JSON.parse(scriptEl!.textContent ?? "{}") as {
      "@type": string;
      mainEntity: unknown[];
    };
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(FAQ_ITEMS.length);
  });
});

// ── 4. Testimonials renders nothing while the array is empty ────────────────

describe("Testimonials — empty array renders null", () => {
  it("TESTIMONIALS is currently empty (no fabricated quotes)", () => {
    expect(TESTIMONIALS).toHaveLength(0);
  });

  it("renders nothing to the DOM when TESTIMONIALS is empty", () => {
    const { container } = render(<Testimonials />);
    expect(container.firstChild).toBeNull();
  });
});

// ── 5. No "kid" in the section copy (founder's "my own kids" is allowed) ────
//
// Scan rule: the word "kid" must not appear in athlete-facing product copy.
// The founder block uses the word in a personal family context
// ("for my own kids") which is exempt per the brief.
// We test the raw FAQ_ITEMS and FAQ_JSON_LD (the product copy) for the banned
// word, and test the Founder rendered output to confirm the "my own kids"
// personal usage does NOT trigger a false positive.

describe("Audience language — no banned 'kid' in product copy", () => {
  it("none of the FAQ questions contain 'kid' as a product-copy term", () => {
    // We allow the substring only if it is the founder's personal phrase:
    // "my own kids". Product-copy usage of "kid"/"kids"/"kiddo" is banned.
    const KID_PRODUCT_RE = /\bkid(?:do|s)?\b/i;
    const FOUNDER_EXCEPTION = /my own kids/i;
    for (const item of FAQ_ITEMS) {
      const combined = `${item.q} ${item.a}`;
      if (KID_PRODUCT_RE.test(combined)) {
        // If the match is present, it MUST be covered by the founder exception.
        // FAQ copy never mentions the founder's personal story, so any match here
        // is a genuine violation.
        expect(FOUNDER_EXCEPTION.test(combined)).toBe(true);
      }
    }
  });

  it("Founder component renders without throwing and contains the expected personal phrase", () => {
    // The founder block contains "my own kids" — this is the founder speaking
    // about his family; it is explicitly allowed per the brief.
    render(<Founder />);
    expect(screen.getByText(/my own kids/i)).toBeInTheDocument();
  });

  it("Founder component renders the canonical tagline verbatim", () => {
    render(<Founder />);
    expect(
      screen.getByText(/Your Identity Is Secure\. Compete From Victory\./i),
    ).toBeInTheDocument();
  });
});
