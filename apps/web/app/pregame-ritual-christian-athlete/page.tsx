// /pregame-ritual-christian-athlete — GTM Engine page (FV-411).
//
// VERBATIM COPY: every heading, paragraph, and FAQ answer below is
// reproduced word-for-word from docs/gtm/pages/fv-crrc-w1-page.html
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
import { getArticleBySlug } from "@/lib/resources/articles";
import {
  CHRISTIAN_ATHLETE_APPS_HREF,
  CHRISTIAN_ATHLETE_APPS_TITLE,
} from "@/lib/gtm/page-titles";

const siteUrl = "https://www.fromvictoryapp.com";

const PAGE_TITLE =
  "A Pregame Ritual for the Christian Athlete: The Guided Visualization";

// Verbatim single sentence from the approved lead paragraph.
const PAGE_DESCRIPTION =
  "A pregame ritual for the Christian athlete is a short, repeatable practice that carries your faith into the moment before you compete.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} · From Victory`,
  description: PAGE_DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${siteUrl}/pregame-ritual-christian-athlete`,
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
      name: "What is a good pregame prayer or ritual for Christian athletes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A guided pregame session: breath, a visualization built for your sport and position, and a voice that keeps returning you to who God says you are. From Victory runs it as audio, headphones on and eyes closed, about five minutes before you compete, and closes in prayer.",
      },
    },
    {
      "@type": "Question",
      name: "How do athletes actually visualize before a game?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most are told to visualize and left to do it alone, which is why it rarely sticks. From Victory guides the visualization out loud, specific to your sport and position, and anchors it in who you are in Christ so you step into the moment already secure.",
      },
    },
    {
      "@type": "Question",
      name: "What Bible verse anchors the From Victory pregame session?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hebrews 12:1-2: run your race with your eyes fixed on Jesus. It is the verse the session is built on. You can also carry a focus-cue verse of your own into it.",
      },
    },
  ],
};

function PregameRitualJsonLd() {
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

export default function PregameRitualPage() {
  // FV-413 — for the cross-link below. Title rendered is the article's
  // own verbatim title from the registry (lib/resources/articles.ts).
  const preGameNervesArticle = getArticleBySlug(
    "pre-game-nerves-christian-athlete-routine",
  );

  return (
    <>
      <PregameRitualJsonLd />
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
              <h1 className="fv-h-hero mb-0 max-w-[26ch]">{PAGE_TITLE}</h1>
            </Reveal>
          </div>
        </section>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <section className="py-12 sm:py-16 border-t border-hairline">
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            <div className="max-w-[68ch] space-y-6">
              <p className={P}>
                <strong>
                  A pregame ritual for the Christian athlete is a short,
                  repeatable practice that carries your faith into the moment
                  before you compete. From Victory guides it as audio:
                  headphones on, eyes closed, about five minutes. A voice
                  walks you through breath, a visualization built for your
                  sport and your position, and who God says you are, then
                  prays with you and sends you out. Everyone tells athletes
                  to visualize. Almost no tool actually helps you do it. From
                  Victory does, and you are not doing it alone.
                </strong>
              </p>

              <p className={P}>
                You believe in Christ. Your faith holds on Sunday. But before
                the whistle on Saturday, most athletes leave it in the locker
                room. Not because they want to. Because no one ever gave them
                a way to run it, out loud, in the last few minutes before
                they compete. Here is what the session is, start to finish.
              </p>

              <h2 className={H2}>Headphones on, eyes closed</h2>
              <p className={P}>
                You do not read this ritual. You put your headphones on,
                close your eyes, and let a voice walk you through it. About
                five minutes. That is the whole thing. The voice is doing one
                job the whole way: keeping you anchored in who God says you
                are, so the outcome stops being the thing your worth rides
                on.
              </p>

              <h2 className={H2}>It opens with who you are</h2>
              <p className={P}>
                The session starts by naming you. Not the starting lineup.
                Not the scout in the stands. Not your last game. You are
                loved before you lace up, already won in Christ. That comes
                first, before any of the sport talk, because it is the
                ground the rest stands on.
              </p>
              <p className={P}>
                <em>
                  &quot;Let us run with perseverance the race marked out for
                  us, fixing our eyes on Jesus.&quot; (Hebrews 12:1-2)
                </em>{" "}
                That is the verse the whole session is built on.
              </p>

              <h2 className={H2}>Then it slows your breath</h2>
              <p className={P}>
                A couple of slow breaths. Not a focus trick. A way of letting
                your body hear that the outcome is not yours to carry alone.
              </p>

              <h2 className={H2}>The visualization is the core</h2>
              <p className={P}>
                This is the part almost no faith tool gives you. The voice
                walks you through the first moment of your sport, specific
                to your position. A hockey goalie sees the first shot: set
                your feet, track the puck, make the first save. A basketball
                guard sees the first possession. A golfer stands over the
                first tee shot. You are not picturing some generic
                highlight. You see yourself step into the real moment
                already secure, playing free instead of tight.
              </p>
              <p className={P}>
                Everyone says visualize. The hard part has always been the
                doing. Told to visualize, most athletes sit in a quiet room
                and try to run the movie alone, and it falls apart. From
                Victory runs it with you, out loud, so you actually do it.
              </p>

              <h2 className={H2}>It names the hard moment before it comes</h2>
              <p className={P}>
                Then the voice does something a highlight reel never would.
                It names the adversity you are going to meet. The mistake.
                The bad call. Down two scores. And it walks you through the
                reset before it happens, so when the moment comes you
                already know the way back. Then it prays with you and sends
                you out.
              </p>

              <h2 className={H2}>Why guided, and why not alone</h2>
              <p className={P}>
                You are not alone in your own head trying to manufacture
                confidence. That is the difference. A secular script leaves
                you to build yourself up by yourself. This one keeps handing
                the moment back to the One who already settled your worth.
                God&apos;s power, freeing you to play hard. That is what
                lets you stop white-knuckling the result.
              </p>

              <h2 className={H2}>Why a session, not just a verse</h2>
              <p className={P}>
                A verse you read in the morning is a good start. But the
                moment you want to quit does not need more information. It
                needs a practice you can run without thinking. That is what
                the session is. Faith on the field, not just on Sunday.
              </p>
              <p className={P}>
                This is the ritual From Victory is built around. Play hard,
                fearless, and free. From Victory is pre-launch.{" "}
                <Link
                  href="/?source=pregame-ritual#waitlist"
                  className={LINK_CLS}
                >
                  Join the waitlist
                </Link>
                .
              </p>

              <h2 className={H2}>Common questions</h2>

              <h3 className={H3}>
                What is a good pregame prayer or ritual for Christian
                athletes?
              </h3>
              <p className={P}>
                A guided pregame session: breath, a visualization built for
                your sport and position, and a voice that keeps returning
                you to who God says you are. From Victory runs it as audio,
                headphones on and eyes closed, about five minutes before you
                compete, and closes in prayer.
              </p>

              <h3 className={H3}>
                How do athletes actually visualize before a game?
              </h3>
              <p className={P}>
                Most are told to visualize and left to do it alone, which is
                why it rarely sticks. From Victory guides the visualization
                out loud, specific to your sport and position, and anchors it
                in who you are in Christ so you step into the moment already
                secure.
              </p>

              <h3 className={H3}>
                What Bible verse anchors the From Victory pregame session?
              </h3>
              <p className={P}>
                Hebrews 12:1-2: run your race with your eyes fixed on Jesus.
                It is the verse the session is built on. You can also carry a
                focus-cue verse of your own into it.
              </p>
            </div>
          </div>
        </section>

        {/* ── Related reading (FV-413) ────────────────────────────────────
            Cross-links only, added after the verbatim article copy above.
            Link text is a verbatim reuse of each linked page's own title —
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
                  <Link href={CHRISTIAN_ATHLETE_APPS_HREF} className={LINK_CLS}>
                    {CHRISTIAN_ATHLETE_APPS_TITLE}
                  </Link>
                </li>
                {preGameNervesArticle && (
                  <li>
                    <Link
                      href={`/resources/${preGameNervesArticle.slug}`}
                      className={LINK_CLS}
                    >
                      {preGameNervesArticle.title}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
