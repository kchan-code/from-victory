"use client";

// Pregame v2.1 — state machine router.
// View states: 'start' | 'flow' (index 0..FLOW.length-1) | 'card' | 'quick'
//   + prepare-ahead additions:
//   'prepare-flow' (index 0..prepareFlow.length-1) | 'prepare-download'
//
// Setup phase (steps 0-7): tap-through choices. Step 8 is the audio session
// (Identity scripture + visualization + coping + prayer fold into the
// transcript). Card lives outside FLOW and renders after audio completes.
//
// FV-223: on completion the session setup is persisted to localStorage under
// `fv_pregame_session` (writePregameSession). On the start screen, if a saved
// setup exists for the current sport, the athlete sees a secondary "Run it like
// last time" entry that skips all setup steps and jumps straight to the breath
// threshold (first FLOW step).
//
// Prepare-ahead flow: the athlete makes all setup picks (no breathing, no audio)
// and the session is saved + downloaded for offline play. At the rink they tap
// "Play saved offline session" which runs the full session (breath → audio) with
// the restored selections.

import { useEffect, useRef, useState } from "react";

import CoachmarkTour from "@/components/athlete/CoachmarkTour";
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
  PrepareDownloadScreen,
  PrayerStyleScreen,
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
  NEED_VERSE,
  type PregameState,
} from "./types";
import { getSportConfig, type Sport, type SportConfig } from "./sport-registry";
import { sportHasPositivePlays } from "./positive-plays";
import {
  readPregameSession,
  writePregameSession,
  type PregameSessionCache,
} from "@/lib/pregame/session-cache";
import { logActivityEvent } from "@/lib/actions/activity";

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
  | { kind: "quick" }
  // Prepare-ahead additions:
  //   "prepare-flow"     — walking through setup steps (no breath, no audio)
  //   "prepare-download" — terminal: session saved, download in progress
  | { kind: "prepare-flow"; index: number }
  | { kind: "prepare-download" };

// Athlete's first name surfaces only in the closing "Go play, {name}." byline
// on the Pregame Card — kept off the rest of the flow per the design.
// Network-free check: is this saved session's audio fully cached for offline
// play? Centralizes the session→checkPregameAudioCached param mapping so the two
// callers (mount effect + goStart) can't drift apart. Returns false on SSR / no
// Cache Storage / any error.
async function isSavedSessionCached(
  session: PregameSessionCache,
  sport: Sport,
): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  const { checkPregameAudioCached } = await import("./audio-precache");
  const status = await checkPregameAudioCached({
    sport,
    need: session.need,
    position: session.role ?? null,
    adversity: session.adversity,
    anchor: session.anchor ?? null,
    selfTalk: session.selfTalk ?? null,
    cueWord: session.cueWord || null,
    prayerStyle: session.prayerStyle,
    positivePlays: session.positivePlays,
    bedId: null, // not stored in session cache (FV-306: sound picker removed)
  });
  return status.done;
}

export function PregameFlow({ athleteFirstName, sport = "hockey" }: Props) {
  const sportConfig: SportConfig = getSportConfig(sport);

  // Build the active flow by dropping steps the sport can't support:
  //  - "position": removed for no-ask sports (those that declare no roles).
  //    Hockey/basketball/golf keep it; future no-ask sports (tennis, swimming)
  //    skip it entirely and role stays null.
  //  - "positivePlays": the picker is both role-scoped AND content-gated. A sport
  //    can declare roles but ship no positive plays yet (golf — the
  //    Bomber/Ball-Striker/Scrambler profiles exist but have zero viz plays until
  //    FV-294). Gating on hasRoles alone showed golfers an empty picker they could
  //    never satisfy (the step is `required: positivePlays.length > 0`), trapping
  //    them on Step 04. Gate on whether plays actually exist for every role so the
  //    step is skipped cleanly until plays land, then re-enables automatically.
  const hasRoles = (sportConfig.roles?.length ?? 0) > 0;
  const showPositivePlays = sportHasPositivePlays(sportConfig.roles);
  const activeFlow = FLOW.filter((s) => {
    if (s.id === "position") return hasRoles;
    if (s.id === "positivePlays") return showPositivePlays;
    return true;
  });

  // Prepare-ahead flow: same filter as activeFlow but with "breath" and "audio"
  // removed. The athlete walks through the setup steps only (focus → position →
  // positive plays → hard moment → anchor → self-talk → cue word → prayer →
  // review), then lands on PrepareDownloadScreen. No breathing, no audio session.
  // Index math is completely separate from activeFlow so neither path can corrupt
  // the other's counters. The play path (activeFlow + goNext/goBack) is
  // byte-for-byte unchanged.
  const prepareFlow = activeFlow.filter(
    (s) => s.id !== "breath" && s.id !== "audio",
  );

  const [view, setView] = useState<View>({ kind: "start" });
  const [data, setData] = useState<PregameState>(INITIAL_STATE);

  // FV-223: load saved session for the "Run it like last time" entry.
  // Null means no saved session, sport mismatch, unknown need, or invalid
  // shape — start screen shows only the full-setup path in that case.
  const [savedSession, setSavedSession] = useState<PregameSessionCache | null>(null);

  // True when the saved session's audio is confirmed fully cached (network-free).
  // Drives the "Play saved offline session" entry on the start screen.
  // Defaults false so the entry is never shown until we've actually confirmed it.
  const [savedOfflineReady, setSavedOfflineReady] = useState(false);

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
    const session = restorableSession(readPregameSession());
    setSavedSession(session);
    // Reset offline-ready immediately when the session changes; the check
    // below will set it back to true if applicable.
    setSavedOfflineReady(false);
    // restorableSession is stable per sport — re-validate on sport change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  // Mount-time (and sport-change) network-free cache check for the saved
  // session. Only runs when a restorable session exists; the session→params
  // mapping lives in isSavedSessionCached so it can't drift from the goStart
  // re-check below.
  useEffect(() => {
    const session = restorableSession(readPregameSession());
    if (!session) return;

    let cancelled = false;
    isSavedSessionCached(session, sport)
      .then((ok) => {
        if (!cancelled) setSavedOfflineReady(ok);
      })
      .catch(() => {
        // Non-fatal: entry stays hidden, which is the safe default.
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]); // Re-check when sport changes; savedSession updates in parallel

  const set = <K extends keyof PregameState>(k: K, v: PregameState[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  // Fire-and-forget pregame telemetry → activity_events (via the server action).
  // Never blocks the UI and never throws; a signed-out / non-athlete / offline
  // caller simply no-ops. meta is allow-list-filtered server-side.
  const fireEvent = (
    event_name: "pregame_start" | "pregame_complete",
    meta?: Record<string, unknown>,
  ) => {
    void logActivityEvent({
      event_name,
      surface: "pregame",
      sport,
      network_mode:
        typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
      meta,
    }).catch(() => {});
  };

  const beginFull = () => {
    fromSavedRef.current = false;
    fireEvent("pregame_start", { src: "full" });
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
    const freshSession = restorableSession(readPregameSession());
    setSavedSession(freshSession);
    // Also re-check the offline cache for the fresh session so the "Play
    // saved offline session" badge reflects the current cache state.
    setSavedOfflineReady(false);
    if (freshSession) {
      isSavedSessionCached(freshSession, sport)
        .then(setSavedOfflineReady)
        .catch(() => {
          // Non-fatal: badge stays hidden.
        });
    }
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
      // bedId is parked at null since the "Sound" picker was removed (FV-306);
      // every session — rerun included — plays voice-only. See PregameState.bedId.
      bedId: null,
      audioCompleted: false,
    });
    fromSavedRef.current = true;
    fireEvent("pregame_start", { src: "saved" });
    // Start at breath (index 0) — the threshold step that's always first.
    setView({ kind: "flow", index: 0 });
  };

  // Prepare-ahead entry: start the PREPARE flow from step 0 of prepareFlow.
  // Resets state so the athlete starts fresh (no stale data from a prior run).
  const beginPrepare = () => {
    fromSavedRef.current = false;
    setData(INITIAL_STATE);
    setView({ kind: "prepare-flow", index: 0 });
  };

  // Play-saved-offline entry. Behaviorally identical to "Run it like last
  // time" (beginFromSaved): restore the saved picks, show the breath threshold,
  // then jump straight to audio — the setup screens are skipped because the
  // picks were restored (that's the "one tap at the rink" promise; the breath
  // IS shown, only the re-picking is skipped). Delegating guarantees the same
  // proven path. The ONLY difference between this entry and "Run it like last
  // time" is the start-screen affordance: this one appears only when the audio
  // is confirmed downloaded (savedOfflineReady) and carries the "ready offline"
  // badge — the at-the-rink, no-signal reassurance.
  const beginPlaySaved = () => {
    if (savedSession) beginFromSaved(savedSession);
  };

  // FV-223: persist content choices when the athlete reaches the completion
  // card. Guard: all required fields must be non-null. A session that somehow
  // reached the card without full setup (dev shortcut) should not overwrite
  // a valid prior save with nulls. The effect is declared here — before any
  // early returns — so the rules-of-hooks ordering invariant is respected.
  useEffect(() => {
    if (view.kind !== "card") return;
    // Reaching the card means the audio session finished — log completion with
    // the (allow-listed) personalization dimensions. Null fields are dropped
    // server-side. Fires once per completion (deps: [view.kind]).
    fireEvent("pregame_complete", {
      position: data.role,
      adversity: data.adversity,
      anchor: data.anchor,
      prayer_style: data.prayerStyle,
      audio_completed: data.audioCompleted,
    });
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

  // ── Play-path navigation (unchanged from before) ──────────────────────────

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

  // ── Prepare-path navigation ───────────────────────────────────────────────
  // Completely separate from the play-path nav. Uses prepareFlow (no breath,
  // no audio) and routes to prepare-download at the end instead of "card".
  // The index math never touches activeFlow, so play-path is safe.

  const goPrepareNext = () => {
    if (view.kind !== "prepare-flow") return;
    if (view.index >= prepareFlow.length - 1) {
      // Last step of prepare flow (Review in prepare mode): write the session
      // to localStorage before advancing to the download terminal, so the save
      // exists independently of whether the download succeeds.
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
      setView({ kind: "prepare-download" });
    } else {
      setView({ kind: "prepare-flow", index: view.index + 1 });
    }
  };

  const goPrepareBack = () => {
    if (view.kind !== "prepare-flow") return;
    if (view.index === 0) {
      goStart();
      return;
    }
    setView({ kind: "prepare-flow", index: view.index - 1 });
  };

  // ── Render: start ─────────────────────────────────────────────────────────

  if (view.kind === "start") {
    return (
      <>
        <PregameShell>
          <PregameStart
            onBegin={beginFull}
            onQuick={beginQuick}
            savedSession={savedSession}
            onBeginFromSaved={beginFromSaved}
            onPrepare={beginPrepare}
            onPlaySaved={beginPlaySaved}
            savedOfflineReady={savedOfflineReady}
          />
        </PregameShell>
        {/* FV-313: coachmark tour — only on the start screen, never mid-flow */}
        <CoachmarkTour surface="pregame" />
      </>
    );
  }

  // ── Render: quick ─────────────────────────────────────────────────────────

  if (view.kind === "quick") {
    return (
      <PregameShell>
        <QuickReset state={data} onClose={goStart} />
      </PregameShell>
    );
  }

  // ── Render: card (play-path completion) ───────────────────────────────────

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

  // ── Render: prepare-download terminal ─────────────────────────────────────

  if (view.kind === "prepare-download") {
    return (
      <PregameShell>
        <PregameHeader
          step={prepareFlow.length + 1}
          total={prepareFlow.length + 1}
          label="Saving for offline"
          onBack={() => setView({ kind: "prepare-flow", index: prepareFlow.length - 1 })}
          onClose={goStart}
        />
        <div className="animate-step-in flex flex-1 flex-col">
          <PrepareDownloadScreen
            state={data}
            sport={sport}
            onDone={goStart}
          />
        </div>
      </PregameShell>
    );
  }

  // ── Render: prepare-flow (setup steps without breath/audio) ───────────────

  if (view.kind === "prepare-flow") {
    const prepareStep = prepareFlow[view.index];
    if (!prepareStep) return null;
    const prepareCanAdvance = prepareStep.required(data);
    const prepareIsLast = view.index === prepareFlow.length - 1;
    // Override CTA label at the last step (Review) so it reads as a save
    // action rather than a play action. All other steps keep their default.
    const prepareCtaLabel = prepareIsLast
      ? "SAVE & DOWNLOAD FOR LATER"
      : (prepareStep.cta ?? "CONTINUE");

    return (
      <PregameShell>
        <PregameHeader
          step={view.index + 1}
          total={prepareFlow.length + 1}
          label={prepareStep.label}
          onBack={goPrepareBack}
          onClose={goStart}
        />
        {/* key={`p-${view.index}`} keeps the step-in animation distinct from
            the play-flow key space so a switch between modes never reuses a
            stale key. */}
        <div key={`p-${view.index}`} className="animate-step-in flex flex-1 flex-col">
          <ScreenSwitch
            stepId={prepareStep.id}
            state={data}
            set={set}
            onContinue={goPrepareNext}
            sportConfig={sportConfig}
            sport={sport}
            prepareMode={prepareIsLast}
          />
        </div>
        {!prepareStep.hideBottomBar && (
          <BottomBar>
            <Button
              variant="coach"
              full
              disabled={!prepareCanAdvance}
              onClick={goPrepareNext}
              className={prepareCanAdvance ? "" : "opacity-45"}
            >
              {prepareCtaLabel}
            </Button>
          </BottomBar>
        )}
      </PregameShell>
    );
  }

  // ── Render: play-flow (unchanged) ─────────────────────────────────────────

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
  prepareMode = false,
}: {
  stepId: string;
  state: PregameState;
  set: <K extends keyof PregameState>(k: K, v: PregameState[K]) => void;
  onContinue: () => void;
  sportConfig: SportConfig;
  sport: Sport;
  /**
   * When true, ReviewScreen renders in "prepare" mode — the bottom bar CTA
   * label says "SAVE & DOWNLOAD FOR LATER". All other steps are unaffected.
   * Only passed as true when rendering the last step of prepare-flow.
   */
  prepareMode?: boolean;
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
    case "review":
      return (
        <ReviewScreen
          state={state}
          sportConfig={sportConfig}
          sport={sport}
          mode={prepareMode ? "prepare" : "play"}
        />
      );
    case "audio":
      return (
        <AudioSessionScreen state={state} set={set} onContinue={onContinue} sportConfig={sportConfig} sport={sport} />
      );
    default:
      return null;
  }
}
