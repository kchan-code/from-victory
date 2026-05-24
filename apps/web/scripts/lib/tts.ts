// OpenAI TTS wrapper.
//
// We call gpt-4o-mini-tts directly via fetch (instead of pulling in the
// openai npm package) so the generator script has zero runtime deps
// beyond Node 18+ built-ins. Keeps `node --experimental-strip-types`
// happy and avoids touching apps/web's production deps.

import { writeFile } from "node:fs/promises";

const TTS_URL = "https://api.openai.com/v1/audio/speech";

export type TtsOptions = {
  text: string;
  voice: string;
  instructions?: string;
  speed?: number;
  // Output path for the generated MP3.
  outPath: string;
};

export async function synthesizeSpeech(opts: TtsOptions): Promise<void> {
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

  const res = await fetch(TTS_URL, {
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

// Crude cost estimate so the CLI can print before burning credits.
// gpt-4o-mini-tts pricing (as of 2026-05): ~$0.60 per million characters.
export function estimateCostUsd(totalChars: number): number {
  return (totalChars / 1_000_000) * 0.6;
}
