"use client"; // client: ephemeral narration preference and accessible range input

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import {
  getNarrationVolume, setNarrationVolume, subscribeNarrationVolume,
  type NativeNarrationPlayer,
} from "@/lib/native/narration";

export function NarrationVolumeControl({ player }: { player: NativeNarrationPlayer | null | undefined }) {
  const id = useId();
  const volume = useSyncExternalStore(subscribeNarrationVolume, getNarrationVolume, () => 1);
  const [error, setError] = useState<string | null>(player?.volumeError ?? null);
  useEffect(() => {
    setError(player?.volumeError ?? null);
    if (!player) return;
    const update = () => setError(player.volumeError);
    player.addEventListener("volumechange", update);
    return () => player.removeEventListener("volumechange", update);
  }, [player]);
  if (!player?.supportsVolume) return null;
  const percent = Math.round(volume * 100);
  return (
    <div className="my-3 w-full rounded-[14px] border border-hairline bg-charcoal px-4 py-3">
      <div className="flex items-center justify-between gap-3 font-body text-[13px] text-cream">
        <label htmlFor={id}>Narration volume</label>
        <span aria-hidden="true" className="font-mono text-gold">{percent === 0 ? "Muted" : `${percent}%`}</span>
      </div>
      <input
        id={id} type="range" min={0} max={100} step={1} value={percent}
        aria-valuetext={percent === 0 ? "Muted" : `${percent} percent`}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
        onChange={(event) => setNarrationVolume(Number(event.currentTarget.value) / 100)}
        className="block min-h-[44px] w-full cursor-pointer accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      />
      <p id={`${id}-help`} className="font-body text-[12px] leading-[1.5] text-cream/70">
        Set your music level with your phone’s volume buttons, then adjust narration here. Phone volume changes both.
      </p>
      {error && (
        <div id={`${id}-error`} role="status" className="mt-1 font-body text-[12px] text-cream">
          {error}
          <button type="button" onClick={() => setNarrationVolume(volume)}
            className="ml-2 min-h-[44px] px-2 text-gold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
