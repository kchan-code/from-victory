"use client";

// Pregame flow — visualization → Beat 1 → Beat 2 → completion.
// Architecture: state machine over a pre-built step timeline.
// Setup choices (tier + cue word) drive how the timeline is built.
// No persistence — see docs/feature-roadmap.md.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Tier = "60s" | "90s" | "3min";
type Intensity = "ready" | "too_much";

type StepKind =
  | "viz-anchor"
  | "settle"
  | "prime"
  | "imagery"
  | "reset"
  | "orient"
  | "breath"
  | "beat1-anchor"
  | "beat2"
  | "completion";

type Step = {
  id: string;
  kind: StepKind;
  duration_ms: number;
  cueWord?: string;
  framing?: string;
  loopIndex?: number;
};

const CUE_OPTIONS = [
  "Stick on puck",
  "Head up, read",
  "First step quick",
  "Hard on pucks",
  "Stay in the play",
] as const;

const VIZ_LOOP_FRAMINGS = [
  "First action",
  "A different read",
  "After the miss",
] as const;

const BEAT1_ANCHOR_LINE = "I am loved before the whistle. I play from that.";
const VIZ_ANCHOR_LINE = "Loved before the first whistle. Now: see the game.";

function buildSteps(tier: Tier, cueWord: string): Step[] {
  const loops = tier === "60s" ? 1 : tier === "90s" ? 2 : 3;
  const steps: Step[] = [];

  // 5s identity anchor before Loop 1 only
  steps.push({ id: "viz-anchor", kind: "viz-anchor", duration_ms: 5000 });

  for (let i = 0; i < loops; i++) {
    steps.push({ id: `l${i}-settle`, kind: "settle", duration_ms: 5000, loopIndex: i });
    steps.push({
      id: `l${i}-prime`,
      kind: "prime",
      duration_ms: 10000,
      cueWord,
      framing: VIZ_LOOP_FRAMINGS[i],
      loopIndex: i,
    });
    steps.push({
      id: `l${i}-imagery`,
      kind: "imagery",
      duration_ms: 28000,
      loopIndex: i,
    });
    steps.push({ id: `l${i}-reset`, kind: "reset", duration_ms: 10000, loopIndex: i });
  }

  steps.push({ id: "beat1-orient", kind: "orient", duration_ms: 5000 });
  steps.push({ id: "beat1-breath", kind: "breath", duration_ms: 30000 });
  steps.push({ id: "beat1-anchor", kind: "beat1-anchor", duration_ms: 10000 });
  steps.push({ id: "beat2", kind: "beat2", duration_ms: 30000, cueWord });
  steps.push({ id: "completion", kind: "completion", duration_ms: 0 });

  return steps;
}

type Props = {
  athleteFirstName: string;
};

export function PregameFlow({ athleteFirstName }: Props) {
  const [mode, setMode] = useState<"setup" | "running" | "completion">("setup");
  const [tier, setTier] = useState<Tier>("90s");
  const [cueWord, setCueWord] = useState<string>(CUE_OPTIONS[0]);
  const [customCue, setCustomCue] = useState<string>("");
  const [useCustomCue, setUseCustomCue] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<Intensity>("ready");

  const finalCue = useCustomCue && customCue.trim() ? customCue.trim() : cueWord;

  const steps = useMemo<Step[]>(
    () => (mode === "running" ? buildSteps(tier, finalCue) : []),
    [mode, tier, finalCue],
  );

  if (mode === "completion") {
    return <CompletionScreen athleteFirstName={athleteFirstName} />;
  }

  if (mode === "running") {
    return (
      <Runner
        steps={steps}
        cueWord={finalCue}
        intensity={intensity}
        onComplete={() => setMode("completion")}
      />
    );
  }

  return (
    <SetupScreen
      tier={tier}
      setTier={setTier}
      cueWord={cueWord}
      setCueWord={setCueWord}
      customCue={customCue}
      setCustomCue={setCustomCue}
      useCustomCue={useCustomCue}
      setUseCustomCue={setUseCustomCue}
      intensity={intensity}
      setIntensity={setIntensity}
      onStart={() => setMode("running")}
    />
  );
}

// ---------------------------------------------------------------------------
// Setup screen — tier, cue word, intensity, start
// ---------------------------------------------------------------------------

type SetupProps = {
  tier: Tier;
  setTier: (t: Tier) => void;
  cueWord: string;
  setCueWord: (c: string) => void;
  customCue: string;
  setCustomCue: (c: string) => void;
  useCustomCue: boolean;
  setUseCustomCue: (b: boolean) => void;
  intensity: Intensity;
  setIntensity: (i: Intensity) => void;
  onStart: () => void;
};

function SetupScreen(props: SetupProps) {
  const tierDescriptions: Record<Tier, { label: string; sub: string }> = {
    "60s": { label: "60 seconds", sub: "One loop. For tight benches and chaos." },
    "90s": { label: "90 seconds", sub: "Two loops. Offense and defense." },
    "3min": { label: "3 minutes", sub: "Three loops. Adds coping imagery." },
  };

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8 text-cream">
      <div className="mx-auto max-w-[560px]">
        <header className="flex items-center justify-between mb-10">
          <Link
            href="/athlete"
            className="font-body text-[14px] text-cream/60 hover:text-cream no-underline"
          >
            ← Back
          </Link>
          <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold">
            Pregame
          </p>
        </header>

        <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[32px] sm:text-[40px] leading-[1.05] mb-3">
          Settle in.
        </h1>
        <p className="font-body text-cream/65 text-[15px] leading-relaxed mb-10">
          A few short loops, a breath, and a settled identity before you step
          on.
        </p>

        <Section title="How long do you have?">
          <div className="grid grid-cols-1 gap-2.5">
            {(Object.keys(tierDescriptions) as Tier[]).map((t) => {
              const active = props.tier === t;
              const d = tierDescriptions[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => props.setTier(t)}
                  className={`text-left rounded-xl px-4 py-3.5 transition-all duration-base ease-out border ${
                    active
                      ? "border-[rgba(223,175,55,0.5)] bg-[rgba(223,175,55,0.06)]"
                      : "border-hairline bg-surface-1 hover:border-hairline-strong"
                  }`}
                >
                  <p
                    className={`font-display font-bold uppercase tracking-[0.04em] text-[15px] ${
                      active ? "text-gold" : "text-cream"
                    }`}
                  >
                    {d.label}
                  </p>
                  <p className="font-body text-[13px] text-cream/55 mt-0.5 leading-snug">
                    {d.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Pick a focus cue for this game">
          <div className="grid grid-cols-1 gap-2">
            {CUE_OPTIONS.map((c) => {
              const active = !props.useCustomCue && props.cueWord === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    props.setCueWord(c);
                    props.setUseCustomCue(false);
                  }}
                  className={`text-left rounded-[10px] px-4 py-3 border font-body text-[14px] transition-all duration-base ease-out ${
                    active
                      ? "border-[rgba(223,175,55,0.5)] bg-[rgba(223,175,55,0.06)] text-gold"
                      : "border-hairline bg-surface-1 text-cream/85 hover:border-hairline-strong"
                  }`}
                >
                  {c}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => props.setUseCustomCue(true)}
              className={`text-left rounded-[10px] px-4 py-3 border font-body text-[14px] transition-all duration-base ease-out ${
                props.useCustomCue
                  ? "border-[rgba(223,175,55,0.5)] bg-[rgba(223,175,55,0.06)] text-gold"
                  : "border-hairline bg-surface-1 text-cream/85 hover:border-hairline-strong"
              }`}
            >
              Other…
            </button>
            {props.useCustomCue ? (
              <input
                type="text"
                value={props.customCue}
                onChange={(e) => props.setCustomCue(e.target.value)}
                placeholder="Your cue word or phrase"
                maxLength={40}
                autoFocus
                className="mt-1 bg-surface-1 border border-hairline rounded-[10px] px-4 py-3 text-cream font-body text-[14px] outline-none transition-colors duration-base ease-out focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18]"
              />
            ) : null}
          </div>
        </Section>

        <Section title="How does pregame feel right now?">
          <div className="grid grid-cols-2 gap-2.5">
            {(["ready", "too_much"] as Intensity[]).map((i) => {
              const active = props.intensity === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => props.setIntensity(i)}
                  className={`text-center rounded-[10px] px-3 py-3 border font-body text-[13px] transition-all duration-base ease-out ${
                    active
                      ? "border-[rgba(223,175,55,0.5)] bg-[rgba(223,175,55,0.06)] text-gold"
                      : "border-hairline bg-surface-1 text-cream/75 hover:border-hairline-strong"
                  }`}
                >
                  {i === "ready" ? "Ready" : "Too much"}
                </button>
              );
            })}
          </div>
          <p className="font-body text-cream/45 text-[12px] mt-2.5 leading-snug">
            Helps us calibrate the cues. No wrong answer.
          </p>
        </Section>

        <button
          type="button"
          onClick={props.onStart}
          disabled={props.useCustomCue && !props.customCue.trim()}
          className="w-full mt-2 inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Start pregame
        </button>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-cream/50 mb-3">
        {title}
      </p>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Runner — walks the step timeline with timers
// ---------------------------------------------------------------------------

type RunnerProps = {
  steps: Step[];
  cueWord: string;
  intensity: Intensity;
  onComplete: () => void;
};

function Runner({ steps, cueWord, intensity, onComplete }: RunnerProps) {
  const [index, setIndex] = useState(0);
  const [stepStartedAt, setStepStartedAt] = useState(() => Date.now());
  const timerRef = useRef<number | null>(null);

  const step = steps[index];

  useEffect(() => {
    if (!step) return;
    if (step.kind === "completion") {
      // Completion has 0 duration — finalize.
      onComplete();
      return;
    }

    setStepStartedAt(Date.now());
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIndex((i) => i + 1);
    }, step.duration_ms);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index, step, onComplete]);

  if (!step) return null;

  const advance = () => setIndex((i) => i + 1);

  return (
    <main className="min-h-screen bg-onyx text-cream flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-8 py-5">
        <Link
          href="/athlete"
          className="font-body text-[13px] text-cream/50 hover:text-cream/80 no-underline"
        >
          Stop
        </Link>
        <PhaseIndicator step={step} steps={steps} index={index} />
        <button
          type="button"
          onClick={advance}
          className="font-body text-[13px] text-cream/50 hover:text-cream/80 bg-transparent border-0 cursor-pointer p-0"
        >
          Skip →
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 sm:px-8">
        <div className="w-full max-w-[520px]">
          <StepView
            key={step.id}
            step={step}
            cueWord={cueWord}
            intensity={intensity}
            stepStartedAt={stepStartedAt}
          />
        </div>
      </div>

      <footer className="px-5 sm:px-8 py-5">
        <StepProgress
          stepStartedAt={stepStartedAt}
          duration_ms={step.duration_ms}
        />
      </footer>
    </main>
  );
}

function PhaseIndicator({
  step,
  steps,
  index,
}: {
  step: Step;
  steps: Step[];
  index: number;
}) {
  const vizKinds: StepKind[] = ["viz-anchor", "settle", "prime", "imagery", "reset"];
  const beat1Kinds: StepKind[] = ["orient", "breath", "beat1-anchor"];
  const phase = vizKinds.includes(step.kind)
    ? "Visualization"
    : beat1Kinds.includes(step.kind)
      ? "Beat 1"
      : step.kind === "beat2"
        ? "Beat 2"
        : "";

  const total = steps.filter((s) => s.kind !== "completion").length;
  const current = Math.min(index + 1, total);

  return (
    <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-gold">
      {phase} <span className="text-cream/40 ml-2">{current}/{total}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Step view — renders the right content per step kind
// ---------------------------------------------------------------------------

function StepView({
  step,
  cueWord,
  intensity,
  stepStartedAt,
}: {
  step: Step;
  cueWord: string;
  intensity: Intensity;
  stepStartedAt: number;
}) {
  switch (step.kind) {
    case "viz-anchor":
      return (
        <Centered>
          <AnchorLine>{VIZ_ANCHOR_LINE}</AnchorLine>
        </Centered>
      );

    case "settle":
      return (
        <Centered>
          <Eyebrow>
            Loop {(step.loopIndex ?? 0) + 1} · {step.framing ?? "First action"}
          </Eyebrow>
          <Quiet>Settle. Eyes soft. One exhale.</Quiet>
        </Centered>
      );

    case "prime":
      return (
        <Centered>
          <Eyebrow>{step.framing ?? "First action"}</Eyebrow>
          <CueWordHero>{cueWord}</CueWordHero>
          <Quiet className="mt-6">
            {intensity === "too_much" ? "Calm focus. Stay with the cue." : "See it. First-person. Real speed."}
          </Quiet>
        </Centered>
      );

    case "imagery":
      return (
        <Centered>
          <ImageryRing duration_ms={step.duration_ms} stepStartedAt={stepStartedAt} />
        </Centered>
      );

    case "reset":
      return (
        <Centered>
          <Quiet>Release. One breath. Eyes open.</Quiet>
        </Centered>
      );

    case "orient":
      return (
        <Centered>
          <Eyebrow>Beat 1 · Orient</Eyebrow>
          <Quiet>Sit. Phone in hand. Today&rsquo;s game, your role.</Quiet>
        </Centered>
      );

    case "breath":
      return (
        <Centered>
          <Eyebrow>Beat 1 · Breath</Eyebrow>
          <BreathProtocol stepStartedAt={stepStartedAt} duration_ms={step.duration_ms} />
        </Centered>
      );

    case "beat1-anchor":
      return (
        <Centered>
          <Eyebrow>Beat 1 · Anchor</Eyebrow>
          <AnchorLine large>{BEAT1_ANCHOR_LINE}</AnchorLine>
        </Centered>
      );

    case "beat2":
      return (
        <Centered>
          <Eyebrow>Beat 2 · Going in</Eyebrow>
          <Quiet className="mb-6">
            Phone away. One breath. Then your cue.
          </Quiet>
          <CueWordHero>{cueWord}</CueWordHero>
          <Quiet className="mt-6">
            <em>This is what ready feels like.</em>
          </Quiet>
        </Centered>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="text-center">{children}</div>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono font-semibold text-[10px] uppercase tracking-[0.18em] text-cream/55 mb-6">
      {children}
    </p>
  );
}

function Quiet({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`font-body text-[16px] text-cream/75 leading-relaxed ${className}`}
    >
      {children}
    </p>
  );
}

function CueWordHero({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[36px] sm:text-[44px] leading-[1.05]">
      {children}
    </p>
  );
}

function AnchorLine({
  children,
  large = false,
}: {
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <p
      className={`font-scripture italic text-cream leading-snug ${
        large ? "text-[24px] sm:text-[28px]" : "text-[19px] sm:text-[22px]"
      }`}
    >
      {children}
    </p>
  );
}

function ImageryRing({
  duration_ms,
  stepStartedAt,
}: {
  duration_ms: number;
  stepStartedAt: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - stepStartedAt;
      const p = Math.min(1, elapsed / duration_ms);
      setProgress(p);
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [duration_ms, stepStartedAt]);

  const size = 220;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} className="opacity-50">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(247,247,247,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(223,175,55,0.6)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/35">
        Generate the moment
      </p>
    </div>
  );
}

function BreathProtocol({
  stepStartedAt,
  duration_ms,
}: {
  stepStartedAt: number;
  duration_ms: number;
}) {
  // 3 cycles of 4-in / 6-out = 10s per cycle = 30s total.
  // Inhale phase: 0-4s of each cycle. Exhale phase: 4-10s.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick(Date.now() - stepStartedAt);
      if (Date.now() - stepStartedAt < duration_ms) {
        raf = window.requestAnimationFrame(loop);
      }
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [stepStartedAt, duration_ms]);

  const cycleMs = 10000;
  const tInCycle = tick % cycleMs;
  const isInhale = tInCycle < 4000;
  const cycleIndex = Math.min(2, Math.floor(tick / cycleMs));

  // Scale ring expansion from 0.7 (start of inhale, end of exhale) to 1.0 (end of inhale, start of exhale).
  const scale = isInhale ? 0.7 + 0.3 * (tInCycle / 4000) : 1.0 - 0.3 * ((tInCycle - 4000) / 6000);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-[200px] w-[200px] flex items-center justify-center">
        <div
          className="absolute h-full w-full rounded-full border border-[rgba(223,175,55,0.4)] transition-transform duration-150 ease-linear"
          style={{
            transform: `scale(${scale})`,
            background:
              "radial-gradient(circle at center, rgba(223,175,55,0.08), rgba(223,175,55,0) 70%)",
          }}
        />
        <p className="relative font-display font-bold uppercase tracking-[0.06em] text-cream text-[22px]">
          {isInhale ? "Inhale" : "Exhale"}
        </p>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/50">
        Breath {cycleIndex + 1} of 3
      </p>
    </div>
  );
}

function StepProgress({
  stepStartedAt,
  duration_ms,
}: {
  stepStartedAt: number;
  duration_ms: number;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (duration_ms <= 0) return;
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - stepStartedAt;
      const p = Math.min(1, elapsed / duration_ms) * 100;
      setPct(p);
      if (elapsed < duration_ms) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [stepStartedAt, duration_ms]);

  return (
    <div className="h-[2px] w-full bg-hairline overflow-hidden rounded-full">
      <div
        className="h-full bg-gold transition-[width] duration-100 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion screen
// ---------------------------------------------------------------------------

function CompletionScreen({ athleteFirstName }: { athleteFirstName: string }) {
  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8 text-cream flex items-center">
      <div className="mx-auto max-w-[480px] text-center">
        <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-4">
          You&rsquo;re ready
        </p>
        <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[36px] sm:text-[44px] leading-[1.05] mb-5">
          Go play, {athleteFirstName}.
        </h1>
        <p className="font-scripture italic text-cream/85 text-[19px] leading-relaxed mb-8">
          From victory, not toward it.
        </p>
        <Link
          href="/athlete"
          className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[16px] text-[15px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
