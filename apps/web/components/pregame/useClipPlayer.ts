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
  DIALED_IN_OPENER_VARIATIONS,
  buildAssembledTimeline,
  manifestUrl,
  resolvePlaylist,
  resolvePracticePlaylist,
} from "./audio-playlist";
import { assembleWavBlobWithBed } from "./audio/encode-wav";
import { getBed, BED_MIX_GAIN } from "./audio/beds";
import { getSportConfig, type Sport } from "./sport-registry";
import type { PrayerStyle } from "./types";
import { selectCacheStrategy } from "@/lib/audio/cache-strategy";

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
   * FV-144 — athlete-picked positive-play viz slugs, in order. Non-empty swaps
   * the template's flagship viz for these clips; empty/undefined keeps the
   * flagship. Pregame-only (ignored when practice=true).
   */
  positivePlays?: string[] | null;
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
  /**
   * How the athlete wants to close the session.
   * Pregame: "guided" keeps shared-prayer+sendoff; "self-guided" swaps to
   *   shared-prayer-selfguided and drops shared-sendoff.
   * Practice: "guided" appends pp-prayer; "self-guided" appends pp-prayer-selfguided.
   * Defaults to "guided" (unchanged behaviour for all existing call sites).
   */
  prayerStyle?: PrayerStyle | null;
  /**
   * FV-227 — athlete-chosen music bed id (see BedId in audio/beds.ts for the
   * full six-option catalog), or null for silence. When non-null, the bed MP3
   * is fetched and decoded once, then
   * mixed under the stitched voice PCM at BED_MIX_GAIN with 1.5 s fade-in and
   * 2 s fade-out. On bed fetch/decode failure the session falls through to
   * voice-only (never blocks or delays playback). Defaults to null (silence).
   */
  bedId?: string | null;
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

/**
 * Deadline (ms) bounding the NETWORK-bound init work — the manifest fetch plus
 * the parallel clip fetches. On the rink ("lie-fi": connected but no
 * throughput — the exact environment pregame was built for) fetch() can hang
 * indefinitely; without this guard `ready` never flips, the play button stays
 * disabled on "Preparing your session…", and the text-mode fallback never
 * fires. When the deadline elapses the in-flight fetches are aborted, init()
 * calls setError(), and screens-b converts to text mode. The deadline is
 * CLEARED the instant all fetches settle, so the CPU-bound decode that follows
 * — and cache-served offline sessions that resolve fast — are never subject to
 * a spurious timeout. (FV-172)
 */
const NETWORK_DEADLINE_MS = 15_000;

/**
 * Deadline (ms) bounding the OPTIONAL bed fetch (FV-227). The bed fetch runs
 * after the clip deadline has already cleared — this is a separate, shorter
 * guard. On any abort or error the session falls through to voice-only so
 * `setReady(true)` always fires. 5 s is generous for a ~350–1200 KB file on
 * the same CDN; a hung connection is cancelled and the athlete is unblocked.
 */
const BED_DEADLINE_MS = 5_000;

/**
 * Fetch a URL as ArrayBuffer. Returns null on network/HTTP failure — including
 * an AbortError when the optional `signal` is aborted (e.g. the lie-fi
 * deadline), which the caller treats as a fetch miss and falls back from.
 *
 * The `url` parameter is already the RESOLVED playable URL (after
 * strategy.resolve() has been applied by the caller). On web this is the
 * original content-addressed URL; on native (future PR) it will be a
 * local file:// path returned by NativeCacheStrategy.resolve().
 */
async function fetchArrayBuffer(url: string, signal?: AbortSignal): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, signal ? { signal } : undefined);
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
  positivePlays,
  practice = false,
  practiceState,
  practiceFocus,
  sport = "hockey",
  prayerStyle,
  bedId = null,
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

  // FV-266 — per-session dialed-in pre-practice opener variation. Picked once
  // per hook mount (lazy-init) so a session that re-resolves the playlist
  // doesn't re-randomize its opener mid-flow. Rotates the "dialed-in" opener
  // across DIALED_IN_OPENER_VARIATIONS; ignored for the "not-feeling-it" state.
  const dialedInVariationRef = useRef<number>(-1);
  if (dialedInVariationRef.current < 0) {
    dialedInVariationRef.current = Math.floor(
      Math.random() * DIALED_IN_OPENER_VARIATIONS.length,
    );
  }

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

    // Lie-fi guard (FV-172): bound ONLY the network-bound work (manifest + clip
    // fetches) with an AbortController + deadline. A hung load aborts → init()
    // calls setError() → screens-b converts to the text-mode fallback, instead
    // of leaving the play button stuck on "Preparing your session…". The
    // deadline is cleared the moment all fetches settle (see clearDeadline
    // after the clip Promise.all), so the CPU-bound decode below and fast
    // cache-served offline sessions are never timed out spuriously.
    const controller = new AbortController();
    let timedOut = false;
    let deadlineId: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, NETWORK_DEADLINE_MS);
    const clearDeadline = () => {
      if (deadlineId !== null) {
        clearTimeout(deadlineId);
        deadlineId = null;
      }
    };

    async function init() {
      // Resolve the storage strategy once for this session. On web this is
      // always WebCacheStrategy (identity resolve, Cache Storage warm/check).
      // On native (future PR) it will be NativeCacheStrategy (file:// paths).
      // Calling selectCacheStrategy() inside init() is intentional — it is
      // memoized (module-level singleton) so the cost is negligible.
      const strategy = selectCacheStrategy();

      // 1. Fetch manifest (network-bound — covered by the deadline).
      // strategy.resolve() maps the manifest URL to a playable URL:
      //   web:    identity — SW serves from Cache Storage transparently.
      //   native: file:// path on the device filesystem (future PR).
      let manifestRes: Response;
      try {
        const resolvedManifestUrl = await strategy.resolve(manifestUrl());
        manifestRes = await fetch(resolvedManifestUrl, { signal: controller.signal });
      } catch {
        // Network failure or a deadline abort. Either way, fall back.
        clearDeadline();
        if (cancelled) return;
        setError(timedOut ? "session preparation timed out" : "manifest fetch failed");
        return;
      }
      if (cancelled) return;
      if (!manifestRes.ok) {
        clearDeadline();
        setError(`manifest fetch failed: ${manifestRes.status}`);
        return;
      }
      let manifest: ClipManifest;
      try {
        manifest = (await manifestRes.json()) as ClipManifest;
      } catch {
        // Mirror the manifest-fetch catch above: clear the deadline and skip
        // the setState if we were unmounted/aborted mid-parse.
        clearDeadline();
        if (cancelled) return;
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
        clips = resolvePracticePlaylist(
          manifest,
          practiceState,
          practiceFocus,
          sportConfig,
          prayerStyle,
          dialedInVariationRef.current,
        );
        if (!clips) {
          clearDeadline();
          setError("no template");
          return;
        }
      } else {
        // Pass sport so the opener slug is sport-aware (FV-117 / FV-116):
        // basketball gets opener-bb-courage / opener-bb-decisions where
        // available; all other combinations use the shared hockey openers.
        clips = resolvePlaylist(
          need!,
          position!,
          adversity!,
          manifest,
          anchor,
          selfTalk,
          cueWord,
          sport,
          prayerStyle,
          positivePlays,
        );
        if (!clips) {
          // No template for this combination — sentinel triggers legacy path.
          clearDeadline();
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

      // 4. Fetch all clip ArrayBuffers in parallel (network-bound — covered by
      // the deadline; an aborted fetch resolves to null below).
      //
      // strategy.resolve() maps each content-addressed clip URL to a playable
      // URL before fetching:
      //   web:    identity — the original /audio/pregame/clips/<slug>.<hash>.mp3
      //           URL is returned unchanged; the SW audioCacheFirst handler
      //           serves the cached bytes transparently.
      //   native: file:// path on the device filesystem (future PR).
      //
      // All resolves run in parallel with the fetches via Promise.all. On web
      // resolve() is a no-op async identity, so performance is unchanged.
      const resolvedClipUrls = await Promise.all(
        clips.map((clip) => strategy.resolve(clip.url)),
      );
      const bufferResults = await Promise.all(
        resolvedClipUrls.map((url) => fetchArrayBuffer(url, controller.signal)),
      );
      // All network-bound work is done — clear the deadline so the CPU-bound
      // decode below is never aborted or timed out. Cache-served offline
      // sessions reach this point fast and clear the deadline well before it
      // would fire, so they are never subject to a spurious timeout.
      clearDeadline();
      if (cancelled) return;

      if (bufferResults.some((b) => b === null)) {
        // A null can be a genuine 404 OR an aborted fetch on a hung network;
        // surface the timeout cause when the deadline fired so the fallback
        // reason is accurate.
        setError(timedOut ? "session preparation timed out" : "clip fetch failed");
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

      // Decode complete — but we may still need the AudioContext to decode
      // the bed MP3. Defer closing until after the optional bed decode below.

      if (cancelled) {
        decodeCtx.close().catch(() => {/* ignore */});
        return;
      }

      // 6. Optionally fetch + decode the music bed (FV-227).
      //
      // Design:
      //   - Bed fetch happens AFTER all clip decodes (network deadline is
      //     already cleared, so this is purely async + CPU-bound work).
      //   - On ANY failure (fetch, decode, abort, or cancelled) fall back to
      //     voice-only. Never block or delay the session on a bed failure —
      //     `setReady(true)` fires regardless of bed outcome.
      //   - A bed-specific ~5 s abort deadline (BED_DEADLINE_MS) guards against
      //     a connected-but-stalled network hanging "Preparing your session…"
      //     after the clip deadline has already cleared.
      //   - The decoded bed buffer is used immediately in step 7 and then
      //     released — no ref is held past blob construction.
      let bedChannel0: Float32Array | null = null;
      if (bedId) {
        const bed = getBed(bedId);
        if (bed) {
          const bedController = new AbortController();
          const bedDeadlineId = setTimeout(() => {
            bedController.abort();
          }, BED_DEADLINE_MS);

          try {
            const bedBuffer = await fetchArrayBuffer(bed.path, bedController.signal);
            clearTimeout(bedDeadlineId);

            if (cancelled) {
              decodeCtx.close().catch(() => {/* ignore */});
              return;
            }

            if (bedBuffer) {
              try {
                const decoded = await decodeCtx.decodeAudioData(bedBuffer.slice(0));
                if (!cancelled) {
                  // Beds are stereo (44.1 kHz, 2 ch) — take channel 0 (left).
                  bedChannel0 = decoded.getChannelData(0);
                }
              } catch {
                // Bed decode failed — fall back to voice-only (console.warn only).
                if (!cancelled) {
                  console.warn("[useClipPlayer] bed decode failed, continuing voice-only");
                }
              }
            } else {
              console.warn("[useClipPlayer] bed fetch failed, continuing voice-only");
            }
          } catch {
            // fetchArrayBuffer threw — most likely an AbortError from the
            // bed deadline. Clear the deadline and fall through to voice-only.
            clearTimeout(bedDeadlineId);
            if (!cancelled) {
              console.warn("[useClipPlayer] bed fetch aborted or errored, continuing voice-only");
            }
            if (cancelled) {
              decodeCtx.close().catch(() => {/* ignore */});
              return;
            }
          }
        }
      }

      // Close the AudioContext now that all decoding (clips + bed) is done.
      decodeCtx.close().catch(() => {/* ignore */});

      if (cancelled) return;

      // 7. Assemble all decoded buffers into a single WAV blob, mixing the bed
      //    under the voice PCM if the athlete chose one (FV-227).
      //    Silence path (bedChannel0 === null) → assembleWavBlobWithBed falls
      //    through to assembleWavBlob behaviour unchanged.
      const voiceSampleRate = decodedBuffers[0]?.sampleRate ?? 24000;
      let blob: Blob;
      try {
        blob = assembleWavBlobWithBed(
          decodedBuffers,
          bedChannel0,
          BED_MIX_GAIN,
          voiceSampleRate,
        );
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
      // Clear the deadline and abort any in-flight manifest/clip fetch so an
      // unmounted or re-keyed session doesn't hold the connection open or fire
      // a stray timeout. cancelled=true is set first, so the abort-driven
      // fetch rejection short-circuits before any setState.
      clearDeadline();
      controller.abort();
    };
  }, [need, position, adversity, anchor, selfTalk, cueWord, positivePlays, practice, practiceState, practiceFocus, sport, prayerStyle, bedId, startRaf, stopRaf, wireMediaSession]);

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
