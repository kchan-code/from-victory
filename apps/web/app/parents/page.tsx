import type { Metadata } from "next";
import Link from "next/link";
import { FlameMark } from "@/components/ui";
import { LandingIconDefs } from "@/components/landing/icons";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { SectionMeta } from "@/components/landing/SectionMeta";
import { SvgIcon } from "@/components/landing/SvgIcon";

const siteUrl = "https://www.fromvictoryapp.com";

export const metadata: Metadata = {
  title: "For Parents · From Victory",
  description:
    "You invest in your athlete's physical training. From Victory builds the mental and spiritual foundation underneath it — daily mindset training, pregame preparation, and a private practice for resilience. You see the rhythm; they own the growth.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/parents`,
    siteName: "From Victory",
    title: "For Parents · From Victory",
    description:
      "Daily mental toughness training for your athlete, rooted in faith. You see participation rhythm; your athlete owns their private training.",
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
    title: "For Parents · From Victory",
    description:
      "Daily mental toughness training for your athlete, rooted in faith. You see participation rhythm; your athlete owns their private training.",
    images: [`${siteUrl}/from-victory-social-preview.jpg`],
  },
};

// ── What your athlete gets ────────────────────────────────────────────────
const athleteGets = [
  {
    icon: "flame" as const,
    title: "Daily training session",
    body: "A short daily session — mental skill plus Scripture foundation — that builds identity, discipline, and resilience over 30 days. Hockey and basketball, with more sports coming.",
  },
  {
    icon: "zap" as const,
    title: "Pregame guided audio",
    body: "A ~5-minute guided audio session before a game: breathing, focus visualization, one controllable, and a send-off. Built for the locker room, earbuds in.",
  },
  {
    icon: "target" as const,
    title: "Pre-practice lock-in",
    body: "A short mental warm-up before practice — reset, one focus cue, compete with full effort. Keeps the habit on non-game days too.",
  },
  {
    icon: "book" as const,
    title: "Journey view",
    body: "A 30-day map showing where your athlete is in the training cycle — one session per day, one steady progression.",
  },
  {
    icon: "shield" as const,
    title: "Rhythm, not a streak",
    body: "Participation is visualized as a rhythm — not a streak. Returning after a missed day is celebrated, never shamed. No leaderboards. No comparison.",
  },
];

// ── What YOU see ─────────────────────────────────────────────────────────
const parentSees = [
  {
    title: "Rhythm summary",
    body: "How often your athlete is training — days active, total sessions completed — so you can see the habit forming without reading over their shoulder.",
  },
  {
    title: "Session count",
    body: "A running count of completed sessions. Not what they wrote or prayed. Just that they showed up.",
  },
  {
    title: "Never their private words",
    body: "The journal and reflection content is athlete-private. Not because we want to hide it from you — but because athletes need a space they genuinely own. Privacy is a feature, not a loophole.",
  },
];

// ── Pricing summary ──────────────────────────────────────────────────────
const pricingPoints = [
  "14 days free — no charge until trial ends",
  "$49 per year, or $5 per month",
  "Cancel anytime from your account settings",
  "One subscription covers your athlete's account",
  "No ads, no third-party tracking, no data sold",
];

export default function ParentsPage() {
  return (
    <>
      <LandingIconDefs />
      <ScrollNav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-[168px] md:pt-[140px] pb-24 overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 fv-hero-bg" />
        </div>
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <div className="inline-flex items-center gap-3 mb-7">
              <span className="fv-pulse-dot" />
              <span className="fv-eyebrow">For Parents</span>
            </div>
            <h1 className="fv-h-hero mb-[26px] max-w-[20ch]">
              You invest in their body.
              <br />
              This builds the <em>foundation beneath it.</em>
            </h1>
            <p className="max-w-[52ch] mb-9 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              From Victory is a daily mental toughness training app for Christian
              athletes ages 13–21. Your athlete trains. You see the rhythm. Their
              private words stay private.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/#waitlist"
                className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
              >
                Join the waitlist
                <SvgIcon name="arrow" size={16} />
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-charcoal active:scale-[0.97]"
              >
                See pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What your athlete gets ────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="01" label="What your athlete gets" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                Daily training built for the moments athletes actually face.
              </h2>
              <p className="fv-lede">
                Not a devotional. Not a hype video. A short daily practice —
                mental skill, Scripture foundation, and game-day preparation —
                that builds discipline and resilience over time.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {athleteGets.map((item) => (
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

      {/* ── What YOU see ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="02" label="What you see as a parent" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                Rhythm and participation.{" "}
                <span className="text-cream/50">Nothing more.</span>
              </h2>
              <p className="fv-lede">
                Your dashboard shows you whether your athlete is building the
                habit — not what they prayed, wrote, or reflected on. Privacy is
                a feature, not a limitation. Serious athletes share more when
                they know their space is genuinely theirs.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-b border-hairline">
            {parentSees.map((item, i) => (
              <Reveal key={item.title}>
                <div
                  className={`px-7 py-9 transition-colors duration-base ease-out hover:bg-charcoal ${
                    i < parentSees.length - 1
                      ? "sm:border-r border-hairline max-sm:border-b max-sm:border-hairline"
                      : ""
                  }`}
                >
                  {i === 2 && (
                    <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-3">
                      By design
                    </div>
                  )}
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

          {/* Privacy callout */}
          <Reveal>
            <div
              className="mt-10 rounded-[20px] px-8 py-8 max-w-[640px]"
              style={{
                background:
                  "linear-gradient(180deg,rgba(223,175,55,0.06),rgba(223,175,55,0)),var(--bg-elev-1)",
                border: "1px solid rgba(223,175,55,0.22)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center text-gold flex-none mt-0.5"
                  style={{
                    background: "var(--fv-gold-soft)",
                    border: "1px solid rgba(223,175,55,0.28)",
                  }}
                >
                  <SvgIcon name="shield" size={18} />
                </div>
                <div>
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-2">
                    Minor data protection
                  </div>
                  <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                    From Victory collects the minimum necessary to run the app:
                    your athlete&apos;s first name and birthdate. No email
                    address, no phone number, no photos. No behavioral
                    analytics. No third-party tracking on any account. Your
                    athlete&apos;s training data is yours to delete, on request,
                    within 30 days.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Faith foundation ─────────────────────────────────────────── */}
      <section className="fv-faith-bg py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <div className="max-w-[760px]">
              <div className="mb-8">
                <FlameMark size={48} />
              </div>
              <SectionMeta num="03" label="Faith foundation" />
              <h2 className="fv-h-section mb-6 max-w-[22ch]">
                Mental toughness training — with the Word underneath.
              </h2>
              <p className="fv-lede mb-8 max-w-[52ch]">
                From Victory is not a devotional app with sports language
                added. It is a mental toughness training app with faith as the
                foundation. The ordering matters. Every session starts from
                the truth that your athlete&apos;s identity in Christ is
                already secure — then trains from there.
              </p>
              <div
                className="fv-faith-callout border border-hairline rounded-[20px] px-8 sm:px-9 py-8 max-w-[560px]"
              >
                <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-3.5">
                  Hebrews 12:1–2
                </div>
                <div className="font-scripture italic text-[clamp(18px,2vw,24px)] leading-[1.5] text-cream text-pretty">
                  &ldquo;Let us run with perseverance the race marked out for
                  us, fixing our eyes on Jesus, the pioneer and perfecter of
                  faith.&rdquo;
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pricing summary ──────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-t border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="04" label="Simple, honest pricing" />
          </Reveal>
          <Reveal>
            <div className="grid gap-12 lg:gap-16 items-start grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <h2 className="fv-h-section mb-8">
                  14 days free. Then $49 per year.
                </h2>
                <ul className="flex flex-col gap-3.5 m-0 p-0 list-none mb-10">
                  {pricingPoints.map((pt) => (
                    <li key={pt} className="flex items-start gap-3.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-gold flex-none mt-0.5"
                        style={{
                          background: "var(--fv-gold-soft)",
                          border: "1px solid rgba(223,175,55,0.28)",
                        }}
                      >
                        <SvgIcon name="check" size={10} />
                      </div>
                      <span className="font-body text-[15px] text-cream/80 leading-[1.5]">
                        {pt}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/#waitlist"
                    className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
                  >
                    Join the waitlist
                    <SvgIcon name="arrow" size={16} />
                  </a>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-onyx active:scale-[0.97]"
                  >
                    See full pricing details
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
                  <span className="fv-eyebrow gold">From Victory · Annual</span>
                </div>
                <div className="mb-1">
                  <span className="font-display font-extrabold text-[48px] leading-none text-cream tracking-[-0.02em]">
                    $49
                  </span>
                  <span className="font-body text-[15px] text-cream/50 ml-1.5">
                    / year
                  </span>
                </div>
                <div className="font-body text-[13px] text-cream/50 mb-7">
                  or $5 / month — billed monthly
                </div>
                <div className="h-px bg-hairline mb-7" />
                <div className="flex flex-col gap-3 mb-8">
                  {[
                    "Daily training session (hockey & basketball)",
                    "Pregame guided audio",
                    "Pre-practice lock-in",
                    "Journey view + rhythm tracking",
                    "Parent dashboard",
                    "14-day free trial",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-gold flex-none"
                        style={{ background: "var(--fv-gold-soft)" }}
                      >
                        <SvgIcon name="check" size={8} />
                      </div>
                      <span className="font-body text-[13.5px] text-cream/70">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-cream/40 font-semibold">
                  No ads · No data sold · Cancel anytime
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
