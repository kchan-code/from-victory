// /christian-athlete-apps — comparison page (FV-411, refreshed FV-504).
// Names the apps that actually win today's SERP. Honest store status.
// Server Component.

import type { Metadata } from "next";
import Link from "next/link";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { LandingIconDefs } from "@/components/landing/icons";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { ArticleFigure } from "@/components/marketing/ArticleFigure";
import {
  CHRISTIAN_ATHLETE_APPS_DATE_MODIFIED,
  CHRISTIAN_ATHLETE_APPS_DATE_PUBLISHED,
  CHRISTIAN_ATHLETE_APPS_EXCERPT,
  CHRISTIAN_ATHLETE_APPS_HREF,
  CHRISTIAN_ATHLETE_APPS_TITLE,
  PREGAME_RITUAL_HREF,
  PREGAME_RITUAL_TITLE,
} from "@/lib/gtm/page-titles";

const siteUrl = "https://www.fromvictoryapp.com";

const PAGE_TITLE = CHRISTIAN_ATHLETE_APPS_TITLE;
const PAGE_DESCRIPTION = CHRISTIAN_ATHLETE_APPS_EXCERPT;
const PAGE_IMAGE = `${siteUrl}/images/blog/app-today-home.png`;

export const metadata: Metadata = {
  alternates: { canonical: CHRISTIAN_ATHLETE_APPS_HREF },
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${siteUrl}${CHRISTIAN_ATHLETE_APPS_HREF}`,
    siteName: "From Victory",
    title: `${PAGE_TITLE} · From Victory`,
    description: PAGE_DESCRIPTION,
    publishedTime: CHRISTIAN_ATHLETE_APPS_DATE_PUBLISHED,
    modifiedTime: CHRISTIAN_ATHLETE_APPS_DATE_MODIFIED,
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

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best app for Christian athletes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Parents asking that today usually hear Faithful Athlete, Playbook Devotional, or Core IV. Those three are listed on the App Store. From Victory is guided visualization you actually run — then compete from victory — for athletes 13 and up, as a web app you can install. Not a daily devotion. Not therapy. Not on the App Store or Play yet.",
      },
    },
    {
      "@type": "Question",
      name: "How is From Victory different from a devotional app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A devotion gives you a verse to read. From Victory is a training session you run: daily mental skill plus Scripture underneath, and a guided pregame visualization for your sport and position.",
      },
    },
    {
      "@type": "Question",
      name: "Is From Victory on the App Store or Google Play?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not yet. From Victory is a web app you can install to the home screen. Internal TestFlight and Play Closed Alpha only. Do not look for a public store listing.",
      },
    },
  ],
};

const ARTICLE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  url: `${siteUrl}${CHRISTIAN_ATHLETE_APPS_HREF}`,
  datePublished: CHRISTIAN_ATHLETE_APPS_DATE_PUBLISHED,
  dateModified: CHRISTIAN_ATHLETE_APPS_DATE_MODIFIED,
  author: {
    "@type": "Organization",
    name: "From Victory",
    url: siteUrl,
  },
  image: [PAGE_IMAGE],
  publisher: {
    "@type": "Organization",
    name: "From Victory",
    url: siteUrl,
  },
};

function ChristianAthleteAppsJsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
    </>
  );
}

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
        <section className="relative pt-[168px] md:pt-[140px] pb-12 overflow-hidden isolate">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 fv-hero-bg" />
          </div>
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            <Reveal>
              <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-cream/55 mb-7">
                <time dateTime={CHRISTIAN_ATHLETE_APPS_DATE_MODIFIED}>
                  Updated August 26, 2026
                </time>
              </p>
              <h1 className="fv-h-article mb-0 max-w-[30ch]">{PAGE_TITLE}</h1>
            </Reveal>
          </div>
        </section>

        <section className="py-12 sm:py-16 border-t border-hairline">
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            <div className="max-w-[68ch] space-y-6">
              <p className={P}>
                <strong>
                  Parents asking for the best Christian athlete app today
                  usually hear Faithful Athlete, Playbook Devotional, or Core
                  IV. Those three are listed on the App Store. From Victory is
                  different: mental-toughness training with Scripture
                  underneath, for athletes 13 and up, as a web app you can
                  install. Not a daily devotion. Not therapy. Not on the App
                  Store or Play yet.
                </strong>
              </p>

              <h2 className={H2}>The three names that win the search today</h2>
              <p className={P}>
                If a parent types &quot;best Christian athlete app&quot; into
                Google or an AI chat, those three names come back. They earned
                that. They shipped store listings. We have not. Here is what
                each one actually is, said plainly, and where From Victory
                sits.
              </p>

              <h2 className={H2}>Faithful Athlete</h2>
              <p className={P}>
                Faithful Athlete is listed on the App Store. It is built around
                daily mental check-ins, biblical affirmations, a prayer
                journal, and verse saving. Sport personalization is broad. It
                is a store app a family can download tonight.
              </p>
              <p className={P}>
                What it is not: a guided, position-specific pregame you run
                with headphones on. If your athlete wants a check-in and a
                verse in their pocket, this is a real option.
              </p>

              <h2 className={H2}>Playbook Devotional</h2>
              <p className={P}>
                Playbook Devotional is listed on the App Store. It is what it
                says: 365 short devotionals for young athletes. A verse, a
                reflection, a question. Built for a morning, a car ride, or
                bedtime. Clean and easy to finish.
              </p>
              <p className={P}>
                If you want a daily reading habit tied to sport, start here.
                A reading plan cannot reach the first shift. That is a
                different job.
              </p>

              <h2 className={H2}>Core IV</h2>
              <p className={P}>
                Core IV Athlete is listed on the stores and sold as a
                faith-and-performance wellness platform: assessments, content,
                team and school dashboards. It is built for programs as much
                as for one athlete. The NCCAA has named it a preferred vendor.
              </p>
              <p className={P}>
                If a school or club wants a wellness dashboard, that is their
                lane. From Victory is not that product. We do not assess
                mental health. We do not sell a coach a view into an
                athlete&apos;s private training.
              </p>

              <h2 className={H2}>The free-devotion category</h2>
              <p className={P}>
                FCA Challenge and YouVersion athlete plans are still the
                free, trusted daily Scripture habit. Keep them. They
                discipled athletes long before any of these apps shipped. They
                stop at read-and-reflect. When the whistle blows, a reading
                plan cannot run the moment with you.
              </p>
              <p className={P}>
                Play With Faith sits nearer the sport-specific faith-feed
                lane: a verse, a short breakdown, a pregame mantra. Useful for
                some athletes. It is not a guided visualization you actually
                run.
              </p>

              <h2 className={H2}>From Victory: see it, then compete from victory</h2>
              <p className={P}>
                Everyone tells athletes to visualize. Almost no tool actually
                helps you do it. From Victory runs the first moment with you:
                a hockey goalie tracks the first shot, a guard sees the first
                possession, a golfer stands over the first tee. Then daily
                training, pre-practice lock-in, and the ride home. Hockey
                first among seven live sports. Ages 13 and up. No one under
                13.
              </p>
              <p className={P}>
                Identity in Christ is the ground under that picture, not a
                chapel headline.{" "}
                <strong>Your Identity Is Secure. Compete From Victory.</strong>{" "}
                A win does not raise your standing with God. A loss does not
                lower it.
              </p>
              <ArticleFigure
                src="/images/blog/app-today-home.png"
                alt="The From Victory home screen, showing the day's training and the pre-practice lock-in"
                width={951}
                height={1923}
                variant="screen"
              />
              <p className={P}>
                It is a web app. Install it to the home screen. It is not on
                the App Store or Google Play yet. Internal TestFlight and Play
                Closed Alpha only. Do not tell a parent they can download us
                from a store tonight. That would be false.
              </p>
              <p className={P}>
                We are not therapy. We are not a mental-health service. If an
                athlete needs clinical care, that is a licensed professional,
                a trusted adult, and 988. A training app sits beside that. It
                does not replace it.
              </p>
              <p className={P}>
                The comparison is visualization you actually run versus a
                devotion you read. Faith-grounded training is the second
                beat, so a parent who came for that still sees it.
              </p>

              <h2 className={H2}>Which one is for you</h2>
              <p className={P}>
                Want a store download and a daily check-in? Faithful Athlete.
                Want 365 short readings? Playbook Devotional. Want a program
                wellness platform? Core IV. Want a free verse habit? FCA
                Challenge or YouVersion. Want visualization you actually run,
                then compete from victory? That is From Victory. Play hard,
                fearless, and free.
              </p>
              <p className={P}>
                <Link href="/signup" className={LINK_CLS}>
                  Start a 14-day free trial
                </Link>
                . $5/mo or $49/yr after for the first athlete. $3/$29 add-on.
                Cancel anytime.
              </p>

              <h2 className={H2}>Common questions</h2>

              <h3 className={H3}>What is the best app for Christian athletes?</h3>
              <p className={P}>
                Parents asking that today usually hear Faithful Athlete,
                Playbook Devotional, or Core IV. Those three are listed on
                the App Store. From Victory is guided visualization you
                actually run — then compete from victory — for athletes 13
                and up, as a web app you can install. Not a daily devotion.
                Not therapy. Not on the App Store or Play yet.
              </p>

              <h3 className={H3}>
                How is From Victory different from a devotional app?
              </h3>
              <p className={P}>
                A devotion gives you a verse to read. From Victory is a
                training session you run: daily mental skill plus Scripture
                underneath, and a guided pregame visualization for your sport
                and position.
              </p>

              <h3 className={H3}>
                Is From Victory on the App Store or Google Play?
              </h3>
              <p className={P}>
                Not yet. From Victory is a web app you can install to the
                home screen. Internal TestFlight and Play Closed Alpha only.
                Do not look for a public store listing.
              </p>
            </div>
          </div>
        </section>

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
                <li>
                  <Link href="/hockey" className={LINK_CLS}>
                    Hockey Visualization Training for Athletes
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
