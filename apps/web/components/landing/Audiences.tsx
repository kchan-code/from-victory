import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import { SvgIcon } from "./SvgIcon";

type IconName = "target" | "shield" | "pulse";

const audiences: {
  icon: IconName;
  who: string;
  headline: string;
  body: string;
  items: string[];
}[] = [
  {
    icon: "target",
    who: "For athletes",
    headline:
      "Train your mind. Reset after mistakes. Compete from secure identity.",
    body: "Short, daily reps that build mental toughness for the moments that matter — practice, game day, the bench, the bus home.",
    items: [
      "Pre-game reset and post-game reflection",
      "Sport-specific cues for game-day situations",
      "Private journaling — athlete-only readable",
    ],
  },
  {
    icon: "shield",
    who: "For parents",
    headline:
      "Help your athlete grow in faith, discipline, and confidence — without adding pressure.",
    // Rewritten from prototype's "COPPA-aware journaling" framing per CLAUDE.md.
    // We are 13+ only; COPPA does not apply. Parents see participation
    // metadata only, never journal content.
    body: "Christ-centered, age-appropriate, and built to remove shame — not stack it. Designed for the 13+ age band, with athlete-private journaling and parent dashboards that show participation only — never content.",
    items: [
      "Safe, Scripture-grounded content",
      "No streaks, scores, or spiritual rankings",
      "Parent dashboard shows participation, never journal content",
    ],
  },
  {
    icon: "pulse",
    who: "For coaches",
    headline:
      "Support a culture of focus, accountability, humility, and bounce-back resilience.",
    body: "A common mental-skills vocabulary for your locker room. Pre-game cues, reset drills, and journal prompts that hold up after a loss.",
    items: [
      "Team-friendly mindset language",
      "Pre- and post-game routines",
      "Team licensing on the roadmap",
    ],
  },
];

export function Audiences() {
  return (
    <section id="audiences" className="py-20 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="08" label="For everyone in the locker room" />
        </Reveal>

        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-14 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              One foundation. Different support roles.
            </h2>
            <p className="fv-lede">
              The same identity. Different positions on the bench. From Victory
              speaks to the athlete first — and gives parents and coaches a
              steady, common language to use.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {audiences.map((a) => (
            <Reveal key={a.who}>
              <article className="bg-charcoal border border-hairline rounded-[20px] p-8 min-h-[320px] flex flex-col justify-between transition-colors duration-base ease-out hover:border-hairline-strong hover:bg-surface-1 h-full">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center text-gold"
                      style={{
                        background: "var(--fv-gold-soft)",
                        border: "1px solid rgba(223,175,55,0.28)",
                      }}
                    >
                      <SvgIcon name={a.icon} size={20} />
                    </div>
                    <div className="font-display font-extrabold text-[14px] tracking-[0.16em] uppercase text-gold">
                      {a.who}
                    </div>
                  </div>
                  <h3 className="font-heading font-semibold text-[24px] leading-[1.15] tracking-[-0.01em] text-cream m-0 mb-3.5 text-balance">
                    {a.headline}
                  </h3>
                  <p className="font-body text-[15px] leading-[1.55] text-cream/70 m-0 mb-6">
                    {a.body}
                  </p>
                </div>
                <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                  {a.items.map((item) => (
                    <li
                      key={item}
                      className="font-body text-[13.5px] text-cream/70 flex items-start gap-2.5"
                    >
                      <span className="flex-none w-1 h-1 rounded-pill bg-gold mt-[9px]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
