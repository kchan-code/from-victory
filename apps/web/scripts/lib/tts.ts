// TTS provider wrapper — OpenAI (default) + ElevenLabs (FV-285 bake-off).
//
// Both providers are called directly via `fetch` (no npm SDK for either) so
// the generator + bake-off scripts keep zero runtime deps beyond Node 18+
// built-ins. Keeps `node --experimental-strip-types` happy and avoids
// touching apps/web's production deps.
//
// Provider selection: explicit `TtsOptions.provider` wins; otherwise the
// `TTS_PROVIDER` env var (`"openai"` default | `"elevenlabs"`). This means
// `npm run audio:generate` is unchanged unless TTS_PROVIDER=elevenlabs is set,
// and the bake-off CLI (scripts/bakeoff-voices.ts) can force elevenlabs per
// call regardless of env.

import { rm, writeFile } from "node:fs/promises";

import { transcodeTo24kMonoMp3 } from "./ffmpeg.ts";

export type TtsProvider = "openai" | "elevenlabs";

export type TtsOptions = {
  text: string;
  voice: string;
  instructions?: string;
  speed?: number;
  // Output path for the generated MP3.
  outPath: string;
  // Forces the provider for this call, overriding TTS_PROVIDER. The
  // bake-off CLI always sets this to "elevenlabs" explicitly.
  provider?: TtsProvider;
  // Neighbouring speech segments (ElevenLabs `previous_text` / `next_text`)
  // for prosody continuity across a stitched clip. No OpenAI equivalent —
  // ignored by the openai path.
  previousText?: string;
  nextText?: string;
};

/** Resolve which provider a call should use: explicit option > TTS_PROVIDER env > "openai". */
export function resolveProvider(explicit?: TtsProvider): TtsProvider {
  if (explicit) return explicit;
  const env = process.env.TTS_PROVIDER;
  if (!env || env === "openai") return "openai";
  if (env === "elevenlabs") return "elevenlabs";
  console.warn(`[tts] Unrecognized TTS_PROVIDER="${env}" — falling back to "openai".`);
  return "openai";
}

export async function synthesizeSpeech(opts: TtsOptions): Promise<void> {
  const provider = resolveProvider(opts.provider);
  if (provider === "elevenlabs") {
    await synthesizeElevenLabs(opts);
  } else {
    await synthesizeOpenAi(opts);
  }
}

// ──────────────────────────────────────────────────────────────────────
// OpenAI (gpt-4o-mini-tts) — unchanged behavior from the pre-FV-285 wrapper.

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

async function synthesizeOpenAi(opts: TtsOptions): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to apps/web/.env.local before running the generator.",
    );
  }

  const body: Record<string, unknown> = {
    model: "gpt-4o-mini-tts",
    voice: opts.voice,
    input: opts.text,
    response_format: "mp3",
  };
  if (opts.instructions) body.instructions = opts.instructions;
  if (opts.speed) body.speed = opts.speed;

  const res = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "(unreadable error body)");
    throw new Error(
      `OpenAI TTS failed (${res.status} ${res.statusText}): ${errText.slice(0, 400)}`,
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(opts.outPath, buf);
}

// ──────────────────────────────────────────────────────────────────────
// ElevenLabs — FV-285 bake-off provider.

const ELEVENLABS_TTS_URL_BASE = "https://api.elevenlabs.io/v1/text-to-speech";
const ELEVENLABS_VOICES_URL = "https://api.elevenlabs.io/v1/voices";
const ELEVENLABS_DEFAULT_MODEL_ID = "eleven_multilingual_v2";

// ElevenLabs' documented voice_settings.speed range.
const ELEVENLABS_SPEED_MIN = 0.7;
const ELEVENLABS_SPEED_MAX = 1.2;

// From Victory's committed AudioScripts type their `voice` field as one of
// these OpenAI voice names (see components/pregame/audio/types.ts). When a
// script's `voice` is one of these (i.e. nobody has overridden it with an
// ElevenLabs voice ID), fall back to ELEVENLABS_VOICE_ID so
// `TTS_PROVIDER=elevenlabs npm run audio:generate` works with zero script
// edits.
const OPENAI_VOICE_NAMES = new Set([
  "ash",
  "onyx",
  "sage",
  "alloy",
  "echo",
  "fable",
  "nova",
  "shimmer",
  "coral",
]);

// `instructions` has no ElevenLabs equivalent. Warn once per process instead
// of once per (silently-dropped) call.
let warnedInstructionsIgnoredOnce = false;

/** Clamp a speed value to ElevenLabs' 0.7-1.2 voice_settings.speed range. */
export function clampElevenLabsSpeed(speed: number): number {
  const clamped = Math.min(ELEVENLABS_SPEED_MAX, Math.max(ELEVENLABS_SPEED_MIN, speed));
  if (clamped !== speed) {
    console.warn(
      `[tts] ElevenLabs speed ${speed} clamped to ${clamped} (valid range ${ELEVENLABS_SPEED_MIN}-${ELEVENLABS_SPEED_MAX}).`,
    );
  }
  return clamped;
}

/** ElevenLabs voice for a script: a non-OpenAI `voice` is taken as a voice ID; an OpenAI name falls back to ELEVENLABS_VOICE_ID. */
export function resolveElevenLabsVoiceId(scriptVoice: string): string {
  if (!OPENAI_VOICE_NAMES.has(scriptVoice)) return scriptVoice;
  const fallback = process.env.ELEVENLABS_VOICE_ID;
  if (!fallback) {
    throw new Error(
      `ELEVENLABS_VOICE_ID is not set and the script's voice ("${scriptVoice}") is an OpenAI ` +
        `voice name, not an ElevenLabs voice ID. Set ELEVENLABS_VOICE_ID in apps/web/.env.local, ` +
        `or pass an ElevenLabs voice ID via --voices.`,
    );
  }
  return fallback;
}

async function synthesizeElevenLabs(opts: TtsOptions): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY is not set. Add it to apps/web/.env.local before running with " +
        "TTS_PROVIDER=elevenlabs (or the bake-off CLI).",
    );
  }
  if (opts.instructions && !warnedInstructionsIgnoredOnce) {
    console.warn(
      "[tts] ElevenLabs has no `instructions` equivalent — per-script/per-segment " +
        "instructions are ignored for this provider (warned once).",
    );
    warnedInstructionsIgnoredOnce = true;
  }

  const voiceId = resolveElevenLabsVoiceId(opts.voice);
  const modelId = process.env.ELEVENLABS_MODEL_ID || ELEVENLABS_DEFAULT_MODEL_ID;

  const voiceSettings: Record<string, unknown> = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0,
    use_speaker_boost: true,
  };
  if (opts.speed) voiceSettings.speed = clampElevenLabsSpeed(opts.speed);

  const body: Record<string, unknown> = {
    text: opts.text,
    model_id: modelId,
    voice_settings: voiceSettings,
  };
  if (opts.previousText) body.previous_text = opts.previousText;
  if (opts.nextText) body.next_text = opts.nextText;

  const url = `${ELEVENLABS_TTS_URL_BASE}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "(unreadable error body)");
    throw new Error(
      `ElevenLabs TTS failed (${res.status} ${res.statusText}): ${errText.slice(0, 400)}`,
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());

  // ElevenLabs returns 44.1kHz; the concat pipeline requires 24kHz mono
  // (matching OpenAI TTS + generated silence) because ffmpeg's concat
  // demuxer needs identical codec/sample-rate across inputs. Download to a
  // sibling temp path, then transcode down into opts.outPath.
  const rawPath = `${opts.outPath}.44k.mp3`;
  await writeFile(rawPath, buf);
  try {
    await transcodeTo24kMonoMp3(rawPath, opts.outPath);
  } finally {
    await rm(rawPath, { force: true });
  }
}

export type ElevenLabsVoiceSummary = {
  voiceId: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
};

/** GET /v1/voices — lets the bake-off CLI's --list-voices print candidates. */
export async function listElevenLabsVoices(): Promise<ElevenLabsVoiceSummary[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY is not set. Add it to apps/web/.env.local before running --list-voices.",
    );
  }
  const res = await fetch(ELEVENLABS_VOICES_URL, {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "(unreadable error body)");
    throw new Error(
      `ElevenLabs list-voices failed (${res.status} ${res.statusText}): ${errText.slice(0, 400)}`,
    );
  }
  const json = (await res.json()) as {
    voices?: Array<{
      voice_id: string;
      name: string;
      category?: string;
      labels?: Record<string, string>;
    }>;
  };
  return (json.voices ?? []).map((v) => ({
    voiceId: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels,
  }));
}

// ──────────────────────────────────────────────────────────────────────
// Cost estimate so a CLI can print before burning credits.
//
// OpenAI gpt-4o-mini-tts pricing (as of 2026-05): ~$0.60 per million
// characters.
//
// ElevenLabs pricing (as of 2026-09, FV-285): $0.10 per 1k characters for
// eleven_multilingual_v2 / eleven_v3; $0.05 per 1k characters for the
// eleven_flash_* models (roughly half — lower latency, slightly lower
// quality). `modelId` only affects the estimate when provider is
// "elevenlabs"; pass the same value you set via ELEVENLABS_MODEL_ID / --model.
export function estimateCostUsd(
  totalChars: number,
  provider: TtsProvider = "openai",
  modelId?: string,
): number {
  if (provider === "elevenlabs") {
    const isFlash = modelId?.toLowerCase().includes("flash") ?? false;
    const perThousandChars = isFlash ? 0.05 : 0.1;
    return (totalChars / 1_000) * perThousandChars;
  }
  return (totalChars / 1_000_000) * 0.6;
}
