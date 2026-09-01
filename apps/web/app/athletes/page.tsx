import type { Metadata } from "next";
import Link from "next/link";
import { LandingIconDefs } from "@/components/landing/icons";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { SectionMeta } from "@/components/landing/SectionMeta";
import { SvgIcon } from "@/components/landing/SvgIcon";
import { SamplePlayer } from "@/components/landing/SamplePlayer";
import { ShareWithParent } from "@/components/athletes/ShareWithParent";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { ATHLETES_H1 } from "@/lib/gtm/page-titles";
import { isAdultSignupEnabled } from "@/lib/flags";

// FV-545 — the athlete-facing wisdom page (KC-approved design v3,
// 2026-09-01). NOT a homepage-style feature page: the homepage sells the
// product by feature; this page organizes practical guidance by the moment
// the athlete needs it (before / the rep / afterward / carry), with each
// block a condensed extract from a shipped athlete article, linking to the
// full piece. Copy is locked from the approved mock; extracts were
// verified against their source articles (lib/resources/articles.ts)
// before this shipped and are drift-pinned in __tests__/athletes-page.
// Bound by docs/content-evidence-standards.md and the sport-neutral rule:
// no whistle/tonight/final-horn/bad-night vocabulary, sport examples
// labeled as examples with 2+ sports. Fonts come only from the layout's
// next/font pipeline via Tailwind font-* classes; brand marks only from
// the shipped ScrollNav/Footer assets (KC directive 2026-09-01).

const siteUrl = "https://www.fromvictoryapp.com";

export const metadata: Metadata = {
  alternates: { canonical: "/athletes" },
  title: "For the Athlete",
  description:
    "Mental reps for the moments that test you: steady yourself before competition, hold focus under pressure, recover after a result you want back. Rooted in identity in Christ.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/athletes`,
    siteName: "From Victory",
    title: "For the Athlete · From Victory",
    description:
      "The mental game, moment by moment. Practical guidance for athletes before, during, and after competition, grounded in secure identity in Christ.",
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
    title: "For the Athlete · From Victory",
    description:
      "The mental game, moment by moment. Practical guidance for athletes before, during, and after competition, grounded in secure identity in Christ.",
    images: [`${siteUrl}/from-victory-social-preview.jpg`],
  },
};

// ── The labeled sample — the flagship hockey forward arrival clip. This is
// genuinely the forward first-shift visualization ("your line is called…
// you hop the boards"), so the label describes the actual clip. Distinct
// from the homepage sample (opener-reset), which is a sport-agnostic
// session opener and carries no sport/position label.
const ATHLETE_SAMPLE_SRC = "/audio/pregame/clips/viz-forward.9e8d7eb1.mp3";
const ATHLETE_SAMPLE_DURATION_SEC = 109.362;

// ── Moment blocks — condensed extracts from the shipped athlete articles.
// Each block's `steps` are the three practical actions KC locked; `href`
// is the full article the block condenses; `linkLead` + the article's
// published title form the source link line.

const jumpChips = [
  { href: "#before", label: "Before you compete" },
  { href: "#rep", label: "The mental rep" },
  { href: "#after", label: "Afterward" },
  { href: "#carry", label: "Verses to carry" },
  { href: "#train", label: "Train it" },
];

interface MomentStep {
  title: string;
  body: string;
}

const beforeSteps: MomentStep[] = [
  {
    title: "Breathe",
    body: "Four counts in, six counts out, twice. A longer exhale can help your body settle. Start there.",
  },
  {
    title: "Remember what is true",
    body: "Your worst performance does not lower your standing with God. Your best does not raise it. Loved before you compete, loved after the result.",
  },
  {
    title: "Choose your cue and pray",
    body: "Pick one word that pulls you back to center, and keep the cue short enough to use under pressure. Then hand the result over in prayer and go.",
  },
];

const repSteps: MomentStep[] = [
  {
    title: "Make it real",
    body: "What you would see and hear, how your body would feel, the emotion of the moment, and the action you intend to take, tuned to your sport and role.",
  },
  {
    title: "Rehearse a plan, not a highlight reel",
    body: "A possible opening action you can carry into live competition. For example: a point guard organizing the first possession, a striker taking the first touch under pressure. You are rehearsing what you will bring to the moment, not pre-experiencing it.",
  },
  {
    title: "Rehearse the response after disruption",
    body: "Picture the disruption briefly, then rehearse the response and the next action. The point of the rep is the response.",
  },
];

const afterSteps: MomentStep[] = [
  {
    title: "Name what happened",
    body: "Not “I’m trash.” Be specific, in your sport’s terms. For example: a forced pass through traffic, a lost mark on a set piece, a rushed tee shot. Real, reviewable information.",
  },
  {
    title: "Take one lesson",
    body: "The single adjustment for next time. One. Write it down.",
  },
  {
    title: "Return to the next rep",
    body: "Take the lesson. Then return to the next rep. Your standing with God was settled before the result, and it is still settled after it.",
  },
];

// ── Verses — NIV excerpts (shortened quotations, labeled as excerpts, never
// described as full verbatim verses).
const verses = [
  {
    ref: "Hebrews 12:1–2",
    kind: "NIV excerpt · The anchor",
    quote:
      "“Let us run with perseverance the race marked out for us, fixing our eyes on Jesus.”",
    gloss:
      "You compete from his completed work, not toward a victory you have to earn. Start here.",
  },
  {
    ref: "Isaiah 41:10",
    kind: "NIV excerpt · For the nerves",
    quote:
      "“So do not fear, for I am with you; do not be dismayed, for I am your God.”",
    gloss:
      "“Do not fear” does not mean you stop feeling nervous. It means you are not alone in the moment.",
  },
  {
    ref: "Lamentations 3:22–23",
    kind: "NIV excerpt · For after",
    quote:
      "“His compassions never fail. They are new every morning; great is your faithfulness.”",
    gloss:
      "However it goes, His mercy meets you again tomorrow, fresh because His faithfulness did not move with the result.",
  },
];

function MomentSteps({ steps }: { steps: MomentStep[] }) {
  return (
    <ol className="list-none m-0 p-0 border-t border-hairline">
      {steps.map((step, i) => (
        <li
          key={step.title}
          className="flex gap-5 sm:gap-6 py-5 border-b border-hairline"
        >
          <span
            className="font-display font-extrabold text-[15px] tracking-[0.08em] text-gold flex-none w-8 pt-0.5"
            aria-hidden="true"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>
            <span className="block font-heading font-semibold text-[15.5px] text-cream mb-1">
              {step.title}
            </span>
            <p className="font-body text-[14px] leading-[1.55] text-cream/70 m-0">
              {step.body}
            </p>
          </span>
        </li>
      ))}
    </ol>
  );
}

function SourceLink({ lead, href, title }: { lead: string; href: string; title: string }) {
  return (
    <p className="mt-6 font-body text-[14.5px] text-cream/70">
      {lead}{" "}
      <Link
        href={href}
        className="text-gold underline underline-offset-2 hover:text-gold-bright transition-colors duration-fast"
      >
        {title} →
      </Link>
    </p>
  );
}

export default function AthletesPage() {
  const adultSignup = isAdultSignupEnabled();

  return (
    <>
      <AttributionCapture />
      <LandingIconDefs />
      <ScrollNav />

      <main id="main-content">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative pt-[168px] md:pt-[140px] pb-14 overflow-hidden isolate">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 fv-hero-bg" />
          </div>
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <div className="inline-flex items-center gap-3 mb-7">
                <span className="fv-pulse-dot" />
                <span className="fv-eyebrow">For the Athlete</span>
              </div>
              <h1 className="fv-h-hero mb-[26px] max-w-[16ch]">{ATHLETES_H1}</h1>
              <p className="max-w-[58ch] mb-9 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
                How to steady yourself before competition, hold your focus
                under pressure, and recover after a result you want back.
                Daily training builds the foundation. A guided five-minute
                pregame session calls it up on game day.
              </p>
              {/* Jump chips — the page is organized by moment; land and go
                  to the moment you are in. */}
              <nav aria-label="Page sections" className="flex flex-wrap gap-2.5">
                {jumpChips.map((chip) => (
                  <a
                    key={chip.href}
                    href={chip.href}
                    className="font-mono text-[11px] tracking-[0.14em] uppercase text-cream/70 no-underline border border-hairline-strong rounded-pill px-4 py-2.5 min-h-[44px] inline-flex items-center transition-colors duration-fast hover:text-cream hover:border-cream/55"
                  >
                    {chip.label}
                  </a>
                ))}
              </nav>
            </Reveal>
          </div>
        </section>

        {/* ── Proof: labeled sample + the approved beta quote ──────────── */}
        <section
          aria-labelledby="athlete-sample-heading"
          className="pb-14 border-b border-hairline"
        >
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center max-w-[1060px]">
                <SamplePlayer
                  src={ATHLETE_SAMPLE_SRC}
                  durationSec={ATHLETE_SAMPLE_DURATION_SEC}
                  title="Hear a session"
                  label="Hockey sample · Forward · First shift"
                  headingId="athlete-sample-heading"
                  ariaSubject="pregame session sample"
                />
                {/* The one approved beta quote (FV-514) — real feedback,
                    non-identifying attribution, no outcome claims. */}
                <figure className="m-0 border-l-2 border-gold/40 pl-6">
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/55 font-semibold mb-2.5">
                    Beta feedback
                  </div>
                  <blockquote className="m-0 font-body text-[16px] leading-[1.6] text-cream">
                    &ldquo;The pregame session helped me picture my first
                    shift and gave me one thing to focus on. I started using
                    it before games to dial in.&rdquo;
                  </blockquote>
                  <figcaption className="mt-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-cream/55">
                    Beta hockey athlete
                  </figcaption>
                </figure>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 01 Before you compete ────────────────────────────────────── */}
        <section id="before" className="py-16 sm:py-20 scroll-mt-20">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <SectionMeta num="01" label="Before you compete" />
            </Reveal>
            <Reveal>
              <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-14 items-start">
                <div>
                  <h2 className="fv-h-section mb-4">
                    Nerves are energy, not a verdict.
                  </h2>
                  <p className="font-body text-[15px] leading-[1.65] text-cream/70 m-0 max-w-[44ch]">
                    The problem is not that you feel them. The problem is
                    when they start writing a story about who you are. A
                    short routine, the same every time, gives your mind a
                    rail to grab when the pressure climbs.
                  </p>
                  <SourceLink
                    lead="The full routine, with the words to say:"
                    href="/resources/pre-game-nerves-christian-athlete-routine"
                    title="Pre-Game Nerves: A Christian Athlete’s 5-Step Routine"
                  />
                </div>
                <MomentSteps steps={beforeSteps} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 02 The mental rep ────────────────────────────────────────── */}
        <section
          id="rep"
          className="py-16 sm:py-20 border-t border-hairline scroll-mt-20"
        >
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <SectionMeta num="02" label="The mental rep" />
            </Reveal>
            <Reveal>
              <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-14 items-start">
                <div>
                  <h2 className="fv-h-section mb-4">
                    Does visualization work? Often, as a supplement.
                  </h2>
                  <p className="font-body text-[15px] leading-[1.65] text-cream/70 m-0 max-w-[44ch]">
                    Research reviews find encouraging average results, with
                    real limits: the stronger evidence comes from imagery
                    practiced repeatedly, and it never replaces physical
                    reps, coaching, or film. Here is what a rep worth
                    running includes.
                  </p>
                  <SourceLink
                    lead="The research, honestly, citations included:"
                    href="/resources/does-visualization-work-for-athletes"
                    title="Does Visualization Actually Work for Athletes?"
                  />
                </div>
                <MomentSteps steps={repSteps} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 03 Afterward ─────────────────────────────────────────────── */}
        <section
          id="after"
          className="py-16 sm:py-20 border-t border-hairline scroll-mt-20"
        >
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <SectionMeta num="03" label="Afterward" />
            </Reveal>
            <Reveal>
              <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-14 items-start">
                <div>
                  <h2 className="fv-h-section mb-4">
                    After a performance you want back.
                  </h2>
                  <p className="font-body text-[15px] leading-[1.65] text-cream/70 m-0 max-w-[44ch]">
                    A rough result is information, not a verdict on you. The
                    replay loop often starts because you care. Let it sting
                    honestly, then work it instead of replaying it.
                  </p>
                  <SourceLink
                    lead="The whole reset, including why the sting matters:"
                    href="/resources/how-to-bounce-back-after-a-bad-game"
                    title="How to Bounce Back After a Bad Game"
                  />
                </div>
                <MomentSteps steps={afterSteps} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 04 Verses to carry ───────────────────────────────────────── */}
        <section
          id="carry"
          className="py-16 sm:py-20 border-t border-hairline scroll-mt-20"
        >
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <SectionMeta num="04" label="Carry it" />
            </Reveal>
            <Reveal>
              <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-14 items-start">
                <div>
                  <h2 className="fv-h-section mb-4">
                    Three verses for three moments.
                  </h2>
                  <p className="font-body text-[15px] leading-[1.65] text-cream/70 m-0 max-w-[44ch]">
                    The best pregame verses settle who you already are in
                    Christ, not a charm to play better. One to anchor, one
                    for the nerves, one for after. Pick one and carry it.
                  </p>
                  <SourceLink
                    lead="All twelve, with what each is for:"
                    href="/resources/bible-verses-for-athletes-before-a-game"
                    title="12 Bible Verses for Athletes to Read Before a Game"
                  />
                </div>
                <div>
                  {verses.map((v) => (
                    <div key={v.ref} className="mb-7 last:mb-0">
                      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-gold font-semibold mb-2.5 pl-6">
                        {v.ref} · {v.kind}
                      </div>
                      <blockquote className="m-0 border-l-2 border-gold/40 pl-6">
                        <p className="font-scripture italic text-[clamp(19px,2vw,24px)] leading-[1.5] text-cream m-0">
                          {v.quote}
                        </p>
                      </blockquote>
                      <p className="font-body text-[14px] leading-[1.55] text-cream/70 mt-2.5 mb-0 pl-6">
                        {v.gloss}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 05 Train it ──────────────────────────────────────────────── */}
        <section
          id="train"
          className="py-16 sm:py-20 bg-charcoal border-t border-hairline scroll-mt-20"
        >
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <SectionMeta num="05" label="Train it" />
            </Reveal>
            <Reveal>
              <h2 className="fv-h-section mb-4">
                Read it here. Train it in the app.
              </h2>
              <p className="font-body text-[16px] leading-[1.65] text-cream/70 m-0 max-w-[58ch]">
                Daily training builds the foundation over time. Before you
                compete, a five-minute guided session calls it up through
                breath, visualization, secure identity in Christ, a focus
                cue, and prayer.
              </p>
            </Reveal>

            <Reveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[880px] mt-9">
                {/* 18+ — self-serve is live; the card renders only while the
                    adult-signup flag is on so the page can never point an
                    athlete at a disabled flow. */}
                {adultSignup ? (
                  <div className="border border-hairline-strong rounded-[16px] p-7 bg-onyx">
                    <div className="font-display font-extrabold text-[13px] tracking-[0.14em] text-gold mb-3">
                      18 OR OLDER
                    </div>
                    <h3 className="font-heading font-semibold text-[19px] text-cream m-0 mb-2">
                      Your account. Your call.
                    </h3>
                    <p className="font-body text-[13.5px] leading-[1.6] text-cream/70 m-0 mb-5">
                      Create your own account and start a 14-day free trial.
                      $5/month or $49/year after the trial. Cancel anytime.
                    </p>
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center gap-2 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-6 py-3.5 min-h-[44px] text-[14px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
                    >
                      Start your 14-day free trial
                      <SvgIcon name="arrow" size={14} />
                    </Link>
                  </div>
                ) : null}

                {/* 13–17 — the parent is the buyer; the athlete's move is a share of
                    the parents page. The share action collects and stores no
                    athlete data. */}
                <div className="border border-hairline-strong rounded-[16px] p-7 bg-onyx">
                  <div className="font-display font-extrabold text-[13px] tracking-[0.14em] text-gold mb-3">
                    13 – 17
                  </div>
                  <h3 className="font-heading font-semibold text-[19px] text-cream m-0 mb-2">
                    Send this to a parent.
                  </h3>
                  <p className="font-body text-[13.5px] leading-[1.6] text-cream/70 m-0 mb-5">
                    Training runs through a parent. They subscribe and create
                    your athlete account. Your parent can see your training
                    rhythm, not the content of your sessions. The{" "}
                    <Link
                      href="/parents"
                      className="text-gold underline underline-offset-2 hover:text-gold-bright transition-colors duration-fast"
                    >
                      parents&rsquo; page
                    </Link>{" "}
                    explains how it works.
                  </p>
                  <ShareWithParent />
                </div>
              </div>
            </Reveal>

            <Reveal>
              {/* Canonical send-off (docs/brand.md approved line, verbatim). */}
              <p className="font-heading font-semibold text-[17px] text-cream mt-9 mb-0">
                Play hard, fearless, and free.
              </p>
              <p className="font-body text-[13px] text-cream/55 mt-4 mb-0">
                Questions about privacy, cost, or what we believe?{" "}
                <Link
                  href="/#faq"
                  className="text-gold underline underline-offset-2 hover:text-gold-bright transition-colors duration-fast"
                >
                  Read the FAQ →
                </Link>
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
