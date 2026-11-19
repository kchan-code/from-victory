"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AudioTimeline, Phase } from "./types";
import { audioAssetUrl } from "../audio-mapping";
import { assembleWavBlob } from "./encode-wav";
import { createNativeNarrationPlayer, getNarrationBridge, type NativeNarrationPlayer } from "@/lib/native/narration";

// BreathingSphere only knows four phases. Map the broader audio timeline
// phase set onto them: intro/settle (and anything else non-breath) collapse
// to "idle" so the sphere sits at rest while the narrator is talking.
type SpherePhase = "idle" | "inhale" | "exhale" | "done";

function toSpherePhase(p: Phase): SpherePhase {
  if (p === "inhale" || p === "exhale" || p === "done") return p;
  return "idle";
}

// Hook: load a pregame audio file + its sidecar timeline, expose play/
// pause control, and surface the current phase + t (0..1 within phase)
// derived from audio.currentTime. BreathScreen feeds that into
// <BreathingSphere controlled={...} /> so the visuals stay synced to the
// narration without a parallel timer.
//
// Falls back gracefully if the MP3 or JSON 404s — the consumer can then
// run the sphere in standalone mode.

export type BreathAudioState = {
  nativeNarrationPlayer: NativeNarrationPlayer | null;
  status: "loading" | "ready" | "missing" | "error";
  isPlaying: boolean;
  hasStarted: boolean;
  controlled: {
    phase: SpherePhase;
    t: number;
    round: number;
    isPlaying: boolean;
  };
  // Raw timeline phase before the sphere mapping. Useful if a screen
  // wants to surface intro/settle copy distinctly.
  rawPhase: Phase | "idle";
  rounds: number;
  // Caller wires this to <audio ref={...} /> (or we can render our own
  // element; BreathScreen prefers passing one in).
  audioRef: React.RefObject<HTMLAudioElement | null>;
  // The slug whose timeline actually loaded: `slug`, or `fallbackSlug` when
  // the first one was not available. The caller builds the <audio> src from
  // this, never from the slug it asked for.
  resolvedSlug: string;
  usesNativeAudio: boolean;
  play: () => Promise<void>;
  pause: () => void;
};

// Find the active phase index given the current audio time. Returns -1
// if we haven't crossed the first phase mark yet.
function findActivePhaseIndex(
  timeline: AudioTimeline,
  currentSec: number,
): number {
  let idx = -1;
  for (let i = 0; i < timeline.phases.length; i++) {
    const p = timeline.phases[i];
    if (p && p.startSec <= currentSec) idx = i;
    else break;
  }
  return idx;
}

export function useBreathAudio({
  slug,
  fallbackSlug,
  expectedRounds,
  onComplete,
}: {
  slug: string;
  // FV-758: tried when `slug`'s timeline cannot be loaded (404, or not in the
  // offline audio cache). The saved-run recording is newer than some devices'
  // caches, so an offline athlete falls back to the standard recording rather
  // than to a silent sphere.
  fallbackSlug?: string;
  // Used for the pip count when timeline hasn't loaded yet OR when audio
  // is missing.
  expectedRounds: number;
  onComplete?: () => void;
}): BreathAudioState {
  const [status, setStatus] = useState<BreathAudioState["status"]>("loading");
  const [timeline, setTimeline] = useState<AudioTimeline | null>(null);
  const [currentSec, setCurrentSec] = useState(0);
  const [resolvedSlug, setResolvedSlug] = useState(slug);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [nativeNarrationPlayer, setNativeNarrationPlayer] = useState<NativeNarrationPlayer | null>(null);
  const completedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const nativeBridgeRef = useRef(getNarrationBridge());
  const nativePlayerRef = useRef<NativeNarrationPlayer | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Probe + load timeline JSON. We treat MP3 missing as expected — caller
  // can fall back to sphere-standalone mode.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 15_000);
    completedRef.current = false;
    setStatus("loading");
    setIsPlaying(false);
    setHasStarted(false);
    setNativeNarrationPlayer(null);
    setCurrentSec(0);
    setResolvedSlug(slug);
    // Load the first timeline that is available. A failed fetch (offline cache
    // miss) on a slug that has a fallback moves on to the fallback; on the
    // last candidate it surfaces as before ("missing" for a 404, "error" for a
    // rejected fetch).
    const candidates = fallbackSlug && fallbackSlug !== slug ? [slug, fallbackSlug] : [slug];
    const loadTimeline = async (): Promise<{ slug: string; json: AudioTimeline } | null> => {
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (candidate === undefined) continue;
        const isLast = i === candidates.length - 1;
        try {
          const res = await fetch(audioAssetUrl(candidate, "json"), { signal: controller.signal });
          if (!res.ok) continue;
          // A candidate that has a fallback behind it is only accepted when
          // its MP3 is reachable too. Otherwise a cached timeline with an
          // uncached MP3 (offline) would end in the silent sphere instead of
          // the fallback recording. The service worker answers HEAD from its
          // audio cache.
          if (!isLast) {
            const head = await fetch(audioAssetUrl(candidate, "mp3"), { method: "HEAD", signal: controller.signal });
            if (!head.ok) continue;
          }
          return { slug: candidate, json: (await res.json()) as AudioTimeline };
        } catch (err) {
          if (isLast || controller.signal.aborted) throw err;
        }
      }
      return null;
    };
    loadTimeline()
      .then(async (loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setStatus("missing");
          return;
        }
        const json = loaded.json;
        setResolvedSlug(loaded.slug);
        const bridge = nativeBridgeRef.current;
        if (bridge) {
          const response = await fetch(audioAssetUrl(loaded.slug, "mp3"), { signal: controller.signal });
          if (!response.ok) throw new Error("Breathing audio unavailable");
          const bytes = await response.arrayBuffer();
          if (cancelled) return;
          clearTimeout(deadline);
          const decoder = new OfflineAudioContext(1, 1, 24000);
          const buffer = await decoder.decodeAudioData(bytes);
          if (cancelled) return;
          const player = await createNativeNarrationPlayer(bridge, assembleWavBlob([buffer]), controller.signal);
          if (cancelled) { player.remove(); return; }
          nativePlayerRef.current = player;
          setNativeNarrationPlayer(player);
          player.setAttribute("data-fv-guided-session", "active");
          player.addEventListener("play", () => { setHasStarted(true); setIsPlaying(true); });
          player.addEventListener("pause", () => setIsPlaying(false));
          player.addEventListener("error", () => { setIsPlaying(false); setStatus("error"); });
          player.addEventListener("ended", () => {
            setIsPlaying(false);
            player.removeAttribute("data-fv-guided-session");
            document.dispatchEvent(new Event("fv:guided-session-end"));
            if (!completedRef.current) {
              completedRef.current = true;
              onCompleteRef.current?.();
            }
          });
        }
        setTimeline(json);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      }).finally(() => clearTimeout(deadline));
    return () => {
      cancelled = true;
      clearTimeout(deadline);
      controller.abort();
      nativePlayerRef.current?.remove();
      nativePlayerRef.current = null;
    };
  }, [slug, fallbackSlug]);

  // Wire audio element listeners
  //
  // We deliberately do NOT use audio "timeupdate" for the sphere clock —
  // that event only fires every ~250ms in most browsers (some platforms
  // worse), which gives 4 frames over a 1s phase change and visible
  // chop. Instead we run a rAF loop while isPlaying and read
  // audio.currentTime directly at 60fps. The play/pause/ended listeners
  // still gate that loop on/off.
  useEffect(() => {
    const el = audioRef.current;
    if (nativeBridgeRef.current || !el || status !== "ready") return;
    const onPlay = () => { setHasStarted(true); setIsPlaying(true); };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [status, onComplete]);

  // rAF clock — reads audio.currentTime at the display refresh rate so
  // the sphere expands/contracts smoothly instead of in 250ms steps.
  useEffect(() => {
    if (!isPlaying) return;
    const el = nativePlayerRef.current ?? audioRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      setCurrentSec(el.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  const play = useCallback(async () => {
    const el = nativePlayerRef.current ?? audioRef.current;
    if (!el) return;
    try {
      await el.play();
    } catch {
      // Autoplay blocked or decode failure. Surface as error so the
      // consumer can fall back to standalone mode.
      setStatus("error");
    }
  }, []);

  const pause = useCallback(() => {
    (nativePlayerRef.current ?? audioRef.current)?.pause();
  }, []);

  // Derive sphere-controlled values from the active phase + currentSec
  const { controlled, rawPhase } = useMemo<{
    controlled: BreathAudioState["controlled"];
    rawPhase: Phase | "idle";
  }>(() => {
    const idle = {
      controlled: { phase: "idle" as const, t: 0, round: 0, isPlaying },
      rawPhase: "idle" as const,
    };
    if (!timeline || timeline.phases.length === 0) return idle;
    const idx = findActivePhaseIndex(timeline, currentSec);
    if (idx < 0) return idle;
    const active = timeline.phases[idx];
    if (!active) return idle;
    const next = timeline.phases[idx + 1];
    const phaseEnd = next ? next.startSec : timeline.durationSec;
    const phaseLen = Math.max(0.001, phaseEnd - active.startSec);
    const t = Math.min(1, Math.max(0, (currentSec - active.startSec) / phaseLen));
    return {
      controlled: {
        phase: toSpherePhase(active.phase),
        t,
        round: active.round ?? 0,
        isPlaying,
      },
      rawPhase: active.phase,
    };
  }, [timeline, currentSec, isPlaying]);

  // Watch for "done" phase mark — fires complete even if audio's `ended`
  // event lags or the file has a tail of silence after the done mark.
  useEffect(() => {
    if (rawPhase === "done" && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [rawPhase, onComplete]);

  return {
    nativeNarrationPlayer,
    resolvedSlug,
    status,
    isPlaying,
    hasStarted,
    controlled,
    rawPhase,
    rounds: expectedRounds,
    audioRef,
    usesNativeAudio: nativeBridgeRef.current !== null,
    play,
    pause,
  };
}
