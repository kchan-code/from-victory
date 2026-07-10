// /christian-athlete-apps — GTM Engine page (FV-411).
//
// VERBATIM COPY: every heading, paragraph, and FAQ answer below is
// reproduced word-for-word from docs/gtm/pages/fv-believer-w1-page-comparison.html
// (KC-approved, Delvox GTM Engine). Do NOT edit, trim, reflow, or
// "improve" any of the copy in this file. The one change from the
// source: the "Join the waitlist" anchor now points at the internal
// waitlist section (with a `source` param) instead of the bare
// production domain — see docs/gtm/README.md for the contract.
//
// Server Component — no client code except the reused AttributionCapture.

import type { Metadata } from "next";
import Link from "next/link";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { LandingIconDefs } from "@/components/landing/icons";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { ArticleFigure } from "@/components/marketing/ArticleFigure";
import {
  PREGAME_RITUAL_HREF,
  PREGAME_RITUAL_TITLE,
} from "@/lib/gtm/page-titles";

const siteUrl = "https://www.fromvictoryapp.com";

const PAGE_TITLE = "Three Apps for the Christian Athlete: What Each One Gets Right";

// Verbatim single sentence from the approved lead paragraph.
const PAGE_DESCRIPTION =
  "A Christian athlete choosing an app is really weighing three kinds of tool: a free Scripture devotional, a sport-specific faith app, and a faith-based app that guides you through pregame visualization.";

export const metadata: Metadata = {
  alternates: { canonical: "/christian-athlete-apps" },
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${siteUrl}/christian-athlete-apps`,
    siteName: "From Victory",
    title: `${PAGE_TITLE} · From Victory`,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: `${siteUrl}/from-victory-social-preview.jpg`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} · From Victory`,
    description: PAGE_DESCRIPTION,
    images: [`${siteUrl}/from-victory-social-preview.jpg`],
  },
};

// ---------------------------------------------------------------------------
// FAQPage JSON-LD — reproduced verbatim from the source HTML's inline
// <script type="application/ld+json"> block.
// ---------------------------------------------------------------------------

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best app for Christian athletes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on what you need. A free devotional like FCA Challenge or YouVersion builds a daily Scripture habit. Play With Faith adds a sport-specific faith feed. From Victory guides you through pregame visualization, audio-led and specific to your sport and position, anchored in Scripture and who God says you are.",
      },
    },
    {
      "@type": "Question",
      name: "How is From Victory different from a devotional app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A devotional gives you a verse to read. From Victory guides you through a pregame visualization you run with your eyes closed, built for the on-field moment a reading plan cannot reach.",
      },
    },
    {
      "@type": "Question",
      name: "Does From Victory help athletes actually visualize before a game?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Most tools tell you to visualize and leave you to do it alone. From Victory guides the visualization out loud, specific to your sport and position, and keeps returning you to who you are in Christ so you step in already secure, not trying to earn it.",
      },
    },
  ],
};

function ChristianAthleteAppsJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared typography — matches components/resources/ArticleBody.tsx classes
// so this hand-authored longform page reads identically to /resources.
// ---------------------------------------------------------------------------

const H2 =
  "font-heading font-semibold text-cream text-[22px] sm:text-[24px] leading-snug tracking-[-0.01em] pt-4";
const H3 =
  "font-heading font-semibold text-cream text-[18px] sm:text-[19px] leading-snug tracking-[-0.005em] pt-2";
const P = "font-body text-[15.5px] leading-[1.75] text-cream/80";
const LINK_CLS =
  "text-gold underline underline-offset-2 hover:text-gold-bright transition-colors duration-fast";

export default function ChristianAthleteAppsPage() {
  return (
    <>
      <ChristianAthleteAppsJsonLd />
      <AttributionCapture />
      <LandingIconDefs />
      <ScrollNav />

      <main>
        {/* ── Header ───────────────────────────────────────────────────── */}
        <section className="relative pt-[168px] md:pt-[140px] pb-12 overflow-hidden isolate">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 fv-hero-bg" />
          </div>
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            <Reveal>
              <h1 className="fv-h-article mb-0 max-w-[30ch]">{PAGE_TITLE}</h1>
            </Reveal>
          </div>
        </section>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <section className="py-12 sm:py-16 border-t border-hairline">
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            <div className="max-w-[68ch] space-y-6">
              <p className={P}>
                <strong>
                  A Christian athlete choosing an app is really weighing
                  three kinds of tool: a free Scripture devotional, a
                  sport-specific faith app, and a faith-based app that
                  guides you through pregame visualization. Each gets
                  something right. Here is what each does well, and where
                  From Victory fits.
                </strong>
              </p>

              <h2 className={H2}>
                The free devotional: FCA Challenge and YouVersion athlete
                plans
              </h2>
              <p className={P}>
                What they get right: they are free, trusted, and built on a
                daily Scripture habit. The Fellowship of Christian Athletes
                and YouVersion have discipled athletes for years, and their
                reading plans are a solid foundation. If you want a verse in
                front of you every morning, start here.
              </p>
              <p className={P}>
                Where they stop: they are read-and-reflect. They give you
                the verse and leave the rest to you. When the whistle blows,
                a reading plan cannot reach the field.
              </p>

              <h2 className={H2}>
                The sport-specific faith app: Play With Faith
              </h2>
              <p className={P}>
                What it gets right: it is built for athletes, not the
                masses. A daily verse, a short sport-specific breakdown, a
                pregame mantra. It closes some of the gap between faith and
                sport that the reading plans leave open.
              </p>
              <p className={P}>
                Where it differs: it leads with mental-game reps and
                gamified Scripture. That works for some athletes. What it
                does not give you is a guided practice you actually run in
                the last minute before you compete.
              </p>

              <h2 className={H2}>From Victory: guided visualization for game day</h2>
              <p className={P}>
                Every coach tells athletes to visualize. Sports psychology
                has said it for decades because it works. The problem has
                always been the doing. Told to visualize, most athletes sit
                in a quiet room and try to run the movie alone, and it falls
                apart. From Victory guides it. Headphones on, eyes closed, a
                voice walks you through the moment in about five minutes,
                with prompts written for your sport and your position. A
                goalie sees the first shot. A guard sees the first
                possession.
              </p>
              {/* FV-416 — app screenshot (capture of the Today home
                  screen). Layout only; no copy change. */}
              <ArticleFigure
                src="/images/blog/app-today-home.png"
                alt="The From Victory home screen, showing the day's training and the pre-practice lock-in"
                width={951}
                height={1923}
                variant="screen"
              />
              <p className={P}>
                And the visualization is not self-reliant. You are not alone
                in your own head trying to talk yourself into confidence.
                The voice keeps returning you to who God says you are, so
                the moment you step into is one where your worth is already
                settled. That is what frees you to play hard. It runs on a
                guided session you can call under pressure: breath, a
                visualization built for your sport and position, and who
                God says you are. No grind. No streaks. No shame. What it
                refuses to say is part of the point. It does not turn faith
                into a performance upgrade. It makes secure identity the
                ground the whole thing stands on.
              </p>

              <h2 className={H2}>Which one is for you</h2>
              <p className={P}>
                Keep the free devotional; it is a good habit. If you want a
                sport-specific faith feed, Play With Faith is worth a look.
                If you have been told to visualize and never had a tool that
                actually walks you through it, faith-anchored and specific
                to your sport, that is what From Victory is built for. Play
                hard, fearless, and free. From victory, not for victory.
              </p>

              <h2 className={H2}>Common questions</h2>

              <h3 className={H3}>What is the best app for Christian athletes?</h3>
              <p className={P}>
                It depends on what you need. A free devotional like FCA
                Challenge or YouVersion builds a daily Scripture habit. Play
                With Faith adds a sport-specific faith feed. From Victory
                guides you through pregame visualization, audio-led and
                specific to your sport and position, anchored in Scripture
                and who God says you are.
              </p>

              <h3 className={H3}>
                How is From Victory different from a devotional app?
              </h3>
              <p className={P}>
                A devotional gives you a verse to read. From Victory guides
                you through a pregame visualization you run with your eyes
                closed, built for the on-field moment a reading plan cannot
                reach.
              </p>

              <h3 className={H3}>
                Does From Victory help athletes actually visualize before a
                game?
              </h3>
              <p className={P}>
                Yes. Most tools tell you to visualize and leave you to do it
                alone. From Victory guides the visualization out loud,
                specific to your sport and position, and keeps returning you
                to who you are in Christ so you step in already secure, not
                trying to earn it.
              </p>
            </div>
          </div>
        </section>

        {/* ── Related reading (FV-413) ────────────────────────────────────
            Cross-link only, added after the verbatim article copy above.
            Link text is a verbatim reuse of the linked page's own title —
            the "Related reading" label is a plain functional label, not
            authored marketing copy. */}
        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            <div className="max-w-[68ch] pt-8 border-t border-hairline">
              <h2 className="font-mono text-[10px] tracking-[0.20em] uppercase text-cream/55 font-semibold mb-4">
                Related reading
              </h2>
              <ul className="list-none p-0 m-0 space-y-2">
                <li>
                  <Link href={PREGAME_RITUAL_HREF} className={LINK_CLS}>
                    {PREGAME_RITUAL_TITLE}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
