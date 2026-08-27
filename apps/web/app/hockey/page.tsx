// /hockey — hockey-first marketing landing (FV-504).
// Training, not devotion. Hockey-first among seven live sports.
// Server Component.

import type { Metadata } from "next";
import Link from "next/link";
import { FlameMark } from "@/components/ui";
import { LandingIconDefs } from "@/components/landing/icons";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { SectionMeta } from "@/components/landing/SectionMeta";
import { SvgIcon } from "@/components/landing/SvgIcon";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";

const siteUrl = "https://www.fromvictoryapp.com";

const PAGE_TITLE = "Hockey Visualization Training for Athletes";
const PAGE_DESCRIPTION =
  "See the first shift before the puck drops. Goalie tracks the first shot. Hard moment named. Ages 13+. Compete From Victory.";

export const metadata: Metadata = {
  alternates: { canonical: "/hockey" },
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${siteUrl}/hockey`,
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

const whatYouTrain = [
  {
    icon: "flame" as const,
    title: "Daily training",
    body: "One mental skill, then a picture of tomorrow's first moment. About five minutes. Built for a school night, not a chapel hour.",
  },
  {
    icon: "zap" as const,
    title: "Pregame on the ice",
    body: "Five minutes, headphones on. Your line is called. Three hard strides. Eyes up. Shoulder check. Or you have already made the first save. The hard moment is named. The body knows the cue.",
  },
  {
    icon: "target" as const,
    title: "Pre-practice lock-in",
    body: "See the first drill before you step on. One cue. Full effort. Tuesday skate uses the same picture as Friday night.",
  },
];

const positions = [
  {
    title: "Forward",
    body: "Your line is called. Three hard strides. Eyes up. Shoulder check. Simple, strong play. Recover. Next action. The turnover is named before it happens, so you reset instead of carrying it.",
  },
  {
    title: "Defense",
    body: "Walk the blue line. Gap up and stand him up. Get it out on a long D-zone shift. The pinch that goes wrong already has a way back.",
  },
  {
    title: "Goalie",
    body: "Set your depth, quiet your hands, and track the puck all the way in. Make the first save, calm and big. A bad goal does not write the next one.",
  },
];

export default function HockeyPage() {
  return (
    <>
      <AttributionCapture />
      <LandingIconDefs />
      <ScrollNav />

      <main>
        <section className="relative pt-[168px] md:pt-[140px] pb-24 overflow-hidden isolate">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 fv-hero-bg" />
          </div>
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <div className="inline-flex items-center gap-3 mb-7">
                <span className="fv-pulse-dot" />
                <span className="fv-eyebrow">Hockey</span>
              </div>
              <h1 className="fv-h-hero mb-[26px] max-w-[18ch]">
                You&apos;ve already seen the first shift.
              </h1>
              <p className="max-w-[54ch] mb-6 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
                Your line is called. Three hard strides. Eyes up. Shoulder
                check. A goalie has already set their depth, tracked the
                puck, made the first save. The hard moment is named before it
                happens. Identity in Christ is the ground under that picture.
                Compete From Victory.
              </p>
              <p className="max-w-[54ch] mb-9 text-cream/70 text-[clamp(15px,1.3vw,17px)] leading-[1.55]">
                Built by a hockey dad, hockey first, for athletes 13 and up.
                The same visualization now runs basketball (first
                possession), golf (first tee), football (first snap),
                baseball (first pitch), lacrosse and soccer (first touch).
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
                >
                  Start a 14-day free trial
                  <SvgIcon name="arrow" size={16} />
                </Link>
                <Link
                  href="/parents"
                  className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-charcoal active:scale-[0.97]"
                >
                  For parents
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <SectionMeta num="01" label="What you train" />
            </Reveal>
            <Reveal>
              <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                <h2 className="fv-h-section">
                  See it before the puck drops.
                </h2>
                <p className="fv-lede">
                  You pick Forward, Defense, or Goalie. The audio walks the
                  first moment of that job, then the hard one: the goal that
                  goes in, the turnover at your blue line, the shift you
                  cannot get off. You have already been there once.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {whatYouTrain.map((item) => (
                <Reveal key={item.title}>
                  <article className="bg-onyx border border-hairline rounded-lg p-7 transition-colors duration-base ease-out hover:border-hairline-strong h-full">
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center text-gold mb-5"
                      style={{
                        background: "var(--fv-gold-soft)",
                        border: "1px solid rgba(223,175,55,0.28)",
                      }}
                    >
                      <SvgIcon name={item.icon} size={18} />
                    </div>
                    <h3 className="font-heading font-semibold text-[20px] leading-[1.2] text-cream tracking-[-0.005em] mb-2.5">
                      {item.title}
                    </h3>
                    <p className="font-body text-[14.5px] leading-[1.55] text-cream/70 m-0">
                      {item.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 md:py-32">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <SectionMeta num="02" label="By position" />
            </Reveal>
            <Reveal>
              <h2 className="fv-h-section mb-14 max-w-[22ch]">
                See the shift before it happens.
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-b border-hairline">
              {positions.map((item, i) => (
                <Reveal key={item.title}>
                  <div
                    className={`px-7 py-9 transition-colors duration-base ease-out hover:bg-charcoal ${
                      i < positions.length - 1
                        ? "sm:border-r border-hairline max-sm:border-b max-sm:border-hairline"
                        : ""
                    }`}
                  >
                    <h3 className="font-heading font-semibold text-[22px] tracking-[-0.01em] text-cream mb-2.5">
                      {item.title}
                    </h3>
                    <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="fv-faith-bg py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <div className="max-w-[760px]">
                <div className="mb-8">
                  <FlameMark size={48} />
                </div>
                <SectionMeta num="03" label="Under the picture" />
                <h2 className="fv-h-section mb-6 max-w-[22ch]">
                  The picture stands on settled ground.
                </h2>
                <p className="fv-lede mb-6 max-w-[52ch]">
                  A 13-year-old on a U15 bench, a 16-year-old watching the
                  depth chart, a 20-year-old in junior or college: the first
                  moment is still a real play. Identity in Christ is the
                  ground under that picture, not the headline of every
                  paragraph. A cut, a healthy scratch, or a loss does not
                  reopen it. You play free because the standing is already
                  settled.
                </p>
                <p className="fv-lede mb-8 max-w-[52ch]">
                  This is visualization training, not a locker-room chapel
                  talk. Not therapy. Not for anyone under 13.
                </p>
                <div className="fv-faith-callout border border-hairline rounded-[20px] px-8 sm:px-9 py-8 max-w-[560px]">
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-3.5">
                    Hebrews 12:1–2
                  </div>
                  <div className="font-scripture italic text-[clamp(18px,2vw,24px)] leading-[1.5] text-cream text-pretty">
                    &ldquo;Let us run with perseverance the race marked out
                    for us, fixing our eyes on Jesus, the pioneer and
                    perfecter of faith.&rdquo;
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-t border-hairline">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <SectionMeta num="04" label="For hockey parents" />
            </Reveal>
            <Reveal>
              <div className="grid gap-12 lg:gap-16 items-start grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <h2 className="fv-h-section mb-6">
                    You already sit in the rink. They see the first shift
                    before they step on.
                  </h2>
                  <p className="fv-lede mb-8 max-w-[52ch]">
                    A parent buys and manages the account for athletes 13–17.
                    You see rhythm: they showed up. You do not see what they
                    prayed or which hard moment they named. 18+ can train on
                    their own. 14 days free, then $5/mo or $49/yr for the
                    first athlete. $3/$29 for each additional. Cancel anytime.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
                    >
                      Start your athlete&apos;s 14-day free trial
                      <SvgIcon name="arrow" size={16} />
                    </Link>
                    <Link
                      href="/resources/when-your-athlete-gets-cut-a-parents-guide"
                      className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-onyx active:scale-[0.97]"
                    >
                      When your athlete gets cut
                    </Link>
                  </div>
                </div>
                <div
                  className="rounded-[24px] p-8"
                  style={{
                    background:
                      "linear-gradient(180deg,rgba(223,175,55,0.06),rgba(223,175,55,0)),var(--bg-elev-2)",
                    border: "1px solid rgba(223,175,55,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-5">
                    <FlameMark size={16} />
                    <span className="fv-eyebrow gold">Web app · PWA</span>
                  </div>
                  <p className="font-body text-[15px] leading-[1.6] text-cream/80 m-0 mb-6">
                    From Victory runs in the browser and installs to the home
                    screen. It is not listed on the App Store or Google Play
                    yet. Internal TestFlight and Play Closed Alpha only. Do
                    not look for a public store listing.
                  </p>
                  <p className="font-body text-[15px] leading-[1.6] text-cream/80 m-0">
                    Play hard, fearless, and free.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
