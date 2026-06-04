"use client"; // client: HTMLAudioElement, requestAnimationFrame, AudioContext (decode only)
// React hook encapsulating clip-playlist playback via HTMLAudioElement.
//
// Architecture (HTMLMediaElement path — replaces the former Web Audio scheduler):
//
//   Phase 0 (mount): fetch manifest → resolve playlist → fetch + decode all
//   clips in parallel. All decoding happens before the first play tap so
//   playback starts instantly. decodeAudioData still requires an AudioContext,
//   but we create a decode-only context that is CLOSED once decode finishes —
//   no AudioContext is held open during playback.
//
//   Phase 1 (after decode): call assembleWavBlob(AudioBuffer[]) → one WAV Blob
//   → URL.createObjectURL → HTMLAudioElement.src. The audio element is
//   DOM-attached (hidden) — document.body.appendChild(audio) with
//   audio.hidden = true. DOM attachment is cheap insurance for iOS background
//   playback: some iOS versions are less reliable with fully detached Audio()
//   objects when the screen locks. The hook still has no render output; the
//   element is invisible and removed on unmount.
//
//   Phase 2 (play gesture): audio.play() from inside the user-gesture handler.
//   Pause: audio.pause(). Both are synchronous from the caller's perspective.
//
//   Phase 3 (rAF loop): reads audio.currentTime ~60fps to drive elapsedSec.
//   `ended` event drives completion. `play`/`pause` events keep `playing` in
//   sync AND drive startRaf()/stopRaf() so the progress timer is always live
//   when audio is actually playing (including resumes via MediaSession or the
//   visibilitychange nudge, not just the play() callback path).
//
//   Unmount: cancel rAF, audio.pause(), audio.remove(), revoke object URL,
//   null the ref.
//
// Why HTMLAudioElement (not AudioContext):
//   iOS Safari suspends an AudioContext when the screen locks — deliberate
//   power-management behaviour that has no PWA workaround. HTMLMediaElement
//   is in a different OS category (podcast / media-player) and keeps playing
//   with the screen locked. The prior Web Audio scheduler died mid-session
//   whenever the athlete's phone auto-locked. One contiguous WAV blob also
//   means there are no inter-clip scheduling gaps — gapless playback is
//   preserved and the complex AudioBufferSourceNode GC / suspend-offset clock
//   arithmetic is no longer needed.
//
// iOS caveats:
//   - Screen-lock playback requires an HTMLMediaElement started from a user
//     gesture. This hook satisfies that contract: play() is called from the
//     athlete's tap handler. The element is DOM-attached-but-hidden to improve
//     reliability across iOS versions (some treat fully-detached Audio() less
//     favourably in the background media category).
//   - Deliberate screen-lock suspends the AudioContext used for decode, but
//     by that point decode is already complete and the context is closed.
//   - The decode-only AudioContext still needs webkitAudioContext on older
//     iOS; vendor prefix detection is kept for that reason.
//   - Audio is NOT guaranteed to resume after a phone call / system
//     interruption on iOS without a fresh user gesture. A lightweight
//     visibilitychange nudge is included; it uses intendedPlayingRef (user
//     intent) rather than the playing state mirror so it correctly fires even
//     after iOS-initiated pauses. A phone-call interruption still requires a
//     manual tap to resume. On-device testing is required to confirm behaviour.
//
// Error handling: any failure in fetch/decode/blob sets `error` to a string.
// The sentinel "no template" triggers the legacy/text-mode fallback in screens.

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type AssembledTimeline,
  type ClipManifest,
  type ResolvedClip,
  buildAssembledTimeline,
  manifestUrl,
  resolvePlaylist,
  resolvePracticePlaylist,
} from "./audio-playlist";
import { assembleWavBlob } from "./audio/encode-wav";
import { getSportConfig, type Sport } from "./sport-registry";

// ---------------------------------------------------------------------------
// Vendor-prefix type helper (decode-only AudioContext)
// ---------------------------------------------------------------------------

// reason: webkitAudioContext is a Safari/legacy vendor-prefix not in the
// standard TypeScript DOM lib; least-invasive access without no-any violation.
type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

// ---------------------------------------------------------------------------
// MediaSession feature-detect helper
// ---------------------------------------------------------------------------

// reason: navigator.mediaSession is present in modern browsers but absent from
// some environments (SSR, older iOS). The DOM lib types MediaMetadata and
// MediaSessionAction fully; we augment Navigator minimally to allow
// feature-detection and assignment without any-escape.
interface MediaMetadataInit {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
}
// reason: navigator.mediaSession is present in modern browsers and in the
// TypeScript DOM lib, but its presence on navigator is not guaranteed at
// compile time (the TS lib types it as optional). We augment Navigator
// minimally to allow feature-detection via `in` / optional chaining without
// any-escape. The metadata and setActionHandler types intentionally match the
// DOM lib's MediaSession interface so assignments type-check cleanly.
interface MediaSessionManager {
  metadata: MediaMetadata | null;
  setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null): void;
}
type NavigatorWithMediaSession = Navigator & {
  mediaSession?: MediaSessionManager;
};

// ---------------------------------------------------------------------------
// Public hook surface (UNCHANGED — consumers must not need changes)
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
  /**
   * When true, resolve via resolvePracticePlaylist(manifest) instead of the
   * pregame resolvePlaylist(...). The need/position/adversity fields are
   * ignored — the practice playlist is state+focus-driven. All other playback
   * behaviour (decode, blob assembly, pause/resume, rAF timer) is shared with
   * the pregame path. Defaults to false.
   */
  practice?: boolean;
  /**
   * Athlete's self-reported pre-practice state (FRO-22).
   * "dialed-in" (default) or "not-feeling-it". Drives opener selection.
   * Only used when practice=true. Unknown values default to "dialed-in".
   */
  practiceState?: "dialed-in" | "not-feeling-it" | null;
  /**
   * Athlete's chosen focus phrase for today's practice (FRO-22).
   * Maps to a pp-focus-<slug> clip injected between choose-focus-lead/tail.
   * Only used when practice=true. Unknown/missing values drop the focus clip
   * cleanly (lead+tail still play).
   */
  practiceFocus?: string | null;
  /**
   * The athlete's sport. Used to resolve sport-specific practice opener slugs
   * and focus slug maps. Defaults to "hockey" so existing call sites stay green.
   */
  sport?: Sport;
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

/** Fetch a URL as ArrayBuffer. Returns null on network/HTTP failure. */
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
  practice = false,
  practiceState,
  practiceFocus,
  sport = "hockey",
  onCompleted,
}: UseClipPlayerOptions): UseClipPlayerResult {
  // ── state ──
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [totalSec, setTotalSec] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<AssembledTimeline | null>(null);

  // ── refs ──
  // The single HTMLAudioElement that plays the assembled WAV blob.
  // DOM-attached-but-hidden (audio.hidden = true; document.body.appendChild).
  // Attachment improves iOS background-media reliability vs. fully detached;
  // the hook still exposes no render surface — the element is invisible.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Object URL for the assembled WAV blob — revoked on unmount.
  const blobUrlRef = useRef<string | null>(null);
  // rAF handle.
  const rafRef = useRef<number | null>(null);
  // Guard against double-fire of onCompleted.
  const completedRef = useRef(false);
  // Stable ref for onCompleted callback to avoid stale closure in event handlers.
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;
  // Mirror of playing state for use inside event listeners (avoids stale closures).
  const playingRef = useRef(false);
  playingRef.current = playing;
  // Tracks the ATHLETE'S INTENT to play — set true by play(), set false by
  // pause() and ended/completion. The native "pause" event does NOT clear this:
  // an iOS-initiated pause (phone call, system interruption) is not the athlete
  // wanting to stop. The visibilitychange nudge uses this ref (not playingRef)
  // so it correctly resumes after an iOS interruption while still respecting a
  // deliberate user pause.
  const intendedPlayingRef = useRef(false);
  // Timeline ref for use inside the ended handler without stale closure.
  const timelineRef = useRef<AssembledTimeline | null>(null);
  // clipsRef retained (unused in playback but consistent with original structure).
  const clipsRef = useRef<ResolvedClip[]>([]);

  // ── rAF loop ──
  // Reads audio.currentTime ~60fps. HTMLMediaElement.currentTime is the
  // authoritative position; we don't need the suspend-offset arithmetic that
  // the AudioContext path required.
  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startRaf = useCallback(() => {
    // Idempotent: if a loop is already running, don't schedule a second one.
    // This prevents duplicate rAF loops when both the play() callback path and
    // the native "play" event listener call startRaf() in close succession.
    if (rafRef.current !== null) return;
    const loop = () => {
      const audio = audioRef.current;
      // Self-terminate when there's nothing to track (element gone or ended)
      // so the loop never orphans if stopRaf() isn't reached on completion.
      if (!audio || audio.ended) {
        rafRef.current = null;
        return;
      }
      if (!audio.paused) {
        setElapsedSec(audio.currentTime);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── MediaSession wiring ──
  // Registers lock-screen / Control Center title + play/pause handlers.
  // Feature-detected: absent on SSR and older iOS.
  const wireMediaSession = useCallback((sessionTitle: string) => {
    const nav = navigator as NavigatorWithMediaSession;
    if (!nav.mediaSession) return;

    // reason: MediaMetadata constructor is a browser global, typed loosely here
    // because the TS lib definition requires importing from a specific lib config.
    // Constructing via the global avoids an any-escape while staying strict.
    try {
      // reason: MediaMetadata is a browser global that TypeScript strict mode
      // doesn't guarantee is available; runtime check above guards this path.
      const MediaMetadataCtor = (
        window as Window & { MediaMetadata?: new (init: MediaMetadataInit) => MediaMetadata }
      ).MediaMetadata;
      if (MediaMetadataCtor) {
        nav.mediaSession.metadata = new MediaMetadataCtor({
          title: sessionTitle,
          artist: "From Victory",
        });
      }
    } catch {
      // MediaMetadata constructor failed — non-fatal, skip metadata.
    }

    // Lock-screen control taps are deliberate athlete intent — mirror the
    // play()/pause() callbacks so intendedPlayingRef stays consistent. Without
    // this, a lock-screen pause could be auto-resumed by the visibilitychange
    // nudge (which keys on intent), and a lock-screen play wouldn't be.
    nav.mediaSession.setActionHandler("play", () => {
      intendedPlayingRef.current = true;
      audioRef.current?.play().catch(() => {
        // Play rejected — state syncs via events; clear intent so the nudge
        // doesn't loop-retry a play the browser refused.
        intendedPlayingRef.current = false;
      });
    });
    nav.mediaSession.setActionHandler("pause", () => {
      intendedPlayingRef.current = false;
      audioRef.current?.pause();
    });
  }, []);

  // ── Phase 0: decode-on-mount ──
  // Fetch manifest → resolve playlist → fetch + decode all clips → assemble WAV.
  useEffect(() => {
    if (!practice && (!need || !position || !adversity)) return;

    let cancelled = false;

    async function init() {
      // 1. Fetch manifest.
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

      // 2. Resolve playlist.
      // Practice mode: use the state-aware practice playlist from the manifest.
      // Pregame mode: resolve by need × position × adversity (+ personalization).
      let clips: ReturnType<typeof resolvePlaylist>;
      if (practice) {
        const sportConfig = getSportConfig(sport);
        clips = resolvePracticePlaylist(manifest, practiceState, practiceFocus, sportConfig);
        if (!clips) {
          setError("no template");
          return;
        }
      } else {
        clips = resolvePlaylist(
          need!,
          position!,
          adversity!,
          manifest,
          anchor,
          selfTalk,
          cueWord,
        );
        if (!clips) {
          // No template for this combination — sentinel triggers legacy path.
          setError("no template");
          return;
        }
      }
      if (cancelled) return;

      clipsRef.current = clips;

      // 3. Build assembled timeline (before decode so UI can show phase info early).
      const assembled = buildAssembledTimeline(clips);
      if (cancelled) return;
      timelineRef.current = assembled;
      setTimeline(assembled);
      setTotalSec(assembled.totalDurationSec);

      // 4. Fetch all clip ArrayBuffers in parallel.
      const bufferResults = await Promise.all(
        clips.map((clip) => fetchArrayBuffer(clip.url)),
      );
      if (cancelled) return;

      if (bufferResults.some((b) => b === null)) {
        setError("clip fetch failed");
        return;
      }

      // 5. Decode all ArrayBuffers.
      // An AudioContext is required for decodeAudioData, but we CLOSE it once
      // decode is done — playback is handled by HTMLAudioElement, not Web Audio.
      // Creating the context here (before a gesture) is fine on iOS Safari;
      // iOS only restricts *resuming* a suspended context outside a gesture.
      let decodeCtx: AudioContext | null = null;
      try {
        const AudioContextCtor =
          window.AudioContext ??
          (window as WindowWithWebkit).webkitAudioContext;
        if (!AudioContextCtor) {
          setError("AudioContext not supported");
          return;
        }
        decodeCtx = new AudioContextCtor() as AudioContext;
      } catch {
        setError("AudioContext constructor failed");
        return;
      }

      const decodedBuffers: AudioBuffer[] = [];
      for (let i = 0; i < bufferResults.length; i++) {
        const raw = bufferResults[i];
        if (!raw) {
          setError("clip buffer missing after fetch");
          decodeCtx.close().catch(() => {/* ignore */});
          return;
        }
        try {
          // Pass a copy: decodeAudioData consumes (detaches) the ArrayBuffer.
          const decoded = await decodeCtx.decodeAudioData(raw.slice(0));
          if (cancelled) {
            decodeCtx.close().catch(() => {/* ignore */});
            return;
          }
          decodedBuffers.push(decoded);
        } catch {
          if (cancelled) {
            decodeCtx.close().catch(() => {/* ignore */});
            return;
          }
          setError(`clip decode failed at index ${i}`);
          decodeCtx.close().catch(() => {/* ignore */});
          return;
        }
      }

      // Decode complete — close the AudioContext. It is no longer needed.
      // HTMLAudioElement takes over from here.
      decodeCtx.close().catch(() => {/* ignore */});

      if (cancelled) return;

      // 6. Assemble all decoded buffers into a single WAV blob.
      let blob: Blob;
      try {
        blob = assembleWavBlob(decodedBuffers);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "WAV assembly failed");
        return;
      }
      if (cancelled) return;

      // 7. Create an object URL and wire the HTMLAudioElement.
      const blobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = blobUrl;

      const audio = new Audio();
      audio.preload = "auto";
      audio.src = blobUrl;
      // Attach to the DOM (hidden) so iOS classifies this element in the
      // background-media category more reliably across iOS versions. The hook
      // still has no visible render output; the element is invisible and will
      // be removed on unmount.
      audio.hidden = true;
      document.body.appendChild(audio);
      audioRef.current = audio;

      // Sync playing state AND drive the rAF loop from native media events.
      // Driving from events (rather than only from the play() callback's .then())
      // means the progress timer is also live after resumes triggered by the
      // visibilitychange nudge or the MediaSession lock-screen play button.
      audio.addEventListener("play", () => {
        setPlaying(true);
        startRaf();
      });
      audio.addEventListener("pause", () => {
        if (!completedRef.current) {
          setPlaying(false);
          stopRaf();
          // Note: intendedPlayingRef is intentionally NOT cleared here.
          // An iOS-initiated pause (phone call, system interruption) fires the
          // "pause" event but the athlete has not chosen to stop. The intent ref
          // is cleared only in the user-initiated pause() callback and on completion.
        }
      });

      audio.addEventListener("ended", () => {
        if (completedRef.current) return;
        completedRef.current = true;
        intendedPlayingRef.current = false;
        const totalDur = timelineRef.current?.totalDurationSec ?? 0;
        setCompleted(true);
        setElapsedSec(totalDur);
        setPlaying(false);
        stopRaf();
        onCompletedRef.current?.();
      });

      // Register lock-screen metadata + controls.
      wireMediaSession(practice ? "Pre-Practice" : "Pregame");

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
  }, [need, position, adversity, anchor, selfTalk, cueWord, practice, practiceState, practiceFocus, sport, startRaf, stopRaf, wireMediaSession]);

  // ── Lightweight visibilitychange nudge ──
  // iOS may pause the audio element when the app is briefly backgrounded (e.g.
  // Control Center swipe, notification tap). When the app returns to foreground
  // and the athlete intended to be playing, attempt to resume.
  //
  // Critically, we check intendedPlayingRef (user intent) rather than
  // playingRef (actual playback state). The native "pause" event — fired by an
  // iOS-initiated interruption — flips playingRef to false but does NOT clear
  // intendedPlayingRef. This means the nudge correctly fires after an iOS
  // interruption, which was previously a silent no-op. After a phone call iOS
  // may still reject play() (requires a fresh gesture); the athlete can tap
  // manually in that case. This is best-effort and on-device testing is needed.
  useEffect(() => {
    if (!ready) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const audio = audioRef.current;
      if (!audio || completedRef.current || !intendedPlayingRef.current) return;
      if (audio.paused) {
        audio.play().catch(() => {
          // Play rejected — athlete must tap manually. Don't set error.
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [ready]);

  // ── play ──
  const play = useCallback(() => {
    if (!ready || completed || playing) return;
    const audio = audioRef.current;
    if (!audio) return;

    // Record that the athlete intends to be playing. This is set before the
    // play() call so the visibilitychange nudge can act on it even if the
    // promise resolves after a brief background trip.
    intendedPlayingRef.current = true;

    // iOS Safari requires play() to be called inside a user-gesture handler.
    // This callback is always invoked from a button tap, satisfying that requirement.
    // The native "play" event listener (wired in Phase 0) handles setPlaying(true)
    // and startRaf() — we no longer call startRaf() from .then() here. This ensures
    // the rAF loop is always started from the single event-driven path regardless of
    // whether playback resumed via play(), visibilitychange nudge, or MediaSession.
    audio.play().catch(() => {
      // Play rejected by the browser (e.g. second tab, autoplay policy in some
      // contexts). Clear intent so the nudge doesn't loop-retry. Don't set error
      // — leave UI intact so the athlete can tap again.
      intendedPlayingRef.current = false;
    });
  }, [ready, completed, playing]);

  // ── pause ──
  const pause = useCallback(() => {
    if (!playing) return;
    const audio = audioRef.current;
    if (!audio) return;
    // Clear intent BEFORE calling pause() so the visibilitychange nudge — if
    // it fires immediately after — sees the correct intent state and does not
    // attempt to resume a deliberately-paused session.
    intendedPlayingRef.current = false;
    // audio.pause() is synchronous. The "pause" event listener handles
    // setPlaying(false) + stopRaf() so we don't need to call them here.
    audio.pause();
  }, [playing]);

  // ── cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopRaf();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
        // Remove from the DOM (mirrors the appendChild in Phase 0).
        audio.remove();
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      // Clear MediaSession handlers to avoid stale closures after unmount.
      try {
        const nav = navigator as NavigatorWithMediaSession;
        if (nav.mediaSession) {
          nav.mediaSession.setActionHandler("play", null);
          nav.mediaSession.setActionHandler("pause", null);
        }
      } catch {
        // Non-fatal — navigator may not be available in all teardown contexts.
      }
    };
  }, [stopRaf]);

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
