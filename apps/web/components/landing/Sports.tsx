import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

const sports: { meta: string; name: string; active?: boolean }[] = [
  { meta: "In MVP", name: "Hockey", active: true },
  { meta: "Next", name: "Soccer" },
  { meta: "Next", name: "Lacrosse" },
  { meta: "Next", name: "Football" },
  { meta: "Next", name: "Baseball" },
  { meta: "Roadmap", name: "Basketball" },
  { meta: "Roadmap", name: "Wrestling" },
  { meta: "Roadmap", name: "Volleyball" },
  { meta: "Roadmap", name: "Track & field" },
  { meta: "Roadmap", name: "Tennis" },
];

export function Sports() {
  return (
    <section
      id="sports"
      className="py-20 sm:py-24 md:py-32 bg-charcoal border-y border-hairline"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="07" label="Beachhead" />
        </Reveal>

        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              Built first for hockey. Designed for every athlete.
            </h2>
            <p className="fv-lede">
              From Victory starts with hockey because that&apos;s the first
              lived experience behind the product — bad shifts, fast resets,
              coach pressure, team roles, and the need to compete with courage.
              The foundation applies to every sport.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-10">
            {sports.map((s) => (
              <div
                key={s.name}
                className={`border rounded-[14px] px-4 py-[18px] flex flex-col gap-2 transition-all duration-base ease-out ${
                  s.active
                    ? "border-[color:rgba(223,175,55,0.4)]"
                    : "border-hairline bg-charcoal hover:bg-surface-1 hover:border-hairline-strong"
                }`}
                style={
                  s.active
                    ? {
                        background:
                          "linear-gradient(180deg,rgba(223,175,55,0.08),rgba(223,175,55,0)),var(--bg-elev-1)",
                      }
                    : undefined
                }
              >
                <div
                  className={`font-mono text-[9px] tracking-[0.16em] uppercase font-semibold ${
                    s.active ? "text-gold" : "text-cream/50"
                  }`}
                >
                  {s.meta}
                </div>
                <div className="font-heading font-semibold text-[16px] text-cream">
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
