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

export const metadata: Metadata = {
  title: "For Teams, Churches & Sports Ministries · From Victory",
  description:
    "From Victory gives teams, clubs, FCA chapters, chaplains, and church youth groups a simple way to provide Scripture-rooted athlete mindset training to families — without managing accounts, monitoring athletes, or holding private data.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/teams`,
    siteName: "From Victory",
    title: "For Teams, Churches & Sports Ministries · From Victory",
    description:
      "Equip athletes across every sport to compete from a secure identity in Christ. You fund access. Families create accounts. Athletes train privately.",
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
    title: "For Teams, Churches & Sports Ministries · From Victory",
    description:
      "Equip athletes across every sport to compete from a secure identity in Christ. You fund access. Families create accounts. Athletes train privately.",
    images: [`${siteUrl}/from-victory-social-preview.jpg`],
  },
};

// ── How it works steps ────────────────────────────────────────────────────
const howItWorks = [
  {
    num: "01",
    title: "Request group pricing",
    body: "Tell us how many families or athletes you want to cover. We'll help size the right group option.",
  },
  {
    num: "02",
    title: "Receive access codes",
    body: "You receive codes to distribute to families. You are giving access, not managing accounts.",
  },
  {
    num: "03",
    title: "Families onboard independently",
    body: "Each parent or family creates its own account and controls the athlete's setup.",
  },
  {
    num: "04",
    title: "Athletes train privately",
    body: "Athletes complete training in their own account. Your organization does not see rosters, activity, responses, or progress history.",
  },
];

// ── Who this is for ──────────────────────────────────────────────────────
const audiences = [
  {
    icon: "zap" as const,
    label: "Teams, clubs, and academies",
    heading: "Give athletes a daily mental-skills rhythm rooted in Christ.",
    body: "You already invest in coaching, practices, strength work, film, and competition. From Victory helps athletes train the inner layer that carries into every sport: identity, focus, resilience, reset, and preparation.\n\nYou provide access. Families create accounts. Athletes train privately.",
    note: null,
  },
  {
    icon: "anchor" as const,
    label: "FCA chapters, chaplains, and sports ministries",
    heading: "Help athletes carry faith into the daily pressure of competition.",
    body: "A huddle, talk, or chapel can be powerful. But pressure shows up every day: tryouts, slumps, injuries, mistakes, rivalry games, and the fear of disappointing people. From Victory gives athletes a daily practice that connects Scripture, identity, and mental preparation between gatherings.",
    note: "Non-denominational Protestant. Scripture-centered. Built as mindset training with faith at the foundation — not sports language added onto a generic devotional.",
  },
  {
    icon: "book" as const,
    label: "Church youth groups and family ministries",
    heading: "Serve sports families without becoming the system of record.",
    body: "Many families in your church are navigating the pressure, identity questions, and time demands of youth sports. From Victory gives you a practical resource to place in their hands while keeping the family — not the church — in control of the account and data.",
    note: null,
  },
];

// ── What athletes actually get ────────────────────────────────────────────
const athleteGets = [
  {
    icon: "flame" as const,
    title: "Daily mindset training",
    body: "Short daily sessions that connect Scripture, identity in Christ, and practical mental skills athletes can carry into practice, games, tryouts, and setbacks.",
  },
  {
    icon: "zap" as const,
    title: "Pregame guided audio",
    body: "A guided preparation session before competition: breath, focus, visualization, reset plan, and a Christ-centered send-off.",
  },
  {
    icon: "target" as const,
    title: "Pre-practice lock-in",
    body: "A quick mental warm-up before training: one focus cue, one effort frame, and one way to respond when practice gets hard.",
  },
  {
    icon: "wind" as const,
    title: "Reset and resilience rhythm",
    body: "Athletes learn how to return after a mistake, a bad game, a missed day, or a hard stretch without shame.",
  },
  {
    icon: "anchor" as const,
    title: "Sport-specific tracks",
    body: "The core training is built for Christian athletes across sports. Hockey and basketball are the first sport-specific tracks available at launch, with additional sports in development.",
  },
];

// ── FAQ: How group pricing works ──────────────────────────────────────────
const groupFaq = [
  {
    q: "Who owns the athlete accounts?",
    a: "Families do. Each parent creates and controls their own account. From the moment they onboard, everything — accounts, data, deletion rights — belongs to them. Your organization distributed the access; it does not hold any of it.",
  },
  {
    q: "Can I see how athletes are training?",
    a: "No, and that's intentional. There is no coach dashboard and no team activity feed. The architecture does not support reading another athlete's session — by design, not by policy. What an athlete trains on and how they prepare is between them and their family account.",
  },
  {
    q: "What athlete data does our organization hold?",
    a: "None. Each athlete account holds only a first name and birthdate. No email address, no phone number, no photos, no behavioral analytics. The purchasing organization — your team, chapter, or church — has no access to any of it. Full deletion on the parent's request within 30 days.",
  },
  {
    q: "Is there ongoing admin work after we distribute codes?",
    a: "No. Once families have their codes, they onboard independently. There is no roster to update, no dashboard to check, and no reporting obligations on your end. You funded the access; families manage their experience from there.",
  },
  {
    q: "What happens if a family leaves the program?",
    a: "Their account belongs to the family, not the organization. If your group arrangement ends, families can continue with their own subscription at the standard rate. Nothing in the athlete's account changes — just who's paying.",
  },
];

// ── Group pricing CTA URL ────────────────────────────────────────────────
const groupPricingUrl = "/?role=coach&source=teams&intent=group-pricing#waitlist";

export default function TeamsPage() {
  return (
    <>
      <AttributionCapture />
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
              <span className="fv-eyebrow">For Teams, Churches &amp; Sports Ministries</span>
            </div>
            <h1 className="fv-h-hero mb-[26px] max-w-[22ch]">
              Equip athletes across every sport to compete from a{" "}
              <em>secure identity in Christ.</em>
            </h1>
            <p className="max-w-[54ch] mb-5 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              From Victory is built for teams, clubs, academies, FCA chapters,
              chaplains, and church youth groups that want to support athletes
              without becoming another system to manage. You fund access.
              Families create their own accounts. Athletes train privately.
            </p>
            <div className="flex flex-wrap gap-3">
              {/*
               * TODO FV-249: when hello@ email routing is live, replace the
               * groupPricingUrl href with a mailto:hello@fromvictoryapp.com link
               * (or a dedicated /teams/contact form). Until then, the waitlist
               * form with pre-filled coach role captures this intent cleanly.
               */}
              <a
                href={groupPricingUrl}
                data-testid="teams-request-pricing-hero"
                className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
              >
                Request group pricing
                <SvgIcon name="arrow" size={16} />
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-charcoal active:scale-[0.97]"
              >
                See individual pricing
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] tracking-[0.16em] uppercase text-cream/60 font-semibold">
              Select &ldquo;Coach / Ministry Leader&rdquo; on the form &rarr; we&apos;ll follow up with group options
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Who this is for: three audiences ─────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="01" label="Who this is built for" />
          </Reveal>
          <Reveal>
            <div className="mb-14">
              <h2 className="fv-h-section wide">
                Built for the adults already investing in athletes.
              </h2>
              <p className="fv-lede max-w-[52ch]">
                The tool is the same. The context changes. From Victory can
                support a team, a ministry, a chaplaincy program, or a church
                sports initiative without requiring your organization to manage
                athlete data.
              </p>
            </div>
          </Reveal>

          <div className="flex flex-col gap-3.5">
            {audiences.map((aud) => (
              <Reveal key={aud.label}>
                <article className="bg-charcoal border border-hairline rounded-lg p-7 sm:p-9 transition-colors duration-base ease-out hover:border-hairline-strong">
                  <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
                    {/* Icon + label */}
                    <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:w-[200px]">
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center text-gold flex-none"
                        style={{
                          background: "var(--fv-gold-soft)",
                          border: "1px solid rgba(223,175,55,0.28)",
                        }}
                      >
                        <SvgIcon name={aud.icon} size={18} />
                      </div>
                      <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold">
                        {aud.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-heading font-semibold text-[22px] leading-[1.2] text-cream tracking-[-0.01em] mb-3">
                        {aud.heading}
                      </h3>
                      {aud.body.split("\n\n").map((paragraph, i) => (
                        <p
                          key={i}
                          className="font-body text-[15px] leading-[1.6] text-cream/70 mb-4 m-0 max-w-[64ch]"
                        >
                          {paragraph}
                        </p>
                      ))}
                      {aud.note && (
                        <div
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md mt-1"
                          style={{
                            background: "rgba(247,247,247,0.04)",
                            border: "1px solid rgba(247,247,247,0.08)",
                          }}
                        >
                          <SvgIcon name="check" size={11} className="text-gold flex-none" />
                          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-cream/50 font-semibold">
                            {aud.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works: 4-step flow ─────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="02" label="How it works" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                Simple to offer.{" "}
                <span className="text-cream/50">Private for families.</span>
              </h2>
              <p className="fv-lede">
                No team portal. No admin dashboard. No roster maintenance. Your
                organization funds access; families use it independently.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {howItWorks.map((step) => (
              <Reveal key={step.num}>
                <div className="bg-onyx border border-hairline rounded-lg p-7 h-full">
                  <div className="font-display font-extrabold text-[40px] leading-none text-gold tracking-[-0.01em] mb-5">
                    {step.num}
                  </div>
                  <h3 className="font-heading font-semibold text-[18px] leading-[1.2] text-cream tracking-[-0.005em] mb-2.5">
                    {step.title}
                  </h3>
                  <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Clarification: volume pricing = conversation, not self-serve */}
          <Reveal>
            <div
              className="mt-10 rounded-[20px] px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center gap-6"
              style={{
                background: "var(--bg-elev-2)",
                border: "1px solid var(--fv-hairline-2)",
              }}
            >
              <div className="flex-1">
                <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-cream/50 font-semibold mb-1.5">
                  Group pricing
                </div>
                <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                  Team and group pricing is not self-serve yet — we size each
                  arrangement individually. There are no published per-seat
                  numbers here on purpose: the right structure depends on your
                  group size and context. Access codes are issued as part of
                  that conversation. Use the form below to start it.
                </p>
              </div>
              <a
                href={groupPricingUrl}
                data-testid="teams-request-pricing-mid"
                className="flex-none inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-6 py-[16px] text-[15px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] whitespace-nowrap"
              >
                Request group pricing
                <SvgIcon name="arrow" size={15} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What athletes get ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="03" label="What athletes get" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                The same full training experience every athlete receives.
              </h2>
              <p className="fv-lede">
                No reduced team version. No watered-down group plan. Every
                athlete receives the full From Victory experience. The only
                difference is how access is funded.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {athleteGets.map((item) => (
              <Reveal key={item.title}>
                <article className="bg-charcoal border border-hairline rounded-lg p-7 transition-colors duration-base ease-out hover:border-hairline-strong h-full">
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center text-gold mb-5"
                    style={{
                      background: "var(--fv-gold-soft)",
                      border: "1px solid rgba(223,175,55,0.28)",
                    }}
                  >
                    <SvgIcon name={item.icon} size={18} />
                  </div>
                  <h3 className="font-heading font-semibold text-[18px] leading-[1.2] text-cream tracking-[-0.005em] mb-2.5">
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

      {/* ── Faith foundation ─────────────────────────────────────────── */}
      <section className="fv-faith-bg py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <div className="max-w-[760px]">
              <div className="mb-8">
                <FlameMark size={48} />
              </div>
              <SectionMeta num="04" label="Faith foundation" />
              <h2 className="fv-h-section mb-6 max-w-[22ch]">
                Built from identity in Christ, not performance pressure.
              </h2>
              <p className="fv-lede mb-6 max-w-[56ch]">
                From Victory begins where Christian athlete formation should
                begin: an athlete&apos;s identity is secure in Christ before
                the scoreboard, stat sheet, depth chart, or coach&apos;s
                opinion says anything.
              </p>
              <p className="fv-lede mb-8 max-w-[56ch]">
                The app then trains from that foundation: focus, discipline,
                resilience, preparation, and the ability to reset after
                mistakes. It is not therapy, clinical care, or crisis
                intervention. It is Scripture-rooted mindset training designed
                to work alongside families, coaches, churches, and sports
                ministries.
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

      {/* ── FAQ: How group pricing works ──────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="05" label="How group pricing works" />
          </Reveal>
          <Reveal>
            <div className="mb-14">
              <h2 className="fv-h-section">
                Common questions from coaches and ministries.
              </h2>
            </div>
          </Reveal>

          <div className="max-w-[800px] divide-y divide-hairline border-t border-hairline">
            {groupFaq.map(({ q, a }) => (
              <Reveal key={q}>
                <div className="py-8">
                  <h3 className="font-heading font-semibold text-[19px] leading-[1.2] text-cream tracking-[-0.005em] mb-3">
                    {q}
                  </h3>
                  <p className="font-body text-[14.5px] leading-[1.6] text-cream/70 m-0">
                    {a}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA strip ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="fv-final-bg absolute inset-0 pointer-events-none" />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 text-center">
          <Reveal>
            <div className="mx-auto mb-6 inline-block">
              <FlameMark size={48} />
            </div>
            <h2 className="fv-final-headline max-w-[24ch] mx-auto">
              Ready to equip the athletes and{" "}
              <em>families you serve?</em>
            </h2>
            <p className="fv-lede max-w-[52ch] mx-auto mb-8">
              Give them a private, Scripture-rooted training rhythm they can
              carry into practices, games, tryouts, pressure, and setbacks —
              without adding another dashboard for your organization to manage.
            </p>
            {/*
             * TODO FV-249: swap this href for mailto:hello@fromvictoryapp.com
             * (or a /teams/contact route) once hello@ email routing is live.
             * The form with pre-filled Coach role captures org intent cleanly.
             */}
            <a
              href={groupPricingUrl}
              data-testid="teams-request-pricing-final"
              className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-8 py-[20px] text-[17px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
            >
              Request group pricing
              <SvgIcon name="arrow" size={17} />
            </a>
            <p className="mt-4 font-mono text-[11px] tracking-[0.16em] uppercase text-cream/60 font-semibold">
              Select &ldquo;Coach / Ministry Leader&rdquo; &rarr; we&apos;ll follow up with options for your team, church, or sports community
            </p>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
