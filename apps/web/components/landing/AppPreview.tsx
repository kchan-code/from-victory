import { FlameMark } from "@/components/ui";
import { PhoneStatusBar } from "./PhoneStatusBar";
import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import { SvgIcon } from "./SvgIcon";

export function AppPreview() {
  return (
    <section
      id="app"
      className="relative overflow-hidden bg-charcoal py-20 sm:py-24 md:py-32"
    >
      <div className="fv-preview-bg absolute inset-0 pointer-events-none" />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="04" label="The app" />
        </Reveal>
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 items-end mb-6 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <h2 className="fv-h-section">
              Built for the moments athletes actually face.
            </h2>
            <p className="fv-lede">
              Before the game, between games, and every day in between. From
              Victory gives athletes a daily training session, a guided pregame
              reset, and a pre-practice lock-in — all rooted in secure identity.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <div className="fv-preview-scroll">
            {/* 1. Today Dashboard — reflects the real /athlete hub */}
            <PreviewItem
              lbl="01 / Today dashboard"
              ttl="Everything you need, one tap away."
              sub="Rhythm ring, daily training, pregame, pre-practice — all from the home screen."
            >
              <div className="fv-phone-screen">
                <div className="fv-phone-notch" />
                <PhoneStatusBar small />
                <div className="px-[18px] pt-2 pb-5 flex-1 overflow-hidden">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative w-12 h-12 flex-none"
                        aria-hidden
                      >
                        <svg width="48" height="48" className="-rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="rgba(247,247,247,0.06)"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="var(--fv-cobalt)"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray="125.7"
                            strokeDashoffset="75.4"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="font-display font-extrabold text-[11px] text-cream leading-none">
                            8
                            <span className="text-[7px] opacity-55">/30</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="font-display font-extrabold text-[20px] text-cream tracking-[-0.01em] leading-none">
                          Hi Jordan.
                        </div>
                        <div className="font-body text-[10px] text-cream/50 mt-0.5">
                          Keep your rhythm.
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-pill bg-charcoal border border-hairline inline-flex items-center justify-center text-cream/70">
                      <SvgIcon name="bell" size={12} />
                    </div>
                  </div>

                  {/* Nav cards */}
                  <div className="flex flex-col gap-[6px]">
                    {/* Daily Training — primary */}
                    <div
                      className="rounded-[13px] px-3 py-2.5 flex items-center gap-2.5"
                      style={{
                        background:
                          "linear-gradient(180deg,rgba(223,175,55,0.12),rgba(223,175,55,0)),var(--bg-elev-1)",
                        border: "1px solid rgba(223,175,55,0.42)",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-[8px] flex items-center justify-center text-gold flex-none"
                        style={{
                          background: "var(--fv-gold-soft)",
                          border: "1px solid rgba(223,175,55,0.28)",
                        }}
                      >
                        <SvgIcon name="book" size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-gold font-semibold">
                          Today
                        </div>
                        <div className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[12px] leading-[1.15]">
                          Daily Training
                        </div>
                      </div>
                      <div className="font-display text-gold text-[14px]">→</div>
                    </div>

                    {/* Pregame */}
                    <div
                      className="rounded-[13px] px-3 py-2.5 flex items-center gap-2.5"
                      style={{
                        background:
                          "linear-gradient(180deg,rgba(223,175,55,0.07),rgba(223,175,55,0)),var(--bg-elev-1)",
                        border: "1px solid rgba(223,175,55,0.22)",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-none"
                        style={{
                          background: "rgba(223,175,55,0.06)",
                          border: "1px solid rgba(223,175,55,0.16)",
                        }}
                      >
                        <SvgIcon name="shield" size={13} className="text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-gold/70 font-semibold">
                          Game day
                        </div>
                        <div className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[12px] leading-[1.15]">
                          Start Pregame
                        </div>
                      </div>
                      <div className="font-display text-gold/70 text-[14px]">→</div>
                    </div>

                    {/* Pre-practice */}
                    <div
                      className="rounded-[13px] px-3 py-2.5 flex items-center gap-2.5"
                      style={{
                        background:
                          "linear-gradient(180deg,rgba(223,175,55,0.04),rgba(223,175,55,0)),var(--bg-elev-1)",
                        border: "1px solid rgba(223,175,55,0.16)",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-none"
                        style={{
                          background: "rgba(223,175,55,0.04)",
                          border: "1px solid rgba(223,175,55,0.10)",
                        }}
                      >
                        <SvgIcon name="wind" size={13} className="text-gold/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-gold/55 font-semibold">
                          Practice day
                        </div>
                        <div className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[12px] leading-[1.15]">
                          Lock In
                        </div>
                      </div>
                      <div className="font-display text-gold/55 text-[14px]">→</div>
                    </div>

                    {/* Journey */}
                    <div
                      className="rounded-[13px] px-3 py-2.5 flex items-center gap-2.5"
                      style={{
                        background:
                          "linear-gradient(180deg,rgba(223,175,55,0.02),rgba(223,175,55,0)),var(--bg-elev-1)",
                        border: "1px solid rgba(223,175,55,0.10)",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-none"
                        style={{
                          background: "rgba(223,175,55,0.03)",
                          border: "1px solid rgba(223,175,55,0.07)",
                        }}
                      >
                        <SvgIcon name="pen" size={13} className="text-gold/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-gold/40 font-semibold">
                          History
                        </div>
                        <div className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[12px] leading-[1.15]">
                          Your Journey
                        </div>
                      </div>
                      <div className="font-display text-gold/40 text-[14px]">→</div>
                    </div>
                  </div>
                </div>
              </div>
            </PreviewItem>

            {/* 2. Daily Training Session — the real /athlete/daily screen */}
            <PreviewItem
              lbl="02 / Daily training"
              ttl="Mental skill + scripture, every day."
              sub="30 sessions of mental toughness training rooted in the Word. Read, reflect, complete."
            >
              <div className="fv-phone-screen">
                <div className="fv-phone-notch" />
                <PhoneStatusBar small />
                <div className="px-[18px] pt-2 pb-5 flex-1 overflow-hidden">
                  {/* Back + day label */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1 text-cream/50">
                      <SvgIcon name="chev" size={10} className="rotate-180" />
                      <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase font-semibold">
                        Home
                      </div>
                    </div>
                  </div>
                  {/* Rhythm ring + day */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="relative w-10 h-10 flex-none" aria-hidden>
                      <svg width="40" height="40" className="-rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="rgba(247,247,247,0.06)"
                          strokeWidth="3.5"
                          fill="none"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="var(--fv-cobalt)"
                          strokeWidth="3.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray="100.5"
                          strokeDashoffset="70.3"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="font-display font-extrabold text-[9px] text-cream leading-none">
                          8<span className="text-[6px] opacity-55">/30</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[8.5px] tracking-[0.16em] uppercase text-gold font-semibold">
                        Day 8 of 30
                      </div>
                      <div className="font-body text-[10px] text-cream/55">
                        7 sessions complete.
                      </div>
                    </div>
                  </div>

                  {/* Session card */}
                  <div className="bg-charcoal border border-hairline rounded-[14px] p-3 mb-2.5">
                    <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-gold font-semibold mb-1.5">
                      Daily Training · Day 8
                    </div>
                    <div className="font-display font-extrabold uppercase tracking-[0.01em] text-cream text-[14px] leading-[1.1] mb-2">
                      Control What You Can Control
                    </div>
                    <div className="font-body text-[10.5px] text-cream/65 leading-[1.5] mb-2.5">
                      Every athlete faces moments where the outcome is out of
                      their hands. Mental toughness is learning to own the
                      process — not the result.
                    </div>
                    <div className="border-l-[2px] border-gold/50 pl-3">
                      <div className="font-scripture text-[10.5px] leading-[1.45] text-cream italic">
                        &ldquo;I can do all this through him who gives me
                        strength.&rdquo;
                      </div>
                      <div className="font-mono text-[8px] tracking-[0.14em] uppercase text-gold mt-1">
                        Philippians 4:13 · NIV
                      </div>
                    </div>
                  </div>

                  {/* Complete CTA */}
                  <div
                    className="rounded-[11px] py-2.5 text-center font-display font-extrabold uppercase tracking-[0.12em] text-[11px] text-onyx"
                    style={{ background: "var(--fv-gold)" }}
                  >
                    Complete Day 8
                  </div>
                </div>
              </div>
            </PreviewItem>

            {/* 3. Pregame — guided audio session */}
            <PreviewItem
              lbl="03 / Pregame audio"
              ttl="A 5-minute guided reset before you step on."
              sub="Personalized by sport and position. Breath, visualization, identity, and your focus cue — narrated."
            >
              <div className="fv-phone-screen" style={{ background: "#000" }}>
                <div className="fv-phone-notch" />
                <PhoneStatusBar small lightOnDark />
                <div className="fv-pregame-bg absolute inset-0 pointer-events-none" />
                <div
                  className="absolute right-[-30px] top-[30px] pointer-events-none opacity-[0.08]"
                  aria-hidden
                >
                  <FlameMark size={240} />
                </div>
                <div
                  className="relative flex flex-col justify-between px-[22px] pt-1.5 pb-7 flex-1"
                  style={{ overflow: "hidden" }}
                >
                  <div>
                    <div className="mt-7 inline-flex items-center gap-2 font-mono text-[9.5px] tracking-[0.22em] uppercase text-gold font-semibold">
                      <span className="w-[5px] h-[5px] rounded-pill bg-gold" />
                      Pregame · 18 min out
                    </div>
                    <div className="mt-5 font-display font-extrabold text-[28px] leading-[0.95] tracking-[0.02em] uppercase text-cream">
                      Breathe.
                      <br />
                      Focus.
                      <br />
                      Compete.
                    </div>
                    <div className="mt-2 font-body text-[10.5px] text-cream/55 leading-[1.45]">
                      Defenseman · Adversity: getting benched
                    </div>
                  </div>

                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                    <div
                      className="absolute w-36 h-36 rounded-full"
                      style={{ border: "1px solid rgba(36,91,255,0.18)" }}
                    />
                    <div
                      className="absolute w-[108px] h-[108px] rounded-full"
                      style={{ border: "1px solid rgba(36,91,255,0.32)" }}
                    />
                    <div
                      className="w-[72px] h-[72px] rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle at 35% 30%,rgba(223,175,55,0.5),rgba(36,91,255,0.45) 60%,rgba(7,26,51,0.6) 100%)",
                        boxShadow: "0 0 60px rgba(36,91,255,0.25)",
                      }}
                    />
                  </div>

                  <div>
                    <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-cream/50 font-semibold mb-1.5">
                      Your focus cue
                    </div>
                    <div
                      className="rounded-[12px] px-3.5 py-3 font-heading font-medium text-[13px] text-cream mb-2.5"
                      style={{
                        background: "rgba(5,5,5,0.55)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(247,247,247,0.14)",
                      }}
                    >
                      First-shift effort. Body language steady.
                    </div>
                    <div className="bg-gold text-onyx font-display font-extrabold uppercase tracking-[0.14em] text-[12px] rounded-[10px] px-3.5 py-3 text-center">
                      Start guided session
                    </div>
                  </div>
                </div>
              </div>
            </PreviewItem>

            {/* 4. Post-game reset — COMING SOON (FV-225) */}
            <PreviewItem
              lbl="04 / Post-game reset"
              ttl="Won, lost, mistake, tough — every game has a reset."
              sub="Coming soon. Reflection before recap — name it, release it, carry the lesson."
            >
              <div className="fv-phone-screen">
                <div className="fv-phone-notch" />
                <PhoneStatusBar small />
                <div className="px-[18px] pt-1.5 pb-[18px] flex-1 overflow-hidden">
                  {/* Coming soon badge */}
                  <div className="mb-3">
                    <div
                      data-testid="postgame-coming-soon"
                      className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-[8px] tracking-[0.14em] uppercase font-semibold"
                      style={{
                        background: "rgba(36,91,255,0.12)",
                        border: "1px solid rgba(36,91,255,0.35)",
                        color: "var(--fv-cobalt-bright, #6b8fff)",
                      }}
                    >
                      <span
                        className="w-[4px] h-[4px] rounded-pill"
                        style={{ background: "var(--fv-cobalt-bright, #6b8fff)" }}
                      />
                      Coming soon
                    </div>
                  </div>

                  <div className="mb-3.5">
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
                      Post-game reset
                    </div>
                    <div className="font-heading font-semibold text-[17px] text-cream mt-1 tracking-[-0.01em]">
                      After the game
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-[7px]">
                    <div
                      className="rounded-[12px] px-3 py-3 text-cream opacity-60"
                      style={{
                        background: "rgba(79,199,138,0.10)",
                        border: "1px solid rgba(79,199,138,0.4)",
                      }}
                    >
                      <div className="font-mono text-[8.5px] tracking-[0.16em] uppercase text-success font-semibold">
                        Won
                      </div>
                      <div className="font-heading font-semibold text-[13px] mt-1">
                        Stay grounded
                      </div>
                    </div>
                    {[
                      { label: "Lost", title: "Reset, not ruin" },
                      { label: "Mistake", title: "Name & release" },
                      { label: "Tough", title: "Carry the lesson" },
                    ].map((opt) => (
                      <div
                        key={opt.label}
                        className="bg-charcoal border border-hairline rounded-[12px] px-3 py-3 opacity-60"
                      >
                        <div className="font-mono text-[8.5px] tracking-[0.16em] uppercase text-cream/50 font-semibold">
                          {opt.label}
                        </div>
                        <div className="font-heading font-semibold text-[13px] mt-1 text-cream">
                          {opt.title}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 bg-charcoal border border-hairline rounded-[12px] p-3 text-center">
                    <div className="font-body text-[11px] text-cream/55 leading-[1.45]">
                      The post-game reset is coming. It will be here when you
                      need it.
                    </div>
                  </div>
                </div>
              </div>
            </PreviewItem>

            {/* 5. Pre-practice Lock In — the real /athlete/practice screen */}
            <PreviewItem
              lbl="05 / Pre-practice lock in"
              ttl="Two minutes before you step on the practice ice."
              sub="Self-report your state, pick one thing to own, then hear it narrated back."
            >
              <div className="fv-phone-screen" style={{ background: "#000" }}>
                <div className="fv-phone-notch" />
                <PhoneStatusBar small lightOnDark />
                <div className="fv-pregame-bg absolute inset-0 pointer-events-none" />
                <div
                  className="relative flex flex-col px-[22px] pt-1.5 pb-7 flex-1"
                  style={{ overflow: "hidden" }}
                >
                  <div className="mt-7 mb-5">
                    <div className="inline-flex items-center gap-2 font-mono text-[9.5px] tracking-[0.22em] uppercase text-gold font-semibold mb-3">
                      <span className="w-[5px] h-[5px] rounded-pill bg-gold" />
                      Pre-practice · Lock in
                    </div>
                    <div className="font-display font-extrabold text-[22px] leading-[1.0] tracking-[0.02em] uppercase text-cream">
                      How are you showing up today?
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-5">
                    <div
                      className="rounded-[12px] px-3.5 py-3"
                      style={{
                        background: "rgba(223,175,55,0.10)",
                        border: "1px solid rgba(223,175,55,0.5)",
                      }}
                    >
                      <div className="font-heading font-semibold text-[13px] text-cream">
                        Dialed in
                      </div>
                      <div className="font-body text-[10.5px] text-cream/60 mt-0.5">
                        Ready to work. Lock in and go.
                      </div>
                    </div>
                    <div
                      className="rounded-[12px] px-3.5 py-3"
                      style={{
                        background: "rgba(5,5,5,0.55)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(247,247,247,0.14)",
                      }}
                    >
                      <div className="font-heading font-semibold text-[13px] text-cream">
                        Not feeling it
                      </div>
                      <div className="font-body text-[10.5px] text-cream/50 mt-0.5">
                        Off, flat, dragging. You showed up anyway.
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="bg-gold text-onyx font-display font-extrabold uppercase tracking-[0.14em] text-[12px] rounded-[10px] px-3.5 py-3 text-center">
                      Continue
                    </div>
                  </div>
                </div>
              </div>
            </PreviewItem>

            {/* 6. Journey — the real /athlete/journey session history */}
            <PreviewItem
              lbl="06 / Your journey"
              ttl="Every session you've completed."
              sub="The road behind you — re-read, revisit, remember. No shame for gaps; returning is the goal."
            >
              <div className="fv-phone-screen">
                <div className="fv-phone-notch" />
                <PhoneStatusBar small />
                <div className="px-[18px] pt-2 pb-[18px] flex-1 overflow-hidden">
                  <div className="mb-3.5">
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-gold font-semibold">
                      Jordan&apos;s Journey
                    </div>
                    <div className="font-display font-extrabold uppercase tracking-[0.03em] text-cream text-[18px] leading-[1.05]">
                      The Road Behind You
                    </div>
                    <div className="font-body text-cream/55 text-[10.5px] mt-1">
                      7 sessions complete. Each one is yours.
                    </div>
                  </div>

                  <div className="flex flex-col gap-[6px]">
                    {[
                      { day: 7, title: "One More Rep", ref: "Heb 12:1-2" },
                      { day: 6, title: "Quiet Confidence", ref: "Phil 4:7" },
                      { day: 5, title: "After the Mistake", ref: "Rom 8:1" },
                      { day: 4, title: "Control Your Effort", ref: "Col 3:23" },
                    ].map((entry) => (
                      <div
                        key={entry.day}
                        className="flex items-center gap-2.5 bg-charcoal border border-hairline rounded-[12px] px-2.5 py-2"
                      >
                        <div
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-none"
                          style={{
                            background: "rgba(223,175,55,0.10)",
                            border: "1px solid rgba(223,175,55,0.20)",
                          }}
                        >
                          <div className="font-mono font-bold text-[10px] text-gold leading-none">
                            {entry.day}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold uppercase tracking-[0.02em] text-cream text-[11px] leading-[1.2] truncate">
                            {entry.title}
                          </div>
                          <div className="font-mono text-[8.5px] text-cream/40 mt-0.5">
                            {entry.ref}
                          </div>
                        </div>
                        <SvgIcon name="chev" size={10} className="text-gold/50 flex-none" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PreviewItem>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PreviewItem({
  children,
  lbl,
  ttl,
  sub,
}: {
  children: React.ReactNode;
  lbl: string;
  ttl: string;
  sub: string;
}) {
  return (
    <div
      className="flex-none flex flex-col gap-[18px] w-[268px]"
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="fv-phone fv-phone-sm">{children}</div>
      <div className="flex flex-col gap-1">
        <div className="font-mono text-[10px] tracking-[0.20em] uppercase text-gold font-semibold">
          {lbl}
        </div>
        <h3 className="font-heading font-semibold text-[16px] text-cream tracking-[-0.005em] m-0">
          {ttl}
        </h3>
        <p className="font-body text-[13px] text-cream/50 leading-[1.5] m-0">
          {sub}
        </p>
      </div>
    </div>
  );
}
