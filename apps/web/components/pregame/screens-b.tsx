"use client";

import {
  Button,
  Card,
  CustomInputRow,
  Eyebrow,
  Icon,
  ScreenBody,
  SectionLabel,
  SelectCard,
  SelectChip,
  VerseRef,
} from "./shared";
import {
  ADVERSITIES,
  COMMITMENT_OPTIONS,
  COPING_PLAN,
  CUE_WORDS,
  DEFAULTS,
  RESET_ANCHORS,
  ROLE_CONTENT,
  SCRIPTURE_REF,
  SCRIPTURE_SHORT,
  SELF_TALK_OPTIONS,
  type PregameState,
  type Role,
} from "./types";

type SetFn = <K extends keyof PregameState>(k: K, v: PregameState[K]) => void;

// ─── SCREEN 8 ─── Role-Specific Rehearsal
export function RoleScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  const role = state.role;
  const roleNames = Object.keys(ROLE_CONTENT) as Role[];

  return (
    <ScreenBody>
      <SectionLabel>Step 07 · Your Role</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        What position are you playing today?
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        We&rsquo;ll rehearse the job that&rsquo;s actually yours.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {roleNames.map((r) => {
          const selected = state.role === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => set("role", r)}
              aria-pressed={selected}
              className={`rounded-[12px] border px-2 py-3.5 font-heading text-[14px] font-semibold transition-colors duration-fast ${
                selected
                  ? "border-gold/55 bg-gold/[0.06] text-gold"
                  : "border-hairline bg-charcoal text-cream"
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>

      {role && (
        <div className="mt-5">
          <Card accent="verse">
            <Eyebrow className="!text-gold">{role.toUpperCase()}</Eyebrow>
            <h2 className="mb-4 mt-2 font-heading text-[20px] font-bold leading-[1.3] text-cream">
              {ROLE_CONTENT[role].title}
            </h2>
            <div className="flex flex-col gap-2.5">
              {ROLE_CONTENT[role].scenes.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-[10px] border border-hairline bg-cream/[0.025] px-3.5 py-3"
                >
                  <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-gold/45 font-mono text-[10px] text-gold">
                    {i + 1}
                  </div>
                  <span className="font-heading text-[15px] font-medium text-cream">
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 9 ─── Coping Visualization
export function CopingScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  return (
    <ScreenBody>
      <SectionLabel>Step 08 · Rehearse Adversity</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Rehearse the hard moment.
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        Choose one thing that could happen today. We&rsquo;ll build the plan now,
        not in panic later.
      </p>

      <div className="flex flex-wrap gap-2">
        {ADVERSITIES.map((a) => (
          <SelectChip
            key={a}
            label={a}
            selected={state.adversity === a}
            onClick={() => set("adversity", a)}
          />
        ))}
      </div>

      {state.adversity && (
        <div className="mt-5">
          <div className="overflow-hidden rounded-[14px] border border-hairline bg-charcoal">
            <div
              className="border-b border-hairline px-[18px] py-3.5"
              style={{
                background:
                  "linear-gradient(180deg, rgba(223,175,55,0.08), rgba(223,175,55,0))",
              }}
            >
              <Eyebrow className="!text-gold">If this happens</Eyebrow>
              <div className="mt-1 font-heading text-[18px] font-semibold leading-[1.3] text-cream">
                {state.adversity}
              </div>
            </div>

            <div className="px-[18px] pb-1 pt-[18px]">
              <Eyebrow>Response Plan</Eyebrow>
            </div>
            <div className="flex flex-col gap-2 px-[18px] pb-[18px] pt-2">
              {COPING_PLAN.map((p, i) => {
                const last = i === COPING_PLAN.length - 1;
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <div
                      className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-[1.5px] font-mono text-[10px] font-bold ${
                        last
                          ? "border-gold bg-gold text-onyx"
                          : "border-gold/45 bg-transparent text-gold"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`font-heading text-[16px] text-cream ${
                        last ? "font-bold" : "font-medium"
                      }`}
                    >
                      {p}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-hairline bg-cream/[0.025] px-5 py-4">
              <p className="font-scripture text-[17px] italic leading-[1.45] text-cream">
                Your mistake is real.{" "}
                <span className="font-heading font-bold not-italic text-gold">
                  It is not your identity.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 10 ─── Second-Person Self-Talk
export function SelfTalkScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  const isCustom = !!state.selfTalk && !SELF_TALK_OPTIONS.includes(state.selfTalk);

  return (
    <ScreenBody>
      <SectionLabel>Step 09 · Coach Yourself</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Coach yourself like someone you trust would coach you.
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        What do you need to hear when pressure hits?
      </p>

      <div className="flex flex-col gap-2">
        {SELF_TALK_OPTIONS.map((p) => (
          <SelectCard
            key={p}
            label={p}
            selected={state.selfTalk === p}
            onClick={() => set("selfTalk", p)}
            compact
          />
        ))}
        <CustomInputRow
          value={isCustom ? state.selfTalk ?? "" : ""}
          selected={isCustom}
          onChange={(v) => set("selfTalk", v)}
          placeholder="Write your own coaching line"
          ariaLabel="Write your own coaching line"
        />
      </div>

      {state.selfTalk && (
        <div
          className="relative mt-5 rounded-[14px] border border-gold/35 p-5"
          style={{
            background:
              "linear-gradient(180deg, rgba(223,175,55,0.08), rgba(36,91,255,0.04)), var(--fv-charcoal)",
          }}
        >
          <div className="absolute left-3.5 top-2.5 font-scripture text-[36px] leading-none text-gold/70">
            &ldquo;
          </div>
          <p className="ml-[22px] mt-1.5 font-heading text-[19px] font-semibold leading-[1.35] text-cream">
            {state.selfTalk}
          </p>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 11 ─── Reset Anchor + Cue Word
export function ResetScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  const isCustomAnchor = !!state.anchor && !RESET_ANCHORS.includes(state.anchor);

  return (
    <ScreenBody>
      <SectionLabel>Step 10 · Reset Anchor</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        Choose your reset anchor.
      </h1>
      <p className="mb-3.5 font-body text-[14px] text-cream/50">
        When pressure hits, what physical cue brings you back?
      </p>

      <div className="grid grid-cols-2 gap-2">
        {RESET_ANCHORS.map((a) => {
          const selected = state.anchor === a;
          return (
            <button
              key={a}
              type="button"
              onClick={() => set("anchor", a)}
              aria-pressed={selected}
              className={`rounded-[12px] border px-3.5 py-3.5 text-left font-heading text-[14px] font-medium text-cream transition-colors duration-fast ${
                selected
                  ? "border-gold/55 bg-gold/[0.06]"
                  : "border-hairline bg-charcoal"
              }`}
            >
              {a}
            </button>
          );
        })}
      </div>
      <div className="mt-2">
        <CustomInputRow
          value={isCustomAnchor ? state.anchor ?? "" : ""}
          selected={isCustomAnchor}
          onChange={(v) => set("anchor", v)}
          placeholder="Custom anchor"
          ariaLabel="Custom reset anchor"
        />
      </div>

      <div className="h-6" />
      <h2 className="mb-1 font-heading text-[22px] font-bold text-cream">
        Choose your cue word.
      </h2>
      <p className="mb-3.5 font-body text-[13px] text-cream/50">
        One word. The one you&rsquo;d say to yourself between shifts.{" "}
        <span className="text-cream/70">Default: Faithful.</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {CUE_WORDS.map((w) => {
          const selected = state.cueWord === w;
          return (
            <button
              key={w}
              type="button"
              onClick={() => set("cueWord", w)}
              aria-pressed={selected}
              className={`rounded-pill border px-4 py-2.5 font-display text-[13px] font-extrabold uppercase tracking-[0.10em] transition-colors duration-fast ${
                selected
                  ? "border-gold bg-gold text-onyx"
                  : "border-hairline bg-transparent text-cream"
              }`}
            >
              {w}
            </button>
          );
        })}
      </div>

      {(state.anchor || state.cueWord) && (
        <div
          className="mt-5 rounded-[14px] border border-hairline px-[18px] py-4"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(223,175,55,0.08), transparent 60%), var(--fv-surface-1)",
          }}
        >
          <Eyebrow className="!text-gold">Your Reset</Eyebrow>
          <div className="mt-2.5 flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/50">
                Anchor
              </span>
              <span className="font-heading text-[15px] font-semibold text-cream">
                {state.anchor || "—"}
              </span>
            </div>
            <div className="h-px bg-hairline" />
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/50">
                Cue word
              </span>
              <span className="font-display text-[20px] font-extrabold uppercase tracking-[0.08em] text-gold">
                {state.cueWord || "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 12 ─── Game Commitment
export function CommitScreen({
  state,
  set,
}: {
  state: PregameState;
  set: SetFn;
}) {
  const isCustom = !!state.commitment && !COMMITMENT_OPTIONS.includes(state.commitment);
  return (
    <ScreenBody>
      <SectionLabel>Step 11 · Commitment</SectionLabel>
      <h1 className="mb-1 font-heading text-[26px] font-bold leading-[1.15] text-cream">
        What is one thing you will do today no matter what?
      </h1>
      <p className="mb-4 font-body text-[14px] text-cream/50">
        Not the result. The behavior you control.
      </p>

      <div className="flex flex-col gap-2">
        {COMMITMENT_OPTIONS.map((o) => (
          <SelectCard
            key={o}
            label={o}
            selected={state.commitment === o}
            onClick={() => set("commitment", o)}
            compact
          />
        ))}
        <CustomInputRow
          value={isCustom ? state.commitment ?? "" : ""}
          selected={isCustom}
          onChange={(v) => set("commitment", v)}
          placeholder="Your own commitment"
          ariaLabel="Your own commitment"
        />
      </div>

      {state.commitment && (
        <div
          className="mt-5 rounded-[16px] border border-gold/45 px-5 py-5"
          style={{
            background:
              "linear-gradient(180deg, rgba(223,175,55,0.10), rgba(223,175,55,0.02))",
          }}
        >
          <Eyebrow className="!text-gold">Today&rsquo;s Commitment</Eyebrow>
          <p className="mt-2.5 font-display text-[26px] font-extrabold uppercase leading-[1.1] tracking-[0.01em] text-cream">
            {state.commitment}
          </p>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── SCREEN 13 ─── Prayer / Send-Off
export function PrayerScreen() {
  return (
    <div
      className="flex-1 overflow-y-auto px-6 pb-[130px] pt-5"
      style={{
        background:
          "radial-gradient(80% 50% at 50% 30%, rgba(36,91,255,0.10), transparent 60%), radial-gradient(60% 40% at 50% 100%, rgba(223,175,55,0.07), transparent 70%), var(--fv-onyx)",
      }}
    >
      <Eyebrow className="!text-center !text-[11px] !tracking-[0.26em] !text-gold">
        Step 12 · Send-Off
      </Eyebrow>

      <h1 className="m-0 mt-3.5 mb-1 text-center font-display text-[48px] font-extrabold uppercase leading-none tracking-[0.02em] text-cream">
        Play from <span className="text-gold">victory</span>.
      </h1>

      <div className="h-7" />

      <Card accent="prayer" className="!p-6">
        <div className="mb-3.5 text-center">
          <Eyebrow>A Prayer</Eyebrow>
        </div>
        <p className="m-0 text-center font-scripture text-[17px] italic leading-[1.6] text-cream">
          Lord, help me compete with courage, humility, and joy. Help me serve
          my team, respond well to mistakes, and remember that my worth is
          secure in You.
          <span className="mt-3 block font-heading text-[12px] font-semibold uppercase not-italic tracking-[0.18em] text-gold">
            Amen.
          </span>
        </p>
      </Card>

      <div className="h-6" />

      <p className="m-0 px-2 text-center font-scripture text-[18px] italic leading-[1.45] text-cream/70">
        You are not playing for your worth.
        <br />
        <span className="font-heading font-bold not-italic text-cream">
          You are playing from it.
        </span>
      </p>
    </div>
  );
}

// ─── SCREEN 14 ─── Pregame Card
function CardRow({
  label,
  value,
  italic,
  bold,
}: {
  label: string;
  value: string;
  italic?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/50">
        {label}
      </div>
      <div
        className={`text-[15px] leading-[1.35] text-cream ${
          italic ? "font-scripture italic" : "font-heading"
        } ${bold ? "font-bold" : "font-medium"}`}
      >
        {value}
      </div>
    </div>
  );
}

export function PregameCardScreen({
  state,
  onQuick,
  onDone,
}: {
  state: PregameState;
  onQuick: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-onyx px-5 pb-8 pt-5">
      <div className="mb-4 text-center">
        <Eyebrow className="!tracking-[0.26em] !text-gold">
          Your Pre-Game Card
        </Eyebrow>
        <p className="mt-1.5 font-body text-[13px] text-cream/50">
          Screenshot it. Open it before puck drop.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-[22px] border border-gold/30 px-5 pb-5 pt-6"
        style={{
          background:
            "radial-gradient(100% 60% at 50% 0%, rgba(223,175,55,0.10), transparent 65%), radial-gradient(80% 50% at 50% 100%, rgba(36,91,255,0.08), transparent 70%), linear-gradient(180deg, #0d0d0d, #060606)",
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(247,247,247,0.04)",
        }}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.22em] text-cream/50">
              From Victory
            </div>
            <div className="mt-px font-display text-[14px] font-extrabold uppercase tracking-[0.10em] text-cream">
              Pre-Game
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-cream/50">
              Today
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-gold">
              {state.gameType ?? "Game day"}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <VerseRef>{SCRIPTURE_REF.toUpperCase()}</VerseRef>
          <p className="mt-2 font-scripture text-[15px] italic leading-[1.5] text-cream/70">
            {SCRIPTURE_SHORT}
          </p>
        </div>

        <div className="mb-5 border-y border-hairline py-4">
          <div className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/50">
            Cue Word
          </div>
          <div className="font-display text-[52px] font-extrabold uppercase leading-[0.95] tracking-[0.04em] text-gold">
            {state.cueWord || DEFAULTS.cueWord}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <CardRow label="Reset anchor" value={state.anchor || DEFAULTS.anchor} />
          <CardRow
            label="Self-talk"
            value={state.selfTalk || DEFAULTS.selfTalk}
            italic
          />
          <CardRow
            label="Commitment"
            value={state.commitment || DEFAULTS.commitment}
            bold
          />
          {state.role && <CardRow label="Role" value={state.role} />}
        </div>

        <div className="mt-5 border-t border-hairline pt-3.5 text-center">
          <p className="m-0 font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-cream">
            Play From <span className="text-gold">Victory</span>.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          full
          onClick={onQuick}
          leading={<Icon name="bolt" size={14} className="text-gold" />}
        >
          Quick reset
        </Button>
        <Button variant="coach" full onClick={onDone}>
          DONE
        </Button>
      </div>
    </div>
  );
}
