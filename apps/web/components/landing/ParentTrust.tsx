import Link from "next/link";
import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import { SvgIcon } from "./SvgIcon";

// FV-514 homepage IA restructure — parent trust strip. Heading is KC-approved
// verbatim (audit doc §7 decision 5). Every bullet title/body below is reused
// verbatim or near-verbatim (light trims only, no new claims) from copy
// already approved and live on /parents and /pricing.

const bullets = [
  {
    icon: "shield" as const,
    // Verbatim: /parents parentSees[0].
    title: "Rhythm summary",
    body: "How often your athlete is training — days active, total sessions completed — so you can see the habit forming without reading over their shoulder.",
  },
  {
    icon: "check" as const,
    // Verbatim (trimmed to the first and last sentence): /parents
    // parentSees[2].
    title: "Never their private space",
    body: "What happens inside a session stays your athlete's — the focus they pick, the hard moment they name, the prayer they bring. Privacy is a feature, not a loophole.",
  },
  {
    icon: "book" as const,
    // Verbatim: /pricing "Not a health service" callout.
    title: "Not a health service",
    body: "From Victory is a mindset training app, not a mental health service. The app does not provide therapy, clinical care, or crisis intervention.",
  },
  {
    icon: "flame" as const,
    // Title verbatim: /pricing "Minimum data" h2. Body near-verbatim
    // (trimmed): /pricing FAQ "What data do you collect" answer plus the
    // "Data sold to third parties" row note, both reused verbatim.
    title: "Minimum data. No tracking. No ads.",
    body: "We collect the minimum necessary: your athlete's first name and birthdate. No behavioral analytics. No third-party tracking. Data sold to third parties: never.",
  },
];

export function ParentTrust() {
  return (
    <section className="py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="03" label="Trust and privacy" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-8 items-end mb-10 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              What you see, and what stays private.
            </h2>
            {/* Verbatim: /parents "What YOU see" lede, first sentence. */}
            <p className="fv-lede">
              Your dashboard shows you whether your athlete is building the
              habit — not what they prayed about or worked through inside a
              session.
            </p>
          </div>
        </Reveal>

        {/* Compact 2-up grid (even on the smallest phones) — a trust strip
            should read at a glance, not stack into a scroll wall. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {bullets.map((b) => (
            <Reveal key={b.title}>
              <article className="bg-charcoal border border-hairline rounded-lg p-4 sm:p-5 transition-colors duration-base ease-out hover:border-hairline-strong hover:bg-surface-1 h-full">
                <div className="flex items-center gap-2 mb-2">
                  <SvgIcon name={b.icon} size={14} className="text-gold flex-none" />
                  <h3 className="font-heading font-semibold text-[13.5px] leading-[1.2] text-cream tracking-[-0.005em] m-0">
                    {b.title}
                  </h3>
                </div>
                <p className="font-body text-[12px] leading-[1.45] text-cream/70 m-0">
                  {b.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-7 font-body text-[13.5px] text-cream/60 m-0 max-w-[60ch]">
            {/* Verbatim: Faq.tsx FAQ_ITEMS[3].a, second sentence. */}
            We confirm age at account creation — there’s no account for
            anyone under 13.{" "}
            <Link
              href="/parents"
              className="text-cream/70 hover:text-cream underline underline-offset-2 transition-colors duration-fast ease-out"
            >
              More for parents
            </Link>
            <span className="mx-2 text-cream/25" aria-hidden>
              ·
            </span>
            <Link
              href="/privacy"
              className="text-cream/70 hover:text-cream underline underline-offset-2 transition-colors duration-fast ease-out"
            >
              Privacy Policy
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
