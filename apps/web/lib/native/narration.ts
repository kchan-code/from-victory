/** Native-only narration. No provider SDK, account, URL, or listening data crosses
 * this bridge: only the assembled From Victory WAV and playback commands.
 * Contract matches FVNarration on iOS and Android. Older shells and browsers
 * return null and keep their existing HTML playback behavior. */
export type NarrationStatus = {
  position: number;
  duration: number;
  state: "ready" | "playing" | "paused" | "ended" | "error";
  error?: string;
  volume?: number;
};
export interface NarrationBridge {
  begin(options: { sessionId: string; byteLength: number }): Promise<void>;
  append(options: { sessionId: string; index: number; data: string }): Promise<void>;
  prepare(options: { sessionId: string }): Promise<{ duration: number }>;
  play(options: { sessionId: string }): Promise<void>;
  pause(options: { sessionId: string }): Promise<void>;
  getStatus(options: { sessionId: string }): Promise<NarrationStatus>;
  dispose(options: { sessionId: string }): Promise<void>;
  setVolume?(options: { sessionId: string; volume: number }): Promise<{ volume: number }>;
}
export function getNarrationBridge(): NarrationBridge | null {
  if (typeof window === "undefined") return null;
  const injected = window as unknown as {
    Capacitor?: { Plugins?: { FVNarration?: NarrationBridge } };
  };
  const bridge = injected.Capacitor?.Plugins?.FVNarration;
  return bridge && ["begin", "append", "prepare", "play", "pause", "getStatus", "dispose"]
    .every((method) => typeof bridge[method as keyof NarrationBridge] === "function")
    ? bridge : null;
}
// Ephemeral preference only: resets on page reload, never stored or sent to a server.
let desiredNarrationVolume = 1;
const volumeListeners = new Set<() => void>();
export function getNarrationVolume(): number { return desiredNarrationVolume; }
export function setNarrationVolume(volume: number): void {
  if (!Number.isFinite(volume)) return;
  desiredNarrationVolume = Math.max(0, Math.min(1, volume));
  // Notify on identical values too so a failed native write can be retried.
  volumeListeners.forEach((listener) => listener());
}
export function subscribeNarrationVolume(listener: () => void): () => void {
  volumeListeners.add(listener);
  return () => { volumeListeners.delete(listener); };
}

export const NARRATION_MAX_BYTES = 64 * 1024 * 1024;
export const NARRATION_CHUNK_BYTES = 192 * 1024;
const CALL_TIMEOUT_MS = 15_000;
// A bridge timeout cannot cancel a native call. Serialize begin plus its late
// cleanup so an old begin can never replace a newer session after timing out.
let beginQueue: Promise<unknown> = Promise.resolve();

function bounded<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Native narration timed out")), CALL_TIMEOUT_MS);
    promise.then((value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); });
  });
}
function checkAbort(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException("Narration cancelled", "AbortError");
}
function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

/** The narrow media surface shared by HTML playback and the native adapter. */
export type NarrationPlayer = Pick<HTMLAudioElement,
  "currentTime" | "duration" | "paused" | "ended" | "play" | "pause" |
  "addEventListener" | "setAttribute" | "removeAttribute" | "remove">;

/** Native status remains authoritative across app suspension. Polling resumes
 * on visibility; we never infer completion from a JavaScript timer or resume
 * automatically after a call/headphone disconnect. */
export class NativeNarrationPlayer extends EventTarget implements NarrationPlayer {
  readonly native = true;
  readonly supportsVolume: boolean;
  volumeError: string | null = null;
  private pendingVolume: number | null = null;
  private volumeDrain: Promise<void> | null = null;
  private unsubscribeVolume: () => void = () => undefined;
  private position = 0;
  private sampledAt = performance.now();
  get currentTime(): number {
    return Math.min(this.duration, this.position +
      (this.paused ? 0 : Math.max(0, performance.now() - this.sampledAt) / 1000));
  }
  duration: number;
  paused = true;
  ended = false;
  private disposed = false;
  private timer: ReturnType<typeof setInterval>;
  private queue: Promise<unknown> = Promise.resolve();
  private polling = false;
  private marker = document.createElement("span");
  private refreshVisible = () => { if (document.visibilityState === "visible") this.poll(); };

  constructor(private bridge: NarrationBridge, readonly sessionId: string, duration: number) {
    super();
    this.duration = duration;
    this.supportsVolume = typeof bridge.setVolume === "function";
    if (this.supportsVolume) {
      this.unsubscribeVolume = subscribeNarrationVolume(() => { void this.applyVolume(); });
    }
    this.marker.hidden = true;
    document.body.appendChild(this.marker);
    this.timer = setInterval(() => this.poll(), 250);
    document.addEventListener("visibilitychange", this.refreshVisible);
  }
  /** Coalesce rapid slider changes independently of play/pause/status work.
   * Rejections are visible but nonfatal: never stop narration or seize focus. */
  applyVolume(): Promise<void> {
    if (!this.supportsVolume || this.disposed || this.ended) return Promise.resolve();
    this.pendingVolume = getNarrationVolume();
    if (this.volumeDrain) return this.volumeDrain;
    this.volumeDrain = Promise.resolve().then(async () => {
      while (this.pendingVolume !== null && !this.disposed && !this.ended) {
        const volume = this.pendingVolume;
        this.pendingVolume = null;
        try {
          const result = await bounded(this.bridge.setVolume!({ sessionId: this.sessionId, volume }));
          if (!Number.isFinite(result.volume) || result.volume < 0 || result.volume > 1) {
            throw new Error("Invalid narration volume");
          }
          if (!this.disposed) this.volumeError = null;
        } catch {
          if (!this.disposed) this.volumeError = "Couldn’t change narration volume. Try again.";
        }
        if (!this.disposed) this.dispatchEvent(new Event("volumechange"));
      }
    }).finally(async () => {
      this.volumeDrain = null;
      if (this.pendingVolume !== null && !this.disposed) await this.applyVolume();
    });
    return this.volumeDrain;
  }
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation);
    this.queue = next.catch(() => undefined);
    return next;
  }
  private accept(status: NarrationStatus): void {
    if (this.disposed) return;
    if (!Number.isFinite(status.position) || !Number.isFinite(status.duration)) {
      throw new Error("Invalid native narration status");
    }
    this.position = Math.max(0, status.position);
    this.sampledAt = performance.now();
    this.duration = status.duration;
    const wasPaused = this.paused;
    this.paused = status.state !== "playing";
    if (status.state === "error") throw new Error(status.error || "Native narration failed");
    if (status.state === "ended" && !this.ended) {
      this.ended = true;
      this.dispatchEvent(new Event("ended"));
    } else if (wasPaused !== this.paused) {
      this.dispatchEvent(new Event(this.paused ? "pause" : "play"));
    }
    this.dispatchEvent(new Event("timeupdate"));
  }
  private fail(): void {
    if (this.disposed) return;
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
    this.dispatchEvent(new Event("error"));
    // Release native audio on an unknown/error state. Never fall back to an
    // HTML player, which could stop the athlete's external music.
    this.remove();
  }
  private poll(): void {
    if (this.disposed || this.polling || this.ended) return;
    this.polling = true;
    void this.enqueue(async () => {
      if (!this.disposed) this.accept(await bounded(this.bridge.getStatus({ sessionId: this.sessionId })));
    }).catch(() => this.fail()).finally(() => { this.polling = false; });
  }
  play(): Promise<void> {
    return this.enqueue(async () => {
      if (this.disposed || this.ended) return;
      await this.applyVolume();
      if (this.disposed || this.ended) return;
      await bounded(this.bridge.play({ sessionId: this.sessionId }));
      if (!this.disposed) this.accept(await bounded(this.bridge.getStatus({ sessionId: this.sessionId })));
    });
  }
  pause(): void {
    void this.enqueue(async () => {
      if (this.disposed || this.ended) return;
      await bounded(this.bridge.pause({ sessionId: this.sessionId }));
      if (!this.disposed) this.accept(await bounded(this.bridge.getStatus({ sessionId: this.sessionId })));
    }).catch(() => this.fail());
  }
  setAttribute(name: string, value: string): void { this.marker.setAttribute(name, value); }
  removeAttribute(name: string): void { this.marker.removeAttribute(name); }
  remove(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribeVolume();
    this.pendingVolume = null;
    clearInterval(this.timer);
    document.removeEventListener("visibilitychange", this.refreshVisible);
    this.marker.remove();
    document.dispatchEvent(new Event("fv:guided-session-end"));
    // Stop immediately even if a bridge response is stalled. Repeat after
    // pending commands settle so a late play response cannot leave audio live.
    void bounded(this.bridge.dispose({ sessionId: this.sessionId })).catch(() => undefined);
    void this.enqueue(() => bounded(this.bridge.dispose({ sessionId: this.sessionId }))).catch(() => undefined);
  }
}

/** Canonical RFC 4122 v4 id for a narration session. `crypto.randomUUID` only
 * exists from Chromium 92; Android shells on an un-updated System WebView
 * (e.g. 83 on a stock Android 11 image) lack it, and throwing here left the
 * athlete on the silent text-mode fallback (FV-643). `getRandomValues` is
 * available on every WebView this app supports. */
export function narrationSessionId(): string {
  const source = globalThis.crypto;
  if (typeof source?.randomUUID === "function") return source.randomUUID();
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function createNativeNarrationPlayer(
  bridge: NarrationBridge, blob: Blob, signal: AbortSignal,
): Promise<NativeNarrationPlayer> {
  checkAbort(signal);
  if (blob.size < 44 || blob.size > NARRATION_MAX_BYTES) throw new Error("Invalid narration size");
  const sessionId = narrationSessionId();
  const dispose = () => { void bounded(bridge.dispose({ sessionId })).catch(() => undefined); };
  signal.addEventListener("abort", dispose, { once: true });
  let abandoned = false;
  const begin = beginQueue.catch(() => undefined).then(async () => {
    checkAbort(signal);
    if (abandoned) throw new DOMException("Narration cancelled", "AbortError");
    await bridge.begin({ sessionId, byteLength: blob.size });
    if (abandoned || signal.aborted) await bridge.dispose({ sessionId });
  });
  beginQueue = begin.catch(() => undefined);
  try {
    await bounded(begin);
    checkAbort(signal);
    let index = 0;
    for (let offset = 0; offset < blob.size; offset += NARRATION_CHUNK_BYTES) {
      const bytes = new Uint8Array(await blob.slice(offset, offset + NARRATION_CHUNK_BYTES).arrayBuffer());
      checkAbort(signal);
      await bounded(bridge.append({ sessionId, index: index++, data: base64(bytes) }));
      checkAbort(signal);
    }
    const { duration } = await bounded(bridge.prepare({ sessionId }));
    checkAbort(signal);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("Invalid narration duration");
    const player = new NativeNarrationPlayer(bridge, sessionId, duration);
    await player.applyVolume();
    if (signal.aborted) { player.remove(); checkAbort(signal); }
    return player;
  } catch (error) {
    abandoned = true;
    dispose();
    throw error;
  } finally {
    signal.removeEventListener("abort", dispose);
  }
}
