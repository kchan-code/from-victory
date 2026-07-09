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

const siteUrl = "https://www.fromvictoryapp.com";

const PAGE_TITLE =
  "A Pregame Ritual for the Christian Athlete: Center, Receive, Respond, Carry";

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
        text: "Center, Receive, Respond, Carry: a four-beat, Scripture-anchored ritual you run in about sixty seconds before you compete. From Victory guides it as audio, headphones on and eyes closed, with prompts written for your sport and your position.",
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
      name: "What Bible verses are good for athletes before a game?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Psalm 46:10 grounds the whole rhythm: be still, and know that God is God. Use it as a competing rhythm, not only a reading.",
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
                  before you compete. From Victory builds it around four
                  beats: Center, Receive, Respond, Carry. You do not just
                  read them. You put your headphones on, close your eyes, and
                  a voice walks you through all four in about sixty seconds,
                  with prompts written for your sport and your position.
                  Everyone tells athletes to visualize. Almost no tool
                  actually helps you do it. From Victory does, and you are
                  not doing it alone. The same voice keeps pointing you back
                  to who God says you are, so you can play hard and free.
                </strong>
              </p>

              <p className={P}>
                You believe in Christ. Your faith holds on Sunday. But before
                the whistle on Saturday, most athletes leave it in the locker
                room. Not because they want to. Because no one ever gave them
                a way to run it, out loud, in the last minute before they
                compete. Here is what each beat does, and what the voice in
                your ears is doing while you close your eyes.
              </p>

              <h2 className={H2}>Center</h2>
              <p className={P}>
                Headphones on. Eyes closed. The voice slows you down to one
                breath. This is a posture of surrender, not a focus trick.
                You are not quieting your mind by willpower. You are letting
                your body hear that the outcome is not yours to carry alone.
              </p>
              <p className={P}>
                <em>&quot;Be still, and know that I am God.&quot; (Psalm 46:10)</em>
              </p>

              <h2 className={H2}>Receive</h2>
              <p className={P}>
                The voice names who you already are. Not the starting
                lineup. Not the scout in the stands. Not your last game. It
                says back to you what Christ says: you are already won, and
                that does not move with today&apos;s result. You are not
                talking yourself up. You are receiving something that was
                true before you laced up.
              </p>

              <h2 className={H2}>Respond</h2>
              <p className={P}>
                Now the voice has you name what you are carrying. The
                nerves. The expectation. The fear of the mistake. You hand it
                over. This is honest surrender, not pretending the pressure
                is not real, choosing not to carry it by yourself.
              </p>

              <h2 className={H2}>Carry</h2>
              <p className={P}>
                This is where the guided visualization gets specific to you.
                The prompts are written for your sport and your position, so
                you are not picturing some generic highlight. A goalie sees
                the first shot. A pitcher sees the first pitch. A midfielder
                sees the first ball at their feet. You see yourself step into
                that moment already secure, playing free instead of tight.
                Then you open your eyes and go do the thing you just
                rehearsed. From victory, not for victory.
              </p>

              <h2 className={H2}>Why guided, and why not alone</h2>
              <p className={P}>
                Visualization is not new advice. Coaches and sports
                psychologists have taught it for years because it works. The
                hard part has always been the doing. Told to visualize, most
                athletes sit in a quiet room and try to run the movie by
                themselves, and it falls apart. From Victory guides it out
                loud so you actually run it, and it does one thing a secular
                script never will: it keeps returning you to God. You are
                not alone in your own head trying to manufacture confidence.
                The voice hands the moment back to the One who already
                settled your worth, and that is what frees you to play hard.
              </p>

              <h2 className={H2}>Why a rhythm, not just a verse</h2>
              <p className={P}>
                A verse you read in the morning is a good start. But the
                moment you want to quit does not need more information. It
                needs a practice you can run without thinking. Center,
                Receive, Respond, Carry is that practice: the same four
                beats every morning, and again the minute before you step on
                the field. Faith on the field, not just on Sunday.
              </p>
              <p className={P}>
                This is the rhythm From Victory is built around. Play hard,
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
                Center, Receive, Respond, Carry: a four-beat,
                Scripture-anchored ritual you run in about sixty seconds
                before you compete. From Victory guides it as audio,
                headphones on and eyes closed, with prompts written for your
                sport and your position.
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
                What Bible verses are good for athletes before a game?
              </h3>
              <p className={P}>
                Psalm 46:10 grounds the whole rhythm: be still, and know that
                God is God. Use it as a competing rhythm, not only a reading.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
