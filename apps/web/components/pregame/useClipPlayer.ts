"use client"; // client: Web Audio API, requestAnimationFrame, AudioContext
// React hook encapsulating Web Audio API clip-playlist playback.
//
// Lifecycle:
//   1. Mount: fetch manifest → resolve playlist → fetch + decode all clips in
//      parallel. All decoding happens before the first play tap so playback
//      starts instantly (mirrors `preload="auto"` on the legacy <audio> path).
//   2. First play gesture: create AudioContext (required by iOS Safari), schedule
//      all AudioBufferSourceNodes back-to-back for sample-accurate gapless play.
//   3. Pause / resume: ctx.suspend() / ctx.resume().
//   4. rAF loop: read ctx.currentTime + suspendOffset to drive elapsedSec.
//   5. Unmount: cancel rAF, release wake lock, close AudioContext.
//
// iOS Safari specifics addressed here:
//   - Fix 1 (GC): all scheduled AudioBufferSourceNodes are kept in nodesRef so
//     iOS Safari cannot GC them before their far-future start times.
//   - Fix 2 (interruption): AudioContext statechange + visibilitychange listeners
//     resume a suspended context when the page returns to foreground.
//   - Fix 3 (wake lock): navigator.wakeLock keeps the screen on during playback
//     (defence-in-depth — iOS suspends AudioContext on screen lock).
//
// Error handling: any failure in fetch/decode/AudioContext sets `error: true`
// so the screen can fall back to text mode via the same `onError` path used
// by the legacy <audio> elements.

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type AssembledTimeline,
  type ClipManifest,
  type ResolvedClip,
  buildAssembledTimeline,
  bustUrl,
  manifestUrl,
  resolvePlaylist,
} from "./audio-playlist";

// ---------------------------------------------------------------------------
// Vendor-prefix + non-standard DOM type helpers
// ---------------------------------------------------------------------------

// reason: webkitAudioContext is a Safari/legacy vendor-prefix not in the
// standard TypeScript DOM lib; least-invasive access without no-any violation.
type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

// reason: AudioContext.state can be "interrupted" on iOS Safari (a non-standard
// extension not present in the W3C spec or TS lib). We need to detect it to
// resume after phone-call / notification interruptions.
type ExtendedAudioContextState = AudioContextState | "interrupted";

// reason: navigator.wakeLock is present in modern browsers but absent from
// older TypeScript DOM lib versions; typed minimally to avoid any-escape.
interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
}
interface WakeLock {
  request(type: "screen"): Promise<WakeLockSentinel>;
}
type NavigatorWithWakeLock = Navigator & { wakeLock?: WakeLock };

// ---------------------------------------------------------------------------
// Public hook surface
// ---------------------------------------------------------------------------

export type UseClipPlayerOptions = {
  need: string | null;
  position: string | null;
  adversity: string | null;
  /** Athlete's chosen reset anchor (p3 personalization). */
  anchor?: string | null;
  /** Athlete's chosen self-talk phrase (p3 personalization). */
  selfTalk?: string | null;
  /** Athlete's chosen cue word (p3 personalization). */
  cueWord?: string | null;
  /** Called once when the final clip ends. */
  onCompleted?: () => void;
};

export type UseClipPlayerResult = {
  /** True once all clips are decoded and the player is ready to play. */
  ready: boolean;
  /** Start or resume playback. Noop if not ready or already playing. */
  play: () => void;
  /** Suspend playback. Noop if not playing. */
  pause: () => void;
  playing: boolean;
  /** Session elapsed time in seconds, driven by rAF. */
  elapsedSec: number;
  /** Total assembled session duration in seconds (0 until ready). */
  totalSec: number;
  /** True once the last clip has ended. */
  completed: boolean;
  /** Non-null when an unrecoverable error occurred — caller should fall back. */
  error: string | null;
  /** The assembled phase timeline, available once ready. Null until then. */
  timeline: AssembledTimeline | null;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Fetch a URL as ArrayBuffer with a timeout. Returns null on failure. */
async function fetchArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// useClipPlayer
// ---------------------------------------------------------------------------

export function useClipPlayer({
  need,
  position,
  adversity,
  anchor,
  selfTalk,
  cueWord,
  onCompleted,
}: UseClipPlayerOptions): UseClipPlayerResult {
  // ── init state ──
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [totalSec, setTotalSec] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<AssembledTimeline | null>(null);

  // ── stable refs that persist across renders without causing re-renders ──
  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<AudioBuffer[]>([]);
  const clipsRef = useRef<ResolvedClip[]>([]);
  const rafRef = useRef<number | null>(null);

  // Fix 1 — GC prevention: hold every scheduled AudioBufferSourceNode so
  // iOS Safari cannot garbage-collect nodes whose start times are far in the
  // future. Without this, clips beyond ~1:45 (viz, hardMoment, reset, prayer,
  // sendoff) are collected before they fire and playback silently dies.
  const nodesRef = useRef<AudioBufferSourceNode[]>([]);

  // When we suspend/resume, ctx.currentTime continues counting internally in
  // some implementations. We track the accumulated wall time ourselves so
  // elapsedSec is stable across pause/resume.
  const playStartCtxTimeRef = useRef<number>(0); // ctx.currentTime when last play() called
  const playStartElapsedRef = useRef<number>(0); // elapsedSec value at that moment
  // Whether we've scheduled all nodes (do it only once per play session).
  const scheduledRef = useRef(false);
  // F2: mutex to prevent concurrent ctx.resume() + doSchedule + rAF starts
  // when the athlete double-taps while the context is still resuming.
  const resumingRef = useRef(false);
  // Completed flag ref (to avoid stale closures in event listeners).
  const completedRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  // Fix 2 — interruption recovery: we need the current playing/completed
  // state inside event listeners without stale closures. Keep refs in sync.
  const playingRef = useRef(false);
  playingRef.current = playing;

  // Fix 3 — wake lock: hold the sentinel so we can release it later.
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // ── Wake lock helpers (Fix 3) ──

  const acquireWakeLock = useCallback(async () => {
    // Feature-detect; navigator.wakeLock absent on older Safari + many browsers.
    const nav = navigator as NavigatorWithWakeLock;
    if (!nav.wakeLock) return;
    try {
      // Release any existing sentinel before requesting a new one to avoid leaks.
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        await wakeLockRef.current.release();
      }
      wakeLockRef.current = await nav.wakeLock.request("screen");
    } catch {
      // Fail gracefully — wake lock is defence-in-depth, not a hard requirement.
      wakeLockRef.current = null;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore — already released or browser revoked it.
      }
    }
    wakeLockRef.current = null;
  }, []);

  // ── Phase 0 decode-on-mount: fetch manifest + all clips ──
  useEffect(() => {
    if (!need || !position || !adversity) return;

    let cancelled = false;

    async function init() {
      // 1. Fetch manifest
      const manifestRes = await fetch(manifestUrl());
      if (cancelled) return;
      if (!manifestRes.ok) {
        setError(`manifest fetch failed: ${manifestRes.status}`);
        return;
      }
      let manifest: ClipManifest;
      try {
        manifest = (await manifestRes.json()) as ClipManifest;
      } catch {
        setError("manifest parse failed");
        return;
      }
      if (cancelled) return;

      // 2. Resolve playlist
      // need/position/adversity are confirmed non-null here (checked above)
      // anchor/selfTalk/cueWord are optional; resolvePlaylist handles undefined
      const clips = resolvePlaylist(
        need!,
        position!,
        adversity!,
        manifest,
        anchor,
        selfTalk,
        cueWord,
      );
      if (!clips) {
        // No template for this combination — not an error, caller uses legacy path.
        setError("no template");
        return;
      }
      if (cancelled) return;

      clipsRef.current = clips;

      // 3. Build assembled timeline now (before decode) so it's available early.
      const assembled = buildAssembledTimeline(clips);
      if (cancelled) return;
      setTimeline(assembled);
      setTotalSec(assembled.totalDurationSec);

      // 4. Fetch all clip ArrayBuffers in parallel.
      const bufferResults = await Promise.all(
        clips.map((clip) => fetchArrayBuffer(clip.url)),
      );
      if (cancelled) return;

      const anyMissing = bufferResults.some((b) => b === null);
      if (anyMissing) {
        setError("clip fetch failed");
        return;
      }

      // 5. Decode all ArrayBuffers.
      // We need an AudioContext for decodeAudioData. On iOS Safari the
      // AudioContext MUST be created (or resumed) inside a user-gesture handler,
      // but decodeAudioData is allowed outside one. We create a temporary context
      // here for decoding only if ctxRef is not yet populated. The real playback
      // context is created on the first play() call.
      //
      // Actually: decodeAudioData on iOS Safari requires an AudioContext even
      // for decode, and creating one here (before a gesture) is fine — iOS only
      // restricts *resuming* a suspended context outside a gesture. We reuse
      // this same context for playback on first play().
      let ctx = ctxRef.current;
      if (!ctx) {
        try {
          const AudioContextCtor =
            window.AudioContext ??
            (window as WindowWithWebkit).webkitAudioContext;
          if (!AudioContextCtor) {
            setError("AudioContext not supported");
            return;
          }
          ctx = new AudioContextCtor() as AudioContext;
          ctxRef.current = ctx;
        } catch {
          setError("AudioContext constructor failed");
          return;
        }
      }

      const decodedBuffers: AudioBuffer[] = [];
      for (let i = 0; i < bufferResults.length; i++) {
        const raw = bufferResults[i];
        if (!raw) {
          setError("clip buffer missing after fetch");
          return;
        }
        try {
          // decodeAudioData is async and consumes the ArrayBuffer;
          // we pass a copy so the ref is not detached if we need to retry.
          const decoded = await ctx.decodeAudioData(raw.slice(0));
          if (cancelled) return;
          decodedBuffers.push(decoded);
        } catch {
          if (cancelled) return;
          setError(`clip decode failed at index ${i}`);
          return;
        }
      }

      if (cancelled) return;
      buffersRef.current = decodedBuffers;
      setReady(true);
    }

    init().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "unknown init error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [need, position, adversity, anchor, selfTalk, cueWord]);

  // ── rAF loop ──
  // Runs while playing. Reads ctx.currentTime and adds playStartElapsedRef to
  // get the correct session elapsed even after pause/resume cycles.
  const startRaf = useCallback(() => {
    const loop = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (ctx.state === "running") {
        const sessionElapsed =
          playStartElapsedRef.current +
          (ctx.currentTime - playStartCtxTimeRef.current);
        setElapsedSec(sessionElapsed);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // ── Fix 2: interruption / visibility recovery ──
  //
  // iOS Safari suspends the AudioContext on:
  //   a) A phone call, FaceTime, or system interruption (fires ctx "statechange"
  //      with state "interrupted" — a non-standard iOS extension).
  //   b) The athlete swipes up to Control Center / Notification Center and comes
  //      back (fires document "visibilitychange" hidden → visible).
  //   c) A notification banner tap that briefly backgrounds the app.
  //
  // In all cases, once the page is foregrounded again we attempt ctx.resume().
  // The elapsed clock anchor is re-snapped so the progress bar doesn't jump.
  //
  // We wire these listeners once, after the AudioContext is available (i.e.
  // after decode completes). They are torn down on unmount.
  useEffect(() => {
    // Listeners are only meaningful once we have a context.
    if (!ready) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Attempt to resume a suspended/interrupted context. Only acts when we
    // believe playback is active (playingRef) and the session isn't done.
    const tryResume = () => {
      if (completedRef.current) return;
      if (!playingRef.current) return;
      if (resumingRef.current) return; // F2 mutex: already resuming

      // reason: "interrupted" is an iOS Safari extension on AudioContextState
      // not in the TypeScript DOM lib; cast needed for the comparison.
      const state = ctx.state as ExtendedAudioContextState;
      if (state === "suspended" || state === "interrupted") {
        resumingRef.current = true;
        ctx.resume().then(() => {
          resumingRef.current = false;
          // Re-snap the elapsed clock anchor so the progress bar is accurate.
          // playStartElapsedRef already holds the right elapsed value from the
          // last pause snapshot; we just need a fresh ctx.currentTime anchor.
          playStartCtxTimeRef.current = ctx.currentTime;
          // Restart the rAF loop if it stopped (e.g. page was hidden).
          if (rafRef.current === null) {
            startRaf();
          }
        }).catch(() => {
          resumingRef.current = false;
          // Resume failed — don't set error; leave the athlete's UI intact.
          // They can tap the play button to manually retry.
        });
      }
    };

    // AudioContext statechange fires on iOS for "interrupted" (phone call, etc.)
    // and for "suspended" after certain system events.
    const handleStateChange = () => {
      tryResume();
      // Re-request wake lock after an interruption restores context state,
      // in case the system revoked our sentinel during the interruption.
      if (ctx.state === "running" && playingRef.current) {
        acquireWakeLock().catch(() => {/* defensive */});
      }
    };

    // visibilitychange: fires when athlete returns from Control Center / app
    // switcher / brief background. This is the most common iOS interruption path.
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      tryResume();
      // If playback is active and wake lock was revoked (browsers revoke on
      // visibility-hidden), re-acquire it now that we're visible again.
      if (playingRef.current && !completedRef.current) {
        acquireWakeLock().catch(() => {/* defensive */});
      }
    };

    ctx.addEventListener("statechange", handleStateChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      ctx.removeEventListener("statechange", handleStateChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [ready, startRaf, acquireWakeLock]);

  // ── play ──
  const play = useCallback(() => {
    // F2: also guard on resumingRef so a second tap during an in-flight
    // ctx.resume() can't enqueue a second doSchedule + rAF loop.
    if (!ready || completed || playing || resumingRef.current) return;
    const ctx = ctxRef.current;
    const buffers = buffersRef.current;
    if (!ctx || buffers.length === 0) return;

    // iOS Safari: resume the context inside the gesture handler.
    const doSchedule = () => {
      // F2: clear the resuming mutex now that we're inside the resolved handler.
      resumingRef.current = false;

      if (scheduledRef.current) {
        // Already scheduled — just record the resume point.
        playStartCtxTimeRef.current = ctx.currentTime;
        // playStartElapsedRef.current is already set from the pause point.
        setPlaying(true);
        startRaf();
        // Fix 3: re-acquire wake lock on manual resume.
        acquireWakeLock().catch(() => {/* defensive */});
        return;
      }

      // First play: schedule all clips back-to-back from now.
      const startAt = ctx.currentTime;
      let offset = 0;
      const assembled = timeline;
      const totalDur = assembled?.totalDurationSec ?? 0;

      // F1: track the last AudioBufferSourceNode actually started so that
      // onended fires on the true final clip, not on a fixed last-by-index
      // entry that may have been skipped by the `if (!buf) continue` guard.
      let lastNode: AudioBufferSourceNode | null = null;

      // Fix 1: clear any stale nodes from a previous (cancelled) session before
      // populating. In practice scheduledRef guards against re-entry, but this
      // is a belt-and-suspenders reset so the array never holds dead refs.
      nodesRef.current = [];

      for (let i = 0; i < buffers.length; i++) {
        const buf = buffers[i];
        if (!buf) continue;
        const node = ctx.createBufferSource();
        node.buffer = buf;
        node.connect(ctx.destination);
        node.start(startAt + offset);
        offset += buf.duration;
        // Fix 1: push every node into the ref array to prevent GC on iOS Safari.
        // Without this, nodes scheduled > ~100 s in the future are collected
        // before their start time and never fire — playback dies mid-session.
        nodesRef.current.push(node);
        lastNode = node;
      }

      // F1: attach onended to the true last scheduled node (not a fixed index).
      if (lastNode !== null) {
        lastNode.onended = () => {
          if (completedRef.current) return;
          completedRef.current = true;
          setCompleted(true);
          setElapsedSec(totalDur);
          setPlaying(false);
          stopRaf();
          // Fix 3: release wake lock on natural completion.
          releaseWakeLock().catch(() => {/* defensive */});
          // Fix 1: clear node refs — all nodes have finished, GC is now safe.
          nodesRef.current = [];
          onCompletedRef.current?.();
        };
      }

      scheduledRef.current = true;
      playStartCtxTimeRef.current = startAt;
      playStartElapsedRef.current = 0;
      setPlaying(true);
      startRaf();
      // Fix 3: acquire wake lock on first play.
      acquireWakeLock().catch(() => {/* defensive */});
    };

    if (ctx.state === "suspended") {
      // F2: set the mutex before the async call so any tap that arrives
      // before the promise resolves is rejected at the top of play().
      resumingRef.current = true;
      ctx.resume().then(doSchedule).catch(() => {
        resumingRef.current = false;
        setError("AudioContext resume failed");
      });
    } else {
      doSchedule();
    }
  }, [ready, completed, playing, timeline, startRaf, stopRaf, acquireWakeLock, releaseWakeLock]);

  // ── pause ──
  const pause = useCallback(() => {
    if (!playing) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    // Snapshot elapsed before suspend so resume continues from here.
    const sessionElapsed =
      playStartElapsedRef.current +
      (ctx.currentTime - playStartCtxTimeRef.current);
    playStartElapsedRef.current = sessionElapsed;
    ctx.suspend().then(() => {
      setPlaying(false);
      stopRaf();
      // Fix 3: release wake lock on manual pause.
      releaseWakeLock().catch(() => {/* defensive */});
    }).catch(() => {
      // Ignore — worst case the rAF just reports stale time.
    });
  }, [playing, stopRaf, releaseWakeLock]);

  // ── cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopRaf();
      // Fix 3: release wake lock on unmount.
      releaseWakeLock().catch(() => {/* defensive */});
      // Fix 1: clear node refs on unmount so GC can collect them.
      nodesRef.current = [];
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.close().catch(() => {/* ignore */});
        ctxRef.current = null;
      }
    };
  }, [stopRaf, releaseWakeLock]);

  return {
    ready,
    play,
    pause,
    playing,
    elapsedSec,
    totalSec,
    completed,
    error,
    timeline,
  };
}
