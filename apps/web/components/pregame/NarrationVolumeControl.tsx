"use client"; // client: temporary volume disclosure and ephemeral narration preference

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  getNarrationVolume, setNarrationVolume, subscribeNarrationVolume,
  type NativeNarrationPlayer,
} from "@/lib/native/narration";

export function NarrationVolumeControl({ player, placement = "standalone" }: {
  player: NativeNarrationPlayer | null | undefined;
  /** Transport uses its parent's relative full-width row as the panel anchor. */
  placement?: "standalone" | "transport";
}) {
  const id = useId();
  const volume = useSyncExternalStore(subscribeNarrationVolume, getNarrationVolume, () => 1);
  const [error, setError] = useState<string | null>(player?.volumeError ?? null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setOpen(false);
    setError(player?.volumeError ?? null);
    if (!player) return;
    const update = () => setError(player.volumeError);
    player.addEventListener("volumechange", update);
    return () => player.removeEventListener("volumechange", update);
  }, [player]);
  useEffect(() => {
    if (!open) return;
    sliderRef.current?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        // Leave focus with the outside control the athlete chose.
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  if (!player?.supportsVolume) return null;
  const percent = Math.round(volume * 100);
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };
  return (
    <div
      ref={rootRef}
      className={placement === "transport" ? "col-start-3 min-w-0 justify-self-end" : "relative my-1 flex w-full justify-center"}
      onBlur={(event) => {
        // This is a disclosure, not a modal: Tab can leave it normally.
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef} type="button" aria-expanded={open} aria-controls={`${id}-panel`}
        aria-label={`${percent === 0 ? "Voice muted" : "Voice volume"}${error ? ", adjustment failed; open to retry" : ""}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-[44px] max-w-full flex-col items-center justify-center rounded-pill border border-hairline px-3 py-1 font-heading text-[12px] leading-tight text-cream/80 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <span className="inline-flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path d={percent === 0 ? "m16 9 5 6m0-6-5 6" : "M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"} />
          </svg>
          <span>{percent === 0 ? "Voice muted" : "Voice"}</span>
        </span>
        {error && <span className="mt-0.5 text-[10px] text-gold">Retry</span>}
      </button>
      {!open && error && <span className="sr-only" role="status">Narration volume could not be changed. Open Voice to retry.</span>}
      {open && (
        <div
          id={`${id}-panel`} role="group" aria-labelledby={`${id}-label`}
          className="absolute inset-x-0 bottom-full z-30 mx-auto mb-2 max-h-[calc(100dvh-96px)] w-full max-w-[calc(100vw-32px)] overflow-y-auto rounded-[14px] border border-hairline bg-charcoal px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3 font-body text-[13px] text-cream">
            <label id={`${id}-label`} htmlFor={id}>Narration volume</label>
            <span aria-hidden="true" className="font-mono text-gold">{percent === 0 ? "Muted" : `${percent}%`}</span>
          </div>
          <input
            ref={sliderRef} id={id} type="range" min={0} max={100} step={1} value={percent}
            aria-valuetext={percent === 0 ? "Muted" : `${percent} percent`}
            aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
            onChange={(event) => setNarrationVolume(Number(event.currentTarget.value) / 100)}
            className="block min-h-[44px] w-full cursor-pointer accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          />
          <p id={`${id}-help`} className="font-body text-[12px] leading-[1.5] text-cream/70">
            Adjusts only narration. Phone volume changes both music and voice.
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
          <div className="mt-1 flex justify-end">
            <button type="button" onClick={close}
              className="min-h-[44px] rounded-sm px-3 font-heading text-[13px] text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
