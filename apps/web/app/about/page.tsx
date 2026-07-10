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
  alternates: { canonical: "/about" },
  title: "About",
  description:
    "From Victory is a daily mental toughness training app for Christian athletes — built on the conviction that identity precedes performance, and that athletes compete from Christ's victory, not toward one they're trying to earn.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/about`,
    siteName: "From Victory",
    title: "About · From Victory",
    description:
      "Daily mental toughness training for Christian athletes, rooted in the truth that identity precedes performance. Built by a hockey dad.",
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
    title: "About · From Victory",
    description:
      "Daily mental toughness training for Christian athletes, rooted in the truth that identity precedes performance. Built by a hockey dad.",
    images: [`${siteUrl}/from-victory-social-preview.jpg`],
  },
};

// ── §3 What It Is — cards ─────────────────────────────────────────────────
const whatItIsCards = [
  {
    icon: "flame" as const,
    title: "A daily session",
    body: "A short daily training session — one mental skill plus a Scripture foundation — that builds identity, discipline, and resilience over 30 days. About five minutes. Built to be picked up, used, and put down. Not another feed.",
  },
  {
    icon: "zap" as const,
    title: "Game-day and practice-day tools",
    body: "An optional pregame guided audio session — breathing, focus, a plan for the hard moment, a send-off — plus a short pre-practice lock-in. Built for earbuds in the locker room.",
  },
  {
    icon: "user" as const,
    title: "For parents and adult athletes.",
    body: "A parent creates and manages a younger athlete’s account, or an adult athlete signs up to train on their own. Either way, the training stays private. We’re launching with hockey and basketball, with more sports coming sport by sport.",
  },
];

// ── §5 What It Is Not — points ────────────────────────────────────────────
const whatItIsNotPoints = [
  {
    title: "Not therapy or a mental-health service.",
    body: "From Victory is mental toughness and mindset training — like strength work for the inner game. It is not therapy, treatment, or clinical care, and it doesn’t claim to be. It’s built to sit alongside the people who already support your athlete: you, their coaches, their pastor. If your athlete needs clinical help, that’s a conversation for a licensed professional.",
  },
  {
    title: "Not a devotional with sports language bolted on.",
    body: "The order matters to us. Faith is the foundation the training is built on — not a verse added at the end to make a workout sound spiritual. Your athlete enters daily training grounded in Scripture, not a devotional dressed up in jerseys.",
  },
  {
    title: "Not another app fighting for screen time.",
    body: "No leaderboards. No comparing your athlete to anyone else. No streak guilt when they miss a day. We measure rhythm, not pressure — and an athlete who returns after a gap is met with encouragement, not a broken streak.",
  },
];

// ── §6 Promise to parents — checks ───────────────────────────────────────
const parentPromise = [
  {
    title: "A private training space.",
    body: "What happens inside a session stays your athlete’s — the focus they pick, the moment they work through, the prayer they bring. Not because we’re hiding it from you, but because athletes go deeper when the space is truly their own. On a parent-managed account, your dashboard shows their rhythm and participation — never the contents of a session.",
  },
  {
    title: "The minimum data, on minors.",
    body: "For account setup we collect your athlete’s first name and birthdate. No email, no phone number, no address, no photos. We confirm age at creation — there’s no account for anyone under 13.",
  },
  {
    title: "No ads. No tracking. Ever.",
    body: "For every athlete 13 to 17, minor protections are on by default: no advertising, no behavioral analytics, no third-party tracking. We don’t sell data.",
  },
  {
    title: "Encouragement, not punishment.",
    body: "No leaderboards, no comparison to other athletes, no shame for a missed day. We visualize rhythm — and when your athlete comes back after a gap, the app meets them with encouragement.",
  },
  {
    title: "You stay in control.",
    body: "On a parent-managed account, the parent sets up and manages everything, including billing, and can request deletion of all your athlete’s data at any time — we complete it within 30 days.",
  },
];

export default function AboutPage() {
  return (
    <>
      <LandingIconDefs />
      <ScrollNav />

      {/* ── §1 Hero ───────────────────────────────────────────────────── */}
      <section className="relative pt-[168px] md:pt-[140px] pb-24 overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 fv-hero-bg" />
        </div>
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <div className="inline-flex items-center gap-3 mb-7">
              <span className="fv-pulse-dot" />
              <span className="fv-eyebrow">About From Victory</span>
            </div>
            <h1 className="fv-h-hero mb-[26px] max-w-[18ch]">
              Why From Victory?
            </h1>
            <p className="font-heading font-semibold text-[clamp(18px,1.6vw,22px)] text-cream mb-7 max-w-[40ch] leading-[1.4]">
              Because Christ has already secured the victory.
            </p>

            {/* 1 Corinthians 15:57 callout */}
            <div
              className="fv-faith-callout border border-hairline rounded-[20px] px-8 sm:px-9 py-7 max-w-[540px] mb-8"
            >
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-3.5">
                1 Corinthians 15:57
              </div>
              <div className="font-scripture italic text-[clamp(17px,1.8vw,22px)] leading-[1.5] text-cream text-pretty">
                &ldquo;But thanks be to God! He gives us the victory through our
                Lord Jesus Christ.&rdquo;
              </div>
            </div>

            <p className="max-w-[54ch] mb-5 text-cream/70 text-[clamp(15px,1.3vw,18px)] leading-[1.6]">
              That is the foundation of From Victory. Athletes do not compete to
              earn their worth, prove their identity, or win God&apos;s approval.
              In Christ, the deepest victory has already been given.
            </p>
            <p className="font-heading font-semibold text-cream text-[clamp(16px,1.4vw,19px)] mb-5">
              So we train from there.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 mb-9 text-cream/80 font-body text-[15px]">
              <span>With discipline.</span>
              <span>With confidence.</span>
              <span>With peace.</span>
              <span>With purpose.</span>
            </div>
            <p className="font-scripture italic text-[clamp(16px,1.4vw,19px)] text-cream/70 mb-9">
              Your Identity Is Secure. Compete From Victory.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── §2 Our Story ──────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="01" label="Our story · Built by a hockey dad" />
          </Reveal>
          <Reveal>
            <div className="max-w-[620px] mt-10">
              <div className="flex flex-col gap-[1.4em] font-body text-[clamp(15px,1.25vw,17px)] leading-[1.7] text-cream/80">
                <p>
                  I&apos;m a hockey dad. I&apos;ve sat in enough rinks to watch
                  what pressure does to young athletes — how quietly they start
                  tying their worth to the last shift, the depth chart, the
                  scoreboard.
                </p>
                <p>But I&apos;ve also seen something else.</p>
                <p>
                  It is not only athletes who can get wrapped up in performance.
                  Parents can, too. A child&apos;s game can start to feel like a
                  verdict. Their playing time, their role, their mistakes, their
                  success — all of it can quietly become heavier than it was ever
                  meant to be.
                </p>
                <p>That is part of what opened my eyes.</p>
                <p>
                  Sports are a good thing. A beautiful thing. They teach
                  discipline, courage, teamwork, sacrifice, resilience,
                  leadership, and joy. But good things can become ultimate
                  things. And when sports become ultimate, they start asking
                  athletes and families to carry a weight only God was meant to
                  carry.
                </p>
                <p>
                  I built From Victory for my own kids, and for athletes like
                  them: so they would learn to compete from a settled identity
                  instead of chasing one. Not to win their value. To play from
                  value already given.
                </p>
                <p>
                  As I kept learning, reading, and watching athletes compete,
                  another gap became obvious. Young athletes hear a lot about
                  grit, confidence, visualization, toughness, and mindset. But
                  when they are sitting in the locker room, walking into
                  practice, getting ready for a game, or trying to recover from
                  a hard moment, they often do not have a simple, trustworthy
                  resource they can actually use.
                </p>
                <p>And for Christian athletes, there is an even deeper question.</p>
                <p>
                  A lot of mindset training puts the self in the control seat:
                  control your thoughts, control your emotions, control the
                  outcome. There is wisdom in learning how to focus, reset,
                  prepare, and respond. But Christians are not left to rely on
                  themselves alone. We have a stronger foundation. We rely on
                  God.
                </p>
                <p>That is how From Victory was born.</p>
                <p>
                  It combines practical mental training with Scripture, helping
                  athletes prepare for pressure, reset after hard moments, and
                  compete from the victory Christ has already secured.
                </p>
                <p>
                  This is not a side project that mentions faith. It is a
                  training tool built on it. We are still early, and we are
                  building it the way I would want it built for my own kids:
                  serious, honest, useful, and never wasting an athlete&apos;s
                  time.
                </p>
              </div>

              <p className="font-scripture italic text-[clamp(16px,1.4vw,19px)] text-cream/70 mt-10">
                Rooted in the Word. Fueled by the Spirit. Built for Victory.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── §3 What It Is ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="02" label="What it is" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                A daily training app for the mind and spirit of the Christian
                athlete.
              </h2>
              <p className="fv-lede">
                From Victory is built on one ordering that shapes everything:
                it&apos;s a mental toughness training app with faith as the
                foundation — not a devotional with sports language added on top.
                The athlete opens &ldquo;today&apos;s training,&rdquo; not
                &ldquo;today&apos;s devotional.&rdquo; Scripture is the ground
                it stands on, not the wrapper around it.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {whatItIsCards.map((item) => (
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

      {/* ── §4 What We Believe ────────────────────────────────────────── */}
      <section className="fv-faith-bg py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <div className="max-w-[760px]">
              <div className="mb-8">
                <FlameMark size={48} />
              </div>
              <SectionMeta num="03" label="What we believe" />
              <h2 className="fv-h-section mb-6 max-w-[22ch]">
                The race is already won. We train from there.
              </h2>
              <p className="fv-lede mb-5 max-w-[54ch]">
                From Victory is rooted in historic Christian faith,
                nondenominational in approach, and built on the truth of
                Scripture.
              </p>
              <p className="fv-lede mb-5 max-w-[54ch]">
                We use the NIV and apply God&apos;s Word to the real life of
                athletes: pressure, fear, failure, comparison, discipline,
                identity, and the desire to prove yourself through performance.
              </p>
              <p className="fv-lede mb-8 max-w-[54ch]">
                The message underneath everything we create is simple: an
                athlete&apos;s worth is secure in Christ. It is received as a
                gift, not earned on the scoreboard.
              </p>
              <div className="fv-faith-callout border border-hairline rounded-[20px] px-8 sm:px-9 py-8 max-w-[560px] mb-7">
                <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-3.5">
                  Hebrews 12:1–2
                </div>
                <div className="font-scripture italic text-[clamp(18px,2vw,24px)] leading-[1.5] text-cream text-pretty">
                  &ldquo;Let us run with perseverance the race marked out for
                  us, fixing our eyes on Jesus, the pioneer and perfecter of
                  faith.&rdquo;
                </div>
              </div>
              <p className="font-body text-[15px] leading-[1.6] text-cream/70 mb-6 max-w-[54ch]">
                We run the race God marked out for us, eyes on the One who
                already ran his. We compete from that finished work — not toward
                a victory we&apos;re trying to earn.
              </p>
              <Link
                href="/#faith"
                className="inline-flex items-center gap-2 font-body text-[14px] text-gold hover:text-gold-bright transition-colors duration-fast ease-out no-underline"
              >
                See the faith foundation
                <SvgIcon name="arrow" size={14} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── §5 What It Is Not ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="04" label="What it is not" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                Clear about what we are.{" "}
                <span className="text-cream/50">
                  Just as clear about what we&apos;re not.
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-b border-hairline">
            {whatItIsNotPoints.map((item, i) => (
              <Reveal key={item.title}>
                <div
                  className={`px-7 py-9 transition-colors duration-base ease-out hover:bg-onyx ${
                    i < whatItIsNotPoints.length - 1
                      ? "sm:border-r border-hairline max-sm:border-b max-sm:border-hairline"
                      : ""
                  }`}
                >
                  <h3 className="font-heading font-semibold text-[19px] tracking-[-0.01em] text-cream mb-3">
                    {item.title}
                  </h3>
                  <p className="font-body text-[14px] leading-[1.6] text-cream/70 m-0">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── §6 Our Promise to Parents ─────────────────────────────────── */}
      <section className="py-20 sm:py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionMeta num="05" label="Our promise to parents" />
          </Reveal>
          <Reveal>
            <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <h2 className="fv-h-section">
                Your athlete&apos;s space is genuinely theirs.
              </h2>
              <p className="fv-lede">
                You&apos;re trusting us with your athlete. Here&apos;s how we
                hold that trust — not as fine print, but as how the product is
                built. An adult athlete who signs up on their own gets the same
                private training space and protections, managed by them.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <ul className="flex flex-col gap-5 m-0 p-0 list-none max-w-[720px]">
              {parentPromise.map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gold flex-none mt-0.5"
                    style={{
                      background: "var(--fv-gold-soft)",
                      border: "1px solid rgba(223,175,55,0.28)",
                    }}
                  >
                    <SvgIcon name="check" size={11} />
                  </div>
                  <div>
                    <span className="font-heading font-semibold text-[15px] text-cream">
                      {item.title}
                    </span>{" "}
                    <span className="font-body text-[14.5px] leading-[1.6] text-cream/70">
                      {item.body}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── §7 Close ──────────────────────────────────────────────────── */}
      <section className="fv-faith-bg py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <div className="max-w-[640px]">
              <h2 className="fv-h-section mb-6">
                Start training from a secure identity.
              </h2>
              <p className="fv-lede mb-5">
                From Victory is for the athlete who&apos;s done tying their
                worth to the scoreboard — and for the parent who wants to hand
                them something real. We&apos;re building it carefully, for the
                long run. We&apos;d be glad to have you with us.
              </p>
              <p className="font-scripture italic text-[clamp(16px,1.4vw,19px)] text-cream/70 mb-10">
                Your Identity Is Secure. Compete From Victory.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/#waitlist"
                  className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
                >
                  Join the waitlist
                  <SvgIcon name="arrow" size={16} />
                </Link>
                <Link
                  href="/parents"
                  className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-charcoal active:scale-[0.97]"
                >
                  For parents
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
