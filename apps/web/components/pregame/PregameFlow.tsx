"use client";

// Pregame v2.1 — state machine router.
// View states: 'start' | 'flow' (index 0..FLOW.length-1) | 'card' | 'quick'.
// Setup phase (steps 0-7): tap-through choices. Step 8 is the audio session
// (Identity scripture + visualization + coping + prayer fold into the
// transcript). Card lives outside FLOW and renders after audio completes.
//
// FV-223: on completion the session setup is persisted to localStorage under
// `fv_pregame_session` (writePregameSession). On the start screen, if a saved
// setup exists for the current sport, the athlete sees a secondary "Run it like
// last time" entry that skips all setup steps and jumps straight to the breath
// threshold (first FLOW step).

import { useEffect, useRef, useState } from "react";

import { QuickReset } from "./QuickReset";
import {
  BreathScreen,
  HardMomentScreen,
  PositionScreen,
  PositivePlaysScreen,
  PregameStart,
  TodaysFocusScreen,
} from "./screens-a";
import {
  AudioSessionScreen,
  CueWordScreen,
  PrayerStyleScreen,
  PregameCardScreen,
  ResetAnchorScreen,
  ReviewScreen,
  SelfTalkScreen,
  SoundBedScreen,
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
  NEED_VERSE,
  type PregameState,
} from "./types";
import { getSportConfig, type Sport, type SportConfig } from "./sport-registry";
import {
  readPregameSession,
  writePregameSession,
  type PregameSessionCache,
} from "@/lib/pregame/session-cache";

type Props = {
  athleteFirstName: string;
  /**
   * The athlete's sport. Used to resolve the per-sport config (roles,
   * adversities, clip slugs). Defaults to "hockey" so existing callers
   * are unaffected until FV-27 wires athlete.sport from the DB.
   */
  sport?: Sport;
};

type View =
  | { kind: "start" }
  | { kind: "flow"; index: number }
  | { kind: "card" }
  | { kind: "quick" };

// Athlete's first name surfaces only in the closing "Go play, {name}." byline
// on the Pregame Card — kept off the rest of the flow per the design.
export function PregameFlow({ athleteFirstName, sport = "hockey" }: Props) {
  const sportConfig: SportConfig = getSportConfig(sport);

  // Build the active flow: remove the "position" step for no-ask sports
  // (i.e. sports that declare no roles). Hockey keeps its position step;
  // future no-ask sports (tennis, swimming) skip it entirely and role stays null.
  // The "positivePlays" picker is role-scoped (plays are per-position), so it is
  // dropped alongside "position" for no-ask sports — otherwise the picker would
  // render an empty list the athlete could never satisfy (FV-144).
  const hasRoles = (sportConfig.roles?.length ?? 0) > 0;
  const activeFlow = hasRoles
    ? FLOW
    : FLOW.filter((s) => s.id !== "position" && s.id !== "positivePlays");

  const [view, setView] = useState<View>({ kind: "start" });
  const [data, setData] = useState<PregameState>(INITIAL_STATE);

  // FV-223: load saved session for the "Run it like last time" entry.
  // Null means no saved session, sport mismatch, unknown need, or invalid
  // shape — start screen shows only the full-setup path in that case.
  const [savedSession, setSavedSession] = useState<PregameSessionCache | null>(null);

  // True between "Run it like last time" and the post-breath jump. A ref,
  // not state: it only steers the next goNext, never renders.
  const fromSavedRef = useRef(false);

  // A saved session is restorable only when it was built for this sport AND
  // its need still resolves to a known verse — NEED_VERSE[need] is
  // dereferenced unguarded on the audio + card screens, so a stale need
  // (renamed since the save) or poisoned localStorage must fall back to the
  // full-setup path silently, never crash (PR #194 review 1b).
  const restorableSession = (
    cached: PregameSessionCache | null,
  ): PregameSessionCache | null =>
    cached && cached.sport === sport && cached.need in NEED_VERSE
      ? cached
      : null;

  useEffect(() => {
    setSavedSession(restorableSession(readPregameSession()));
    // restorableSession is stable per sport — re-validate on sport change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  const set = <K extends keyof PregameState>(k: K, v: PregameState[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const beginFull = () => {
    fromSavedRef.current = false;
    setView({ kind: "flow", index: 0 });
  };
  const beginQuick = () => {
    fromSavedRef.current = false;
    setView({ kind: "quick" });
  };
  const goStart = () => {
    fromSavedRef.current = false;
    setView({ kind: "start" });
    // Refresh saved session in case a just-completed run wrote a new one —
    // and clear it when the read fails/invalidates, so the button never
    // shows stale state the store no longer backs (PR #194 review).
    setSavedSession(restorableSession(readPregameSession()));
  };

  // FV-223: "Run it like last time" — restore saved state, run the breath
  // threshold, then jump STRAIGHT to the audio session (goNext intercept
  // below). Setup screens are skipped, not just pre-filled.
  const beginFromSaved = (saved: PregameSessionCache) => {
    setData({
      breathDone: false,
      need: saved.need as PregameState["need"],
      role: saved.role,
      positivePlays: saved.positivePlays,
      adversity: saved.adversity,
      anchor: saved.anchor,
      selfTalk: saved.selfTalk,
      cueWord: saved.cueWord,
      prayerStyle: saved.prayerStyle,
      // bedId is a device-level preference, not part of the session cache.
      // Restore to null here; SoundBedScreen (if visited) will load from
      // localStorage on its own mount. For "Run it like last time" the
      // sound screen is skipped, so we use the current state.bedId if set,
      // otherwise default to null — useClipPlayer reads it from the state
      // that's passed in, so the bed is still applied via what AudioSessionScreen
      // receives.
      bedId: data.bedId,
      audioCompleted: false,
    });
    fromSavedRef.current = true;
    // Start at breath (index 0) — the threshold step that's always first.
    setView({ kind: "flow", index: 0 });
  };

  // FV-223: persist content choices when the athlete reaches the completion
  // card. Guard: all required fields must be non-null. A session that somehow
  // reached the card without full setup (dev shortcut) should not overwrite
  // a valid prior save with nulls. The effect is declared here — before any
  // early returns — so the rules-of-hooks ordering invariant is respected.
  useEffect(() => {
    if (view.kind !== "card") return;
    if (
      data.need !== null &&
      data.adversity !== null &&
      data.anchor !== null &&
      data.selfTalk !== null
    ) {
      writePregameSession({
        sport,
        need: data.need,
        role: data.role,
        positivePlays: data.positivePlays,
        adversity: data.adversity,
        anchor: data.anchor,
        selfTalk: data.selfTalk,
        cueWord: data.cueWord,
        prayerStyle: data.prayerStyle,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.kind]); // only re-run when we transition to the card view

  const goNext = () => {
    if (view.kind !== "flow") return;
    // FV-223: in a saved-session run, breath advances straight to the audio
    // step — every setup screen between them is skipped (that's the "one
    // tap" promise). goBack from audio still walks back sequentially, which
    // deliberately lands on Review pre-filled so the athlete can inspect or
    // edit the restored choices.
    if (fromSavedRef.current && activeFlow[view.index]?.id === "breath") {
      fromSavedRef.current = false;
      const audioIndex = activeFlow.findIndex((s) => s.id === "audio");
      if (audioIndex !== -1) {
        setView({ kind: "flow", index: audioIndex });
        return;
      }
    }
    if (view.index >= activeFlow.length - 1) {
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
        <PregameStart
          onBegin={beginFull}
          onQuick={beginQuick}
          savedSession={savedSession}
          onBeginFromSaved={beginFromSaved}
        />
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
          step={activeFlow.length}
          total={activeFlow.length}
          label="Pre-game Card"
          onBack={() => setView({ kind: "flow", index: activeFlow.length - 1 })}
          onClose={goStart}
        />
        <PregameCardScreen
          state={data}
          onQuick={() => setView({ kind: "quick" })}
          onDone={goStart}
          sportConfig={sportConfig}
          athleteFirstName={athleteFirstName || undefined}
        />
        {athleteFirstName && (
          <p className="px-5 pb-2 pt-1 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-cream/50">
            Go play, {athleteFirstName}.
          </p>
        )}
      </PregameShell>
    );
  }

  const step = activeFlow[view.index];
  if (!step) return null;
  const canAdvance = step.required(data);
  const isLast = view.index === activeFlow.length - 1;
  const ctaLabel = step.cta ?? (isLast ? "SHOW MY PRE-GAME CARD" : "CONTINUE");

  return (
    <PregameShell>
      <PregameHeader
        step={view.index + 1}
        total={activeFlow.length}
        label={step.label}
        onBack={goBack}
        onClose={goStart}
      />
      {/* key={view.index} remounts this wrapper on every step advance so the
          fv-step-in keyframe fires fresh on each new screen. flex-1 is required
          so ScreenBody's own flex-1 fills the remaining shell height correctly.
          The animation is CSS-only and respects prefers-reduced-motion. */}
      <div key={view.index} className="animate-step-in flex flex-1 flex-col">
        <ScreenSwitch
          stepId={step.id}
          state={data}
          set={set}
          onContinue={goNext}
          sportConfig={sportConfig}
          sport={sport}
        />
      </div>
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
  sportConfig,
  sport,
}: {
  stepId: string;
  state: PregameState;
  set: <K extends keyof PregameState>(k: K, v: PregameState[K]) => void;
  onContinue: () => void;
  sportConfig: SportConfig;
  sport: Sport;
}) {
  switch (stepId) {
    case "breath":
      return <BreathScreen state={state} set={set} onContinue={onContinue} />;
    case "todaysFocus":
      // sportConfig.needs is sport-keyed (FV-117).
      return <TodaysFocusScreen state={state} set={set} sportConfig={sportConfig} />;
    case "position":
      return <PositionScreen state={state} set={set} sportConfig={sportConfig} />;
    case "positivePlays":
      return <PositivePlaysScreen state={state} set={set} sportConfig={sportConfig} />;
    case "hardMoment":
      return <HardMomentScreen state={state} set={set} sportConfig={sportConfig} />;
    case "resetAnchor":
      // sportConfig.anchors is sport-keyed (FV-117).
      return <ResetAnchorScreen state={state} set={set} sportConfig={sportConfig} />;
    case "selfTalk":
      // sportConfig.selfTalkOptions is sport-keyed (FV-117).
      return <SelfTalkScreen state={state} set={set} sportConfig={sportConfig} />;
    case "cueWord":
      // FV-175: sportConfig threads cueWordHelper so basketball sees "at the line".
      return <CueWordScreen state={state} set={set} sportConfig={sportConfig} />;
    case "prayerStyle":
      return <PrayerStyleScreen state={state} set={set} />;
    case "soundBed":
      return <SoundBedScreen state={state} set={set} />;
    case "review":
      return <ReviewScreen state={state} sportConfig={sportConfig} sport={sport} />;
    case "audio":
      return (
        <AudioSessionScreen state={state} set={set} onContinue={onContinue} sportConfig={sportConfig} sport={sport} />
      );
    default:
      return null;
  }
}
