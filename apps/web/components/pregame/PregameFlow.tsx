"use client";

// Pregame v2.1 — state machine router.
// View states: 'start' | 'flow' (index 0..FLOW.length-1) | 'card' | 'quick'.
// Setup phase (steps 0-7): tap-through choices. Step 8 is the audio session
// (Identity scripture + visualization + coping + prayer fold into the
// transcript). Card lives outside FLOW and renders after audio completes.
// No persistence — see docs/feature-roadmap.md.

import { useState } from "react";

import { QuickReset } from "./QuickReset";
import {
  BreathScreen,
  HardMomentScreen,
  PositionScreen,
  PregameStart,
  TodaysFocusScreen,
} from "./screens-a";
import {
  AudioSessionScreen,
  CueWordScreen,
  PregameCardScreen,
  ResetAnchorScreen,
  ReviewScreen,
  SelfTalkScreen,
} from "./screens-b";
import {
  BottomBar,
  Button,
  PregameHeader,
  PregameShell,
} from "./shared";
import {
  FLOW,
  INITIAL_STATE,
  type PregameState,
} from "./types";

type Props = {
  athleteFirstName: string;
};

type View =
  | { kind: "start" }
  | { kind: "flow"; index: number }
  | { kind: "card" }
  | { kind: "quick" };

// Athlete's first name surfaces only in the closing "Go play, {name}." byline
// on the Pregame Card — kept off the rest of the flow per the design.
export function PregameFlow({ athleteFirstName }: Props) {
  const [view, setView] = useState<View>({ kind: "start" });
  const [data, setData] = useState<PregameState>(INITIAL_STATE);

  const set = <K extends keyof PregameState>(k: K, v: PregameState[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const beginFull = () => setView({ kind: "flow", index: 0 });
  const beginQuick = () => setView({ kind: "quick" });
  const goStart = () => setView({ kind: "start" });

  const goNext = () => {
    if (view.kind !== "flow") return;
    if (view.index >= FLOW.length - 1) {
      setView({ kind: "card" });
    } else {
      setView({ kind: "flow", index: view.index + 1 });
    }
  };
  const goBack = () => {
    if (view.kind !== "flow") return;
    if (view.index === 0) {
      goStart();
      return;
    }
    setView({ kind: "flow", index: view.index - 1 });
  };

  if (view.kind === "start") {
    return (
      <PregameShell>
        <PregameStart onBegin={beginFull} onQuick={beginQuick} />
      </PregameShell>
    );
  }

  if (view.kind === "quick") {
    return (
      <PregameShell>
        <QuickReset state={data} onClose={goStart} />
      </PregameShell>
    );
  }

  if (view.kind === "card") {
    return (
      <PregameShell>
        <PregameHeader
          step={FLOW.length}
          total={FLOW.length}
          label="Pre-game Card"
          onBack={() => setView({ kind: "flow", index: FLOW.length - 1 })}
          onClose={goStart}
        />
        <PregameCardScreen
          state={data}
          onQuick={() => setView({ kind: "quick" })}
          onDone={goStart}
        />
        {athleteFirstName && (
          <p className="px-5 pb-2 pt-1 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-cream/50">
            Go play, {athleteFirstName}.
          </p>
        )}
      </PregameShell>
    );
  }

  const step = FLOW[view.index];
  if (!step) return null;
  const canAdvance = step.required(data);
  const isLast = view.index === FLOW.length - 1;
  const ctaLabel = step.cta ?? (isLast ? "SHOW MY PRE-GAME CARD" : "CONTINUE");

  return (
    <PregameShell>
      <PregameHeader
        step={view.index + 1}
        total={FLOW.length}
        label={step.label}
        onBack={goBack}
        onClose={goStart}
      />
      <ScreenSwitch
        stepId={step.id}
        state={data}
        set={set}
        onContinue={goNext}
      />
      {!step.hideBottomBar && (
        <BottomBar>
          <Button
            variant="coach"
            full
            disabled={!canAdvance}
            onClick={goNext}
            className={canAdvance ? "" : "opacity-45"}
          >
            {ctaLabel}
          </Button>
        </BottomBar>
      )}
    </PregameShell>
  );
}

function ScreenSwitch({
  stepId,
  state,
  set,
  onContinue,
}: {
  stepId: string;
  state: PregameState;
  set: <K extends keyof PregameState>(k: K, v: PregameState[K]) => void;
  onContinue: () => void;
}) {
  switch (stepId) {
    case "breath":
      return <BreathScreen state={state} set={set} />;
    case "todaysFocus":
      return <TodaysFocusScreen state={state} set={set} />;
    case "position":
      return <PositionScreen state={state} set={set} />;
    case "hardMoment":
      return <HardMomentScreen state={state} set={set} />;
    case "resetAnchor":
      return <ResetAnchorScreen state={state} set={set} />;
    case "selfTalk":
      return <SelfTalkScreen state={state} set={set} />;
    case "cueWord":
      return <CueWordScreen state={state} set={set} />;
    case "review":
      return <ReviewScreen state={state} />;
    case "audio":
      return (
        <AudioSessionScreen state={state} set={set} onContinue={onContinue} />
      );
    default:
      return null;
  }
}
