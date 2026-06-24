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
  title: "Pricing · From Victory",
  description:
    "14 days free, then $49/yr or $5/mo for your first athlete — $29/yr or $3/mo for each additional. No ads, no data sold, cancel anytime.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/pricing`,
    siteName: "From Victory",
    title: "Pricing · From Victory",
    description:
      "14 days free, then $49/yr or $5/mo for your first athlete, $29/yr or $3/mo for each additional. No ads, no data sold, cancel anytime.",
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
    title: "Pricing · From Victory",
    description:
      "14 days free, then $49/yr or $5/mo for your first athlete, $29/yr or $3/mo for each additional. No ads, no data sold, cancel anytime.",
    images: [`${siteUrl}/from-victory-social-preview.jpg`],
  },
};

const annualFeatures = [
  "Daily training session (hockey, basketball & golf)",
  "Pregame guided audio (~5 min)",
  "Pre-practice lock-in",
  "Journey view — 30-day session map",
  "Rhythm visualization (not a streak counter)",
  "Parent dashboard — rhythm + session count",
  "14-day free trial",
  "Cancel anytime",
];

const faq: { q: string; a: string }[] = [
  {
    q: "What happens after the 14-day trial?",
    a: "If you do nothing, your subscription starts at the rate you selected — $49/yr or $5/mo for your first athlete — $29/yr or $3/mo for each additional. We will not charge you before the trial period ends. You can cancel any time in your account settings before the trial ends and you will not be billed. The free trial applies to first-time subscribers.",
  },
  {
    q: "What sports are available right now?",
    a: "Hockey, basketball, and golf are live now. More sports are in development — all 30-day training content is sport-specific, so we build each one fully before releasing it.",
  },
  {
    q: "Can I see what my athlete does inside their sessions?",
    a: "No. The parent dashboard shows rhythm data — how often your athlete trained and total sessions completed. The choices they make inside a session, and anything they bring to prayer, stay theirs by design.",
  },
  {
    q: "Can I cancel before the trial ends?",
    a: "Yes. Cancel any time in your account settings and you will not be charged. No friction, no penalty.",
  },
  {
    q: "Is there a free tier or free version?",
    a: "Not currently. The 14-day free trial gives your athlete full access to evaluate the app with no commitment.",
  },
  {
    q: "How does From Victory handle my athlete's data?",
    a: "We collect the minimum necessary: your athlete's first name and birthdate. No email, no phone number. No behavioral analytics. No ads. No third-party tracking. Full privacy policy is linked below.",
  },
  {
    q: "Can athletes under 13 use From Victory?",
    a: "From Victory is designed for athletes ages 13–21. Accounts require a parent or guardian to set them up, and athletes 13–17 receive additional data protections. The app is not available for users under 13.",
  },
];

export default function PricingPage() {
  return (
    <>
      <LandingIconDefs />
      <ScrollNav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-[168px] md:pt-[140px] pb-24 overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 fv-hero-bg" />
        </div>
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-3 mb-7 justify-center">
              <span className="fv-pulse-dot" />
              <span className="fv-eyebrow">Pricing</span>
            </div>
            <h1 className="fv-h-hero mb-[26px]">
              14 days free.{" "}
              <br className="hidden sm:block" />
              Then <em>$49 per year.</em>
            </h1>
            <p className="max-w-[44ch] mx-auto mb-9 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              $49/yr or $5/mo for your first athlete &mdash; $29/yr or $3/mo
              for each additional. No ads, no data sold, cancel anytime.
              First-time subscribers train free for the first two weeks.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Plans ─────────────────────────────────────────────────────── */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 max-w-[760px] mx-auto">
              {/* Annual — recommended */}
              <div
                className="rounded-[24px] p-8 flex flex-col relative"
                style={{
                  background:
                    "linear-gradient(180deg,rgba(223,175,55,0.10),rgba(223,175,55,0)),var(--bg-elev-1)",
                  border: "1px solid rgba(223,175,55,0.4)",
                  boxShadow: "0 0 0 1px rgba(223,175,55,0.15)",
                }}
              >
                {/* Recommended badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-gold text-onyx font-mono font-semibold text-[10px] tracking-[0.18em] uppercase px-3 py-1 rounded-pill whitespace-nowrap">
                    Best value
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-5 pt-2">
                  <FlameMark size={16} />
                  <span className="fv-eyebrow gold">Annual plan</span>
                </div>

                <div className="mb-1">
                  <span className="font-display font-extrabold text-[52px] leading-none text-cream tracking-[-0.02em]">
                    $49
                  </span>
                  <span className="font-body text-[15px] text-cream/50 ml-1.5">
                    / year
                  </span>
                </div>
                <div className="font-body text-[13px] text-cream/55 mb-2">
                  $49/yr for your first athlete &mdash; $29/yr each additional
                  athlete
                </div>
                <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-gold font-semibold mb-7">
                  14-day free trial
                </div>

                <div className="h-px bg-hairline mb-7" />

                <ul className="flex flex-col gap-3 m-0 p-0 list-none flex-1 mb-8">
                  {annualFeatures.map((feat) => (
                    <li key={feat} className="flex items-start gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-gold flex-none mt-0.5"
                        style={{ background: "var(--fv-gold-soft)" }}
                        aria-hidden
                      >
                        <SvgIcon name="check" size={8} />
                      </div>
                      <span className="font-body text-[13.5px] text-cream/80 leading-[1.45]">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
                >
                  Start your athlete&apos;s free trial
                  <SvgIcon name="arrow" size={16} />
                </Link>
                <p className="text-center font-mono text-[10px] tracking-[0.12em] uppercase text-cream/35 font-semibold mt-3">
                  14 days free &mdash; cancel anytime
                </p>
              </div>

              {/* Monthly */}
              <div
                className="rounded-[24px] p-8 flex flex-col"
                style={{
                  background: "var(--bg-elev-1)",
                  border: "1px solid var(--fv-hairline-2)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="fv-eyebrow">Monthly plan</span>
                </div>

                <div className="mb-1">
                  <span className="font-display font-extrabold text-[52px] leading-none text-cream tracking-[-0.02em]">
                    $5
                  </span>
                  <span className="font-body text-[15px] text-cream/50 ml-1.5">
                    / month
                  </span>
                </div>
                <div className="font-body text-[13px] text-cream/50 mb-1">
                  Billed monthly, $60 per year
                </div>
                <div className="font-body text-[13px] text-cream/55 mb-2">
                  $3/mo each additional athlete
                </div>
                <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-cream/50 font-semibold mb-7">
                  14-day free trial
                </div>

                <div className="h-px bg-hairline mb-7" />

                <ul className="flex flex-col gap-3 m-0 p-0 list-none flex-1 mb-8">
                  {annualFeatures.map((feat) => (
                    <li key={feat} className="flex items-start gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-cream/50 flex-none mt-0.5"
                        style={{ background: "rgba(247,247,247,0.06)" }}
                        aria-hidden
                      >
                        <SvgIcon name="check" size={8} />
                      </div>
                      <span className="font-body text-[13.5px] text-cream/70 leading-[1.45]">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-surface-1 active:scale-[0.97]"
                >
                  Start your athlete&apos;s free trial
                  <SvgIcon name="arrow" size={16} />
                </Link>
                <p className="text-center font-mono text-[10px] tracking-[0.12em] uppercase text-cream/35 font-semibold mt-3">
                  14 days free &mdash; cancel anytime
                </p>
              </div>
            </div>
          </Reveal>

          {/* Trust strip */}
          <Reveal>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-10 font-mono text-[11px] tracking-[0.18em] uppercase text-cream/40 font-semibold">
              <span>No ads</span>
              <span>·</span>
              <span>No data sold</span>
              <span>·</span>
              <span>No behavioral tracking</span>
              <span>·</span>
              <span>Cancel anytime</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What's included ──────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="01" label="Everything included" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                One price. Everything your athlete needs.
              </h2>
              <p className="fv-lede">
                No tiers, no paywalled features. Both plans include everything —
                the only difference is the billing interval.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                {
                  icon: "flame" as const,
                  title: "Daily training session",
                  body: "30 days of sport-specific mental skill + Scripture foundation. Hockey, basketball, and golf available now.",
                },
                {
                  icon: "zap" as const,
                  title: "Pregame guided audio",
                  body: "A real narrated ~5-minute pregame session — breathing, visualization, cue word, and send-off. Built for earbuds in the locker room.",
                },
                {
                  icon: "target" as const,
                  title: "Pre-practice lock-in",
                  body: "A short mental warm-up before every practice, not just game days. One focus cue, full-effort frame.",
                },
                {
                  icon: "book" as const,
                  title: "Journey view",
                  body: "A 30-day map showing progress through the training cycle. Clear, forward-moving, no shame on missed days.",
                },
                {
                  icon: "wind" as const,
                  title: "Rhythm visualization",
                  body: "Your athlete sees their training rhythm — days active, returns after gaps — framed as consistency, never as a streak to protect.",
                },
                {
                  icon: "shield" as const,
                  title: "Parent dashboard",
                  body: "Rhythm data and session counts for the parent. Never private reflection content. Privacy is the design.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="bg-onyx border border-hairline rounded-lg p-7 transition-colors duration-base ease-out hover:border-hairline-strong h-full"
                >
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
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Minor-data promises ──────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="02" label="Your athlete's data" />
          </Reveal>
          <Reveal>
            <div className="grid gap-12 lg:gap-16 items-start grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="fv-h-section mb-6 max-w-[22ch]">
                  Minimum data. No tracking. No ads.
                </h2>
                <p className="fv-lede mb-8 max-w-[52ch]">
                  We built From Victory for athletes 13–21. That means we take
                  their data seriously. Here is what we collect, and what we do
                  not.
                </p>
                <div className="flex flex-col gap-5">
                  {[
                    {
                      collected: true,
                      label: "First name",
                      note: "To address your athlete in the app.",
                    },
                    {
                      collected: true,
                      label: "Birthdate",
                      note: "To confirm 13+ age floor and apply protections for minors.",
                    },
                    {
                      collected: true,
                      label: "Session participation",
                      note: "Dates of completed sessions — shown on your parent dashboard as rhythm data.",
                    },
                    {
                      collected: false,
                      label: "Email address (athlete)",
                      note: "Not collected. Only the parent account has an email.",
                    },
                    {
                      collected: false,
                      label: "Phone number",
                      note: "Not collected.",
                    },
                    {
                      collected: false,
                      label: "Behavioral analytics / tracking",
                      note: "Not used on any account.",
                    },
                    {
                      collected: false,
                      label: "Data sold to third parties",
                      note: "Never. Not for any age.",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-start gap-4 pb-5 border-b border-hairline last:border-0 last:pb-0"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-none mt-0.5 ${
                          row.collected
                            ? "text-gold"
                            : "text-cream/40"
                        }`}
                        style={
                          row.collected
                            ? { background: "var(--fv-gold-soft)" }
                            : { background: "rgba(247,247,247,0.05)" }
                        }
                      >
                        {row.collected ? (
                          <SvgIcon name="check" size={9} />
                        ) : (
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 12 12"
                            fill="none"
                            aria-hidden
                          >
                            <path
                              d="M2 2l8 8M10 2L2 10"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div
                          className={`font-heading font-semibold text-[15px] mb-0.5 ${
                            row.collected ? "text-cream" : "text-cream/50"
                          }`}
                        >
                          {row.label}
                        </div>
                        <div className="font-body text-[13px] text-cream/50 leading-[1.5]">
                          {row.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div
                  className="rounded-[20px] px-7 py-7"
                  style={{
                    background:
                      "linear-gradient(180deg,rgba(223,175,55,0.07),rgba(223,175,55,0)),var(--bg-elev-1)",
                    border: "1px solid rgba(223,175,55,0.22)",
                  }}
                >
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-3">
                    Deletion policy
                  </div>
                  <p className="font-body text-[14px] text-cream/70 leading-[1.55] m-0">
                    Parents control deletion. Requesting account deletion
                    triggers a cascading delete of all athlete data within
                    30 days.
                  </p>
                </div>

                <div
                  className="rounded-[20px] px-7 py-7"
                  style={{
                    background: "var(--bg-elev-1)",
                    border: "1px solid var(--fv-hairline)",
                  }}
                >
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-cream/50 font-semibold mb-3">
                    Not a health service
                  </div>
                  <p className="font-body text-[14px] text-cream/70 leading-[1.55] m-0">
                    From Victory is a mindset training app, not a mental health
                    service. The app does not provide therapy, clinical care, or
                    crisis intervention. It is a daily faith and mental skills
                    practice.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link
                    href="/privacy"
                    className="font-body text-[13.5px] text-cream/60 hover:text-cream underline underline-offset-2 transition-colors duration-fast ease-out"
                  >
                    Privacy Policy
                  </Link>
                  <span className="text-cream/20" aria-hidden>
                    ·
                  </span>
                  <Link
                    href="/terms"
                    className="font-body text-[13.5px] text-cream/60 hover:text-cream underline underline-offset-2 transition-colors duration-fast ease-out"
                  >
                    Terms of Use
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-t border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="03" label="Common questions" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-20 gap-y-0 grid-cols-1 lg:grid-cols-[0.4fr_0.6fr]">
              <h2 className="fv-h-section mb-12 lg:mb-0 max-w-[16ch]">
                Questions parents ask.
              </h2>
              <div className="flex flex-col divide-y divide-hairline">
                {faq.map((item) => (
                  <div key={item.q} className="py-7">
                    <h3 className="font-heading font-semibold text-[17px] leading-[1.3] text-cream tracking-[-0.005em] mb-3">
                      {item.q}
                    </h3>
                    <p className="font-body text-[14.5px] leading-[1.6] text-cream/70 m-0">
                      {item.a}
                    </p>
                  </div>
                ))}
                {/* Cross-link to full FAQ on home page */}
                <div className="pt-7">
                  <p className="font-body text-[13.5px] text-cream/50 m-0">
                    More questions about privacy, faith, and how the app works?{" "}
                    <Link
                      href="/#faq"
                      className="text-cream/70 hover:text-cream underline underline-offset-2 transition-colors duration-fast ease-out"
                    >
                      See the full FAQ
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
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
            <h2 className="fv-final-headline max-w-[18ch] mx-auto">
              Start training from <em>secure identity.</em>
            </h2>
            <p className="fv-lede max-w-[44ch] mx-auto mb-8">
              14 days free, then $5/mo or $49/yr. Your athlete trains.
              You see the rhythm.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-8 py-[20px] text-[17px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
            >
              Start your athlete&apos;s 14-day free trial
              <SvgIcon name="arrow" size={17} />
            </Link>
            <p className="mt-4 font-mono text-[11px] tracking-[0.16em] uppercase text-cream/35 font-semibold">
              Cancel anytime &middot; No commitment
            </p>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
