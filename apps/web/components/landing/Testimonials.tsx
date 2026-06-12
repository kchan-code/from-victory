// TESTIMONIALS — renders ONLY when this array has entries.
//
// !! NEVER fabricate quotes !!
// Populate ONLY with real, permissioned quotes from named athletes or parents
// who have explicitly consented to public attribution. Verify permission before
// each new entry. Empty array = section is invisible; that is intentional.

export interface Testimonial {
  quote: string;
  attribution: string;
}

// TODO: populate with real, permissioned quotes only.
// This array MUST remain empty until KC has collected + verified consent.
export const TESTIMONIALS: Testimonial[] = [];

export function Testimonials() {
  // Renders nothing while the array is empty — intentional.
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="py-20 sm:py-24 border-t border-hairline">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="rounded-[20px] p-7 flex flex-col gap-5"
              style={{
                background: "var(--bg-elev-1)",
                border: "1px solid var(--fv-hairline)",
              }}
            >
              <blockquote className="font-scripture italic text-[clamp(15px,1.3vw,17px)] leading-[1.6] text-cream/90 m-0 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-gold">
                {t.attribution}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
