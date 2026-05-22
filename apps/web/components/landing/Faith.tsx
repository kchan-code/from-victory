import { FlameMark } from "@/components/ui";
import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

const themes = [
  "Secure identity",
  "Self-control",
  "Courage",
  "Peace",
  "Endurance",
  "Renewal",
  "Faithfulness",
];

export function Faith() {
  return (
    <section
      id="faith"
      className="fv-faith-bg py-20 sm:py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <div className="max-w-[820px] mx-auto text-center">
            <div
              className="mx-auto mb-8 inline-block"
              style={{
                filter: "drop-shadow(0 0 28px rgba(223,175,55,0.18))",
              }}
            >
              <FlameMark size={64} />
            </div>

            <SectionMeta num="05" label="Faith foundation" centered />

            <h2 className="fv-h-section mx-auto mb-7 text-center max-w-[18ch]">
              Christ-centered without being performance-centered.
            </h2>

            <p className="fv-lede mx-auto mb-9 text-center">
              From Victory is rooted in biblical truth: the athlete&apos;s
              identity is secure in Christ. Training is not about earning worth.
              It&apos;s about learning to live, compete, fail, reset, and grow
              from the victory Christ has already won.
            </p>

            <div className="fv-faith-callout border border-hairline rounded-[20px] px-8 sm:px-9 py-8 max-w-[620px] mx-auto text-left">
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold font-semibold mb-3.5">
                Hebrews 12:1–2
              </div>
              <div className="font-scripture italic text-[clamp(20px,2vw,26px)] leading-[1.5] text-cream text-pretty">
                &ldquo;Let us run with perseverance the race marked out for us,
                fixing our eyes on Jesus.&rdquo;
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-10">
              {themes.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[11px] tracking-[0.16em] uppercase text-cream/70 font-semibold px-3.5 py-2 rounded-pill border border-hairline bg-charcoal"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
