"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AudioTimeline, Phase } from "./types";
import { audioAssetUrl } from "../audio-mapping";

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
  status: "loading" | "ready" | "missing" | "error";
  isPlaying: boolean;
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
  audioRef: React.RefObject<HTMLAudioElement>;
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
  expectedRounds,
  onComplete,
}: {
  slug: string;
  // Used for the pip count when timeline hasn't loaded yet OR when audio
  // is missing.
  expectedRounds: number;
  onComplete?: () => void;
}): BreathAudioState {
  const [status, setStatus] = useState<BreathAudioState["status"]>("loading");
  const [timeline, setTimeline] = useState<AudioTimeline | null>(null);
  const [currentSec, setCurrentSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const completedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Probe + load timeline JSON. We treat MP3 missing as expected — caller
  // can fall back to sphere-standalone mode.
  useEffect(() => {
    let cancelled = false;
    fetch(audioAssetUrl(slug, "json"))
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setStatus("missing");
          return;
        }
        const json = (await res.json()) as AudioTimeline;
        setTimeline(json);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

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
    if (!el || status !== "ready") return;
    const onPlay = () => setIsPlaying(true);
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
    const el = audioRef.current;
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
    const el = audioRef.current;
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
    audioRef.current?.pause();
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
    status,
    isPlaying,
    controlled,
    rawPhase,
    rounds: expectedRounds,
    audioRef,
    play,
    pause,
  };
}
