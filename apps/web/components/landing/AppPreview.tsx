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
              For the bad shift, the missed shot, the quiet ride home, and the
              night before a big game. From Victory gives athletes a simple way
              to reset, pray, reflect, and step back in from secure identity.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <div className="fv-preview-scroll">
            {/* 1. Today Dashboard */}
            <PreviewItem
              lbl="01 / Today dashboard"
              ttl="Today's rhythm at a glance."
              sub="Identity hero, rhythm ring, the next rep ready to go."
            >
              <div className="fv-phone-screen">
                <div className="fv-phone-notch" />
                <PhoneStatusBar small />
                <div className="px-[18px] pt-1.5 pb-5 flex-1 overflow-hidden">
                  <div className="flex justify-between items-start mb-3.5">
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
                        Tuesday · Mar 12
                      </div>
                      <div className="font-heading font-semibold text-[17px] text-cream mt-1 tracking-[-0.01em]">
                        Good morning, Jordan
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-pill border border-hairline inline-flex items-center justify-center text-cream">
                      <SvgIcon name="bell" size={13} />
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.20em] uppercase font-semibold text-gold">
                    <FlameMark size={11} />
                    From Victory
                  </div>
                  <div className="font-heading font-semibold text-[18px] leading-[1.15] text-cream tracking-[-0.01em] mt-2.5 mb-2">
                    Your worth is not on the scoreboard.
                  </div>
                  <div className="fv-rhythm-card rounded-[18px] p-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-16 h-16 flex-none">
                        <svg
                          width="64"
                          height="64"
                          className="-rotate-90"
                        >
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="rgba(247,247,247,0.06)"
                            strokeWidth="6"
                            fill="none"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="var(--fv-cobalt)"
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray="175.9"
                            strokeDashoffset="70.3"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="font-display font-extrabold text-[18px] text-cream leading-none">
                            60
                            <span className="text-[9px] opacity-55">%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-cream/50 font-semibold">
                          Today&apos;s rhythm
                        </div>
                        <div className="font-heading font-semibold text-[14px] text-cream mt-[3px]">
                          3 reps to go
                        </div>
                        <div className="font-body text-[11px] text-cream/70 mt-0.5">
                          ~3 minutes.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    <ModuleTile icon="wind" name="Center" duration="Done" done />
                    <ModuleTile icon="book" name="Truth" duration="2 min" />
                  </div>
                </div>
                <BottomTabBar />
              </div>
            </PreviewItem>

            {/* 2. Growth Path Selection */}
            <PreviewItem
              lbl="02 / Growth path"
              ttl="Identity is foundation, not an option."
              sub="Pick one growth area. Christ is always on."
            >
              <div className="fv-phone-screen">
                <div className="fv-phone-notch" />
                <PhoneStatusBar small />
                <div className="px-[18px] pt-1.5 pb-5 flex-1 overflow-hidden">
                  <div className="mb-2">
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
                      Growth path
                    </div>
                    <div className="font-heading font-semibold text-[17px] text-cream mt-1 tracking-[-0.01em] leading-[1.2]">
                      Where do you want to grow first?
                    </div>
                  </div>
                  <p className="font-body text-[11.5px] text-cream/70 leading-[1.5] m-0 mb-3.5">
                    Your identity is already secure in Christ. Choose one growth
                    area to focus your first 30 days.
                  </p>

                  <div
                    className="rounded-[14px] mb-2.5 px-3.5 py-3 flex items-center gap-2.5"
                    style={{
                      background:
                        "linear-gradient(180deg,rgba(223,175,55,0.10),rgba(223,175,55,0)),var(--bg-elev-1)",
                      border: "1px solid rgba(223,175,55,0.35)",
                    }}
                  >
                    <div
                      className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gold flex-none"
                      style={{
                        background: "var(--fv-gold-soft)",
                        border: "1px solid rgba(223,175,55,0.28)",
                      }}
                    >
                      <SvgIcon name="shield" size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-semibold text-[12.5px] text-cream">
                        Identity in Christ
                      </div>
                      <div className="font-body text-[10.5px] text-cream/70 mt-px leading-[1.4]">
                        Foundation under every path.
                      </div>
                    </div>
                    <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-gold font-semibold">
                      Always on
                    </div>
                  </div>

                  <div className="flex flex-col gap-[7px]">
                    <div
                      className="rounded-[12px] px-3.5 py-3 flex items-center gap-2.5"
                      style={{
                        background: "rgba(223,175,55,0.05)",
                        border: "1px solid rgba(223,175,55,0.5)",
                      }}
                    >
                      <div className="font-heading font-semibold text-[12.5px] text-cream flex-1">
                        Mental toughness
                      </div>
                      <div className="w-4 h-4 rounded-pill bg-gold flex items-center justify-center text-onyx">
                        <SvgIcon name="check" size={9} />
                      </div>
                    </div>
                    {[
                      "Quiet confidence",
                      "Reset after mistakes",
                      "Daily discipline",
                      "Pressure & focus",
                    ].map((label) => (
                      <div
                        key={label}
                        className="bg-charcoal border border-hairline rounded-[12px] px-3.5 py-3 font-heading font-semibold text-[12.5px] text-cream"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PreviewItem>

            {/* 3. Pre-Game Mindset */}
            <PreviewItem
              lbl="03 / Pre-game mindset"
              ttl="Breathe. Focus. Compete."
              sub="A guided reset between locker room and ice."
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
                      Pre-game · 18 min out
                    </div>
                    <div className="mt-5 font-display font-extrabold text-[34px] leading-[0.95] tracking-[0.02em] uppercase text-cream">
                      Breathe.
                      <br />
                      Focus.
                      <br />
                      Compete.
                    </div>
                  </div>

                  <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                    <div
                      className="absolute w-40 h-40 rounded-full"
                      style={{ border: "1px solid rgba(36,91,255,0.18)" }}
                    />
                    <div
                      className="absolute w-[120px] h-[120px] rounded-full"
                      style={{ border: "1px solid rgba(36,91,255,0.32)" }}
                    />
                    <div
                      className="w-20 h-20 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle at 35% 30%,rgba(223,175,55,0.5),rgba(36,91,255,0.45) 60%,rgba(7,26,51,0.6) 100%)",
                        boxShadow: "0 0 60px rgba(36,91,255,0.25)",
                      }}
                    />
                  </div>

                  <div>
                    <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-cream/50 font-semibold mb-1.5">
                      One controllable
                    </div>
                    <div
                      className="rounded-[12px] px-3.5 py-3 font-heading font-medium text-[13px] text-cream"
                      style={{
                        background: "rgba(5,5,5,0.55)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(247,247,247,0.14)",
                      }}
                    >
                      First-shift effort. Body language steady.
                    </div>
                    <div className="bg-gold text-onyx font-display font-extrabold uppercase tracking-[0.14em] text-[12px] rounded-[10px] px-3.5 py-3 text-center mt-2.5">
                      Lock in
                    </div>
                  </div>
                </div>
              </div>
            </PreviewItem>

            {/* 4. Post-Game Reset */}
            <PreviewItem
              lbl="04 / Post-game reset"
              ttl="Won, lost, mistake, tough — every game has a reset."
              sub="Reflection before recap. Name it, release it, carry the lesson."
            >
              <div className="fv-phone-screen">
                <div className="fv-phone-notch" />
                <PhoneStatusBar small />
                <div className="px-[18px] pt-1.5 pb-[18px] flex-1 overflow-hidden">
                  <div className="mb-3.5">
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
                      Post-game reset
                    </div>
                    <div className="font-heading font-semibold text-[17px] text-cream mt-1 tracking-[-0.01em]">
                      After the game
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-[7px] mb-3.5">
                    <div
                      className="rounded-[12px] px-3 py-3 text-cream"
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
                        className="bg-charcoal border border-hairline rounded-[12px] px-3 py-3"
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

                  <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-gold font-semibold mb-[7px]">
                    Today&apos;s prompt
                  </div>
                  <div className="font-heading font-semibold text-[14.5px] leading-[1.3] text-cream tracking-[-0.005em] mb-2.5">
                    Name the moment you wish you could replay. Then write what
                    you&apos;d do next.
                  </div>
                  <div className="bg-surface-1 border border-hairline rounded-[12px] px-3 py-2.5 font-body text-[11.5px] text-cream/50 min-h-[68px]">
                    Lost the puck at the blue line, 2nd period. Next time: three
                    steps, back-check, reset…
                  </div>
                  <div className="flex justify-between mt-2.5 font-mono text-[8.5px] tracking-[0.16em] uppercase text-cream/50 font-semibold">
                    <span>Private to you</span>
                    <span>96 chars</span>
                  </div>
                </div>
              </div>
            </PreviewItem>

            {/* 5. Journal Reflection */}
            <PreviewItem
              lbl="05 / Journal reflection"
              ttl="Honest prompts. Private space."
              sub="Scripture-anchored journaling kept private to you."
            >
              <div className="fv-phone-screen">
                <div className="fv-phone-notch" />
                <PhoneStatusBar small />
                <div className="px-[18px] pt-1.5 pb-[18px] flex-1 overflow-hidden">
                  <div className="mb-3.5">
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
                      Journal · Day 12
                    </div>
                    <div className="font-heading font-semibold text-[17px] text-cream mt-1 tracking-[-0.01em]">
                      Reflect
                    </div>
                  </div>

                  <div className="fv-card-verse border border-hairline rounded-[18px] p-3.5 mb-3.5">
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-gold font-semibold">
                      2 TIMOTHY 1:7
                    </div>
                    <div className="font-scripture text-[13.5px] leading-[1.5] text-cream mt-2">
                      &ldquo;For God gave us a spirit not of fear but of power
                      and love and self-control.&rdquo;
                    </div>
                  </div>

                  <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-gold font-semibold mb-1.5">
                    Today&apos;s prompt
                  </div>
                  <div className="font-heading font-semibold text-[14.5px] leading-[1.3] text-cream tracking-[-0.005em] mb-3">
                    Where did fear show up this week? Where did self-control
                    show up?
                  </div>
                  <div className="bg-surface-1 border border-hairline rounded-[12px] px-3.5 py-3 font-body text-[12px] text-cream/70 leading-[1.6] min-h-[96px]">
                    Fear before the puck drop. I tried to be small. Self-control
                    — I didn&apos;t argue back when coach pulled me…
                  </div>
                  <div className="flex justify-between mt-2.5 items-center">
                    <div className="font-mono text-[8.5px] tracking-[0.16em] uppercase text-cream/50 font-semibold">
                      Private to you
                    </div>
                    <div className="font-mono text-[8.5px] tracking-[0.16em] uppercase text-cream/50 font-semibold">
                      142 chars
                    </div>
                  </div>
                </div>
              </div>
            </PreviewItem>

            {/* 6. Weekly Rhythm Review */}
            <PreviewItem
              lbl="06 / Weekly rhythm review"
              ttl="Consistency over guilt."
              sub="Track rhythm, not streaks. Returning is the goal."
            >
              <div className="fv-phone-screen">
                <div className="fv-phone-notch" />
                <PhoneStatusBar small />
                <div className="px-[18px] pt-1.5 pb-[18px] flex-1 overflow-hidden">
                  <div className="mb-3.5">
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold">
                      Week of Mar 10
                    </div>
                    <div className="font-heading font-semibold text-[17px] text-cream mt-1 tracking-[-0.01em]">
                      Weekly rhythm
                    </div>
                  </div>

                  <div
                    className="rounded-[16px] p-4 mb-3.5"
                    style={{
                      background:
                        "linear-gradient(180deg,rgba(223,175,55,0.06),rgba(223,175,55,0)),var(--bg-elev-1)",
                      border: "1px solid rgba(223,175,55,0.22)",
                    }}
                  >
                    <div className="flex justify-between items-center mb-3.5">
                      <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-gold font-semibold">
                        5 of 7 days practiced
                      </div>
                      <div className="font-heading font-semibold text-[13px] text-cream">
                        Steady
                      </div>
                    </div>
                    <RhythmWeek />
                  </div>

                  <div className="bg-charcoal border border-hairline rounded-[14px] p-3.5 mb-2">
                    <div className="font-mono text-[9px] tracking-[0.20em] uppercase text-cream/50 font-semibold mb-1.5">
                      Return moments
                    </div>
                    <div className="font-heading font-semibold text-[14px] text-cream">
                      2 returns this week
                    </div>
                    <div className="font-body text-[11.5px] text-cream/70 mt-1 leading-[1.45]">
                      Missed Wednesday. Came back Thursday morning. That&apos;s
                      the rhythm.
                    </div>
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
        <h4 className="font-heading font-semibold text-[16px] text-cream tracking-[-0.005em] m-0">
          {ttl}
        </h4>
        <p className="font-body text-[13px] text-cream/50 leading-[1.5] m-0">
          {sub}
        </p>
      </div>
    </div>
  );
}

function ModuleTile({
  icon,
  name,
  duration,
  done = false,
}: {
  icon: "wind" | "book";
  name: string;
  duration: string;
  done?: boolean;
}) {
  return (
    <div className="bg-charcoal border border-hairline rounded-[14px] p-2.5 min-h-[88px] flex flex-col justify-between">
      <div
        className={`w-[26px] h-[26px] rounded-[8px] flex items-center justify-center ${
          done ? "text-gold" : "text-cream/70 bg-cream/[0.04]"
        }`}
        style={
          done
            ? {
                background: "var(--fv-gold-soft)",
                border: "1px solid rgba(223,175,55,0.28)",
              }
            : undefined
        }
      >
        <SvgIcon name={icon} size={13} />
      </div>
      <div className="flex justify-between items-end mt-2 gap-1.5">
        <div className="font-heading font-semibold text-[12px] text-cream">
          {name}
        </div>
        <div
          className={`font-mono text-[8px] tracking-[0.14em] uppercase font-semibold ${
            done ? "text-gold" : "text-cream/50"
          }`}
        >
          {duration}
        </div>
      </div>
    </div>
  );
}

function BottomTabBar() {
  return (
    <div
      className="absolute left-0 right-0 bottom-0 h-16 flex items-center justify-around pb-2.5 border-t border-hairline"
      style={{
        background: "rgba(5,5,5,0.85)",
        backdropFilter: "blur(14px)",
      }}
    >
      {[
        { icon: "home" as const, label: "Today", active: true },
        { icon: "target" as const, label: "Train" },
        { icon: "pen" as const, label: "Journal" },
        { icon: "user" as const, label: "You" },
      ].map((t) => (
        <div
          key={t.label}
          className={`flex flex-col items-center gap-1 font-mono text-[9px] tracking-[0.14em] uppercase font-semibold ${
            t.active ? "text-gold" : "text-cream/50"
          }`}
        >
          <SvgIcon name={t.icon} size={20} />
          {t.label}
        </div>
      ))}
    </div>
  );
}

function RhythmWeek() {
  const bars: { day: string; pct: number; tone: "gold" | "cobalt"; today?: boolean }[] = [
    { day: "M", pct: 100, tone: "gold" },
    { day: "T", pct: 75, tone: "gold" },
    { day: "W", pct: 0, tone: "gold" },
    { day: "T", pct: 100, tone: "gold" },
    { day: "F", pct: 50, tone: "cobalt" },
    { day: "S", pct: 0, tone: "gold" },
    { day: "S", pct: 60, tone: "cobalt", today: true },
  ];

  return (
    <div className="grid grid-cols-7 gap-[5px]">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-[5px]"
        >
          <div
            className="w-full h-[42px] rounded-[5px] bg-cream/[0.05] relative overflow-hidden"
            style={
              b.today ? { border: "1px solid rgba(223,175,55,0.4)" } : undefined
            }
          >
            {b.pct > 0 && (
              <div
                className={`absolute left-0 right-0 bottom-0 rounded-[5px] ${
                  b.tone === "gold" ? "bg-gold" : "bg-cobalt"
                }`}
                style={{ height: `${b.pct}%` }}
              />
            )}
          </div>
          <div
            className={`font-mono text-[8px] tracking-[0.14em] uppercase font-semibold ${
              b.today ? "text-gold" : "text-cream/50"
            }`}
          >
            {b.day}
          </div>
        </div>
      ))}
    </div>
  );
}
