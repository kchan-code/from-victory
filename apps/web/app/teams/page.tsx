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
  title: "For Teams & Churches · From Victory",
  description:
    "Bring From Victory to your club, team, FCA chapter, or church youth group. Volume pricing via invoice — families redeem codes and onboard privately. No coach dashboards. No roster data.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/teams`,
    siteName: "From Victory",
    title: "For Teams & Churches · From Victory",
    description:
      "Volume pricing for clubs, teams, FCA chapters, and church youth groups. Families get access; athletes train privately. No roster data, no coach dashboards.",
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
    title: "For Teams & Churches · From Victory",
    description:
      "Volume pricing for clubs, teams, FCA chapters, and church youth groups. Families get access; athletes train privately. No roster data, no coach dashboards.",
    images: [`${siteUrl}/from-victory-social-preview.jpg`],
  },
};

// ── How it works steps ────────────────────────────────────────────────────
const howItWorks = [
  {
    num: "01",
    title: "Request volume pricing",
    body: "Tell us how many athletes you want to cover. We send you an invoice — no self-serve checkout required.",
  },
  {
    num: "02",
    title: "Receive redemption codes",
    body: "You get a set of single-use codes to distribute — one per family. You are handing out access, not managing accounts.",
  },
  {
    num: "03",
    title: "Families onboard independently",
    body: "Each parent redeems a code and creates their own account. From that point on, the family owns their setup, their data, and their athlete's privacy.",
  },
  {
    num: "04",
    title: "Athletes train privately",
    body: "Every athlete trains in their own account. You see nothing — no roster, no activity feed, no individual progress. That's not a limitation. It's the architecture.",
  },
];

// ── Who this is for ──────────────────────────────────────────────────────
const audiences = [
  {
    icon: "zap" as const,
    label: "Club & AAA teams · Coaches",
    heading: "Give your players a mental-skills edge without taking on their data.",
    body: "You invest in skating coaches, strength programs, and video review. Mental toughness is the layer that holds all of it together. From Victory gives athletes a daily practice for identity, focus, and resilience — without you ever touching a single athlete's account or training record. You hand out codes. They train.",
    note: "No roster. No coach dashboard. No liability for athlete data.",
  },
  {
    icon: "anchor" as const,
    label: "FCA chapters · Team chaplains",
    heading: "Faith-grounded mental skills training — daily, not just Thursdays.",
    body: "A huddle happens once a week. The hard moments — the cut, the slump, the pressure game — happen every day. From Victory puts a daily mental and spiritual practice in your athletes' hands that runs between your meetings, not instead of them. Scripture foundation, mental skill, pregame preparation. Built for serious athletes.",
    note: "Non-denominational Protestant. NIV. Not a devotional app with sports language.",
  },
  {
    icon: "book" as const,
    label: "Church youth groups · Youth pastors",
    heading: "30 families, zero data liability on your end.",
    body: "Offer this as a resource through your student ministry without becoming a data custodian for every athlete in your group. Each family creates their own account through their redemption code. Their athlete's training data — what they reflect on, what they name as a hard moment — stays entirely between them and the app. You gave them the tool. You don't hold their information.",
    note: "Parents create accounts. Athletes train privately. No church database involved.",
  },
];

// ── What athletes actually get ────────────────────────────────────────────
const athleteGets = [
  {
    icon: "flame" as const,
    title: "Daily training session",
    body: "30 days of sport-specific content — mental skill plus Scripture foundation — for hockey and basketball. Builds identity, discipline, and resilience session by session.",
  },
  {
    icon: "zap" as const,
    title: "Pregame guided audio",
    body: "A ~5-minute guided audio session before a game: breathing, visualization, a plan for the hard moment, and a send-off. Built for the locker room, earbuds in.",
  },
  {
    icon: "target" as const,
    title: "Pre-practice lock-in",
    body: "A short mental warm-up before every practice — not just game days. One focus cue, full-effort frame, reset mindset.",
  },
  {
    icon: "wind" as const,
    title: "Rhythm visualization",
    body: "Athletes see their training participation as a rhythm — not a streak counter. Returning after a gap is encouraged, never shamed.",
  },
];

// ── Privacy model explanation ─────────────────────────────────────────────
const privacyPoints = [
  {
    heading: "You distribute access. You don't see training.",
    body: "Redemption codes give families a door in. Once they create their account, everything that happens inside it belongs to them — not to you, not to us.",
  },
  {
    heading: "No coach view. By design, not by accident.",
    body: "There is no coach dashboard. There is no 'view team activity' screen. The architecture does not support reading another athlete's session, and it never will.",
  },
  {
    heading: "Athlete-first data model, full stop.",
    body: "Each athlete account holds only a first name and birthdate. No email, no phone number, no behavioral analytics. Data belongs to the family. Deletion cascades completely within 30 days of request.",
  },
];

export default function TeamsPage() {
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
              <span className="fv-eyebrow">For Teams &amp; Churches</span>
            </div>
            <h1 className="fv-h-hero mb-[26px] max-w-[22ch]">
              Give 30 families access.{" "}
              <em>Take on zero of their data.</em>
            </h1>
            <p className="max-w-[52ch] mb-9 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              Volume pricing for clubs, AAA teams, FCA chapters, and church
              youth groups. You pay the invoice, distribute redemption codes,
              and step back. Families onboard independently. Athletes train
              privately. No roster. No coach dashboard. No liability for their
              data.
            </p>
            <div className="flex flex-wrap gap-3">
              {/*
               * TODO FV-249: when hello@ email routing is live, replace the
               * /#waitlist href with a mailto:hello@fromvictoryapp.com link
               * (or a dedicated /teams/contact form). Until then, the waitlist
               * form's "Coach" role option captures this intent cleanly without
               * risking a bounce on an unrouted address.
               */}
              <a
                href="/#waitlist"
                className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
              >
                Request team pricing
                <SvgIcon name="arrow" size={16} />
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-charcoal active:scale-[0.97]"
              >
                See individual pricing
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] tracking-[0.16em] uppercase text-cream/35 font-semibold">
              Select &ldquo;Coach&rdquo; role on the form &rarr; we&apos;ll follow up with volume options
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── The privacy pitch — the actual differentiator ─────────────── */}
      <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="01" label="No data liability" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                You give out access.{" "}
                <span className="text-cream/50">You don&apos;t hold their training.</span>
              </h2>
              <p className="fv-lede">
                Most team-focused tools make you the data custodian for every
                athlete in your program. From Victory works the other way: you
                purchase seats and distribute codes, then the families own
                everything from there — accounts, data, deletion.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-b border-hairline">
            {privacyPoints.map((item, i) => (
              <Reveal key={item.heading}>
                <div
                  className={`px-7 py-9 transition-colors duration-base ease-out hover:bg-onyx ${
                    i < privacyPoints.length - 1
                      ? "sm:border-r border-hairline max-sm:border-b max-sm:border-hairline"
                      : ""
                  }`}
                >
                  <h3 className="font-heading font-semibold text-[20px] tracking-[-0.01em] text-cream mb-2.5 leading-[1.2]">
                    {item.heading}
                  </h3>
                  <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Privacy callout — mirrors /parents pattern */}
          <Reveal>
            <div
              className="mt-10 rounded-[20px] px-8 py-8 max-w-[640px]"
              style={{
                background:
                  "linear-gradient(180deg,rgba(223,175,55,0.06),rgba(223,175,55,0)),var(--bg-elev-2)",
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
                    How athlete data actually works
                  </div>
                  <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                    Each athlete account holds only a first name and birthdate.
                    No email address. No phone number. No photos. No behavioral
                    analytics. The purchasing organization — your team, chapter,
                    or church — has no access to any of it. Full deletion on
                    parent request within 30 days.
                  </p>
                  <p className="font-body text-[13px] leading-[1.55] text-cream/55 mt-3 m-0">
                    From Victory is a mindset training app, not a mental health
                    service. It does not provide therapy, clinical care, or
                    crisis intervention.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Who this is for: three audiences ─────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="02" label="Who this is built for" />
          </Reveal>
          <Reveal>
            <div className="mb-14">
              <h2 className="fv-h-section wide">
                Three groups. One shared premise.
              </h2>
              <p className="fv-lede max-w-[52ch]">
                The tool is the same. What you bring to it is different. Here
                is how it fits each context.
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
                      <p className="font-body text-[15px] leading-[1.6] text-cream/70 mb-5 m-0 max-w-[64ch]">
                        {aud.body}
                      </p>
                      <div
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md"
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
            <SectionMeta num="03" label="How it works" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                Invoice. Codes. Done.
              </h2>
              <p className="fv-lede">
                We keep this simple on purpose. No team portal to manage, no
                admin dashboard to maintain, no ongoing roster updates from you.
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
                  Volume pricing
                </div>
                <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
                  Team and group pricing is not self-serve yet — we size each
                  arrangement individually. There are no published per-seat
                  numbers here on purpose: the right structure depends on your
                  group size and context. Use the form below to start a
                  conversation.
                </p>
              </div>
              <a
                href="/#waitlist"
                className="flex-none inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-6 py-[16px] text-[15px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] whitespace-nowrap"
              >
                Request pricing
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
            <SectionMeta num="04" label="What athletes get" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                The same training every individual subscriber gets.
              </h2>
              <p className="fv-lede">
                No feature differences between a direct subscription and a team
                code. Every athlete has full access. The only difference is how
                the subscription was funded.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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

          <Reveal>
            <p className="mt-8 font-body text-[14px] text-cream/40 max-w-[52ch]">
              Hockey and basketball are live at launch. More sports are in
              development.{" "}
              <Link
                href="/pricing"
                className="text-cream/60 hover:text-cream underline underline-offset-2 transition-colors duration-fast ease-out"
              >
                See individual pricing details.
              </Link>
            </p>
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
              <SectionMeta num="05" label="Faith foundation" />
              <h2 className="fv-h-section mb-6 max-w-[22ch]">
                Mental toughness training — with the Word underneath.
              </h2>
              <p className="fv-lede mb-8 max-w-[52ch]">
                From Victory is not a devotional app with sports language added.
                It is a mental toughness training app with faith as the
                foundation. Every session starts from the truth that an
                athlete&apos;s identity in Christ is already secure — then
                trains from there. Non-denominational Protestant. NIV. Built to
                work alongside your program, not compete with it.
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

      {/* ── CTA strip ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="fv-final-bg absolute inset-0 pointer-events-none" />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 text-center">
          <Reveal>
            <div className="mx-auto mb-6 inline-block">
              <FlameMark size={48} />
            </div>
            <h2 className="fv-final-headline max-w-[22ch] mx-auto">
              Ready to bring this to your{" "}
              <em>team or community?</em>
            </h2>
            <p className="fv-lede max-w-[46ch] mx-auto mb-8">
              Fill out the waitlist form and select the Coach role. We&apos;ll
              follow up with volume pricing options sized for your group.
            </p>
            {/*
             * TODO FV-249: swap this href for mailto:hello@fromvictoryapp.com
             * (or a /teams/contact route) once hello@ email routing is live.
             * For now the Coach role on the waitlist form captures org intent.
             */}
            <a
              href="/#waitlist"
              className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-8 py-[20px] text-[17px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
            >
              Request team pricing
              <SvgIcon name="arrow" size={17} />
            </a>
            <p className="mt-4 font-mono text-[11px] tracking-[0.16em] uppercase text-cream/35 font-semibold">
              Select &ldquo;Coach&rdquo; role &rarr; we&apos;ll follow up with options
            </p>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
